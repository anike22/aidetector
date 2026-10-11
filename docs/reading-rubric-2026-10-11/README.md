# Document reading rubric — engine 2.6.0

The earlier subjective 70% estimate had no reproducible formula. This change implements observable proxies for the listed reading criteria and publishes the resulting points; it does not target or validate 70%.

Browser and Edge share `readingEvidence.ts`. The rubric returns findings, source excerpts with offsets, candidate/applied points, corroboration gates and limitations. It is English-only for documents of at least 600 words. At least three supporting families (structure, repetition, illustration, qualification) are required. Organization, SEO framing, missing firsthand claims and prior authorship labels are not independent positive evidence. Firsthand/source markers and counter-evidence can subtract points. All rows receive zero applied points when the eligibility gate fails.

## Calculation

1. Preserve the existing classifier/ensemble/layer base score.
2. Each eligible reading row contributes `round(value × weight, 2)` points.
3. Sum positive and negative contributions. Round the net adjustment to a whole point.
4. Transfer that signed adjustment between AI and Human. Mixed is unchanged. Only available probability mass limits transfer so values remain within 0–100.
5. Preserve uncertainty and local corroboration checks for the verdict.

The six-point-per-cue adjustment from engine 2.5.3 is replaced, not stacked with this rubric. Strict reuses the full Balanced result and records its own heuristic score, branch, pre-bound candidate and final score in `scoreTrace`.

## Exact uploaded Bitcoin article

The upload and fixture match SHA-256 `b297a5efc3c5c63f849817b7c07df663a2377606c40104ddf3f58e535b6c8d1d`.

| Check | Observed value | Weight | Applied points |
| --- | ---: | ---: | ---: |
| Overall organization | 27 | 0 | 0 |
| Explanation → example → qualification | 0.15 | 24 | 3.6 |
| Repeated claims across sections | 0 | 20 | 0 |
| Hypothetical rather than attributed examples | 4.6689 | 3 | 14.01 |
| Firsthand operational or testing claims | 0 | -3 | 0 |
| Specificity and source attribution | 0.15 | 8 | 1.2 |
| Attributed evidence countercheck | 0 | -2 | 0 |
| Consistency of explanatory presentation | 0.6098 | 4 | 2.44 |
| Repeated qualification language | 7.6401 | 0.75 | 5.73 |
| SEO framing and promotional closing | 7 | 0 | 0 |
| Conclusion repetition | 0 | 2 | 0 |
| Rhythm, conversational phrasing and arithmetic | 2 | -2 | -4 |
| Prior knowledge and provenance | 0 | 0 | 0 |

**19 base + 26.98 supporting − 4 counter-evidence = 41.98 → 42% AI.** The whole-point adjustment is +23. Balanced and Aggressive both return 42%; the Balanced verdict remains Inconclusive and Strict review risk is Medium. The human SEO control remains 22% in both modes.

The lexical repetition check found no sufficiently similar cross-section claims and contributes zero. Section-length regularity approximates presentation consistency, not deep understanding of tone. Hypothetical/conditional markers approximate example grounding; sources and firsthand claims are not authenticated. A source matcher excludes ordinary “according to its payout method” wording. Four arithmetic expressions are checked, but that is not a factual audit of the article.

These weights are provisional heuristics, not calibrated probability estimates. The implementation does not reproduce the assistant’s qualitative semantic reading perfectly and does not establish an accuracy improvement from this one article.

## Verification and delivery

- 25 prior detector regressions + 9 reading/parity regressions passed.
- Tests cover exact-text identity, arithmetic of the ledger, excerpt offsets, neutral criteria, ordinary payout wording, short/other-language gating, style contributions above 12, and shared engine parity.
- Browser build passed. Full repository typecheck retains existing unrelated signup/image-alt/competitor typing errors; no new detector or result-card errors remain.
- Repair-test Supabase deployment succeeded: detector function version 7, engine 2.6.0. No production/master deployment.
- Actual HTTP testing remains unverified because the previous automatic approval review rejected transmission of the article and API key to the endpoint. No retry was made to bypass that rejection.

The full ledger and exact results are in `bitcoin-evidence.json`. The result card exposes the ledger under “How this score was calculated.”
