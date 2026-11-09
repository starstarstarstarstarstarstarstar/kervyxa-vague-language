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
  // Added 2026-09-26. Their inflections ("insecure", "securely", "accurately", "inaccurate") are
  // the same unverifiable claim in a different tense and are listed in TERM_FORMS below.
  "secure",
  "accurate",
];

/**
 * Every spelling that counts as a given listed term. A term not listed here matches only itself.
 * The reported term is always the canonical entry of VAGUE_SETTLEMENT_TERMS, never the inflection.
 */
const TERM_FORMS = {
  secure: ["secure", "securely", "insecure", "insecurely"],
  accurate: ["accurate", "accurately", "inaccurate", "inaccurately"],
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A term matches only as a whole word or whole phrase: a letter or digit directly before or after
 * it breaks the match, so "cleanup", "goods", "Content-Security-Policy" and "professionals.csv"
 * are not flagged, while "(robust)", "Better!" and "MAKE IT USER-FRIENDLY" still are.
 */
const TERM_PATTERNS = VAGUE_SETTLEMENT_TERMS.map((term) => {
  const forms = TERM_FORMS[term] || [term];
  const alternatives = forms.map(escapeRegExp).join("|");
  return {
    term,
    pattern: new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu"),
  };
});

/**
 * A crude but effective "does this text also carry a machine-checkable, objective definition"
 * detector: a numeric comparison, a number with a measurement unit, a sha256 digest, or an explicit
 * exit/status code.
 */
const OBJECTIVE_DEFINITION_RE =
  /(<=|>=|==|!=|<|>|≤|≥)\s*-?\d|\b-?\d+(\.\d+)?\s*(ms|milliseconds?|s|sec|secs|seconds?|%|percent|mb|gb|kb|bytes?|rps|qps|req\/s|requests?|ops)\b|sha256:[0-9a-f]{64}|\bexit code\s+-?\d+\b|\bstatus code\s+-?\d+\b/i;

function findVagueSettlementTerms(text) {
  return TERM_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ term }) => term);
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
