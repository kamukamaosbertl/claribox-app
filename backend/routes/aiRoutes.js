const express     = require('express');
const router      = express.Router();
const Feedback    = require('../models/Feedback');
const ChatSession = require('../models/ChatSession');
const Groq        = require('groq-sdk');
const rateLimit   = require('express-rate-limit');
const { LRUCache } = require('lru-cache');

const MAX_TEXT_LENGTH = 4000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const embeddingCache = new LRUCache({ max: 500 });
const responseCache  = new LRUCache({ max: 200, ttl: 1000 * 60 * 15 }); // 15 min response cache

const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' }
});

async function groqWithTimeout(params, timeoutMs = 8000) {
    return Promise.race([
        groq.chat.completions.create(params),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Groq request timed out')), timeoutMs)
        )
    ]);
}

function cleanAIResponse(text) {
    if (!text) return text;
    const metaPatterns = [
        /^Looking at the conversation history[^.]*\.\s*/i,
        /^Based on the conversation history[^.]*\.\s*/i,
        /^Based on (the |our )?previous (conversation|messages?|context)[^.]*\.\s*/i,
        /^Since (the admin|you) (said|replied|answered)[^.]*\.\s*/i,
        /^I (can |will |see |note )(see |that |now )?[^.]*\.\s*/i,
        /^I('ll| will) (now |)deliver[^.]*\.\s*/i,
        /^As (the admin|you) (said|replied|mentioned)[^.]*\.\s*/i,
        /^The admin (has |)(said|replied|mentioned|answered)[^.]*\.\s*/i,
        /^(Looking at|Reviewing|Checking) (the |)(previous |)(history|messages?|context)[^.]*\.\s*/i,
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
    cleaned = cleaned
        .replace(/\(\d+\s+students?\)/gi, '')
        .replace(/\(students?\s+[\d,\s]+(and\s+students?\s+\d+)?\)/gi, '')
        .replace(/\bstudents?\s+\d+(?:[\s,]+(and\s+)?students?\s+\d+)*/gi, '')
        .replace(/\b(\d+)\s+students?\s+(report|mention|note|say|state|complain|praise)/gi, 'some students $2')
        .replace(/\bby\s+\d+\s+students?\b/gi, 'by some students')
        .replace(/\(\s*\)/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([,.])/g, '$1')
        .replace(/^[,\s]+/, '')
        .trim();

    // ── Strip all internal entry references ─────────────────────
    cleaned = cleaned
        .replace(/\(Entry\s+\d+\)/gi, '')
        .replace(/\(Entries[\d\s,and]+\)/gi, '')
        .replace(/\bEntry\s+\d+:/gi, '')
        .replace(/\bEntry\s+\d+\b/gi, '')
        .replace(/\[\d+\]/g, '')
        .trim();

    // ── Strip robotic entry counting phrases ─────────────────────
    cleaned = cleaned
        .replace(/\b(one|two|three|four|five|\d+)\s+out\s+of\s+(one|two|three|four|five|\d+)\s+(entries|feedback|submissions)[^.]*/gi, '')
        .replace(/\b(all|most|some)\s+\d+\s+(entries|feedback|submissions)[^.]*/gi, '')
        .trim();

    // ── Strip ### headings — AI sometimes ignores instructions ───
    cleaned = cleaned.replace(/#{3,}\s*/g, '');

    // ── Strip People Mentioned / Named Individuals sections ───────
    cleaned = cleaned
        .replace(/###?\s*People Mentioned[\s\S]*?(?=\n##|\n\*\*→|\nWould you|$)/gi, '')
        .replace(/###?\s*Named Individuals[\s\S]*?(?=\n##|\n\*\*→|\nWould you|$)/gi, '')
        .replace(/NAMED INDIVIDUALS[\s\S]*?(?=\n##|\n\*\*→|\nWould you|$)/gi, '')
        .replace(/\*\s*None\s*$/i, '')
        .replace(/\bNone\s*$/i, '')
        .trim();

    // ── Strip invented no-feedback sections ──────────────────────
    cleaned = cleaned
        .replace(/###?\s*No (Positive|Neutral|Negative)[^#]*/gi, '')
        .replace(/No (positive|neutral|negative) (feedback|observations?)[^.]*\./gi, '')
        .replace(/No student feedback has been submitted[^.]*that expresses[^.]*/gi, '')
        .trim();

    // ── Final cleanup ─────────────────────────────────────────────
    cleaned = cleaned
        .replace(/\s{2,}/g, ' ')
        .replace(/  +/g, ' ')
        .trim();

    return cleaned || text;
}

let embeddingPipeline = null;
async function getEmbeddingPipeline() {
    if (!embeddingPipeline) {
        console.log('Loading local embedding model...');
        const { pipeline } = await import('@xenova/transformers');
        embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('Embedding model loaded ✅');
    }
    return embeddingPipeline;
}

const ALLOWED_TOPICS = [
    'feedback','student','complaint','suggestion','improve','experience','teaching','lecture','class','course',
    'facility','library','hostel','food','canteen','staff','service','support','concern','report','trend','total',
    'pending','resolved','category','sentiment','negative','positive','neutral','rating','performance','quality',
    'wifi','internet','transport','parking','admin','today','week','month','year','recent','latest','happening',
    'issue','problem','worst','best','common','most','least','summary','overview','analysis','compare','urgent',
    'critical','top','main','key','highlight','insight','how','what','why','which','who','tell','show','give','list'
];

const CATEGORY_KEYWORDS = {
    academic:   ['academic','teaching','teacher','lecture','class','course','learning','exam','assignment','marks','grades','tutor','professor','education','subject'],
    library:    ['library','books','reading','resources','journals','study room','librarian','borrow'],
    it:         ['wifi','internet','network','computer','lab','technology','system','portal','online','connection','software','hardware'],
    facilities: ['facility','campus','building','classroom','toilet','bathroom','grounds','sports','gym','field','maintenance','cleaning'],
    canteen:    ['canteen','food','meal','dining','cafeteria','menu','kitchen','snack','drink'],
    transport:  ['transport','bus','vehicle','parking','commute','driver','route','schedule','taxi','shuttle','road'],
    hostel:     ['hostel','room','dormitory','dorm','housing','sleep','bed','warden','residence'],
    admin:      ['admin','office','registration','fees','payment','documents','finance','enrollment','admission','records']
};

const SYSTEM_PROMPT = `You are an intelligent university feedback analyst assistant.
You help university administrators understand what students are experiencing by analyzing real student feedback data.

YOUR IDENTITY:
- You are an experienced academic affairs analyst at a university
- You speak directly to university administration — not to students
- You are data-driven: your answers are always grounded in the student feedback provided
- You are honest, professional, and measured in your language

RESPONSE FORMAT — always structure your response like this:
## [Main topic based on the question]
One clear opening sentence on the overall picture.

**→ [Sub-theme label]**
Short paragraph about this theme — 2-4 sentences.

**→ [Next sub-theme label]**
Short paragraph about this theme — 2-4 sentences.

**⚠️ Key Concern:** Most urgent issue flagged in bold if applicable.

[One follow-up question]

FORMATTING RULES:
- ## for the main heading ONLY — never use ### anywhere
- **→ Label** for sub-sections — bold arrow, not hash headings
- Every **→** sub-section must start on a NEW LINE
- Use numbered lists (1. 2. 3.) only for solutions and recommendations
- Bold (**text**) for urgent items and sub-section labels only
- Keep paragraphs short — 2-4 sentences max
- Match length to the question — short question gets short answer

MOST IMPORTANT RULE — ANSWER ONLY WHAT WAS ASKED:
- Read the admin question carefully and identify the EXACT topic
- Only include feedback that directly answers that specific topic
- If the feedback data retrieved is NOT about the topic asked, do NOT use it
- If no relevant feedback exists for the topic, say honestly:
  "## [Topic]
  No student feedback has been submitted about [topic] yet."
  Then end with a follow-up question offering related topics that have feedback
- NEVER pad a response with unrelated feedback just to fill space
- NEVER report feedback about teaching if asked about admissions
- NEVER report feedback about canteen if asked about library
- If multiple unrelated topics appear in the data, ignore them completely

HANDLING FOLLOW-UP QUESTIONS:
- When admin uses "that", "it", "this", "those" — resolve from conversation history, never ask for clarification
- Treat every message as part of one continuous conversation

SENTIMENT AWARENESS:
- Positive = strength ("Students are happy about X")
- Neutral = observation ("Students note that X")
- Negative = concern ("Students are reporting problems with X")
- Never frame positive or neutral feedback as complaints

SOLUTIONS DISCIPLINE:
- Only give solutions when admin explicitly asks — "fix", "improve", "recommend", "what should we do"
- Analysis questions get analysis only — NO solutions unless asked

STUDENT REFERENCING:
- Never say "Student 1", "Student 2"
- For multiple students: "several students", "some students", "a number of students"
- For a single student: "a student reported", "feedback indicates", "one student noted" — vary it naturally
- Never start a sentence with "One student" repeatedly — use "A student", "Feedback from one student", "As one student noted"

ENDING EVERY RESPONSE:
- Always end with ONE natural follow-up question giving the admin options
- Example: "Would you like to see solutions for this, or explore another area?"
- Never ask multiple questions at the end

WHAT YOU NEVER DO:
- Never report feedback that is not directly about the topic the admin asked
- Never make up feedback not in the data
- Never use training knowledge to add context not in the data
- Never write "In summary" or "Overall" closing paragraphs
- Never repeat the same point twice
- Never narrate your thinking — just respond directly
- Never end with generic sentences like "it is essential to address these concerns"
- Never reference entry numbers like "Entry 1", "Entry 2", "[1]", "(Entries 2 and 3)" — these are internal labels
- Never show a "NAMED INDIVIDUALS" heading or "None" in your response — that section is for your reference only
- Never create a section for feedback that does not exist — if there is no positive feedback, do not mention it
- Only report what is present in the data, never what is absent`;

function quickRelevanceCheck(message, isFollowUp = false) {
    const lower = message.toLowerCase().trim();
    if (ALLOWED_TOPICS.some(t => lower.includes(t))) return true;
    if (/^(what|how|why|which|who|tell|show|give|are|is|can|do|does|any|were|was).{4,}/i.test(lower)) return true;
    const singleAcknowledgements = [
        'ok','okay','alright','sure','fine','noted','got it','i see',
        'yep','nope','cool','understood','makes sense','right','k'
    ];
    if (singleAcknowledgements.includes(lower.trim())) return false;
    const wordCount = lower.split(/\s+/).filter(w => w.length > 1).length;
    if (isFollowUp && wordCount >= 2 && lower.length < 50) return true;
    return false;
}

async function classifyMessageIntent(message) {
    try {
        const result = await groqWithTimeout({
            model: 'llama-3.1-8b-instant',
            messages: [{
                role: 'system',
                content: `You classify messages sent to a university feedback analysis assistant.
Respond with ONLY a JSON object, no extra text:
{
  "relevant": true or false,
  "type": "feedback_question" or "chit_chat" or "off_topic",
  "normalised": "the message rewritten in clean English fixing typos and slang"
}
A message is RELEVANT if it is asking about student feedback, university services, or administration.
A message is OFF_TOPIC only if it has NOTHING to do with university feedback — e.g. "who won the World Cup".`
            }, { role: 'user', content: message }],
            max_tokens: 80,
            temperature: 0.1
        });
        const raw = result.choices[0]?.message?.content?.trim() || '{}';
        return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (err) {
        console.error('Classification error:', err.message);
        return { relevant: true, type: 'feedback_question', normalised: message };
    }
}

async function isRelevantQuestion(message, isFollowUp = false) {
    if (quickRelevanceCheck(message, isFollowUp)) {
        return { relevant: true, type: 'feedback_question', normalised: message };
    }
    console.log('Keyword check failed — using AI classification');
    return await classifyMessageIntent(message);
}

function detectChitChat(message) {
    const lower = message.toLowerCase().trim();
    if (/(^hi$|^hello$|^hey$|good morning|good afternoon|good evening|good day)/i.test(lower)) return 'greeting';
    if (/(thanks|thank you|thx|appreciate|great|awesome|perfect|well done)/i.test(lower)) return 'gratitude';
    if (/(how are you|how r u|you okay|you good)/i.test(lower)) return 'status';
    if (/(who are you|what are you|what can you do|your name|introduce yourself)/i.test(lower)) return 'identity';
    if (/(^ok$|^okay$|^alright$|^got it$|^i see$|^noted$|^sure$|^fine$|^yep$|^nope$|^cool$|^understood$|^makes sense$)/i.test(lower)) return 'acknowledgement';
    if (/(^yes$|^no$|^yeah$|^nah$)/i.test(lower)) return 'yes_no';
    return null;
}

function detectIntent(message) {
    const lower = message.toLowerCase();
    if (/(how many|total|count|number of|how much|percentage|ratio|statistics|stats)/i.test(lower)) return 'quick';
    if (/(solution|recommend|action|improve|suggest|fix|resolve|address|what should|how can|how do we|what do i do|what should i do|what can i do|what can be done|what to do)/i.test(lower)) return 'solution';
    if (/(is (now |already |been )?solved|has been (fixed|resolved|addressed|sorted)|is fixed|is resolved|issue is gone|problem is gone|we (have |)fixed|we (have |)resolved|mark(ed)? (as |)resolved|close this|close the issue)/i.test(lower)) return 'resolved';
    return 'analysis';
}

function detectResolutionCategory(message) {
    const lower = message.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => new RegExp(`\\b${kw.replace(/[-\/]/g,'\\$&')}\\b`, 'i').test(lower))) return cat;
    }
    return null;
}

function detectCategory(message) {
    const lower = message.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => new RegExp(`\\b${kw.replace(/[-\/]/g,'\\$&')}\\b`, 'i').test(lower))) return cat;
    }
    return null;
}

function detectDateRange(message) {
    const lower = message.toLowerCase();
    const now = new Date();
    if (lower.includes('today')) return { start: new Date(new Date().setHours(0,0,0,0)), label: 'today' };
    if (lower.includes('this week') || lower.includes('last 7 days')) { const s=new Date(); s.setDate(now.getDate()-7); return { start:s, label:'this week' }; }
    if (lower.includes('last week')) { const s=new Date(); s.setDate(now.getDate()-14); const e=new Date(); e.setDate(now.getDate()-7); return { start:s,end:e,label:'last week' }; }
    if (lower.includes('this month')) return { start:new Date(now.getFullYear(),now.getMonth(),1), label:'this month' };
    if (lower.includes('last month')) return { start:new Date(now.getFullYear(),now.getMonth()-1,1), end:new Date(now.getFullYear(),now.getMonth(),1), label:'last month' };
    if (lower.includes('this year')) return { start:new Date(now.getFullYear(),0,1), label:'this year' };
    if (lower.includes('recent')||lower.includes('latest')||lower.includes('happening')) { const s=new Date(); s.setDate(now.getDate()-30); return { start:s, label:'recently (last 30 days)' }; }
    const m = lower.match(/last (\d+)\s*days?/);
    if (m) { const n=parseInt(m[1],10); if(!isNaN(n)&&n>0){ const s=new Date(); s.setDate(s.getDate()-n); return { start:s, label:`last ${n} days` }; } }
    return null;
}

async function generateEmbedding(text) {
    try {
        const safeText = text.slice(0, MAX_TEXT_LENGTH);
        const pipe = await getEmbeddingPipeline();
        const output = await pipe(safeText, { pooling:'mean', normalize:true });
        return Array.from(output.data);
    } catch(err) { console.error('Embedding error:', err.message); return []; }
}

async function generateAIResponse(prompt, history=[], systemPrompt=null) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
            ...history.map(h => ([
                { role: 'user',      content: h.question },
                { role: 'assistant', content: h.answer   }
            ])).flat(),
            { role: 'user', content: prompt }
        ];
        const result = await groqWithTimeout({
            model: 'llama-3.1-8b-instant',
            messages,
            max_tokens: 1000,
            temperature: 0.4
        });
        return cleanAIResponse(result.choices[0]?.message?.content?.trim() || '');
    } catch(err) {
        console.error('AI error:', err.message);
        return "I'm having trouble processing that right now. Please try again.";
    }
}

