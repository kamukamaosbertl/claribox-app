// services/urgencyDetector.js
// ─────────────────────────────────────────────────────────────────
// Scans feedback text for urgent keywords and returns a reason
// if the feedback needs immediate admin attention.
//
// This runs synchronously — no AI call needed.
// Fast enough to run on every feedback submission.
// ─────────────────────────────────────────────────────────────────

const URGENT_PATTERNS = [
    // Safety
    { pattern: /\b(unsafe|danger|dangerous|safety|hazard|risk|accident|injury|injured|hurt|fire|flood|collapse)\b/i, reason: 'Safety concern detected' },
    // Harassment / abuse
    { pattern: /\b(harass|harassment|abuse|abused|threaten|threat|bully|bullying|assault|violence|discriminat)\b/i, reason: 'Harassment or abuse mentioned' },
    // Health
    { pattern: /\b(sick|illness|food poison|food poisoning|medical|hospital|emergency|contaminated|hygiene)\b/i, reason: 'Health concern raised' },
    // Corruption / misconduct
    { pattern: /\b(corrupt|corruption|bribe|bribery|misconduct|fraud|steal|stolen|theft|missing funds)\b/i, reason: 'Misconduct or corruption mentioned' },
    // Strong urgency language
    { pattern: /\b(urgent|immediately|serious|critical|crisis|desperate|please help|no one is listening|ignored for months)\b/i, reason: 'Urgent language used' },
    // Sexual harassment
    { pattern: /\b(sexual|inappropriate|unwanted|touching|molest)\b/i, reason: 'Sensitive misconduct reported' },
];

function detectUrgency(feedbackText) {
    if (!feedbackText) return null;

    for (const { pattern, reason } of URGENT_PATTERNS) {
        if (pattern.test(feedbackText)) {
            return reason;
        }
    }

    return null; // not urgent
}

module.exports = { detectUrgency };