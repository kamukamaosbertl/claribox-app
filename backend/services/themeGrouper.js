const ThemeGroup = require('../models/ThemeGroup');
const Groq = require('groq-sdk');
const axios = require('axios');

const {
  addCategoryToFaiss,
  searchCategoryFaiss,
} = require('./ragIndexer');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:5001';

async function generateEmbedding(text) {
  const res = await axios.post(`${NLP_SERVICE_URL}/embed`, { text });

  if (!res.data?.success || !Array.isArray(res.data.embedding)) {
    throw new Error(res.data?.message || 'Embedding generation failed');
  }

  return res.data.embedding;
}

function normalizeTags(tags = []) {
  return [...new Set(
    (tags || [])
      .map(tag => String(tag || '').trim().toLowerCase())
      .filter(Boolean)
  )];
}

function toTitleCase(text = '') {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeLabelForMatch(label = '') {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9 &/-]/g, '')
    .replace(/\bissues?\b/g, '')
    .replace(/\bproblems?\b/g, '')
    .replace(/\bconcerns?\b/g, '')
    .replace(/\bgeneral\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildShortLabel(label = '') {
  if (!label) return 'General Feedback';

  const cleaned = String(label)
    .split('/')[0]
    .replace(/\bissues?\b/gi, '')
    .replace(/\bproblems?\b/gi, '')
    .replace(/\bconcerns?\b/gi, '')
    .replace(/\baccommodation\b/gi, '')
    .replace(/\bservices?\b/gi, '')
    .replace(/\bservice\b/gi, '')
    .replace(/\bmaintenance\b/gi, '')
    .replace(/\band\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);

  return toTitleCase(words.slice(0, 2).join(' ')) || 'General Feedback';
}

function buildGroupingText({ feedback = '', tags = [], evidenceText = '' }) {
  return [
    ...(tags || []),
    feedback || '',
    evidenceText || '',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 1200);
}

function safeParseJSON(raw = '') {
  try {
    const cleaned = String(raw)
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function sanitizeLabel(label = '') {
  const cleaned = String(label || '')
    .replace(/[^a-zA-Z0-9 &/-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return toTitleCase(cleaned.split(/\s+/).slice(0, 6).join(' '));
}

function normalizeAIResponse(parsed) {
  if (Array.isArray(parsed)) {
    return parsed.find(item => item && item.topicLabel) || parsed[0] || null;
  }

  return parsed;
}

async function getExistingThemeLabels() {
  const groups = await ThemeGroup.find({})
    .select('label feedbackCount lastUsedAt')
    .sort({ feedbackCount: -1, lastUsedAt: -1 })
    .limit(50)
    .lean();

  return groups
    .map(group => sanitizeLabel(group.label))
    .filter(Boolean);
}

function findExistingLabelMatch(label = '', existingLabels = []) {
  const normalized = normalizeLabelForMatch(label);
  if (!normalized) return null;

  return existingLabels.find(existing => {
    const normalizedExisting = normalizeLabelForMatch(existing);
    if (!normalizedExisting) return false;

    return (
      normalizedExisting === normalized ||
      normalizedExisting.includes(normalized) ||
      normalized.includes(normalizedExisting)
    );
  }) || null;
}

async function generateTopicLabelWithAI({
  feedback = '',
  tags = [],
  existingLabels = [],
}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing. AI category labeling cannot run.');
  }

  const prompt = `
You label university student feedback for an admin dashboard.

Feedback:
"${String(feedback || '').slice(0, 800)}"

Tags:
${normalizeTags(tags).slice(0, 6).join(', ') || 'none'}

Existing dashboard categories. Use the EXACT text if one fits:
${existingLabels.length ? existingLabels.map(label => `- "${label}"`).join('\n') : 'none'}

Return exactly ONE JSON object only. Do not return an array.

{
  "topicLabel": "exact existing category or new dashboard category",
  "useExistingCategory": true
}

Rules:
- Return only one best category, not multiple options.
- Choose the category based on the actual meaning of the feedback.
- If an existing category fits, copy it EXACTLY.
- Do NOT create a new category when an existing category already fits.
- Create a new category only when none of the existing categories fit.
- topicLabel must be broad and reusable for dashboard grouping.
- topicLabel must name the responsible place, department, service, system, or office.
- Prefer the specific responsible area over a broad general area.
- Use broad categories only when no specific area is clearly responsible.
- Do not let words like "facilities", "issues", "problems", "concerns", or "maintenance" override the main subject.
- New topicLabel must be title case and max 4 words.
- Never end topicLabel with: Issues, Problems, Concerns.
- No explanation.
- No markdown.
`.trim();

  const result = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.01,
    max_tokens: 80,
  });

  const raw = result.choices[0]?.message?.content || '';
  const parsed = normalizeAIResponse(safeParseJSON(raw));

  let topicLabel = sanitizeLabel(parsed?.topicLabel);

  if (!topicLabel) {
    throw new Error(`AI failed to generate a valid topic label. Raw response: ${raw}`);
  }

  const existingMatch = findExistingLabelMatch(topicLabel, existingLabels);

  if (existingMatch) {
    topicLabel = existingMatch;
  }

  return {
    topicLabel,
    topicShortLabel: buildShortLabel(topicLabel),
    useExistingCategory: Boolean(parsed?.useExistingCategory),
  };
}

async function assignThemeGroup({
  feedbackId,
  feedback = '',
  tags = [],
  evidenceText = '',
}) {
  const normalizedTags = normalizeTags(tags);

  const groupingText = buildGroupingText({
    feedback,
    tags: normalizedTags,
    evidenceText,
  });

  if (!groupingText.trim()) {
    throw new Error('Cannot assign theme group: feedback text is empty.');
  }

  const existingLabels = await getExistingThemeLabels();

  const aiLabel = await generateTopicLabelWithAI({
    feedback,
    tags: normalizedTags,
    existingLabels,
  });

  const existingLabelMatch = findExistingLabelMatch(
    aiLabel.topicLabel,
    existingLabels
  );

  let bestGroup = null;

  if (existingLabelMatch) {
    bestGroup = await ThemeGroup.findOne({
      label: existingLabelMatch,
    });
  }

  const topicShortLabel = buildShortLabel(aiLabel.topicLabel);
  const embeddingText = `${aiLabel.topicLabel} ${topicShortLabel}`;
  const embedding = await generateEmbedding(embeddingText);

  if (!embedding || !embedding.length) {
    throw new Error('Cannot assign theme group: embedding generation failed.');
  }

  if (!bestGroup) {
    const categoryResults = await searchCategoryFaiss(embedding, 5);
    const MATCH_THRESHOLD = 0.8;

    for (const category of categoryResults || []) {
      if ((category.score || 0) < MATCH_THRESHOLD) continue;

      const themeGroupId = category.metadata?.themeGroupId;
      if (!themeGroupId) continue;

      const foundGroup = await ThemeGroup.findById(themeGroupId);
      if (!foundGroup) continue;

      const foundNorm = normalizeLabelForMatch(foundGroup.label);
      const aiNorm = normalizeLabelForMatch(aiLabel.topicLabel);

      if (
        foundNorm === aiNorm ||
        foundNorm.includes(aiNorm) ||
        aiNorm.includes(foundNorm)
      ) {
        bestGroup = foundGroup;
        break;
      }
    }
  }

  if (bestGroup) {
    const mergedTags = [...new Set([
      ...(bestGroup.allTags || []),
      ...normalizedTags,
    ])];

    await ThemeGroup.findByIdAndUpdate(bestGroup._id, {
      allTags: mergedTags,
      representativeTags: mergedTags.slice(0, 5),
      feedbackCount: (bestGroup.feedbackCount || 0) + 1,
      lastUsedAt: new Date(),
    });

    return {
      topicLabel: bestGroup.label,
      topicShortLabel: buildShortLabel(bestGroup.label),
    };
  }

  const newGroup = await ThemeGroup.create({
    label: aiLabel.topicLabel,
    representativeTags: normalizedTags.slice(0, 5),
    allTags: normalizedTags,
    categoryFaissId: null,
    feedbackCount: 1,
    lastUsedAt: new Date(),
  });

  const categoryFaissId = await addCategoryToFaiss({
    embedding,
    metadata: {
      themeGroupId: newGroup._id.toString(),
      label: aiLabel.topicLabel,
      shortLabel: topicShortLabel,
      tags: normalizedTags.slice(0, 5),
    },
  });

  await ThemeGroup.findByIdAndUpdate(newGroup._id, {
    categoryFaissId,
  });

  return {
    topicLabel: aiLabel.topicLabel,
    topicShortLabel,
  };
}

module.exports = {
  assignThemeGroup,
  normalizeTags,
  buildShortLabel,
  buildGroupingText,
  generateTopicLabelWithAI,
};