async function getStats() {
    const [total, pending, resolved, categoryStats] = await Promise.all([
        Feedback.countDocuments(),
        Feedback.countDocuments({ status: 'pending' }),
        Feedback.countDocuments({ status: 'resolved' }),
        Feedback.aggregate([{ $group:{ _id:'$category', count:{ $sum:1 } } }, { $sort:{ count:-1 } }])
    ]);
    return { total, pending, resolved, categoryStats };
}

function extractNames(text) {
    const names = [];

    // Pattern 1: Names with titles — Dr. Mukasa, Prof. Sarah, Mr. Onen etc
    const titledPattern = /\b(Dr\.?|Prof\.?|Professor|Mr\.?|Mrs\.?|Ms\.?|Sir)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
    let match;
    while ((match = titledPattern.exec(text)) !== null) {
        const name = match[0].trim();
        if (!names.includes(name)) names.push(name);
    }

    // Pattern 2: Names WITHOUT titles — catch "Sarah is", "Nakato never", "Osbert always"
    // Look for capitalized names that appear near lecturer/teacher/staff keywords
    const contextPattern = /\b([A-Z][a-z]{2,})\s+(is|was|has|never|always|keeps|does|did|teaches|taught|handles|managed|runs|told|said|came|comes|cancels|rushes|reads|explains|helps|helped)/g;
    const commonWords = new Set(['The','This','These','Those','Some','Many','Most','All','Students','Student','University','Department','Faculty','Staff','Admin','Class','Course','Exam','Library','Canteen','Hostel','Transport','WiFi','Internet','Campus','Building','Room','Office','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','January','February','March','April','May','June','July','August','September','October','November','December']);
    while ((match = contextPattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (!commonWords.has(name) && !names.some(n => n.includes(name))) {
            names.push(name);
        }
    }

    // Pattern 3: "lecturer named X" or "teacher called X" patterns
    const namedPattern = /\b(?:lecturer|teacher|tutor|warden|manager|staff|driver|librarian)\s+(?:named|called)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;
    while ((match = namedPattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (!names.some(n => n.includes(name))) names.push(name);
    }

    return names;
}

// Pre-filter results to only include entries relevant to the admin's question
// This is the key fix for topic leakage — runs BEFORE sending to AI
function filterResultsByTopic(results, message) {
    const lower = message.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 3); // meaningful words only

    const filtered = results.filter(r => {
        const text = (r.feedback + ' ' + (r.evidenceText || '') + ' ' + (r.category || '')).toLowerCase();
        // Keep if any meaningful word from the question appears in the feedback
        return words.some(word => text.includes(word));
    });

    // Only use filtered results if we found matches — otherwise keep all
    // (this prevents filtering out everything when question is very broad)
    return filtered.length > 0 ? filtered : results;
}

function buildContext(results) {
    return results.map((doc, i) => {
        let entry = `[${i+1}] [${doc.category}|${doc.sentiment}] ${doc.feedback}`;
        if (doc.evidenceText) entry += `\n  Evidence: ${doc.evidenceText.slice(0,300)}`;
        const names = extractNames(doc.feedback + (doc.evidenceText || ''));
        if (names.length > 0) entry += `\n  People mentioned: ${names.join(', ')}`;
        return entry;
    }).join('\n\n').slice(0, 2000);
}

function buildNamedPersonsSummary(results) {
    const allNames = {};
    results.forEach(doc => {
        const names = extractNames(doc.feedback + (doc.evidenceText || ''));
        names.forEach(name => {
            if (!allNames[name]) allNames[name] = { positive: 0, negative: 0, neutral: 0, snippets: [] };
            const s = (doc.sentiment || 'neutral').toLowerCase();
            allNames[name][s] = (allNames[name][s] || 0) + 1;
            const snippet = doc.feedback.slice(0, 120);
            if (!allNames[name].snippets.includes(snippet)) allNames[name].snippets.push(snippet);
        });
    });
    if (Object.keys(allNames).length === 0) return null;
    return Object.entries(allNames).map(([name, data]) => {
        const label = data.negative > 0 ? 'concerns raised' : data.positive > 0 ? 'positive feedback' : 'observations noted';
        return `• ${name} — ${label}: "${data.snippets[0]}..."`;
    }).join('\n');
}

function buildPrompt(message, context, dateLabel, categoryLabel, intent='analysis', sentimentSummary=null, namedPersonsSummary=null, resultCount=0) {
    const scope = [
        categoryLabel ? `Category: ${categoryLabel}` : null,
        dateLabel     ? `Time period: ${dateLabel}`   : null
    ].filter(Boolean).join(' | ');

    const intentInstructions = {
        quick: `Give a direct answer in 1-2 sentences. Lead with the fact or number asked for. No headings needed for quick facts.`,

        analysis: `Structure your response like this:
## [Main topic]
One opening sentence.

**→ [Sub-theme label]**
Paragraph about this theme. Each sub-theme starts on a NEW LINE.

**→ [Next sub-theme label]**
Paragraph about this theme.

**⚠️ Key Concern:** Most urgent issue in bold if applicable.

One follow-up question.

RULES:
- Use ## for the main heading only
- Use **→ Label** (bold arrow) for sub-sections — NOT ### headings
- Every **→** point must start on a completely new line
- ONLY report feedback directly about the topic asked — skip unrelated entries
- Do NOT suggest solutions — only report what the feedback shows
- End with one follow-up question`,

        solution: `Start with:
## Solutions for [topic]
One short paragraph on the core problem from the feedback.

Then:
### Recommended Actions
1. [Most urgent action] ⚠️ Urgent
2. [Second action]
3. [Third action]
Each item must be specific and realistic — not generic advice.
Use language like "it is recommended that", "the university should consider".`,

        resolved: `Acknowledge in 1-2 sentences that the issue is resolved. No headings needed. Do not re-analyze the problem.`
    };

    const sentimentContext = sentimentSummary
        ? `Sentiment breakdown: ${sentimentSummary}
Frame response based on sentiment — positive = strength, neutral = observation, negative = concern.
Do NOT frame positive or neutral feedback as complaints.`
        : '';

    const namedSection = namedPersonsSummary
        ? `\nNAMED INDIVIDUALS IN THIS FEEDBACK (MUST mention all by name):\n${namedPersonsSummary}\n`
        : '';

    return `You are analyzing real student feedback submitted to the university suggestion box.
${scope ? `Scope: ${scope}` : 'Scope: All feedback'}

Admin's question: "${message}"

CRITICAL RULE: Only use feedback entries that directly answer the admin's question about "${message}".
If an entry is about a different topic, ignore it completely.
You have ${resultCount} entries below — only use the ones relevant to the question.

${sentimentContext}
${namedSection}
Student Feedback Data — ${resultCount} entries:
${context}

Instructions:
- STRICT: Only report feedback directly related to what was asked
- If no entries match the topic, say "No feedback submitted about this topic yet" and suggest alternatives
- Use ## for main heading, **→ Label** for sub-sections — NEVER use ### headings
- Every **→** sub-section must start on a completely new line with a blank line before it
- Every claim must come from the entries above — no training knowledge
- Do NOT write closing summary paragraphs
- PEOPLE NAMES: If a NAMED INDIVIDUALS section exists, mention every person by name in your response
- If a name appears in the feedback text itself, mention it naturally in your analysis
- Never omit a name that appears in the data
- ${intentInstructions[intent] || intentInstructions.analysis}`;
}

async function runVectorSearch(questionEmbedding, detectedCategory, dateRange) {
    if (dateRange) {
        const dateFilter = {
            createdAt: { $gte: dateRange.start, ...(dateRange.end && { $lte: dateRange.end }) },
            ...(detectedCategory && { category: detectedCategory })
        };
        const countInPeriod = await Feedback.countDocuments(dateFilter);
        if (countInPeriod === 0) {
            return { results: [], usedFallback: false, emptyPeriod: true, dateRange };
        }
    }

    const pipeline = [
        { $vectorSearch: {
            index: 'feedback_vector_index',
            queryVector: questionEmbedding,
            path: 'embedding',
            similarity: 'cosine',
            numCandidates: 200,
            limit: 50,
            ...(detectedCategory && { filter: { category: { $eq: detectedCategory } } })
        }},
        // Include score so we can check relevance threshold
        { $addFields: { score: { $meta: 'vectorSearchScore' } } },
        { $project: { feedback:1, category:1, summary:1, sentiment:1, evidenceText:1, createdAt:1, score:1 } }
    ];

    let results = await Feedback.aggregate(pipeline);

    // RELEVANCE THRESHOLD CHECK
    // If the best matching result has a low similarity score it means
    // the question topic doesn't match any feedback in the database
    // Return empty so admin gets "no feedback on this topic" instead of unrelated content
    if (results.length && !detectedCategory && !dateRange) {
        const topScore = results[0]?.score || 0;
        if (topScore < 0.45) {
            console.log(`Low relevance (${topScore.toFixed(3)}) — topic not in database`);
            return { results: [], usedFallback: false, emptyPeriod: false, topicMismatch: true };
        }
    }

    if (dateRange && results.length) {
        results = results.filter(doc => {
            const created = new Date(doc.createdAt);
            return dateRange.end
                ? created >= dateRange.start && created <= dateRange.end
                : created >= dateRange.start;
        });
    }

    results = results.slice(0, 5);

    if (!results.length && dateRange) {
        const dateFilter = {
            createdAt: { $gte: dateRange.start, ...(dateRange.end && { $lte: dateRange.end }) },
            ...(detectedCategory && { category: detectedCategory })
        };
        results = await Feedback.find(dateFilter)
            .sort({ createdAt: -1 }).limit(5)
            .select('feedback category summary sentiment evidenceText createdAt');
        return { results, usedFallback: true, emptyPeriod: false };
    }

    if (!results.length && (detectedCategory || dateRange)) {
        const broadResults = await Feedback.aggregate([
            { $vectorSearch: { index:'feedback_vector_index', queryVector:questionEmbedding, path:'embedding', similarity:'cosine', numCandidates:100, limit:5 } },
            { $addFields: { score: { $meta: 'vectorSearchScore' } } },
            { $project: { feedback:1, category:1, summary:1, sentiment:1, evidenceText:1, createdAt:1, score:1 } }
        ]);
        return { results: broadResults, usedFallback: true, emptyPeriod: false };
    }

    return { results, usedFallback: false, emptyPeriod: false };
}

const CHIT_CHAT_PROMPTS = {
    greeting:        `The admin just greeted you. Respond warmly and briefly. Let them know you are ready to help them understand student feedback. Keep it to 1-2 sentences.`,
    gratitude:       `The admin just thanked you. Respond naturally and briefly. Keep it to 1 sentence.`,
    status:          `The admin asked how you are. Respond in a friendly, light way and redirect to helping with student feedback. Keep it to 1-2 sentences.`,
    identity:        `The admin is asking who you are. Briefly explain that you are an AI feedback analyst for their university suggestion box system. Keep it to 2-3 sentences.`,
    acknowledgement: `The admin acknowledged your previous message with a short word like "ok" or "okay". Respond in one short sentence only. Ask if they want to explore anything else. Do not repeat anything.`,
    yes_no:          `The admin said yes or no. Use conversation history to know what they mean.
If YES: your FIRST word must be the start of the actual answer. No intro. No "sure". Just the content.
If NO: one short sentence like "No problem! Feel free to ask anything else."
FORBIDDEN: "Looking at", "Based on the history", "Since you said", "I will now", "I see that"`
};

async function loadSession(sessionId) {
    if (!sessionId) return { session: null, history: [] };
    let session = await ChatSession.findOne({ sessionId });
    if (session) return { session, history: session.messages.slice(-10) };
    session = new ChatSession({ sessionId });
    return { session, history: [] };
}

/* ═══════════════════════════════════════════════════════════════════
   ROUTES
═══════════════════════════════════════════════════════════════════ */

router.get('/digest', async (req, res) => {
    try {
        const { sessionId } = req.query;
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);

        let feedbackDocs = await Feedback.find({ createdAt: { $gte: todayStart } })
            .sort({ createdAt: -1 }).limit(20).select('feedback category sentiment createdAt');
        let periodLabel = 'today';

        if (!feedbackDocs.length) {
            const weekStart = new Date(); weekStart.setDate(weekStart.getDate()-7);
            feedbackDocs = await Feedback.find({ createdAt: { $gte: weekStart } })
                .sort({ createdAt: -1 }).limit(20).select('feedback category sentiment createdAt');
            periodLabel = 'the last 7 days';
        }
        if (!feedbackDocs.length) {
            const monthStart = new Date(); monthStart.setDate(monthStart.getDate()-30);
            feedbackDocs = await Feedback.find({ createdAt: { $gte: monthStart } })
                .sort({ createdAt: -1 }).limit(20).select('feedback category sentiment createdAt');
            periodLabel = 'the last 30 days';
        }
        if (!feedbackDocs.length) {
            return res.json({ success:true, digest:"No student feedback has been submitted yet. Once students start submitting feedback, I'll provide daily insights here.", totalAnalysed:0 });
        }

        const stats = await getStats();
        const feedbackContext = feedbackDocs.map((doc,i) => `${i+1}. [${doc.category}|${doc.sentiment}] ${doc.feedback}`).join('\n');
        const sentimentCounts = feedbackDocs.reduce((acc,doc) => { acc[doc.sentiment]=(acc[doc.sentiment]||0)+1; return acc; }, {});

        const digestPrompt = `You are preparing a proactive briefing for a university admin when they open the dashboard.
Feedback period: ${periodLabel} | Submissions: ${feedbackDocs.length}
Stats — Total: ${stats.total}, Pending: ${stats.pending}, Resolved: ${stats.resolved}
Sentiment: ${JSON.stringify(sentimentCounts)}
Feedback:
${feedbackContext}

Write a concise digest using this format:
**Overview:** One sentence on the overall picture.
**Top Issues:** 2-4 most prominent themes (specific — only from data above).
**Sentiment:** Brief note on tone.
${stats.pending > 5 ? `**Action Needed:** ${stats.pending} items pending — flag this.` : ''}
**Suggested Focus:** One specific priority for today.
Keep it scannable. STRICT: Only report what is in the feedback data above.`;

        const digest = await generateAIResponse(digestPrompt);

        if (sessionId) {
            try {
                await ChatSession.findOneAndUpdate({ sessionId }, { $set: { expiresAt: new Date(Date.now()+24*60*60*1000) } }, { upsert:true, new:true });
            } catch(e) {}
        }

        res.json({ success:true, digest, periodLabel, totalAnalysed: feedbackDocs.length });
    } catch(err) {
        console.error('Digest error:', err.message);
        res.status(500).json({ success:false, message:'Failed to generate digest.' });
    }
});

