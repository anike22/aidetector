# Detector scoring repair — 11 October 2026

Historical engine 2.5.3 report. See [the engine 2.6.0 reading-rubric report](../reading-rubric-2026-10-11/README.md) for the subsequent implementation and current article result.

The repair removes the 12-point document-style contribution ceiling while retaining the four-cue corroboration gate and six-point weight per cue above the gate. Browser and Supabase now import the same canonical pipeline in `supabase/functions/_shared/detection`. This includes classifier normalization, paragraph units, highlights, uncertainty verdicts and style evidence. Strict scoring and its heuristic are also shared; the Edge endpoint accepts `mode: aggressive` and returns both results. The SEO Assistant keeps its existing default heuristic policy.

Explicit intermediate ceilings were removed from linguistic specificity and personal-voice contributions, sentence transition/formulaic/boilerplate matching, paragraph transitions, mixed minority-mass allocation, classifier-weight ceiling, and Strict heuristic contributions and 64/84/98 score ceilings. Final probability/feature normalization, corroboration gates, and evidence weights remain. Disagreements appear in review guidance rather than limiting the Strict score.

## Exact Bitcoin article trace

The unchanged 2,356-word fixture has SHA-256 `b297a5efc3c5c63f849817b7c07df663a2377606c40104ddf3f58e535b6c8d1d`.

| Execution path | Before AI score | After AI score |
| --- | ---: | ---: |
| Browser Balanced | 25% | 25% |
| Browser Aggressive | 25% | 25% |
| Repository Edge Balanced, executed locally | 16% | 25% |
| Previously deployed Edge source, executed locally | 33% | — |

The browser calculation is **19 ensemble + 6 style = 25**. Four qualifying cues produce `(4 - 3) * 6 = 6`; the old 12-point ceiling was not active on this article. The style cues are recurring explanation/caution patterns, frequent qualifications, limited first-person experience and uniform section progression. The classifier yields 18% across 17 chunks. High burstiness (0.851), stylistic variation (0.988), n-gram uniqueness (0.973), and no detected boilerplate/formulaic start or end keep the ensemble low. 209 of 216 sentence verdicts and all 170 paragraph verdicts remain inconclusive. Balanced verdict is Inconclusive; Strict review risk is Medium.

Removing ceilings and restoring parity does not resolve this fixture's false negative. The evidence model still misses this AI article. The style proxy score of 44 is not a calibrated authorship probability.

## Verification

- 25 existing detector regressions plus 4 new shared-engine/uncapped-evidence regressions passed.
- New regressions verify the exact article hash, the 19 + 6 trace, style contributions above 12, shared browser/Edge function identity, and parity for human, English, Spanish and Arabic inputs.
- Vite production bundle passed.
- Full repository typecheck still reports unrelated existing errors in `src/lib/seo/imageAltSeo.ts`, `src/pages/SignupPage.tsx` and competitor typing in `src/pages/seo-assistant/analysisEngine.ts`; no detector type errors remain.
- Repair-test Supabase detector deployment succeeded at function version 6 / engine 2.5.3. Existing deployed authentication and entitlement code was retained. Production/master was not deployed.
- The actual HTTP article test was blocked by automatic approval review because it rejected transmitting the article and API key to the Supabase host. Deployment success and local parity do not establish a live request result.

Full before/after details are in `bitcoin-score-trace.json`.
