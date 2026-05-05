const axios = require('axios');

const Feedback = require('../models/Feedback');
const FeedbackChunk = require('../models/FeedbackChunk');

// ============================================================
// CONFIG
// ============================================================

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://127.0.0.1:5001';

const CHUNK_SIZE = 700;
const CHUNK_OVERLAP = 100;
const MAX_INDEX_TEXT_LENGTH = 6000;

// ============================================================
// TEXT HELPERS
// ============================================================

function cleanText(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .trim();
}

function buildIndexableText(feedback) {
  const parts = [];

  if (feedback.feedback) {
    parts.push(`Student feedback: ${feedback.feedback}`);
  }

  if (feedback.evidenceText) {
    parts.push(`Evidence text: ${feedback.evidenceText}`);
  }

  return cleanText(parts.join('\n\n')).slice(0, MAX_INDEX_TEXT_LENGTH);
}

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const cleaned = cleanText(text);

  if (!cleaned) return [];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();

    if (chunk) chunks.push(chunk);

    if (end >= cleaned.length) break;

    start += chunkSize - overlap;
  }

  return chunks;
}

// ============================================================
// PYTHON NLP / FAISS HELPERS
// ============================================================

async function createEmbedding(text) {
  const response = await axios.post(`${NLP_SERVICE_URL}/embed`, {
    text
  });

  if (!response.data?.success || !Array.isArray(response.data.embedding)) {
    throw new Error(response.data?.message || 'Failed to create embedding');
  }

  if (response.data.embedding.length === 0) {
    throw new Error('Embedding service returned an empty embedding');
  }

  return response.data.embedding;
}

async function addEmbeddingToFaiss({ embedding, metadata }) {
  const response = await axios.post(`${NLP_SERVICE_URL}/faiss/add`, {
    embedding,
    metadata
  });

  if (!response.data?.success || typeof response.data.faissId !== 'number') {
    throw new Error(response.data?.message || 'Failed to add vector to FAISS');
  }

  return response.data.faissId;
}

async function addCategoryToFaiss({ embedding, metadata }) {
  const response = await axios.post(`${NLP_SERVICE_URL}/faiss/category/add`, {
    embedding,
    metadata
  });

  if (!response.data?.success || typeof response.data.faissId !== 'number') {
    throw new Error(response.data?.message || 'Failed to add category vector to FAISS');
  }

  return response.data.faissId;
}

async function searchCategoryFaiss(embedding, topK = 5) {
  const response = await axios.post(`${NLP_SERVICE_URL}/faiss/category/search`, {
    embedding,
    topK
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to search category FAISS');
  }

  return response.data.results || [];
}


//==========================================================
//generate embedding for admin query
//==========================================================
async function searchFaiss(embedding, topK = 10) {
  const response = await axios.post(`${NLP_SERVICE_URL}/faiss/search`, {
    embedding,
    topK
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to search FAISS');
  }

  return response.data.results || [];
}

const generateEmbedding = createEmbedding;

// ============================================================
// MAIN RAG INDEXER
// ============================================================

async function indexFeedbackForRAG(feedbackId) {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new Error('Feedback not found');
  }

  await Feedback.findByIdAndUpdate(feedback._id, {
    ragStatus: 'processing',
    ragError: null
  });

  const indexableText = buildIndexableText(feedback);

  if (!indexableText) {
    await Feedback.findByIdAndUpdate(feedback._id, {
      ragStatus: 'failed',
      ragError: 'No feedback or evidence text available for RAG indexing'
    });

    throw new Error('No feedback or evidence text available for RAG indexing');
  }

  const chunks = chunkText(indexableText);

  if (chunks.length === 0) {
    await Feedback.findByIdAndUpdate(feedback._id, {
      ragStatus: 'failed',
      ragError: 'No chunks were created for RAG indexing'
    });

    throw new Error('No chunks were created for RAG indexing');
  }

  await FeedbackChunk.deleteMany({ feedbackId: feedback._id });

  const createdChunks = await FeedbackChunk.insertMany(
    chunks.map((chunk, index) => ({
      feedbackId: feedback._id,
      anonymous_id: feedback.anonymous_id,
      chunkIndex: index,
      chunkText: chunk,
      sourceType: feedback.evidenceText ? 'combined' : 'feedback',
      tags: feedback.tags || [],
      topicLabel: feedback.topicLabel || null,
      topicShortLabel: feedback.topicShortLabel || null,
      sentiment: feedback.sentiment || null,
      emotion: feedback.emotion || null,
      faissId: null,
      embeddingStatus: 'pending',
      embeddingError: null
    }))
  );

  let indexedCount = 0;

  for (const chunk of createdChunks) {
    try {
      const embedding = await createEmbedding(chunk.chunkText);

      const faissId = await addEmbeddingToFaiss({
        embedding,
        metadata: {
          chunkId: String(chunk._id),
          feedbackId: String(feedback._id),
          anonymous_id: feedback.anonymous_id,
          chunkIndex: chunk.chunkIndex,
          sourceType: chunk.sourceType,
          tags: chunk.tags || [],
          topicLabel: chunk.topicLabel || null,
          topicShortLabel: chunk.topicShortLabel || null,
          sentiment: chunk.sentiment || null,
          emotion: chunk.emotion || null
        }
      });

      chunk.faissId = faissId;
      chunk.embeddingStatus = 'indexed';
      chunk.embeddingError = null;
      await chunk.save();

      indexedCount += 1;
    } catch (err) {
      chunk.embeddingStatus = 'failed';
      chunk.embeddingError = err.message;
      await chunk.save();

      console.error(
        `RAG chunk indexing failed for feedback ${feedback.anonymous_id}, chunk ${chunk.chunkIndex}:`,
        err.message
      );
    }
  }

  if (indexedCount === 0) {
    await Feedback.findByIdAndUpdate(feedback._id, {
      ragStatus: 'failed',
      ragError: 'All chunks failed during embedding or FAISS indexing'
    });

    throw new Error('All chunks failed during embedding or FAISS indexing');
  }

  await Feedback.findByIdAndUpdate(feedback._id, {
    ragStatus: indexedCount === createdChunks.length ? 'indexed' : 'failed',
    ragError:
      indexedCount === createdChunks.length
        ? null
        : `${indexedCount}/${createdChunks.length} chunks indexed successfully`,
    indexedAt: new Date()
  });

  return {
    feedbackId: String(feedback._id),
    anonymous_id: feedback.anonymous_id,
    chunksCreated: createdChunks.length,
    chunksIndexed: indexedCount
  };
}

module.exports = {
  indexFeedbackForRAG,
  chunkText,
  buildIndexableText,
  createEmbedding,
  generateEmbedding,
  addEmbeddingToFaiss,
  addCategoryToFaiss,
  searchCategoryFaiss,
  searchFaiss
};