router.post('/chat', chatRateLimiter, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        if (!message) return res.status(400).json({ success:false, message:'Message is required.' });

        const { session, history } = await loadSession(sessionId);

        const chitChatType = detectChitChat(message);
        if (chitChatType) {
            const answer = chitChatType === 'yes_no'
                ? await generateAIResponse(CHIT_CHAT_PROMPTS[chitChatType], history)
                : await generateAIResponse(CHIT_CHAT_PROMPTS[chitChatType]);
            if (session) { session.addMessage(message, answer); await session.save(); }
            return res.json({ success:true, answer });
        }

        const isFollowUp = history.length > 0;
        const classification = await isRelevantQuestion(message, isFollowUp);
        if (!isFollowUp && !classification.relevant) {
            return res.json({ success:true, answer:"I'm here to help you understand student feedback. Try asking: \"What are students saying about the canteen this month?\" or \"What are the most common complaints?\"" });
        }

        const cleanMessage = classification.normalised || message;
        const normalizedMessage = cleanMessage.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,' ').replace(/\s+/g,' ').trim();
        const stats = await getStats();

        const isStatQuestion = normalizedMessage.includes('total') || normalizedMessage.includes('pending') || (normalizedMessage.includes('category') && stats.categoryStats.length > 0);
        if (isStatQuestion) {
            const categoryBreakdown = stats.categoryStats.map(c=>`${c._id}: ${c.count}`).join(', ');
            const topCategory = stats.categoryStats[0];
            const factualPart = [
                normalizedMessage.includes('total')    ? `Total submissions: **${stats.total}**` : null,
                normalizedMessage.includes('pending')  ? `Pending: **${stats.pending}** | Resolved: **${stats.resolved}**` : null,
                normalizedMessage.includes('category') ? `Top category: **${topCategory?._id}** (${topCategory?.count} submissions)` : null,
            ].filter(Boolean).join('  \n');
            const narrative = await generateAIResponse(`The admin asked: "${message}". Stats: Total=${stats.total}, Pending=${stats.pending}, Resolved=${stats.resolved}, Categories: ${categoryBreakdown||'none'}. In ONE sentence, add a brief observation. Do not restate the numbers.`);
            const answer = `${factualPart}\n\n${narrative}`.trim();
            if (session) { session.addMessage(message, answer); await session.save(); }
            return res.json({ success:true, answer, source:'stats' });
        }

        const detectedCategory = detectCategory(normalizedMessage);
        const dateRange        = detectDateRange(normalizedMessage);
        const intent           = detectIntent(cleanMessage);

        // Check response cache first
        const cacheKey = cleanMessage + '|' + (detectedCategory||'') + '|' + (dateRange?.label||'');
        const cached = responseCache.get(cacheKey);
        if (cached && !dateRange) { // don't cache time-sensitive queries
            if (session) { session.addMessage(message, cached); await session.save(); }
            return res.json({ success:true, answer: cached, fromCache: true });
        }

        let questionEmbedding = embeddingCache.get(cleanMessage);
        if (!questionEmbedding) {
            questionEmbedding = await generateEmbedding(cleanMessage);
            if (!questionEmbedding.length) return res.status(500).json({ success:false, message:'Failed to generate embedding.' });
            embeddingCache.set(cleanMessage, questionEmbedding);
        }

        const { results, emptyPeriod } = await runVectorSearch(questionEmbedding, detectedCategory, dateRange);

        if (!results.length) {
            let prompt;
            if (emptyPeriod && dateRange) {
                const recent = await Feedback.find().sort({ createdAt:-1 }).limit(5).select('feedback category sentiment createdAt');
                const recentCtx = recent.length ? recent.map((d,i)=>`${i+1}. [${d.category}|${d.sentiment}] ${d.feedback} (${new Date(d.createdAt).toDateString()})`).join('\n') : 'None available.';
                prompt = `The admin asked: "${message}". No feedback submitted ${dateRange.label==='today'?'today':`for ${dateRange.label}`} yet. Do NOT invent any. Recent feedback: ${recentCtx}. Tell admin honestly, briefly mention recent trends.`;
            } else {
                const availableCategories = await Feedback.distinct('category');
                const catList = availableCategories.length ? availableCategories.join(', ') : 'none yet';
                prompt = `The admin asked: "${message}". No student feedback has been submitted about this specific topic yet.
Tell the admin clearly in one sentence that nothing has been submitted about this topic.
Then ask: "Would you like to explore what students are saying about any of these areas: ${catList}?"
Do NOT invent any feedback. Do NOT report feedback about other topics.`;
            }
            const answer = await generateAIResponse(prompt);
            if (session) { session.addMessage(message, answer); await session.save(); }
            return res.json({ success:true, answer, ragResults:0, emptyPeriod: !!emptyPeriod });
        }

        // Pre-filter results by topic before sending to AI
        const filteredResults = filterResultsByTopic(results, cleanMessage);

        const context             = buildContext(filteredResults);
        const sentimentCounts     = filteredResults.reduce((acc,doc) => { const s=(doc.sentiment||'unknown').toLowerCase(); acc[s]=(acc[s]||0)+1; return acc; }, {});
        const sentimentSummary    = Object.entries(sentimentCounts).map(([s,c])=>`${c} ${s}`).join(', ');
        const namedPersonsSummary = buildNamedPersonsSummary(filteredResults);

        if (intent === 'resolved') {
            const resolutionCategory = detectResolutionCategory(cleanMessage);
            const updateFilter = { status:'pending', ...(resolutionCategory && { category:resolutionCategory }) };
            const updateResult = await Feedback.updateMany(updateFilter, { $set:{ status:'resolved', resolvedAt:new Date() } });
            const answer = await generateAIResponse(`The admin said: "${message}". ${resolutionCategory?`Category: ${resolutionCategory}.`:''} ${updateResult.modifiedCount>0?`${updateResult.modifiedCount} pending feedback items marked as resolved.`:'No pending items found to update.'} Acknowledge warmly in 1-2 sentences.`);
            if (session) { session.addMessage(message, answer); await session.save(); }
            return res.json({ success:true, answer, intent:'resolved', itemsResolved:updateResult.modifiedCount });
        }

        const prompt = buildPrompt(cleanMessage, context, dateRange?.label, detectedCategory, intent, sentimentSummary, namedPersonsSummary, filteredResults.length);
        const answer = await generateAIResponse(prompt, history);

        // Cache the response for repeated questions
        if (!dateRange) responseCache.set(cacheKey, answer);

        if (session) { session.addMessage(message, answer); await session.save(); }
        res.json({ success:true, answer, ragResults:filteredResults.length, detectedCategory:detectedCategory||'all', detectedPeriod:dateRange?.label||'all time', intent, sentimentSummary });

    } catch(err) {
        console.error('Chat route error:', err.message);
        res.status(500).json({ success:false, message:'AI processing failed. Please check your Groq API key.' });
    }
});

