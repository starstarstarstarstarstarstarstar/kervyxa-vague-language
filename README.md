# kervyxa-vague-language

A dependency-free copy of Kervyxa's vague-settlement-language detector
(`packages/domain/src/vague-language.ts` in the Kervyxa monorepo), with its test suite ported to
`node:test`. Kervyxa applies this detector to every acceptance criterion before a contract can be
approved: a term like "better" or "robust" with no measurable definition next to it is refused.

## Why this repository exists

Kervyxa buys software outcomes through verified Outcome Contracts. This repository is the target of
such a contract for a change Kervyxa itself needs next, so the fix is bought through the product.
The accepted change is merged back into the monorepo by hand.

## The open problem

`findVagueSettlementTerms` matches every term as a plain substring of the lower-cased text. That
was deliberate for the inflections of "secure" and "accurate" (added 2026-09-26) but it also fires on
unrelated longer words: "cleanup", "security header", "goods", "goodbye". The requested change is
whole-word (and whole-phrase) matching, with the inflections of "secure" and "accurate" still
detected explicitly, so the existing suite stays green while the false positives disappear.

```
npm test
```
