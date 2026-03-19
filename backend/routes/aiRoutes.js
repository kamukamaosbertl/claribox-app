const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Groq = require('groq-sdk');

const MAX_TEXT_LENGTH = 4000;

// Groq AI
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Local embedding pipeline
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

// Feedback topics & categories
const ALLOWED_TOPICS = [
    'feedback','student','complaint','suggestion','improve','experience','teaching','lecture','class','course',
    'facility','library','hostel','food','canteen','staff','service','support','concern','report','trend','total',
    'pending','resolved','category','sentiment','negative','positive','neutral','rating','performance','quality',
    'wifi','internet','transport','parking','admin','today','week','month','year','recent','latest','happening'
];

const CATEGORY_KEYWORDS = {
    academic: ['academic','teaching','teacher','lecture','class','course','learning','exam','assignment','marks','grades','tutor','professor','education','subject'],
    library: ['library','books','reading','resources','journals','study room','librarian','borrow'],
    it: ['wifi','internet','network','computer','lab','technology','system','portal','online','connection','software','hardware'],
    facilities: ['facility','campus','building','classroom','toilet','bathroom','grounds','sports','gym','field','maintenance','cleaning'],
    canteen: ['canteen','food','meal','dining','cafeteria','menu','kitchen','snack','drink'],
    transport: ['transport','bus','vehicle','parking','commute','driver','route','schedule','taxi','shuttle','road'],
    hostel: ['hostel','room','dormitory','dorm','housing','sleep','bed','warden','residence'],
    admin: ['admin','office','registration','fees','payment','documents','finance','enrollment','admission','records']
};

/* ---------------- HELPER FUNCTIONS ---------------- */

function isRelevantQuestion(message) {
    const lower = message.toLowerCase();
    return ALLOWED_TOPICS.some(topic => lower.includes(topic));
}

function detectChitChat(message) {
    const lower = message.toLowerCase();
    if (/(hi|hello|hey|good morning|good afternoon)/i.test(lower)) return 'greeting';
    if (/(thanks|thank you|thx|appreciate)/i.test(lower)) return 'gratitude';
    return null;
}

function detectCategory(message) {
    const lower = message.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => new RegExp(`\\b${kw.replace(/[-\/]/g,'\\$&')}\\b`, 'i').test(lower))) {
            console.log(`Category detected: ${cat}`);
            return cat;
        }
    }
    return null;
}

function detectDateRange(message) {
    const lower = message.toLowerCase();
    const now = new Date();
    if (lower.includes('today')) return { start: new Date(now.setHours(0,0,0,0)), label: 'today' };
    if (lower.includes('this week') || lower.includes('last 7 days')) { const start=new Date(); start.setDate(now.getDate()-7); return { start, label: 'this week' }; }
    if (lower.includes('last week')) { const start=new Date(); start.setDate(now.getDate()-14); const end=new Date(); end.setDate(now.getDate()-7); return { start,end,label:'last week' }; }
    if (lower.includes('this month')) return { start: new Date(now.getFullYear(), now.getMonth(),1), label:'this month' };
    if (lower.includes('last month')) return { start: new Date(now.getFullYear(),now.getMonth()-1,1), end: new Date(now.getFullYear(),now.getMonth(),1), label:'last month' };
    if (lower.includes('this year')) return { start: new Date(now.getFullYear(),0,1), label:'this year' };
    if (lower.includes('recent') || lower.includes('latest') || lower.includes('happening')) { const start=new Date(); start.setDate(now.getDate()-30); return { start,label:'recently (last 30 days)' }; }
    const lastNDaysMatch = lower.match(/last (\d+)\s*days?/);
    if (lastNDaysMatch) { const n=parseInt(lastNDaysMatch[1],10); if(!isNaN(n)&&n>0){ const start=new Date(); start.setDate(start.getDate()-n); return { start, label:`last ${n} days` }; } }
    return null;
}