router.post('/chat/stream', chatRateLimiter, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        if (!message) return res.status(400).json({ success:false, message:'Message is required.' });

        res.setHeader('Content-Type',  'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection',    'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        const sendChunk = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
        const endStream = () => { res.write(`data: [DONE]\n\n`); res.end(); };

        const { session, history } = await loadSession(sessionId);

        const chitChatType = detectChitChat(message);
        if (chitChatType) {
            const streamMessages = chitChatType === 'yes_no'
                ? [...history.map(h=>([{role:'user',content:h.question},{role:'assistant',content:h.answer}])).flat(), {role:'user',content:CHIT_CHAT_PROMPTS['yes_no']}]
                : [{role:'user',content:CHIT_CHAT_PROMPTS[chitChatType]}];
            const stream = await groq.chat.completions.create({ model:'llama-3.1-8b-instant', messages:streamMessages, max_tokens:chitChatType==='yes_no'?400:150, temperature:0.4, stream:true });
            let fullAnswer = '';
            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content || '';
                if (text) { fullAnswer += text; sendChunk({ text }); }
            }
            if (session) { session.addMessage(message, cleanAIResponse(fullAnswer)); await session.save(); }
            return endStream();
        }

        const isFollowUp = history.length > 0;
        const classification = await isRelevantQuestion(message, isFollowUp);
        if (!isFollowUp && !classification.relevant) {
            sendChunk({ text:"I'm here to help you understand student feedback. Try asking: \"What are students saying about the canteen?\" or \"What are the most common complaints?\"" });
            return endStream();
        }

        const cleanMessage      = classification.normalised || message;
        const normalizedMessage = cleanMessage.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,' ').replace(/\s+/g,' ').trim();
        const stats             = await getStats();

        const isStatQuestion = normalizedMessage.includes('total') || normalizedMessage.includes('pending') || (normalizedMessage.includes('category') && stats.categoryStats.length > 0);
        if (isStatQuestion) {
            const categoryBreakdown = stats.categoryStats.map(c=>`${c._id}: ${c.count}`).join(', ');
            const topCategory = stats.categoryStats[0];
            const factualPart = [
                normalizedMessage.includes('total')    ? `Total submissions: **${stats.total}**` : null,
                normalizedMessage.includes('pending')  ? `Pending: **${stats.pending}** | Resolved: **${stats.resolved}**` : null,
                normalizedMessage.includes('category') ? `Top category: **${topCategory?._id}** (${topCategory?.count} submissions)` : null,
            ].filter(Boolean).join('  \n');
            sendChunk({ text: factualPart + '\n\n' });
            const stream = await groq.chat.completions.create({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:`Stats: Total=${stats.total}, Pending=${stats.pending}, Resolved=${stats.resolved}, Categories: ${categoryBreakdown||'none'}. In ONE sentence add a brief observation. Do not restate numbers.`}], max_tokens:100, temperature:0.4, stream:true });
            let narrative = '';
            for await (const chunk of stream) { const text=chunk.choices[0]?.delta?.content||''; if(text){narrative+=text;sendChunk({text});} }
            if (session) { session.addMessage(message, cleanAIResponse(factualPart+'\n\n'+narrative)); await session.save(); }
            return endStream();
        }

        const detectedCategory = detectCategory(normalizedMessage);
        const dateRange        = detectDateRange(normalizedMessage);
        const intent           = detectIntent(cleanMessage);

        let questionEmbedding = embeddingCache.get(cleanMessage);
        if (!questionEmbedding) {
            questionEmbedding = await generateEmbedding(cleanMessage);
            if (!questionEmbedding.length) { sendChunk({ text:'Failed to process your question. Please try again.' }); return endStream(); }
            embeddingCache.set(cleanMessage, questionEmbedding);
        }

        const { results, emptyPeriod } = await runVectorSearch(questionEmbedding, detectedCategory, dateRange);

        if (!results.length) {
            let noDataPrompt;
            if (emptyPeriod && dateRange) {
                const recent = await Feedback.find().sort({createdAt:-1}).limit(5).select('feedback category sentiment createdAt');
                const recentCtx = recent.length ? recent.map((d,i)=>`${i+1}. [${d.category}|${d.sentiment}] ${d.feedback} (${new Date(d.createdAt).toDateString()})`).join('\n') : 'None available.';
                noDataPrompt = `The admin asked: "${message}". No feedback submitted ${dateRange.label==='today'?'today':`for ${dateRange.label}`} yet. Do NOT invent any. Recent: ${recentCtx}. Tell admin honestly, briefly mention recent trends.`;
            } else {
                const availableCategories = await Feedback.distinct('category');
                const catList = availableCategories.length ? availableCategories.join(', ') : 'none yet';
                noDataPrompt = `The admin asked: "${message}". No student feedback has been submitted about this specific topic yet.
Tell the admin clearly in one sentence that nothing has been submitted about this topic.
Then ask: "Would you like to explore what students are saying about any of these areas: ${catList}?"
Do NOT invent any feedback. Do NOT report feedback about other topics.`;
            }
            const stream = await groq.chat.completions.create({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:noDataPrompt}], max_tokens:200, temperature:0.4, stream:true });
            let fullAnswer = '';
            for await (const chunk of stream) { const text=chunk.choices[0]?.delta?.content||''; if(text){fullAnswer+=text;sendChunk({text});} }
            if (session) { session.addMessage(message, cleanAIResponse(fullAnswer)); await session.save(); }
            return endStream();
        }

        // Pre-filter results by topic before sending to AI
        const filteredResults = filterResultsByTopic(results, cleanMessage);

        const context             = buildContext(filteredResults);
        const sentimentCounts     = filteredResults.reduce((acc,doc)=>{ const s=(doc.sentiment||'unknown').toLowerCase(); acc[s]=(acc[s]||0)+1; return acc; }, {});
        const sentimentSummary    = Object.entries(sentimentCounts).map(([s,c])=>`${c} ${s}`).join(', ');
        const namedPersonsSummary = buildNamedPersonsSummary(filteredResults);

        if (intent === 'resolved') {
            const resolutionCategory = detectResolutionCategory(cleanMessage);
            const updateFilter = { status:'pending', ...(resolutionCategory&&{category:resolutionCategory}) };
            const updateResult = await Feedback.updateMany(updateFilter, { $set:{ status:'resolved', resolvedAt:new Date() } });
            const resolvedPrompt = `The admin said: "${message}". ${resolutionCategory?`Category: ${resolutionCategory}.`:''} ${updateResult.modifiedCount>0?`${updateResult.modifiedCount} pending items marked resolved.`:'No pending items found.'} Acknowledge warmly in 1-2 sentences.`;
            const stream = await groq.chat.completions.create({ model:'llama-3.1-8b-instant', messages:[{role:'user',content:resolvedPrompt}], max_tokens:150, temperature:0.4, stream:true });
            let fullAnswer = '';
            for await (const chunk of stream) { const text=chunk.choices[0]?.delta?.content||''; if(text){fullAnswer+=text;sendChunk({text});} }
            if (session) { session.addMessage(message, cleanAIResponse(fullAnswer)); await session.save(); }
            return endStream();
        }

        const prompt = buildPrompt(cleanMessage, context, dateRange?.label, detectedCategory, intent, sentimentSummary, namedPersonsSummary, filteredResults.length);
        const messages = [
            { role:'system', content: SYSTEM_PROMPT },
            ...history.map(h=>([{role:'user',content:h.question},{role:'assistant',content:h.answer}])).flat(),
            { role:'user', content: prompt }
        ];

        const stream = await groq.chat.completions.create({ model:'llama-3.1-8b-instant', messages, max_tokens:1000, temperature:0.4, stream:true });

        let fullAnswer   = '';
        let streamBuffer = '';
        let introStripped = false;

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (!text) continue;
            fullAnswer += text;
            if (!introStripped) {
                streamBuffer += text;
                // Wait for a complete sentence before sending first chunk
                if (streamBuffer.length >= 200 && /[.!?]\s/.test(streamBuffer)) {
                    const cleaned = cleanAIResponse(streamBuffer);
                    introStripped = true;
                    if (cleaned) sendChunk({ text: cleaned });
                    streamBuffer = '';
                }
            } else {
                sendChunk({ text });
            }
        }

        if (streamBuffer) { const c = cleanAIResponse(streamBuffer); if(c) sendChunk({ text: c }); }
        fullAnswer = cleanAIResponse(fullAnswer);
        if (session) { session.addMessage(message, fullAnswer); await session.save(); }
        sendChunk({ done:true, ragResults:filteredResults.length, detectedCategory:detectedCategory||'all', detectedPeriod:dateRange?.label||'all time', intent, sentimentSummary });
        endStream();

    } catch(err) {
        console.error('Stream route error:', err.message);
        try { res.write(`data: ${JSON.stringify({error:'Something went wrong. Please try again.'})}\n\n`); res.write(`data: [DONE]\n\n`); res.end(); } catch(e) {}
    }
});

