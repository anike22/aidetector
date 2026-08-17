# SEO Assistant Detector — Protection Record

## Status: UNCHANGED ✅

This file documents that the SEO Assistant detector was **not modified** during
the main AI Detector engine audit (v2.5.0 → calibration fix).

---

## Files that are OFF-LIMITS for main detector changes

| File | Owner | Status |
|------|-------|--------|
| `supabase/functions/advanced-detector/index.ts` | SEO Assistant | ✅ Unchanged |
| `src/pages/seo-assistant/` | SEO Assistant UI | ✅ Unchanged |
| `src/pages/seo-assistant/analysisEngine.ts` | SEO Assistant client | ✅ Unchanged |

## Files modified for main detector fix

| File | Change |
|------|--------|
| `_shared/detection/ensemble.ts` | Fixed Mixed mass inflation bug |
| `_shared/detection/engine.ts` | Added adjusted AI-risk, sentence aggregation, revised verdict logic, dev diagnostics |
| `_shared/detection/types.ts` | Added `DevDiagnostics` interface, `adjustedAiRisk` to `AdvancedTextAnalysisResult.overall` |
| `supabase/functions/detector/index.ts` | No changes (routes to engine.ts unchanged) |

## Files that are SHARED but NOT modified

| File | Notes |
|------|-------|
| `_shared/detection/calibration.ts` | Read-only — calibration constants unchanged |
| `_shared/detection/classifier.ts` | Read-only — classifier unchanged |
| `_shared/detection/linguisticLayer.ts` | Read-only |
| `_shared/detection/statisticalLayer.ts` | Read-only |
| `_shared/detection/languageLayer.ts` | Read-only |
| `_shared/detection/layers/*` | Read-only |
| `_shared/entitlements.ts` | Read-only — shared auth/billing |

---

## Verification

Run regression tests to confirm SEO Assistant is intact:

```bash
deno test --allow-env supabase/functions/_shared/detection/tests/regression_main_detector.ts \
  --filter "SEO PROTECTION"
```

Expected: all `SEO PROTECTION:` tests pass with zero failures.

---

## Dependency Map

```
Main AI Detector
  supabase/functions/detector/index.ts
    └── _shared/detection/engine.ts  ← MODIFIED
          ├── ensemble.ts             ← MODIFIED
          ├── calibration.ts          (read-only)
          ├── classifier.ts           (read-only)
          ├── linguisticLayer.ts      (read-only)
          ├── statisticalLayer.ts     (read-only)
          ├── languageLayer.ts        (read-only)
          └── layers/*                (read-only)
    └── _shared/entitlements.ts       (read-only, shared)

SEO Assistant Detector (ISOLATED — DO NOT TOUCH)
  supabase/functions/advanced-detector/index.ts
    └── _shared/entitlements.ts       (read-only, shared)
    └── INTEGRATIONS_API_KEY          (Gemini 2.5 Flash via API gateway)

Shared (read-only, used by both):
  _shared/entitlements.ts
```
