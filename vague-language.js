"use strict";
/**
 * Deterministic vague-settlement-language detector, extracted from Kervyxa's
 * `packages/domain/src/vague-language.ts` (dependency-free CommonJS copy).
 *
 * Kervyxa applies it after AI drafting to every acceptance criterion (and, at WARN severity only,
 * to free prose such as the objective): an outcome contract can only be settled by a machine if
 * "done" does not secretly mean "a human liked it".
 */

const VAGUE_SETTLEMENT_TERMS = [
  "good",
  "better",
  "clean",
  "professional",
  "optimized",
  "optimised",
  "user friendly",
  "user-friendly",
  "high quality",
  "robust",
  // Added 2026-09-26 as SUBSTRING matches: "insecure", "securely", "accurately" and "inaccurate"
  // are the same unverifiable claim in a different tense.
  "secure",
  "accurate",
];

/**
 * A crude but effective "does this text also carry a machine-checkable, objective definition"
 * detector: a numeric comparison, a number with a measurement unit, a sha256 digest, or an explicit
 * exit/status code.
 */
const OBJECTIVE_DEFINITION_RE =
  /(<=|>=|==|!=|<|>|≤|≥)\s*-?\d|\b-?\d+(\.\d+)?\s*(ms|milliseconds?|s|sec|secs|seconds?|%|percent|mb|gb|kb|bytes?|rps|qps|req\/s|requests?|ops)\b|sha256:[0-9a-f]{64}|\bexit code\s+-?\d+\b|\bstatus code\s+-?\d+\b/i;

function findVagueSettlementTerms(text) {
  const lower = text.toLowerCase();
  return VAGUE_SETTLEMENT_TERMS.filter((term) => lower.includes(term));
}

function hasObjectiveDefinition(text) {
  return OBJECTIVE_DEFINITION_RE.test(text);
}

/**
 * `null` => no vague settlement language found at all.
 * `severity: "REJECT"` => vague term(s) with no accompanying objective, measurable definition.
 * `severity: "WARN"` => vague term(s) present but the same text also carries an objective definition.
 */
function evaluateVagueLanguage(text) {
  const matchedTerms = findVagueSettlementTerms(text);
  if (matchedTerms.length === 0) return null;
  const objective = hasObjectiveDefinition(text);
  return {
    severity: objective ? "WARN" : "REJECT",
    matchedTerms,
    reason: objective
      ? `contains vague settlement language (${matchedTerms.join(", ")}) alongside an objective ` +
        `definition — review recommended`
      : `contains vague settlement language (${matchedTerms.join(", ")}) with no objective, ` +
        `measurable definition attached`,
  };
}

module.exports = {
  VAGUE_SETTLEMENT_TERMS,
  findVagueSettlementTerms,
  hasObjectiveDefinition,
  evaluateVagueLanguage,
};
