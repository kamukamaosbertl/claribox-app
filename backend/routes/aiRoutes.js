// ─────────────────────────────────────────────────────────────────────────────
// aiRoutes.js
//
// PURPOSE:
// Main AI layer for the university feedback analytics system.
//
// PUBLIC ROUTES:
//   GET  /digest          → auto-generated daily briefing for the admin dashboard
//   POST /chat            → question/answer with full RAG pipeline
//   POST /chat/stream     → same pipeline, streamed via SSE
//
// UTILITY ROUTES:
//   GET    /session/:id   → restore chat history after page refresh
//   DELETE /session/:id   → clear a chat session
//   GET    /summary/:id   → generate or retrieve a per-feedback summary
//
// ── PIPELINE ARCHITECTURE ────────────────────────────────────────────────────
//
//  Admin message
//       │
//       ├─ Gibberish?         → reject early, no API call
//       ├─ Chit-chat?         → handle with minimal/no Groq call
//       ├─ Stats question?    → query DB counts, skip FAISS
//       ├─ Aggregation?       → fetch broad feedback, group dynamically
//       │
//       ├─ Date only, no topic  → MODE A
//       │    └─ MongoDB date filter → buildFeedbackSummaryContext → Groq
//       │
//       └─ Topic (with/without date) → MODE B
//            └─ generateEmbedding → searchFaiss → FeedbackChunk lookup
//                   → softFilterChunkResults → buildChunkContext → Groq
//
// ─────────────────────────────────────────────────────────────────────────────

const express       = require('express');
const router        = express.Router();
const Feedback      = require('../models/Feedback');
const Resolution    = require('../models/Resolution');
const ChatSession   = require('../models/ChatSession');
const FeedbackChunk = require('../models/FeedbackChunk');
const Groq          = require('groq-sdk');
const rateLimit     = require('express-rate-limit');
const { LRUCache }  = require('lru-cache');

const { generateEmbedding, searchFaiss, searchCategoryFaiss } = require('../services/ragIndexer');

// ─────────────────────────────────────────────────────────────────────────────
// GROQ CLIENT
// ─────────────────────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// CACHES
//
// embeddingCache → question text → float32 vector (max 500, LRU)
// responseCache  → question text → full AI answer (max 200, TTL 15 min)
//                  Only cached for non-date questions (date answers change).
// ─────────────────────────────────────────────────────────────────────────────
const embeddingCache = new LRUCache({ max: 500 });
const responseCache  = new LRUCache({ max: 200, ttl: 1000 * 60 * 15 });

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER — 30 requests per IP per minute
// ─────────────────────────────────────────────────────────────────────────────
const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' }
});
// system prompt for all AI interactions

