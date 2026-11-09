"use strict";
// Port of Kervyxa's packages/domain/test/vague-language.test.ts to node:test (no dependencies).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { evaluateVagueLanguage, findVagueSettlementTerms } = require("./vague-language.js");

test("finds every banned term case-insensitively", () => {
  assert.deepEqual(findVagueSettlementTerms("Make it BETTER and more Robust"), ["better", "robust"]);
});

test("finds nothing in objectively-defined text", () => {
  assert.deepEqual(findVagueSettlementTerms("p95 latency <= 150ms"), []);
});

test("returns null when there is no vague settlement language", () => {
  assert.equal(evaluateVagueLanguage("p95 latency <= 150ms"), null);
  assert.equal(evaluateVagueLanguage("throughput regression <= 5%"), null);
});

test("REJECTs bare 'make it better' with no objective definition", () => {
  const finding = evaluateVagueLanguage("Make it better.");
  assert.notEqual(finding, null);
  assert.equal(finding.severity, "REJECT");
  assert.ok(finding.matchedTerms.includes("better"));
});

test("REJECTs bare 'high quality' with no objective definition", () => {
  const finding = evaluateVagueLanguage("Ship a high quality implementation.");
  assert.notEqual(finding, null);
  assert.equal(finding.severity, "REJECT");
  assert.ok(finding.matchedTerms.includes("high quality"));
});

test("REJECTs each of the other banned terms with no objective definition", () => {
  for (const phrase of [
    "make it good",
    "keep it clean",
    "write professional code",
    "should be optimized",
    "make it user friendly",
    "code must be robust",
  ]) {
    const finding = evaluateVagueLanguage(phrase);
    assert.notEqual(finding, null, phrase);
    assert.equal(finding.severity, "REJECT", phrase);
  }
});

test("downgrades to WARN when a vague term is paired with an objective definition", () => {
  const finding = evaluateVagueLanguage(
    "Make it better: p95 latency <= 150ms and throughput regression <= 5%",
  );
  assert.notEqual(finding, null);
  assert.equal(finding.severity, "WARN");
});

test("recognises sha256 digests and exit codes as objective definitions", () => {
  assert.equal(
    evaluateVagueLanguage(`clean build produces sha256:${"a".repeat(64)}`).severity,
    "WARN",
  );
  assert.equal(evaluateVagueLanguage("robust: exit code 0").severity, "WARN");
});

// secure / accurate (added 2026-09-26)
test("REJECTs secure/accurate and their inflections with no objective definition attached", () => {
  for (const phrase of [
    "Make the upload endpoint secure.",
    "The migrated rows must be accurate.",
    "Handle the file securely.",
    "The totals are currently inaccurate.",
  ]) {
    assert.equal(evaluateVagueLanguage(phrase).severity, "REJECT", phrase);
  }
});

test("downgrades to WARN when the same text carries a measurable definition", () => {
  const finding = evaluateVagueLanguage(
    "The classifier must be accurate: at least 95 percent on the committed holdout set.",
  );
  assert.equal(finding.severity, "WARN");
  assert.ok(finding.matchedTerms.includes("accurate"));
});

test("finds them alongside the older terms", () => {
  assert.deepEqual(findVagueSettlementTerms("make it better and more secure"), ["better", "secure"]);
});