async function generateEmbedding(text) {
    try {
        const safeText = text.slice(0, MAX_TEXT_LENGTH);
        const pipe = await getEmbeddingPipeline();
        const output = await pipe(safeText,{ pooling:'mean', normalize:true });
        return Array.from(output.data);
    } catch(err) { console.error('Embedding error:', err.message); return []; }
}

async function generateAIResponse(prompt, history=[]) {
    try {
        const messages = [
            { role:'system', content:'You are a human-like university feedback assistant. Explain trends naturally and only suggest solutions if asked explicitly.' },
            ...history.map(h => ([ {role:'user', content:h.question}, {role:'assistant', content:h.answer} ])).flat(),
            { role:'user', content: prompt }
        ];
        const result = await groq.chat.completions.create({
            model:'llama-3.1-8b-instant',
            messages,
            max_tokens:600,
            temperature:0.3
        });
        return result.choices[0]?.message?.content?.trim() || '';
    } catch(err){ console.error('AI error:', err.message); return "Sorry, I'm having trouble right now."; }
}

async function getStats() {
    const [total,pending,resolved,categoryStats] = await Promise.all([
        Feedback.countDocuments(),
        Feedback.countDocuments({status:'pending'}),
        Feedback.countDocuments({status:'resolved'}),
        Feedback.aggregate([{ $group:{_id:'$category', count:{$sum:1}}},{ $sort:{count:-1} }])
    ]);
    return { total,pending,resolved,categoryStats };
}

function buildContext(results){
    return results.map((doc,i)=>{
        let entry=`${i+1}. [${doc.category}|${doc.sentiment}] ${doc.feedback}`;
        if(doc.evidenceText) entry+=`\n  Evidence: ${doc.evidenceText.slice(0,300)}`;
        return entry;
    }).join('\n\n').slice(0,2000);
}

// Updated prompt builder: ensures separate blocks per question
function buildPrompt(message, context, dateLabel, categoryLabel, includeSolutions=false){
    const scope = [categoryLabel?`category: ${categoryLabel}`:null,dateLabel?`time period: ${dateLabel}`:null].filter(Boolean).join(', ');
    return `You are analyzing university student feedback data.
${scope?`Focus on feedback from: ${scope}.`:''}

Use the student feedback below as PRIMARY source.
If insufficient, use general knowledge but preface with "Based on general knowledge:".

Question: ${message}

Student Feedback Data:
${context}

Instructions:
- Treat this question separately from previous questions
- Give a detailed, human-like response (4-6 sentences)
- Explain what the feedback is about
${includeSolutions?'- Suggest concrete actions the administration can take':''}
- Identify patterns and themes
- If using feedback data say "Based on student feedback:"
- Be professional and helpful`;
}

async function runVectorSearch(questionEmbedding, detectedCategory, dateRange){
    const pipeline = [
        { $vectorSearch:{ index:'feedback_vector_index', queryVector:questionEmbedding, path:'embedding', similarity:'cosine', numCandidates:100, limit:detectedCategory?10:5, ...(detectedCategory && { filter:{category:{ $eq: detectedCategory } } }) } }
    ];
    if(dateRange) pipeline.push({ $match:{ createdAt:{ $gte:dateRange.start, ...(dateRange.end && { $lte:dateRange.end }) } } });
    pipeline.push({ $project:{ feedback:1, category:1, summary:1, sentiment:1, evidenceText:1, createdAt:1 } }, { $limit:5 });

    let results = await Feedback.aggregate(pipeline);
    if(!results.length && (detectedCategory||dateRange)){
        console.log('Fallback search triggered');
        results = await Feedback.aggregate([{ $vectorSearch:{ index:'feedback_vector_index', queryVector:questionEmbedding, path:'embedding', similarity:'cosine', numCandidates:100, limit:5 } }, { $project:{ feedback:1, category:1, summary:1, sentiment:1, evidenceText:1, createdAt:1 } }]);
        return { results, usedFallback:true };
    }
    return { results, usedFallback:false };
}