const SYSTEM_PROMPT = `
You are an AI assistant for university student feedback analysis.

Your role is to help administrators understand student feedback clearly and accurately.

════════════════════════════
CORE RULES
════════════════════════════
- Use ONLY the provided feedback data.
- Do NOT invent facts, trends, or examples.
- Paraphrase feedback — do NOT quote students directly.
- NEVER include counts, numbers, totals, percentages, or quantities in responses.
- NEVER include exact counts, numbers, totals, percentages, or quantities.
- Avoid precise phrases like:
  - "5 mentions"
  - "2 out of 6"
- You may use natural qualitative language like:
  - "many students"
  - "several students"
  - "a few mentions"
- Always describe patterns qualitatively instead (e.g. "frequent complaints", "recurring issue", "less common concern").
- If data is limited, say so clearly.

════════════════════════════
OPENING RULE
════════════════════════════
- Never start with:
  - "Based on..."
  - "Based on the feedback..."
  - "Based on the provided data..."
  - "Based on the top feedback categories..."
  - "From the data..."
  - "Looking at the feedback..."
- Start with the answer itself.

════════════════════════════
CONVERSATION MEMORY
════════════════════════════
- Treat short follow-ups as continuing the previous topic.
- If the admin says "them", "this", "that", "it", "those", "they", or asks a short question, resolve it using the previous answer.
- Do NOT switch topics during a follow-up unless the admin clearly names a new topic.
- Do NOT restate the previous answer. Continue from it and go deeper.
- Do NOT add unrelated topics (e.g. cafeteria, WiFi) when the conversation is about one specific topic.
- If the admin asks "only?" or "is that all?" — expand on the current topic with more depth, do not repeat.
- If the follow-up is about emotions or sentiment ("are they frustrated?", "how do they feel?") — describe the emotional tone in more detail using the data.
- If unclear, ask one short clarification question instead of starting new analysis.

Examples:
Admin: "What are students saying about lecturers?"
Assistant: explains engagement, clarity, enthusiasm.
Admin: "are they being frustrated, only?"
Assistant: goes deeper — describes anger, disappointment, specific complaints. Does NOT mention cafeteria.

Admin: "Tell me about WiFi."
Assistant: explains WiFi complaints.
Admin: "How can we fix it?"
Assistant: gives WiFi actions only. Does NOT add other topics.

Examples:
Admin: "What problems are students facing?"
Assistant: explains lecturer performance, cafeteria, washrooms, WiFi.
Admin: "What can we do about them?"
Assistant: gives actions for those same issues only.

Admin: "Tell me about WiFi."
Assistant: explains WiFi complaints.
Admin: "How can we fix it?"
Assistant: gives WiFi actions only.

════════════════════════════
RESPONSE STYLE
════════════════════════════
- Start directly with the main insight.
- Be clear, natural, and confident.
- Keep responses concise but meaningful.
- Group related ideas into themes.
- Avoid robotic or repetitive phrasing.
- Do NOT label responses as categories (e.g. "Lecturer Performance", "Cafeteria Services")
- Never repeat the same opening phrase across responses in the same conversation.
- Each response should feel fresh and approach the topic from a new angle.
- Write naturally instead of naming categories explicitly
- Always start a response with one short intro sentence before any bullets or headers.
- Always end with one short sentence telling the admin what they could ask next.
  Examples:
  "You can ask me to suggest solutions for any of these issues."
  "Ask me to go deeper on any of these areas."
  "You can ask me to prioritize these or explore a specific concern."
- Never end a response abruptly after the last bullet or action.

════════════════════════════
INSIGHT QUALITY
════════════════════════════
- Focus on patterns, not isolated comments.
- Highlight the most important issues first.
- Do not treat minor and major issues equally.
- Combine similar feedback into clear themes.
════════════════════════════
INTENT DETECTION
════════════════════════════
- If the admin asks for actions, fixes, improvements, or solutions (e.g. "how can we solve", "what should we do", "what is the solution"), you MUST switch to solution mode.
- In solution mode:
  - Do NOT repeat or restate the problems in detail.
  - Do NOT re-analyze the issues.
  - Provide clear, direct actions only.
- Treat follow-up solution questions as continuation of the previous issues.

════════════════════════════
SOLUTIONS
════════════════════════════
- When the admin asks for solutions:
  - Give clear, practical actions immediately.
  - Do NOT restate or summarize the problems in any form.
- Do NOT include phrases like:
  - "Students are concerned about..."
  - "The main issues are..."
  - "Students are facing..."
  - Keep explanations short and focused on what should be done.
  - Each point should be an action, not a description.
  - Do NOT start solution responses by restating the problems.
  - Start directly with actions.

- Example:
  Bad:
  "Students are struggling with lecture pacing..."
  
  Good:
  "Slow down lecture pacing, include explanations beyond slides, and allow time for questions."
- Think:
  "The problems are already known — now act on them."

════════════════════════════
INVALID INPUT HANDLING
════════════════════════════
- Only treat input as invalid if it is clearly meaningless, repetitive, or nonsensical.
- Minor spelling mistakes, typos, or informal phrasing should still be understood and answered.
- If the intent of the question is clear, always proceed with analysis.
- Instead, respond briefly that the message was not understood.
- Suggest a clear example of a valid question.

Examples of invalid input:
- repeated words (e.g. "what what", "how how")
- random or nonsensical text
- incomplete questions

In these cases, respond like:
- If rejecting, do it only when the message has no clear meaning.
- Do NOT reject valid questions with minor typos.

════════════════════════════
FORMATTING RULES
════════════════════════════
Detect the right format from the question type:

USE BULLET POINTS ("- ") when:
- Admin asks to "list", "show", "give me", "what are the problems", "what issues"
- The answer has 3 or more distinct separate items

USE NUMBERED STEPS when:
- Admin asks for solutions, actions, fixes, recommendations
- Always number solutions — never write them as prose

USE BOLD HEADERS when:
- Admin asks for a summary, overview, briefing, or digest
- The answer covers multiple distinct themes

USE SHORT PROSE when:
- Admin asks "why", "how", "what are students saying", "explain"
- The answer is one connected idea

NEVER:
- Mix bullet styles ("*" and "-" in the same response)
- Write solutions as paragraphs
- Use "•" symbol
- Write more than 4 bullet points unless explicitly asked for more

════════════════════════════
TONE
════════════════════════════
Sound like a sharp, knowledgeable colleague — clear and helpful.

════════════════════════════
PRIORITY
════════════════════════════
Accuracy over perfection. Context over fresh retrieval. Continuity over restarting. Clarity over structure.
`;
// ─────────────────────────────────────────────────────────────────────────────
// CHIT-CHAT PROMPTS
//
// Minimal Groq prompts for social messages that don't need RAG.
// 'greeting' is a getter so it reads the current hour fresh each call.
// 'insult' and 'acknowledgement' are handled inline with static strings.
// ─────────────────────────────────────────────────────────────────────────────
const CHIT_CHAT_PROMPTS = {
    get greeting() {
        const h = new Date().getHours();
        const t = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
        return `Reply in one short professional sentence. Start with "Good ${t}." Then say you are ready to help analyze student feedback.`;
    },
    gratitude: `The admin thanked you. Respond briefly and naturally in one sentence.`,
    status:    `The admin asked how you are. Respond in one friendly sentence and redirect to helping with feedback.`,
    identity:  `Explain in 2-3 sentences that you are an AI feedback analyst for a university suggestion box system. Keep it clear and professional.`,
    yes_no:    `The admin said yes or no. Check the conversation history and continue directly from where you left off. Start with actual content immediately. No "Sure" or "Of course".`
};


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 1 — UTILITY HELPERS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// groqWithTimeout
// Wraps a Groq call in a race against a timeout (default 12s).
// On rate-limit (429), waits 3s and retries once.
// ─────────────────────────────────────────────────────────────────────────────
async function groqWithTimeout(params, timeoutMs = 12000) {
    const attempt = () => Promise.race([
        groq.chat.completions.create(params),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Groq request timed out')), timeoutMs)
        )
    ]);

    try {
        return await attempt();
    } catch (err) {
        if (err?.status === 429 || err?.message?.includes('rate limit') || err?.message?.includes('Rate limit')) {
            await new Promise(res => setTimeout(res, 3000));
            return await attempt();
        }
        throw err;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// cleanAIResponse
//
// Post-processes raw Groq output before sending to the admin.
// Strips implementation leakage, fabricated counts, student quotes,
// internal IDs, and vacuous closing phrases.
// Falls back to original text if cleaning removes everything.
// ─────────────────────────────────────────────────────────────────────────────
function cleanAIResponse(text) {
    if (!text) return text;

    // 1. Meta-opener phrases (loop until none remain)
    const metaPatterns = [
        /^Looking at the conversation history[^.]*\.\s*/i,
        /^Based on the conversation history[^.]*\.\s*/i,
        /^Based on the (feedback|data|information|context|results)[^.]*\.\s*/i,
        /^Based on the top feedback categories[^.]*\.\s*/i,
        /^Based on the top feedback categories[^:]*:\s*/i,
        /^From the (feedback|data|information|context|results)[^.]*\.\s*/i,
        /^Looking at the (feedback|data|information|context|results)[^.]*\.\s*/i,
        /^Reviewing the (feedback|data|information|context|results)[^.]*\.\s*/i,
        /^According to the (feedback|data|information|context|results)[^.]*\.\s*/i,
        /^Since (the admin|you) (said|replied|answered)[^.]*\.\s*/i,
        /^I (can |will |see |note )(see |that |now )?[^.]*\.\s*/i,
        /^I('ll| will) (now |)deliver[^.]*\.\s*/i,
        /^As (the admin|you) (said|replied|mentioned)[^.]*\.\s*/i,
        /^The admin (has |)(said|replied|mentioned|answered)[^.]*\.\s*/i,
        /^(Looking at|Reviewing|Checking) (the |)(previous |)(history|messages?|context)[^.]*\.\s*/i,
        /^In (this|the) (analysis|response|answer|summary)[^.]*,\s*/i,
        /^To (answer|address|respond to) (your|the) (question|request)[^.]*,\s*/i,
        /^Here('s| is) (a |an |)(summary|overview|breakdown|analysis)[^.]*:\s*/i,
        /^(Sure|Certainly|Of course|Absolutely)[!,.]?\s*/i,
        /^(Let me|I will|I'll) (now |)(analyze|summarize|break down|look at)[^.]*\.\s*/i,
    ];

    let cleaned = text.trim();
    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of metaPatterns) {
            const before = cleaned;
            cleaned = cleaned.replace(pattern, '').trim();
            if (cleaned !== before) changed = true;
        }
    }

    // 2. Fabricated count references
    cleaned = cleaned
        .replace(/\b\d+\s+out\s+of\s+\d+\s+(students?|comments?|responses?|people|participants?|submissions?|entries|feedback)[^.]*/gi, '')
        .replace(/\b\d+\s+out\s+of\s+\d+\s+student\s+(comments?|responses?|submissions?)[^.]*/gi, '')
        .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+out\s+of\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+(students?|comments?|responses?|entries|feedback|submissions?)[^.]*/gi, '')
        .replace(/\b(all|most|some)\s+\d+\s+(entries|feedback|submissions?|comments?|responses?)[^.]*/gi, '')
        .replace(/\(approximately\s+\d+%[^)]*\)/gi, '')
        .replace(/approximately\s+\d+%\s+of\s+(the\s+)?(issues?|feedback|students?|complaints?)[^,.]*/gi, '')
        .replace(/\b\d+%\s+of\s+(the\s+)?(issues?|feedback|students?|complaints?)[^,.]*/gi, '')
        .trim();

    // 3. Student number references
    cleaned = cleaned
        .replace(/\(\d+\s+students?\)/gi, '')
        .replace(/\(students?\s+[\d,\s]+(and\s+students?\s+\d+)?\)/gi, '')
        .replace(/\bstudents?\s+\d+(?:[\s,]+(and\s+)?students?\s+\d+)*/gi, '')
        .replace(/\b(\d+)\s+students?\s+(report|mention|note|say|state|complain|praise)/gi, 'some students $2')
        .replace(/\bby\s+\d+\s+students?\b/gi, 'by some students')
        .replace(/\bspecifically,?\s+\d+\s+students?\s+(mentioned|noted|felt|said|suggested)[^.]*/gi, 'some students')
        .replace(/\(\s*\)/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([,.])/g, '$1')
        .replace(/^[,\s]+/, '')
        .trim();

    // 4. Fabricated student quotes
    cleaned = cleaned
        .replace(/\b(one|a|another|some)\s+student\s+(said|commented|noted|suggested|mentioned|stated)[^"]*"[^"]*"\s*/gi, '')
        .replace(/\b(one|a|another|some)\s+student\s+(said|commented|noted|suggested|mentioned|stated)[^']*'[^']*'\s*/gi, '')
        .replace(/\bAs (one|a|another) student (put it|said|noted|commented)[^.]*\.\s*/gi, '')
        .trim();

    // 5. Entry and chunk ID references
    cleaned = cleaned
        .replace(/\(Entry\s+\d+\)/gi, '')
        .replace(/\(Entries[\d\s,and]+\)/gi, '')
        .replace(/\bEntry\s+\d+:?/gi, '')
        .replace(/\bentry\s+\d+\b/gi, '')
        .replace(/\[\d+\]/g, '')
        .trim();

    // 6. Triple hash markdown artifacts
    cleaned = cleaned.replace(/#{3,}\s*/g, '');

    // 7. Named individuals sections
    cleaned = cleaned
        .replace(/###?\s*People Mentioned[\s\S]*?(?=\n##|\n\*\*→|\nWould you|$)/gi, '')
        .replace(/###?\s*Named Individuals[\s\S]*?(?=\n##|\n\*\*→|\nWould you|$)/gi, '')
        .replace(/NAMED INDIVIDUALS[\s\S]*?(?=\n##|\n\*\*→|\nWould you|$)/gi, '')
        .replace(/\*\s*None\s*$/i, '')
        .replace(/\bNone\s*$/i, '')
        .trim();

    // 8. Vacuous sentiment sections
    cleaned = cleaned
        .replace(/###?\s*No (Positive|Neutral|Negative)[^#]*/gi, '')
        .replace(/No (positive|neutral|negative) (feedback|observations?)[^.]*\./gi, '')
        .trim();

    // 9. Filler closing sentences
    cleaned = cleaned
        .replace(/\bI hope (this|that) (helps?|answers?|clarifies?)[^.]*\.\s*$/gi, '')
        .replace(/\bLet me know if you (need|want|have)[^.]*\.\s*$/gi, '')
        .replace(/\bFeel free to (ask|reach out)[^.]*\.\s*$/gi, '')
        .replace(/\bPlease (let me know|feel free)[^.]*\.\s*$/gi, '')
        .trim();

    // 10. Final whitespace cleanup — preserve newlines for markdown
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').trim();

    return cleaned || text;
}

//markdown cleaner for AI responses, removes markdown artifacts and empty sections  
function postProcessMarkdown(text) {
    if (!text) return text;
    return text
        // Ensure ** bold headers are on their own line
        .replace(/([^\n])\*\*([^*]+)\*\*/g, '$1\n\n**$2**')
        // Ensure each - bullet is on its own line
        .replace(/([^\n])-\s+(?=[A-Z])/g, '$1\n- ')
        // Ensure each numbered step is on its own line  
        .replace(/([^\n])(\d+\.)\s+/g, '$1\n$2 ')
        // Remove excessive blank lines (max 2)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}


// ─────────────────────────────────────────────────────────────────────────────
// enforceFollowUp
// On non-solution intents, strips any recommendation language that leaked
// through despite system prompt rules.
// ─────────────────────────────────────────────────────────────────────────────
function enforceFollowUp(answer, intent) {
    if (!answer || intent === 'solution') return answer;

    return answer
        .replace(/\bIt may help to[^.]*\.\s*$/gi, '')
        .replace(/\bConsider (reviewing|addressing|looking into)[^.]*\.\s*$/gi, '')
        .replace(/\bThe university (should|could|may want to)[^.]*\.\s*$/gi, '')
        .replace(/\bIt (would|might) be (worth|beneficial|helpful)[^.]*\.\s*$/gi, '')
        .replace(/\bAddressing this (could|would|may)[^.]*\.\s*$/gi, '')
        .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// isGibberish
// Returns true for inputs that are clearly not real questions.
// Checked first — avoids any API or DB calls for nonsense input.
// ─────────────────────────────────────────────────────────────────────────────
function isGibberish(message) {
    const t = message.trim().toLowerCase();

    const validShortReplies = new Set([
        'ok', 'no', 'hi', 'hey', 'yes', 'yo', 'k',
        'why', 'how', 'what', 'who', 'when', 'where'
    ]);
    if (validShortReplies.has(t)) return false;

    if (t.length < 3) return true;
    if (/^[^a-zA-Z0-9]+$/.test(t)) return true;
    if (/^(.)\1{4,}$/.test(t)) return true;
    if (/^\d+$/.test(t)) return true;

    const letters = t.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 4) {
        const vowels = letters.match(/[aeiou]/g) || [];
        if (vowels.length / letters.length < 0.1) return true;
    }
    if (/[^aeiou\s]{8,}/i.test(t)) return true;

    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// buildConversationalQuery
// Wraps a short follow-up with the previous Q&A so the LLM can resolve
// references like "it" or "this issue" without re-stating.
// ─────────────────────────────────────────────────────────────────────────────
function buildConversationalQuery(message, lastContext) {
    if (!lastContext?.lastQuestion && !lastContext?.lastAnswer) return message;
    if (message.includes('Previous admin question:')) return message;

    const truncatedAnswer = lastContext.lastAnswer
        ? lastContext.lastAnswer.slice(0, 600).trim()
        : '';

    return `
Previous admin question:
${lastContext.lastQuestion || ''}

Previous assistant answer:
${truncatedAnswer}

Current follow-up:
${message}

STRICT RULES:
- This is a follow-up to the previous topic ONLY.
- The topic is: "${lastContext.lastQuestion || 'the previous question'}".
- Do NOT introduce ANY new topics not present in the previous question.
- Do NOT mention hostels if the previous question was about registration.
- Do NOT mention finance if the previous question was about hostels.
- Stay locked on the exact topic of the previous question.
- Do NOT restart the analysis. Continue from where the previous answer left off.
- If the admin is asking about emotions or feelings, go deeper into those only.
- Resolve pronouns like "they", "them", "it" using the previous topic only.
- If the follow-up is too vague to answer on topic, ask one short clarification question.
`.trim();
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 2 — DETECTION HELPERS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// detectChitChat
// Returns a classification string for social/non-analytical messages, or null.
// ─────────────────────────────────────────────────────────────────────────────
function detectChitChat(message) {
    const lower = message.toLowerCase().trim();
    if (/(^bye$|^goodbye$|see you|see ya|later|talk to you later|catch you later|bye bye|good night|goodnight)/i.test(lower)) return 'farewell';
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|good night|good day)[!. ]*$/.test(lower)) return 'greeting';
    if (/(thanks|thank you|thx|appreciate|great work|well done)/.test(lower)) return 'gratitude';
    if (/(how are you|how r u|you okay|you good)/.test(lower)) return 'status';
    if (/(who are you|what are you|what can you do|your name|introduce yourself)/.test(lower)) return 'identity';
    if (/^(ok|okay|alright|got it|i see|noted|sure|fine|yep|nope|cool|understood|makes sense|right|k|good|great|nice|sounds good)\.?$/i.test(lower)) return 'acknowledgement';
    if (/^(yes|no|yeah|nah)\.?$/i.test(lower)) return 'yes_no';

    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helpers
// ─────────────────────────────────────────────────────────────────────────────
function getTimeGreeting(hour = new Date().getHours()) {
    if (hour >= 5  && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}

function getUserGreetingType(message = '') {
    const lower = message.toLowerCase().trim();
    if (/good morning/.test(lower))   return 'morning';
    if (/good afternoon/.test(lower)) return 'afternoon';
    if (/good evening/.test(lower))   return 'evening';
    if (/good night/.test(lower))     return 'night';
    if (/^(hi|hello|hey)[!. ]*$/.test(lower)) return 'generic';
    return null;
}

function buildGreetingReply(message = '') {
    const actual = getTimeGreeting();
    const userGreeting = getUserGreetingType(message);

    const labels = {
        morning: 'Good morning', afternoon: 'Good afternoon',
        evening: 'Good evening', night: 'Good night', generic: 'Hello'
    };
    const mismatchMessages = {
        morning: "It's already later in the day",
        afternoon: 'A little early for "good afternoon"',
        evening: "It's not evening yet",
        night: 'Not quite night yet'
    };

    const actualGreeting = labels[actual] || 'Hello';

    if (!userGreeting || userGreeting === 'generic' || userGreeting === actual) {
        return `${actualGreeting}. How can I help you analyze student feedback today?`;
    }
    return `${actualGreeting}. ${mismatchMessages[userGreeting]}, but I'm ready to help you analyze student feedback.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// detectIntent
// Classifies the admin's question into one of six types.
// ─────────────────────────────────────────────────────────────────────────────
function detectIntent(message) {
    const lower = message.toLowerCase();

    if (/(bad response|not good|poor response|rewrite|rephrase|regenerate|generate another|another version|make it better|improve this answer|different version|not as before)/i.test(lower)) return 'rewrite';
    if (/(categories|themes|topics|main issues|most talked|most common|common issues|patterns|trends|recurring issues|major concerns|key concerns)/i.test(lower)) return 'aggregation';
    if (/(how many|total|count|number of|how much|percentage|ratio|statistics|stats|figures|metrics)/i.test(lower)) return 'quick';
    if (/(solution|solutions|recommend|recommendation|what can we (actually |)do|what do we do about|how do we fix|what should be done|action|actions|improve|improvement|suggest|suggestion|fix|solve|resolve|address|handle|deal with|way forward|next step|next steps|what should|what can|how can|how do we|what do we do|what should i do|what should we do|what can be done|what to do|possible response|admin response|intervention|interventions)/i.test(lower)) return 'solution';
    if (/(is (now |already |been )?solved|has been (fixed|resolved|addressed)|is fixed|is resolved|we (have |)fixed|we (have |)resolved|mark(ed)? (as |)resolved|closed|completed|done)/i.test(lower)) return 'resolved';

    return 'analysis';
}

// ─────────────────────────────────────────────────────────────────────────────
// detectResponseMode
// Secondary classification affecting formatting, independent of intent.
// ─────────────────────────────────────────────────────────────────────────────
function detectResponseMode(message) {
    const lower = message.toLowerCase();
    if (/(today|recent|overview|summary|summarize|summarise|summerize|what are students saying|what students are saying|what's happening)/i.test(lower)) return 'briefing';
    if (/(analyze|analysis|insight|patterns|themes|why|what does this suggest)/i.test(lower)) return 'deep_analysis';
    if (/(how many|count|number of|total|stats|percentage)/i.test(lower)) return 'quick_fact';
    return 'standard';
}

// ─────────────────────────────────────────────────────────────────────────────
// detectDateRange
// Parses time expressions from the admin's message.
// Returns { start, end?, label } or null.
// ─────────────────────────────────────────────────────────────────────────────
function detectDateRange(message) {
    const lower = message.toLowerCase();
    const now   = new Date();

    if (lower.includes('today')) {
        return { start: new Date(new Date().setHours(0, 0, 0, 0)), label: 'today' };
    }
    if (lower.includes('this week') || lower.includes('last 7 days')) {
        const s = new Date(); s.setDate(now.getDate() - 7);
        return { start: s, label: 'this week' };
    }
    if (lower.includes('two weeks') || lower.includes('2 weeks')) {
        const s = new Date(); s.setDate(now.getDate() - 14);
        return { start: s, label: 'last 14 days' };
    }
    if (lower.includes('last week')) {
        const s = new Date(); s.setDate(now.getDate() - 14);
        const e = new Date(); e.setDate(now.getDate() - 7);
        return { start: s, end: e, label: 'last week' };
    }
    if (lower.includes('this month')) {
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), label: 'this month' };
    }
    if (lower.includes('last month')) {
        return {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end:   new Date(now.getFullYear(), now.getMonth(), 1),
            label: 'last month'
        };
    }
    if (lower.includes('this year')) {
        return { start: new Date(now.getFullYear(), 0, 1), label: 'this year' };
    }
    if (lower.includes('recent') || lower.includes('latest') || lower.includes('happening')) {
        const s = new Date(); s.setDate(now.getDate() - 30);
        return { start: s, label: 'recently (last 30 days)' };
    }
    const match = lower.match(/last (\d+)\s*days?/);
    if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > 0) {
            const s = new Date(); s.setDate(s.getDate() - n);
            return { start: s, label: `last ${n} days` };
        }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// isTimeSummaryQuery
// Returns true only when there is a date range AND no specific topic.
// Those go to Mode A (MongoDB date query) instead of Mode B (FAISS).
// ─────────────────────────────────────────────────────────────────────────────
function isTimeSummaryQuery(message, dateRange, queryHints = []) {
    if (!dateRange) return false;
    const lower = message.toLowerCase();
    const mentionsTopic = /\b(about|regarding|on)\b/.test(lower) && queryHints.length > 0;
    return !mentionsTopic;
}

// ─────────────────────────────────────────────────────────────────────────────
// isShortFollowUp
// Returns true if the message looks like a follow-up rather than a new question.
// ─────────────────────────────────────────────────────────────────────────────
function isShortFollowUp(message) {
    const lower = message.toLowerCase().trim();
    const words = lower.split(/\s+/).filter(Boolean);

    if (words.length <= 4 && /^(why|how|what|which|where|when|who|now|next|any|best|way)\b/i.test(lower)) return true;
    if (/^(why|how|what|which|where|when|who|and|then|also|continue|explain|tell|show)\b/i.test(lower)) return true;
    if (/\b(it|this|that|they|them|those|these|one|ones|issue|problem|problems|solution|solutions)\b/i.test(lower)) return true;

    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// extractQueryHints
// Pulls meaningful topic words out of the admin's question for soft filtering.
// ─────────────────────────────────────────────────────────────────────────────
function extractQueryHints(message) {
    const stopWords = new Set([
        'what', 'how', 'why', 'when', 'where', 'which', 'about', 'are',
        'students', 'student', 'saying', 'says', 'tell', 'show', 'give',
        'please', 'this', 'that', 'with', 'from', 'into', 'the', 'a', 'an',
        'and', 'or', 'is', 'was', 'were', 'have', 'has', 'had', 'do', 'does',
        'did', 'can', 'could', 'would', 'should', 'will', 'any', 'some',
        'most', 'more', 'less', 'all', 'no', 'not', 'also', 'just', 'very',
        'for', 'by', 'at', 'in', 'on', 'of', 'to', 'me', 'us', 'you'
    ]);
    return message
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 2 && !stopWords.has(w));
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeQueryForIntent
// Wraps the current message with prior context for the embedding call.
// Prevents double-wrapping.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeQueryForIntent(message, lastContext = null) {
    if (message.includes('Previous admin question')) return message;
    if (!lastContext) return message;

    return `
Previous question:
${lastContext.lastQuestion || ''}

Previous answer:
${lastContext.lastAnswer || ''}

Current question:
${message}

Answer the current question in the context of the previous topic.
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// isExpansionRequest
// Detects when the admin wants more detail on the previous answer.
// ─────────────────────────────────────────────────────────────────────────────
function isExpansionRequest(message) {
    return /(more details|more detail|explain more|go deeper|expand|elaborate|tell me more|more info|make it (shorter|clearer|simpler|better)|break it down|just list|list them|list it|list down|what else|what other|any other|others)/i.test(message);
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 3 — SESSION HELPERS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// loadSession
// Finds or creates a ChatSession. Returns { session, history }.
// If no sessionId, returns { session: null, history: [] }.
// ─────────────────────────────────────────────────────────────────────────────
async function loadSession(sessionId) {
    if (!sessionId) return { session: null, history: [] };
    let session = await ChatSession.findOne({ sessionId });
    if (session) return { session, history: session.messages.slice(-4) };
    session = new ChatSession({ sessionId });
    return { session, history: [] };
}

// ─────────────────────────────────────────────────────────────────────────────
// getLastAssistantContext
// Returns the last { lastQuestion, lastAnswer } pair from session history.
// ─────────────────────────────────────────────────────────────────────────────
function getLastAssistantContext(history = []) {
    if (!history.length) return null;
    const last = history[history.length - 1];
    if (!last) return null;
    return { lastQuestion: last.question || '', lastAnswer: last.answer || '' };
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 4 — STATS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// getStats
// Returns total submissions, resolved count, and top 10 tags.
// Uses only real schema fields — no Feedback.category.
// ─────────────────────────────────────────────────────────────────────────────
async function getStats() {
    const [total, resolved, topTagsRaw] = await Promise.all([
        Feedback.countDocuments(),
        Resolution.countDocuments({ isPublished: true }),
        Feedback.aggregate([
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ])
    ]);
    return { total, resolved, topTags: topTagsRaw };
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 5 — CONTEXT BUILDERS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// buildFeedbackSummaryContext
// Used in Mode A (time-based) and aggregation intent.
// Converts Feedback documents → multi-line text for LLM.
// ─────────────────────────────────────────────────────────────────────────────
function buildFeedbackSummaryContext(feedbackDocs) {
    return feedbackDocs.map(doc => {
        const tagStr  = (doc.tags || []).join(', ') || 'untagged';
        const sentStr = doc.sentiment || 'unknown';
        const emoStr  = doc.emotion   || 'neutral';
        const text    = doc.evidenceText
            ? `${doc.feedback} [Evidence: ${doc.evidenceText.slice(0, 200)}]`
            : doc.feedback;
        return `[${sentStr}|${emoStr}|tags: ${tagStr}] ${text}`;
    }).join('\n\n').slice(0, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// buildChunkContext
// Used in Mode B (semantic FAISS queries).
// Converts FeedbackChunk documents → multi-line text for LLM.
// ─────────────────────────────────────────────────────────────────────────────
function buildChunkContext(chunks) {
    return chunks.map(chunk => {
        const sentStr = chunk.sentiment || 'unknown';
        const emoStr  = chunk.emotion   || 'neutral';
        return `[${sentStr}|${emoStr}] ${chunk.chunkText}`;
    }).join('\n\n').slice(0, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// softFilterChunkResults
// After FAISS retrieves chunks, loosely prefers chunks whose text/tags/topic
// contains words from the admin's question.
// "Soft" means: if filtering removes everything, we return all results.
// ─────────────────────────────────────────────────────────────────────────────
function softFilterChunkResults(chunks, queryHints, detectedCategory = null) {
    if (!queryHints || !queryHints.length) return chunks;
    
    // Strict filter — chunk must match at least 2 hints if we have enough hints
    const filtered = chunks.filter(chunk => {
        const haystack = [
            chunk.chunkText || '',
            (chunk.tags || []).join(' '),
            chunk.topicLabel || '',
            chunk.topicShortLabel || '',
            detectedCategory?.label || '',
            detectedCategory?.shortLabel || ''
        ].join(' ').toLowerCase();
        
        const matchCount = queryHints.filter(hint => haystack.includes(hint)).length;
        
        // If we have 3+ hints, require at least 2 matches
        // If we have fewer hints, require at least 1
        return queryHints.length >= 3 ? matchCount >= 2 : matchCount >= 1;
    });
    
    return filtered.length > 0 ? filtered : chunks;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 6 — RETRIEVAL MODES
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// runTimeSummarySearch  (Mode A)
// For pure time-based questions with no specific topic.
// Queries MongoDB by createdAt. Returns up to 80 Feedback docs.
// ─────────────────────────────────────────────────────────────────────────────
async function runTimeSummarySearch(dateRange) {
    const dateFilter = { createdAt: { $gte: dateRange.start } };
    if (dateRange.end) dateFilter.createdAt.$lte = dateRange.end;
    return Feedback.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(80)
        .select('feedback evidenceText tags topicLabel sentiment emotion createdAt');
}

// ─────────────────────────────────────────────────────────────────────────────
// getTopCategories
// Returns top 5 topicLabels by count, with negative sentiment counts.
// Used in the aggregation intent.
// ─────────────────────────────────────────────────────────────────────────────
async function getTopCategories(dateRange) {
    const match = {};
    if (dateRange) {
        match.createdAt = { $gte: dateRange.start };
        if (dateRange.end) match.createdAt.$lte = dateRange.end;
    }
    return Feedback.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$topicLabel',
                topicShortLabel: { $first: '$topicShortLabel' },
                count: { $sum: 1 },
                negativeCount: {
                    $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] }
                }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// applyCategoryBoost
// Boosts chunk scores when their topicLabel matches the detected category.
// ─────────────────────────────────────────────────────────────────────────────
function applyCategoryBoost(scoredChunks, detectedCategory = null) {
    if (!detectedCategory) return scoredChunks;

    const categoryText = [
        detectedCategory.label || '',
        detectedCategory.shortLabel || ''
    ].join(' ').toLowerCase();

    return scoredChunks
        .map(chunk => {
            const chunkTopicText = [
                chunk.topicLabel || '',
                chunk.topicShortLabel || ''
            ].join(' ').toLowerCase();

            const topicMatches = categoryText && chunkTopicText && (
                categoryText.includes(chunk.topicShortLabel?.toLowerCase() || '') ||
                chunkTopicText.includes(detectedCategory.shortLabel?.toLowerCase() || '') ||
                chunkTopicText.includes(detectedCategory.label?.toLowerCase() || '')
            );

            return { ...chunk, score: topicMatches ? chunk.score + 0.08 : chunk.score };
        })
        .sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────────────────
// applySentimentBoost
// Boosts negative/high-emotion chunks so they surface first.
// ─────────────────────────────────────────────────────────────────────────────
function applySentimentBoost(scoredChunks) {
    return scoredChunks
        .map(chunk => {
            let boost = 0;
            if ((chunk.sentiment || '').toLowerCase() === 'negative') boost += 0.05;
            const emotion = (chunk.emotion || '').toLowerCase();
            if (emotion === 'anger') boost += 0.04;
            if (['sadness', 'fear', 'disgust'].includes(emotion)) boost += 0.03;
            return { ...chunk, score: chunk.score + boost };
        })
        .sort((a, b) => b.score - a.score);
}

// ─────────────────────────────────────────────────────────────────────────────
// runSemanticSearch  (Mode B)
// For topical questions (with or without date).
// 1. FAISS → nearest 10 chunks
// 2. Reject if top score < 0.30
// 3. Load FeedbackChunk docs, optionally filter by date
// 4. Apply category + sentiment boosts, deduplicate, take top 8
// 5. Soft-filter by query hints
// Returns { chunks, topicMismatch, emptyPeriod }
// ─────────────────────────────────────────────────────────────────────────────
async function runSemanticSearch(questionEmbedding, queryHints, dateRange, detectedCategory = null) {
    const faissResults = await searchFaiss(questionEmbedding, 10);
    if (!faissResults.length) return { chunks: [], topicMismatch: true, emptyPeriod: false };
    if (faissResults[0].score < 0.38) return { chunks: [], topicMismatch: true, emptyPeriod: false };

    const faissIds = faissResults.map(r => r.faissId);
    let chunks = await FeedbackChunk.find({
        faissId:         { $in: faissIds },
        embeddingStatus: 'indexed'
    }).select('chunkText feedbackId chunkIndex sourceType sentiment emotion tags topicLabel topicShortLabel anonymous_id faissId');

    if (!chunks.length) return { chunks: [], topicMismatch: true, emptyPeriod: false };

    // Optional date filter via parent Feedback
    if (dateRange) {
        const feedbackIds   = chunks.map(c => c.feedbackId);
        const dateFilter    = { _id: { $in: feedbackIds }, createdAt: { $gte: dateRange.start } };
        if (dateRange.end) dateFilter.createdAt.$lte = dateRange.end;

        const validFeedbacks = await Feedback.find(dateFilter).select('_id');
        const validIds       = new Set(validFeedbacks.map(f => f._id.toString()));
        chunks = chunks.filter(c => validIds.has(c.feedbackId.toString()));

        if (!chunks.length) return { chunks: [], topicMismatch: false, emptyPeriod: true };
    }

    // Score, boost, deduplicate, soft-filter
    const scoreMap = {};
    faissResults.forEach(r => { scoreMap[r.faissId] = r.score; });

    const scored   = chunks.map(c => ({ ...c.toObject(), score: scoreMap[c.faissId] || 0 })).sort((a, b) => b.score - a.score);
    const boosted  = applySentimentBoost(applyCategoryBoost(scored, detectedCategory));

    const seen    = new Set();
    const deduped = [];
    for (const item of boosted) {
        const key = item.chunkText.slice(0, 120).toLowerCase().trim();
        if (!seen.has(key)) { seen.add(key); deduped.push(item); }
    }

    const filtered = softFilterChunkResults(deduped.slice(0, 8), queryHints, detectedCategory);
    return { chunks: filtered, topicMismatch: false, emptyPeriod: false };
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 7 — PROMPT BUILDERS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// buildAnalysisPrompt
// Main prompt for analysis, quick, and aggregation intents.
// ─────────────────────────────────────────────────────────────────────────────
function buildAnalysisPrompt(message, context, dateLabel, queryHints, intent, responseMode) {
    const topicStr = queryHints?.length ? `Topic: ${queryHints.join(', ')}` : null;
    const scope    = [topicStr, dateLabel ? `Period: ${dateLabel}` : null]
        .filter(Boolean)
        .join(' | ');
        const lower = message.toLowerCase();
    let formatInstruction = '';

    if (/(list|all problems|all issues|show me|give me|what are the problems|what problems|what issues|facing|students face|problems are|issues are|what concerns|what complaints|most common|most urgent|priorit)/i.test(lower)) {
        formatInstruction = `Format: Use ONLY "- " (dash space) for every bullet. Never use "*" or "•". Each bullet on its own line. Example:
    - First issue
    - Second issue
    - Third issue`;
    } else if (/(solution|fix|action|improve|recommend|what can|how can|what should|way forward|next step|practical)/i.test(lower)) {
        formatInstruction = `Format: Use numbered steps. Start each with an action verb. Example:
    1. Train finance staff on communication
    2. Implement digital clearance system
    3. Schedule regular maintenance`;
    } else if (/(why|what are students saying|tell me about|explain|what do students|how do students feel)/i.test(lower)) {
        formatInstruction = `Format: Use short prose paragraphs. Max 2-3 sentences per theme. No bullet points.`;
    } else if (/(summary|summarize|summarise|overview|digest|briefing|management summary)/i.test(lower)) {
    formatInstruction = `CRITICAL FORMAT RULES:
- Output ONLY clean markdown. No inline asterisks mid-sentence.
- Every bold header must open AND close: **Header Name**
- Never use single asterisk * for anything
- Use this EXACT structure with blank lines between sections:

One intro sentence here.

**Header One**
One or two sentences here.

**Header Two**
One or two sentences here.

**Header Three**
One or two sentences here.

One closing sentence here.`;
    } else {
        formatInstruction = `Format: Use the most natural format for this question. Bullets for lists, prose for explanations.`;
    }
    

    return `
Admin question:
"${message}"

Scope:
${scope || 'All available feedback'}

Student feedback data:
${context}

Task:
Answer the admin's question using the feedback data.

Guidance:
- Focus on the most impactful problems
- Suggest practical, realistic actions
- Avoid generic or obvious recommendations
- Keep solutions clear and distinct
- Phrase insights as conclusions, not observations
- If the question names a specific topic (finance, hostel, WiFi, registration), answer ONLY that topic.
- Do NOT mention any other topic even if related data exists.
- If the admin asks about finance, talk about finance only — not hostels, not WiFi.
- If the admin asks about hostels, talk about hostels only — not finance, not registration.
- Treat the named topic as the ONLY topic for this response.
- If the question asks to list ALL problems, include only what is present in the data.
- Do NOT pad the answer with unrelated categories or minor mentions.
- - Start with ONE short intro sentence summarizing the overall picture.
- Then use the chosen format (bullets, numbered steps, or headers).
- Do NOT repeat the question back.
- Each bullet must describe a student problem only. No recommendations in bullet lists.
- End with ONE short sentence suggesting what the admin could ask next.
  Example: "You can ask me to prioritize these issues or suggest solutions for any of them."
- Do NOT include recommendations or solutions in the list.
- If the question asks for problems, every bullet must be a problem, not an action or suggestion.
${formatInstruction}

`.trim();
}
// ─────────────────────────────────────────────────────────────────────────────
// buildSolutionPrompt
// Prompt for when the admin explicitly asks for recommended actions.
// ─────────────────────────────────────────────────────────────────────────────
function buildSolutionPrompt(message, context, dateLabel, queryHints, priorQuestion) {
    const topicStr = queryHints?.length ? `Topic: ${queryHints.join(', ')}` : null;
    const scope    = [topicStr, dateLabel ? `Period: ${dateLabel}` : null]
        .filter(Boolean)
        .join(' | ');
        const lower = message.toLowerCase();
    let formatInstruction = '';

    if (/(list|all|every|each)/i.test(lower)) {
        formatInstruction = `Format: Use numbered steps. One action per line. Keep each action short and direct.`;
    } else {
        formatInstruction = `Format: Use numbered steps for distinct actions. If only one issue, a short paragraph is fine.`;
    }    

    return `
Admin request:
"${message}"

${priorQuestion ? `Context: "${priorQuestion}"` : ''}

Scope:
${scope || 'All available feedback'}

Student feedback data:
${context}

Task:
Provide practical actions based on the issues in the data.

Guidance:
- Focus on the most important problems
- Suggest clear, actionable steps
- Keep responses concise and useful
- Do NOT restate or summarize the problems. The admin already knows them.
- Do NOT start with "Students are facing..." or "The main issues are..."
- Start immediately with the first action.
- If the admin named a specific topic, give solutions for THAT TOPIC ONLY.
- Do NOT add solutions for other topics that were not asked about.
- Start with the FIRST ACTION immediately. 
- Do NOT introduce what the problems are.
- The admin already read the analysis — just give actions.
- Maximum 7 actions total. Stop after 7. Do not list every possible solution.
- End with ONE short sentence suggesting what the admin could explore next.
  Example: "You can ask me to go deeper on any of these actions."
- Combine similar actions into one point instead of listing them separately.
- Prioritize the most impactful actions first.
${formatInstruction}
`.trim();
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 8 — AI RESPONSE GENERATORS
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// generateAIResponse
// Standard (non-streaming) Groq call.
// Messages: system prompt → flattened history → user prompt.
// Returns a friendly error string on failure instead of throwing.
// ─────────────────────────────────────────────────────────────────────────────
async function generateAIResponse(prompt, history = [], systemPrompt = null) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
            ...history.flatMap(h => ([
                { role: 'user',      content: h.question },
                { role: 'assistant', content: h.answer   }
            ])),
            { role: 'user', content: prompt }
        ];
        const result = await groqWithTimeout({ model: 'llama-3.1-8b-instant', messages, max_tokens: 800, temperature: 0.6 });
        return cleanAIResponse(result.choices[0]?.message?.content?.trim() || '');
    } catch (err) {
        console.error('[AI] generateAIResponse error:', err.message);
        return "I'm having trouble processing that right now. Please try again in a moment.";
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// streamAIResponse
// Streaming Groq call for /chat/stream.
// Buffers the first ~60 chars to run cleanAIResponse on meta-openers,
// then streams the rest directly for low latency.
// Returns the full accumulated text so the caller can save it to the session.
// ─────────────────────────────────────────────────────────────────────────────
async function streamAIResponse(prompt, history = [], sendChunk, systemPrompt = null) {
    const messages = [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
        ...history.flatMap(h => ([
            { role: 'user',      content: h.question },
            { role: 'assistant', content: h.answer   }
        ])),
        { role: 'user', content: prompt }
    ];

    const stream = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant', messages, max_tokens: 800, temperature: 0.6, stream: true
    });

    let fullAnswer    = '';
    let introBuffer   = '';
    let introStripped = false;

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (!text) continue;
        fullAnswer += text;

        if (!introStripped) {
            introBuffer += text;
            if (introBuffer.length >= 60 && /[.!?]\s/.test(introBuffer)) {
                const cleaned = cleanAIResponse(introBuffer);
                introStripped = true;
                if (cleaned) sendChunk({ text: cleaned });
                introBuffer = '';
            }
        } else {
            sendChunk({ text });
        }
    }

    if (introBuffer) {
        const cleaned = cleanAIResponse(introBuffer);
        if (cleaned) sendChunk({ text: cleaned });
    }

    return cleanAIResponse(fullAnswer);
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 9 — SHARED CHAT PIPELINE
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// runChatPipeline
//
// Central brain of both chat routes.
// Returns: { answer: string, meta: object }
//
// Decision flow:
//  1.  Chit-chat          → minimal/no Groq call
//  2.  Gibberish          → reject, no API call
//  3.  Pending metric     → static rejection
//  4.  Stats question     → DB counts + one Groq sentence
//  5.  Short follow-up    → early context clarification
//  6.  Intent detection   → aggregation / rewrite / expand / solution / analysis
//  7a. Mode A             → MongoDB date query → Groq
//  7b. Mode B             → FAISS → FeedbackChunk → Groq
// ─────────────────────────────────────────────────────────────────────────────
async function runChatPipeline(message, session, history, streamMode = false, sendChunk = null) {
    const lastContext  = getLastAssistantContext(history);
    const followUpMode = history.length > 0 && isShortFollowUp(message);

    // ── 1. Chit-chat ─────────────────────────────────────────────────────────
    const chitChatType = detectChitChat(message);

    if (chitChatType) {
        // Static responses (no Groq call)
        const staticReplies = {
            greeting:        () => buildGreetingReply(message),
            acknowledgement: () => 'Noted. Let me know if you want to explore this further.',
            farewell:        () => "Alright, see you. Feel free to come back anytime if you need insights.",
            gratitude:       () => "You're welcome.",
            status:          () => "I'm ready to help analyze student feedback and identify key issues."
        };

        if (staticReplies[chitChatType]) {
            const answer = staticReplies[chitChatType]();
            if (session) { session.addMessage(message, answer); await session.save(); }
            return { answer, meta: { mode: 'chit-chat' } };
        }

        // identity and yes_no still use Groq
        let answer;
        if (streamMode && sendChunk) {
            const chitMessages = chitChatType === 'yes_no'
                ? [
                    ...history.flatMap(h => ([
                        { role: 'user',      content: h.question },
                        { role: 'assistant', content: h.answer   }
                    ])),
                    { role: 'user', content: CHIT_CHAT_PROMPTS['yes_no'] }
                  ]
                : [{ role: 'user', content: CHIT_CHAT_PROMPTS[chitChatType] }];

            const stream = await groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: chitMessages,
                max_tokens: chitChatType === 'yes_no' ? 600 : 150,
                temperature: 0.6,
                stream: true
            });

            let full = '';
            for await (const chunk of stream) {
                const t = chunk.choices[0]?.delta?.content || '';
                if (t) { full += t; sendChunk({ text: t }); }
            }
            answer = cleanAIResponse(full);
        } else {
            answer = await generateAIResponse(
                CHIT_CHAT_PROMPTS[chitChatType],
                chitChatType === 'yes_no' ? history : []
            );
        }

        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { mode: 'chit-chat' } };
    }


    // ── 2. Gibberish check ───────────────────────────────────────────────────
if (isGibberish(message)) {
    return {
        answer: `I couldn't understand that message. Try asking something like: "What are students complaining about most?" or "Summarize today's feedback."`,
        meta: {}
    };
}
    // ── 3. Unsupported metric ────────────────────────────────────────────────
    const normalizedLower = message.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

    if (/\bpending\b/i.test(normalizedLower)) {
        return {
            answer: "I don't currently track pending feedback status. I can only show total submissions and resolved issues.",
            meta: { source: 'stats', unsupportedMetric: 'pending' }
        };
    }

    // ── 4. Stats questions ───────────────────────────────────────────────────
    const isStatQuestion =
        /(how many|total|count|number of|stats|statistics|metrics|figures|top tags|most common tags)/i.test(normalizedLower) &&
        !/(categories|themes|topics|main issues|most talked|most common issue|most common category|common issues|patterns|trends|recurring issues|major concerns|key concerns)/i.test(normalizedLower);

    if (isStatQuestion) {
        const stats = await getStats();
        const topTagsList = stats.topTags.length
            ? stats.topTags.map(t => `${t._id} (${t.count})`).join(', ')
            : 'no tagged data yet';

        const factLines = [];
        if (/total|how many/i.test(normalizedLower)) factLines.push(`Total submissions: **${stats.total}**`);
        if (/resolved/i.test(normalizedLower))        factLines.push(`Resolved issues: **${stats.resolved}**`);
        if (/tag/i.test(normalizedLower))             factLines.push(`Top tags: ${topTagsList}`);

        const factualPart = factLines.join('  \n') || `Total: **${stats.total}** | Resolved: **${stats.resolved}**`;

        const observation = await generateAIResponse(
            `Stats available — Total submissions: ${stats.total}, Resolved issues: ${stats.resolved}, Top tags: ${topTagsList}.
Admin asked: "${message}".
In one sentence, add a brief analytical observation.
Do not mention pending, unresolved, or approval status unless explicitly provided.`,
            history
        );

        const answer = `${factualPart}\n\n${observation}`.trim();
        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { source: 'stats' } };
    }

    // ── 5. Short follow-up with no prior context ──────────────────────────────
// ── 5. Short follow-up with no prior context
const isVeryShort = message.trim().split(/\s+/).length <= 3;
if (isVeryShort && isShortFollowUp(message) && !lastContext?.lastQuestion) {
    const answer = "Can you specify which issue or feedback area you're referring to?";
    if (session) { session.addMessage(message, answer); await session.save(); }
    return { answer, meta: { needsContext: true } };
}

// ── 5b. Vague follow-up with ambiguous pronoun and prior context
    const isVagueFollowUp = followUpMode &&
        /\b(these|those|them|this|it|the issues|the problems|fix these|solve these|address these)\b/i.test(message) &&
        message.trim().split(/\s+/).length <= 8;

    if (isVagueFollowUp && lastContext?.lastQuestion) {
        const hintsFromPrev = extractQueryHints(lastContext.lastQuestion);
        if (hintsFromPrev.length === 0) {
            const clarifyPrompt = `The admin asked a vague follow-up: "${message}". 
    The previous topic was: "${lastContext.lastQuestion}".
    Ask one short clarification question to understand what they mean.
    Do not answer the question. Just ask for clarification in one sentence.`;
            
            const answer = await generateAIResponse(clarifyPrompt, []);
            if (session) { session.addMessage(message, answer); await session.save(); }
            return { answer, meta: { needsContext: true } };
        }
    }

    // Prepend prior context for short follow-ups
    let cleanMessage = followUpMode && lastContext
        ? buildConversationalQuery(message, lastContext)
        : message;

    // ── 6. Intent, date, mode detection ──────────────────────────────────────
    const dateRange    = detectDateRange(normalizedLower);
    const intent       = detectIntent(cleanMessage);
    const responseMode = detectResponseMode(cleanMessage);
    const queryHints   = extractQueryHints(cleanMessage);

    // ── Aggregation ───────────────────────────────────────────────────────────
    if (intent === 'aggregation') {
        const categories = await getTopCategories(dateRange);
        if (!categories.length) {
            return { answer: "There is not enough feedback data for this period.", meta: { mode: 'aggregation' } };
        }

        const context = categories.map(cat =>
            `${cat._id} (${cat.count} mentions, ${cat.negativeCount} negative)`
        ).join('\n');

        const prompt = `
Admin question: "${message}"

Top feedback categories:
${context}

Explain the main issues clearly based on these categories.
Do NOT invent anything. No percentages. Focus on the most important categories.
`.trim();

        const answer = await generateAIResponse(prompt, history);
        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { mode: 'aggregation' } };
    }

    // ── Rewrite ───────────────────────────────────────────────────────────────
    if (intent === 'rewrite' && lastContext?.lastAnswer) {
        const rewritePrompt = `
Rewrite the previous assistant answer. The admin was not satisfied with it.

Previous admin question:
${lastContext.lastQuestion || ''}

Previous assistant answer:
${lastContext.lastAnswer.slice(0, 600).trim()}

Admin feedback:
${message}

STRICT RULES:
- Use the same underlying feedback data — do NOT introduce new issues.
- Do NOT repeat the same wording, structure, or sentence order.
- Make it shorter, clearer, and more direct.
- Lead immediately with the main insight. No preamble.
- Do NOT invent quotes, counts, numbers, or examples.
- Follow the system prompt style strictly.
`.trim();

        const answer = await generateAIResponse(rewritePrompt, []);
        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { mode: 'rewrite' } };
    }

    // ── Expand ────────────────────────────────────────────────────────────────
    if (isExpansionRequest(message) && lastContext?.lastAnswer) {
        const expandPrompt = `
The admin wants more detail on the previous answer.

Previous admin question:
${lastContext.lastQuestion || ''}

Previous assistant answer:
${lastContext.lastAnswer.slice(0, 600).trim()}

STRICT RULES:
- Only expand on issues already present in the previous answer.
- Do NOT introduce new issues, topics, or concerns.
- Do NOT invent quotes, counts, numbers, or examples.
- Add depth and context — but stay grounded.
- Lead with the most important point. No preamble.
- Follow the system prompt style strictly.
`.trim();

        const answer = await generateAIResponse(expandPrompt, []);
        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { mode: 'expand' } };
    }

    // ── Broad solution (no specific topic) ────────────────────────────────────
    const isBroadSolution = intent === 'solution' && !dateRange &&
        !/\b(about|regarding|on|for)\b/.test(cleanMessage.toLowerCase());

    if (isBroadSolution) {
        const feedbackDocs = await Feedback.find()
            .sort({ createdAt: -1 }).limit(80)
            .select('feedback evidenceText tags topicLabel sentiment emotion createdAt');

        if (!feedbackDocs.length) {
            return { answer: "No feedback has been submitted yet, so I can't suggest any solutions right now.", meta: { mode: 'broad_solution' } };
        }

        const context = buildFeedbackSummaryContext(feedbackDocs);
        const sentimentSummary = Object.entries(
            feedbackDocs.reduce((a, d) => { const s = (d.sentiment || 'unknown').toLowerCase(); a[s] = (a[s] || 0) + 1; return a; }, {})
        ).map(([s, c]) => `${c} ${s}`).join(', ');
        const emotionSummary = Object.entries(
            feedbackDocs.reduce((a, d) => { const e = (d.emotion || 'neutral').toLowerCase(); a[e] = (a[e] || 0) + 1; return a; }, {})
        ).map(([e, c]) => `${c} ${e}`).join(', ');
        const solutionPrompt = buildSolutionPrompt(message, context, null, [], lastContext?.lastQuestion || null);

        let answer;
        if (streamMode && sendChunk) { answer = await streamAIResponse(solutionPrompt, history, sendChunk); }
        else                         { answer = await generateAIResponse(solutionPrompt, history); }

        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { ragResults: feedbackDocs.length, mode: 'broad_solution', intent } };
    }

    // ── 7a. Mode A — Time-based summary (no specific topic) ──────────────────
    if (isTimeSummaryQuery(cleanMessage, dateRange, queryHints)) {
        const feedbackDocs = await runTimeSummarySearch(dateRange);

        if (!feedbackDocs.length) {
            const recent = await Feedback.find().sort({ createdAt: -1 }).limit(5)
                .select('feedback sentiment emotion tags createdAt');
            const recentCtx      = recent.map(d => `[${d.sentiment}|${d.emotion}] ${d.feedback} (${new Date(d.createdAt).toDateString()})`).join('\n') || 'No feedback available yet.';
            const noDataMsg      = dateRange.label === 'today' ? 'No new feedback has been submitted today yet.' : `No feedback was submitted for ${dateRange.label}.`;
            const fallbackPrompt = `The admin asked: "${message}". ${noDataMsg} Do NOT invent feedback. Most recent available:\n${recentCtx}\nTell the admin clearly that nothing was submitted for the requested period, then briefly note what the recent feedback shows.`;

            let answer;
            if (streamMode && sendChunk) { answer = await streamAIResponse(fallbackPrompt, history, sendChunk); }
            else                         { answer = await generateAIResponse(fallbackPrompt, history); }

            if (session) { session.addMessage(message, answer); await session.save(); }
            return { answer, meta: { ragResults: 0, emptyPeriod: true, detectedPeriod: dateRange.label } };
        }

        const context          = buildFeedbackSummaryContext(feedbackDocs);
        const sentimentSummary = Object.entries(feedbackDocs.reduce((a, d) => { const s = (d.sentiment || 'unknown').toLowerCase(); a[s] = (a[s] || 0) + 1; return a; }, {})).map(([s, c]) => `${c} ${s}`).join(', ');
        const emotionSummary   = Object.entries(feedbackDocs.reduce((a, d) => { const e = (d.emotion || 'neutral').toLowerCase();    a[e] = (a[e] || 0) + 1; return a; }, {})).map(([e, c]) => `${c} ${e}`).join(', ');
        const prompt           = buildAnalysisPrompt(message, context, dateRange.label, queryHints, intent, sentimentSummary, emotionSummary, feedbackDocs.length, responseMode);

        let answer;
        if (streamMode && sendChunk) { answer = await streamAIResponse(prompt, history, sendChunk); }
        else                         { answer = await generateAIResponse(prompt, history); }

        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { ragResults: feedbackDocs.length, mode: 'time_summary', detectedPeriod: dateRange.label, intent } };
    }

    // ── 7b. Mode B — Semantic FAISS search ───────────────────────────────────
    const normalizedQuery = normalizeQueryForIntent(cleanMessage, lastContext);
    const cacheKey        = normalizedQuery + '|' + (dateRange?.label || '');

    if (!dateRange) {
        const cached = responseCache.get(cacheKey);
        if (cached) {
            if (session) { session.addMessage(message, cached); await session.save(); }
            return { answer: cached, meta: { fromCache: true } };
        }
    }

    let questionEmbedding = embeddingCache.get(normalizedQuery);
    if (!questionEmbedding) {
        questionEmbedding = await generateEmbedding(normalizedQuery);
        if (!questionEmbedding || !questionEmbedding.length) {
            return { answer: 'Failed to process your question. Please try again.', meta: { error: 'embedding_failed' } };
        }
        embeddingCache.set(normalizedQuery, questionEmbedding);
    }

    const categoryResults  = await searchCategoryFaiss(questionEmbedding, 1);
    const bestCategory     = categoryResults[0] || null;
    const detectedCategory = bestCategory?.score >= 0.62 ? bestCategory.metadata : null;

    // On follow-ups, use the previous question's hints to stay on topic
    const strictHints = followUpMode && lastContext?.lastQuestion
        ? extractQueryHints(lastContext.lastQuestion)
        : queryHints;

    const { chunks, topicMismatch, emptyPeriod } = await runSemanticSearch(
        questionEmbedding, strictHints, dateRange, detectedCategory
    );

    // No FAISS match above threshold
    if (topicMismatch) {
        const looksLikeFeedbackQuestion = /(feedback|student|students|complaint|complaints|issue|issues|suggestion|suggestions|trend|trends|summary|summarize|summarise|sentiment|tag|tags|resolution|overall|going on|resolved)/i.test(cleanMessage);
        const answer = looksLikeFeedbackQuestion
            ? "I couldn't find matching feedback for that topic yet. Try asking about a different issue, service, or time period."
            : "I'm designed to help with university student feedback analysis. Try asking about complaints, trends, summaries, or issues students are reporting.";

        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { mode: looksLikeFeedbackQuestion ? 'no_matching_feedback' : 'out_of_scope', topicMismatch: true } };
    }

    // Topic matched but date filter removed all results
    if (emptyPeriod && !chunks.length) {
        const recent    = await Feedback.find().sort({ createdAt: -1 }).limit(5).select('feedback sentiment emotion tags createdAt');
        const recentCtx = recent.map(d => `[${d.sentiment}|${d.emotion}] ${d.feedback} (${new Date(d.createdAt).toDateString()})`).join('\n') || 'No feedback available yet.';
        const periodMsg = dateRange?.label === 'today' ? 'No new feedback has been submitted today yet.' : `No feedback was submitted for ${dateRange?.label}.`;
        const fallbackPrompt = `The admin asked: "${message}". ${periodMsg} Do NOT invent feedback. Most recent available:\n${recentCtx}\nTell the admin clearly that nothing was submitted for the requested period, then briefly note what the recent feedback shows.`;

        let answer;
        if (streamMode && sendChunk) { answer = await streamAIResponse(fallbackPrompt, history, sendChunk); }
        else                         { answer = await generateAIResponse(fallbackPrompt, history); }

        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { ragResults: 0, emptyPeriod: true } };
    }

    // Edge case: no chunks and no clear reason
    if (!chunks.length) {
        const answer = await generateAIResponse(
            `The admin asked: "${message}". No directly matching feedback was found. Tell the admin no specific match was found and suggest they try a different time period or topic.`,
            history
        );
        if (session) { session.addMessage(message, answer); await session.save(); }
        return { answer, meta: { ragResults: 0 } };
    }

    // ── Build context and generate final response ─────────────────────────────
    const context          = buildChunkContext(chunks);
    const sentimentSummary = Object.entries(chunks.reduce((a, c) => { const s = (c.sentiment || 'unknown').toLowerCase(); a[s] = (a[s] || 0) + 1; return a; }, {})).map(([s, c]) => `${c} ${s}`).join(', ');
    const emotionSummary   = Object.entries(chunks.reduce((a, c) => { const e = (c.emotion || 'neutral').toLowerCase();    a[e] = (a[e] || 0) + 1; return a; }, {})).map(([e, c]) => `${c} ${e}`).join(', ');

    let answer;

    if (intent === 'solution') {
        const priorQuestion  = followUpMode && lastContext?.lastQuestion ? lastContext.lastQuestion : null;
        const solutionPrompt = buildSolutionPrompt(message, context, dateRange?.label, queryHints, priorQuestion);

        if (streamMode && sendChunk) { answer = await streamAIResponse(solutionPrompt, history, sendChunk); }
        else                         { answer = await generateAIResponse(solutionPrompt, history); }

    } else if (intent === 'resolved') {
        const resolvedPrompt = `The admin said: "${message}". The issue has been noted as resolved. Acknowledge warmly in 1-2 sentences. No headings needed.`;

        if (streamMode && sendChunk) {
            const stream = await groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: resolvedPrompt }],
                max_tokens: 800, temperature: 0.6, stream: true
            });
            let full = '';
            for await (const chunk of stream) {
                const t = chunk.choices[0]?.delta?.content || '';
                if (t) { full += t; sendChunk({ text: t }); }
            }
            answer = cleanAIResponse(full);
        } else {
            answer = await generateAIResponse(resolvedPrompt);
        }

    } else {
        const analysisPrompt = buildAnalysisPrompt(message, context, dateRange?.label, queryHints, intent, sentimentSummary, emotionSummary, chunks.length, responseMode);

        if (streamMode && sendChunk) { answer = await streamAIResponse(analysisPrompt, history, sendChunk); }
        else                         { answer = await generateAIResponse(analysisPrompt, history); }
    }

    // Final safety check
    answer = cleanAIResponse(answer);
    answer = postProcessMarkdown(answer);
    if (!answer || answer.trim().length === 0) {
        answer = "I couldn't generate a clear response for that. Try rephrasing your question slightly.";
    } else {
        answer = enforceFollowUp(answer, intent);
    }

const safeAnswer = typeof answer === 'string' ? answer : '';

const isBadFallback =
  !safeAnswer ||
  safeAnswer.includes("I'm having trouble processing that right now") ||
  safeAnswer.includes("Failed to process your question") ||
  safeAnswer.includes("I didn't quite understand that");

if (!dateRange && !isBadFallback) {
  responseCache.set(cacheKey, safeAnswer);
}

if (session) {
  session.addMessage(message, safeAnswer);
  await session.save();
}

return {
  answer: safeAnswer,
  meta: {
    ragResults: chunks.length,
    mode: 'semantic',
    detectedPeriod: dateRange?.label || 'all time',
    intent,
    sentimentSummary
  }
};
}


/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 10 — ROUTES
═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// GET /digest
// Auto-briefing for the admin dashboard.
// Fallback: today → last 7 days → last 30 days → empty state.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/digest', async (req, res) => {
    try {
        const { sessionId } = req.query;
        const select = 'feedback evidenceText tags sentiment emotion createdAt';

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        let feedbackDocs = await Feedback.find({ createdAt: { $gte: todayStart } }).sort({ createdAt: -1 }).limit(50).select(select);
        let periodLabel  = 'today';

        if (!feedbackDocs.length) {
            const s = new Date(); s.setDate(s.getDate() - 7);
            feedbackDocs = await Feedback.find({ createdAt: { $gte: s } }).sort({ createdAt: -1 }).limit(50).select(select);
            periodLabel  = 'the last 7 days';
        }
        if (!feedbackDocs.length) {
            const s = new Date(); s.setDate(s.getDate() - 30);
            feedbackDocs = await Feedback.find({ createdAt: { $gte: s } }).sort({ createdAt: -1 }).limit(50).select(select);
            periodLabel  = 'the last 30 days';
        }
        if (!feedbackDocs.length) {
            return res.json({ success: true, digest: "No student feedback has been submitted yet. Once students start submitting feedback, I'll provide daily insights here.", totalAnalysed: 0 });
        }

        const stats            = await getStats();
        const feedbackContext  = buildFeedbackSummaryContext(feedbackDocs);
        const sentimentSummary = Object.entries(feedbackDocs.reduce((a, d) => { const s = (d.sentiment || 'neutral').toLowerCase(); a[s] = (a[s] || 0) + 1; return a; }, {})).map(([k, v]) => `${v} ${k}`).join(', ') || 'no data';
        const emotionSummary   = Object.entries(feedbackDocs.reduce((a, d) => { const e = (d.emotion   || 'neutral').toLowerCase(); a[e] = (a[e] || 0) + 1; return a; }, {})).map(([k, v]) => `${v} ${k}`).join(', ') || 'no data';
        const topTagsLine      = stats.topTags.length ? stats.topTags.slice(0, 5).map(t => `${t._id} (${t.count})`).join(', ') : 'no tags yet';

        const digestPrompt = `You are preparing a proactive briefing for a university administrator.

Period: ${periodLabel} | Submissions analysed: ${feedbackDocs.length}
System stats: Total=${stats.total}, Resolved=${stats.resolved}
Top recurring tags: ${topTagsLine}
Student Feedback Data:
${feedbackContext}

Write a concise admin briefing:
**Overview:** One sentence on the overall picture.
**Top Issues:** 2-4 most prominent themes from the data above only.
**Sentiment:** Brief note on the emotional tone.
**Suggested Focus:** One specific priority action for today.

STRICT RULE: Only report what is present in the feedback data above.`;

        const digest = await generateAIResponse(digestPrompt);

        if (sessionId) {
            try { await ChatSession.findOneAndUpdate({ sessionId }, { $set: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }, { upsert: true, new: true }); }
            catch (_) {}
        }

        res.json({ success: true, digest, periodLabel, totalAnalysed: feedbackDocs.length });
    } catch (err) {
        console.error('[digest] Error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate digest.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /chat
// Input:  { message: string, sessionId?: string }
// Output: { success: true, answer: string, ...meta }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat', chatRateLimiter, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

        const { session, history } = await loadSession(sessionId);
        const { answer, meta }     = await runChatPipeline(message, session, history, false, null);

        res.json({ success: true, answer, ...meta });
    } catch (err) {
        console.error('[/chat] Error:', err.message);
        res.status(500).json({ success: false, message: 'AI processing failed. Please check your Groq API key and try again.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /chat/stream
// Streaming via SSE.
// Client receives: { text } chunks, then { done: true, ...meta }, then [DONE].
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat/stream', chatRateLimiter, async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    let streamedAnyText = false;

    const sendChunk = (data) => {
        if (data?.text) streamedAnyText = true;
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    const endStream = () => { res.write(`data: [DONE]\n\n`); res.end(); };

    try {
        const { message, sessionId } = req.body;
        if (!message) { sendChunk({ error: 'Message is required.' }); return endStream(); }

        const { session, history } = await loadSession(sessionId);
        const { answer, meta }     = await runChatPipeline(message, session, history, true, sendChunk);

        if (!streamedAnyText && answer?.trim()) sendChunk({ text: answer });
        sendChunk({ done: true, ...meta });
        endStream();
    } catch (err) {
        console.error('[/chat/stream] Error:', err.message);
        try { sendChunk({ error: 'Something went wrong. Please try again.' }); endStream(); } catch (_) {}
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /session/:sessionId — restore chat history on page refresh
// ─────────────────────────────────────────────────────────────────────────────
router.get('/session/:sessionId', async (req, res) => {
    try {
        const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.json({ success: true, history: [], isNew: true });
        res.json({ success: true, history: session.messages.slice(-20), isNew: false });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load session.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /session/:sessionId — clear session when admin clicks "Clear chat"
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/session/:sessionId', async (req, res) => {
    try {
        await ChatSession.findOneAndDelete({ sessionId: req.params.sessionId });
        res.json({ success: true, message: 'Session cleared.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to clear session.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /summary/:id
// Generates a 2-3 sentence summary for a single Feedback document.
// Returns cached summary if one already exists on the document.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary/:id', async (req, res) => {
    try {
        const feedbackItem = await Feedback.findById(req.params.id);
        if (!feedbackItem) return res.status(404).json({ success: false, message: 'Feedback not found.' });
        if (feedbackItem.summary) return res.json({ success: true, summary: feedbackItem.summary, cached: true });

        const rawText  = feedbackItem.evidenceText
            ? `${feedbackItem.feedback}. Additional detail: ${feedbackItem.evidenceText}`
            : feedbackItem.feedback;
        const tagsLine = feedbackItem.tags?.length ? `Tags: ${feedbackItem.tags.join(', ')}` : 'Tags: none';

        const summaryPrompt = `Summarize this student feedback for a university admin dashboard.

Feedback: "${rawText}"
Sentiment: ${feedbackItem.sentiment || 'unknown'} | Emotion: ${feedbackItem.emotion || 'neutral'}
${tagsLine} | Topic: ${feedbackItem.topicLabel || 'unclassified'}

Write a clear 2-3 sentence professional summary in third person.
Capture the core issue. Mention urgency if clearly indicated.
No opinions. No recommendations. Factual and neutral.`;

        const summary = await generateAIResponse(
            summaryPrompt,
            [],
            `You are a professional feedback summarizer for a university administration system. Always write in factual, neutral, third-person language.`
        );

        await Feedback.findByIdAndUpdate(feedbackItem._id, { summary });
        res.json({ success: true, summary, cached: false });
    } catch (err) {
        console.error('[/summary] Error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate summary.' });
    }
});

module.exports = router;