router.get('/session/:sessionId', async (req, res) => {
    try {
        const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.json({ success:true, history:[], isNew:true });
        res.json({ success:true, history:session.messages.slice(-20), isNew:false });
    } catch(err) { res.status(500).json({ success:false, message:'Failed to load session.' }); }
});

router.delete('/session/:sessionId', async (req, res) => {
    try {
        await ChatSession.findOneAndDelete({ sessionId: req.params.sessionId });
        res.json({ success:true, message:'Session cleared.' });
    } catch(err) { res.status(500).json({ success:false, message:'Failed to clear session.' }); }
});

router.get('/summary/:id', async (req, res) => {
    try {
        const feedbackItem = await Feedback.findById(req.params.id);
        if (!feedbackItem) return res.status(404).json({ success:false, message:'Feedback not found.' });
        if (feedbackItem.summary) return res.json({ success:true, summary:feedbackItem.summary, cached:true });

        const rawFeedback = feedbackItem.evidenceText
            ? `${feedbackItem.feedback}. Additional detail: ${feedbackItem.evidenceText}`
            : feedbackItem.feedback;

        const summarySystemPrompt = `You are a professional feedback summarizer for a university administration system. Produce clean, concise, admin-ready summaries. Factual, neutral, third person always.`;
        const summaryPrompt = `Summarize this student feedback for a university admin dashboard.
Feedback: "${rawFeedback}"
Category: ${feedbackItem.category||'Unknown'} | Sentiment: ${feedbackItem.sentiment||'Unknown'}
Write a clear 2-3 sentence professional summary in third person. Capture the core issue, mention urgency if clear. No opinions or recommendations.`;

        const summary = await generateAIResponse(summaryPrompt, [], summarySystemPrompt);
        await Feedback.findByIdAndUpdate(feedbackItem._id, { summary });
        res.json({ success:true, summary, cached:false });
    } catch(err) {
        console.error('Summary error:', err.message);
        res.status(500).json({ success:false, message:'Failed to generate summary.' });
    }
});

module.exports = router;