/* ---------------- ROUTES ---------------- */

router.post('/chat', async (req,res)=>{
    try{
        const { message, history=[] } = req.body;
        if(!message) return res.status(400).json({success:false,message:'Message is required.'});

        // Handle greetings or thanks
        const chitChatType = detectChitChat(message);
        if(chitChatType==='greeting') return res.json({success:true,answer:'Hello! How can I assist with student feedback today? 😊'});
        if(chitChatType==='gratitude') return res.json({success:true,answer:'You’re welcome! Glad to help! 😄'});

        // Block irrelevant first-time questions
        const isFollowUp = history.length>0;
        if(!isFollowUp && !isRelevantQuestion(message)) return res.status(400).json({success:false,message:'This assistant only answers questions about student feedback.'});

        const normalizedMessage = message.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,' ').replace(/\s+/g,' ').trim();
        const stats = await getStats();

        // Quick stats
        if(normalizedMessage.includes('total')) return res.json({success:true,answer:`There are ${stats.total} total feedback submissions.`});
        if(normalizedMessage.includes('pending')) return res.json({success:true,answer:`There are ${stats.pending} pending feedbacks and ${stats.resolved} resolved.`});
        if(normalizedMessage.includes('category') && stats.categoryStats.length>0) return res.json({success:true,answer:`Top category: ${stats.categoryStats[0]._id} (${stats.categoryStats[0].count} feedbacks).`});

        // Process feedback query
        const detectedCategory = detectCategory(normalizedMessage);
        const dateRange = detectDateRange(normalizedMessage);

        router.embeddingCache = router.embeddingCache || new Map();
        let questionEmbedding = router.embeddingCache.get(message);
        if(!questionEmbedding){
            questionEmbedding = await generateEmbedding(message);
            if(!questionEmbedding.length) return res.status(500).json({success:false,message:'Failed to generate embedding.'});
            router.embeddingCache.set(message,questionEmbedding);
        }

        const { results } = await runVectorSearch(questionEmbedding, detectedCategory, dateRange);
        if(!results.length) return res.json({success:true,answer:`No feedback found${dateRange?` for ${dateRange.label}`:''}${detectedCategory?` in ${detectedCategory} category`:''}.`});

        const context = buildContext(results);
        const includeSolutions = /(solution|recommend|action|improve|suggest)/i.test(message);

        // Only include relevant previous history
        const feedbackHistory = history.filter(h=>isRelevantQuestion(h.question));

        const answer = await generateAIResponse(buildPrompt(message, context, dateRange?.label, detectedCategory, includeSolutions), feedbackHistory);

        res.json({
            success:true,
            answer,
            ragResults: results.length,
            detectedCategory: detectedCategory||'all',
            detectedPeriod: dateRange?.label||'all time'
        });

    } catch(err){
        console.error('Chat route error:', err.message);
        res.status(500).json({success:false,message:'AI processing failed. Please check your Groq API key.'});
    }
});

router.get('/summary/:id', async (req,res)=>{
    try{
        const feedbackItem = await Feedback.findById(req.params.id);
        if(!feedbackItem) return res.status(404).json({success:false,message:'Feedback not found.'});
        if(feedbackItem.summary) return res.json({success:true,summary:feedbackItem.summary,cached:true});

        const textToSummarize = feedbackItem.evidenceText?`${feedbackItem.feedback}. Evidence: ${feedbackItem.evidenceText}`:feedbackItem.feedback;
        const summary = await generateAIResponse(textToSummarize); // Reusing AI for summarization
        await Feedback.findByIdAndUpdate(feedbackItem._id,{summary});
        res.json({success:true,summary,cached:false});
    } catch(err){
        console.error('Summary route error:', err.message);
        res.status(500).json({success:false,message:'Failed to generate summary.'});
    }
});

module.exports = router;