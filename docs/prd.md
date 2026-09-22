# Requirements Document

## 1. Application Overview

**Application Name**: AIDetector.cx — Plagiarism Intelligence & Evidence Platform (Public /plagiarism-checker Rebuild)

**Description**: Complete public page rebuild of `https://www.aidetector.cx/plagiarism-checker` transforming the standard checker into a premium Plagiarism Intelligence & Evidence Platform. The platform establishes an evidence-first paradigm that goes beyond a raw similarity score by revealing what matched, where it was found, how it matched, citation context, and search coverage transparency. The update is strictly additive to the public experience and checker interface: all existing AI Detector modes (Balanced/Aggressive), SEO Assistant, Humanizer, Image/Video/Deepfake Detectors, Citation Verifier, Student Mode, Writing Monitor, Authentication, Billing/Credit economics, backend endpoints, and site color schemes remain completely preserved without algorithm recalibration or regression.

## 2. Users and Use Scenarios

**Target Users**:
- Students seeking pre-submission integrity checks, self-plagiarism verification, and draft comparisons.
- Educators and Academic Evaluators verifying source provenance, attribution validity, and classroom repository submissions.
- Academic Researchers inspecting literature overlap, citation fidelity, and non-overlapping external sources.
- Content Writers and SEO Teams auditing internal portfolio uniqueness, syndication duplicates, and AI-assisted rewrites.
- Publishers and Editorial Teams verifying submitted manuscripts against historical publishing archives.
- Legal and Corporate Teams inspecting contracts, policy documents, and internal proprietary content repositories.

**Core Use Scenarios**:
- Submitting text or documents via the above-the-fold live workspace and toggling between Standard Scan and Deep Forensic Scan.
- Viewing multi-dimensional results: Total Similarity, Plagiarism Risk Level, Uncited Direct Matches, and Properly Cited Attributions.
- Inspecting side-by-side evidence maps displaying matched passages, match type badges, source URLs, and publication timelines.
- Auditing search provider reliability via the Search Coverage & Provider Audit Matrix to see operational states across engines.
- Uploading and indexing custom institutional or personal document collections in the Private Corpus to check for localized overlap.

## 3. Page Structure and Functionality

### 3.1 Page Information Architecture & Layout Hierarchy

```
Public /plagiarism-checker Route:
  1. Global Navigation Bar (Preserved Platform Header)
  2. Above-The-Fold Hero & Live Checker Workspace
     - Single H1 Title & Supportive Microcopy
     - Live Interactive Checker (Text Paste, File Upload, Scan Mode Toggle)
     - Quick Capability Strip
  3. Product Positioning: \"Go Beyond a Plagiarism Percentage\"
     - 6 Core Diagnostic Questions Framework
  4. Forensic Intelligence Suite Overview & Results Breakdown (Screenshot Story #1)
  5. Live Checker Engine & Forensic Badges (Screenshot Story #2)
  6. Source Intelligence & Evidence Mapping
  7. Paraphrase Intelligence & Semantic Analysis
  8. Cross-Language Similarity Analysis
  9. Citation Intelligence & Attribution Verification
  10. Search Coverage & Provider Audit Matrix (Screenshot Story #3)
  11. Private Corpus & Institutional Archive (Screenshot Story #4)
  12. Scan Comparison: Standard Scan vs Deep Forensic Scan
  13. How It Works (4-Step Workflow)
  14. Professional Use Cases Grid
  15. Methodology, Transparency & System Limitations
  16. Competitive Differentiation (\"More Than a Traditional Similarity Checker\")
  17. Data Privacy, Content Security & Corpus Isolation
  18. Educational SEO Content & E-E-A-T Architecture
  19. Comprehensive Frequently Asked Questions (13 Q&As)
  20. Bottom Conversion CTA Section
  21. Global Footer (Preserved Platform Footer)
```

### 3.2 Above-The-Fold Live Checker Workspace

- **Primary Heading**: Single `H1` tag reading: `Advanced Plagiarism Checker With Source & Paraphrase Detection`.
- **Supporting Copy**: Concise factual statement detailing detection of verbatim text overlap, paraphrased phrasing, missing citations, and external source discovery without unverified accuracy superlatives.
- **Compact Capability Indicators**: Badge row indicating Exact Match Detection, Deep Paraphrase Analysis, Source Verification, Citation Analysis, and Cross-Language Analysis.
- **Live Plagiarism Checker Workspace**:
  - Centered wide desktop layout and touch-optimized responsive mobile layout.
  - **Input Modes**: Direct plain text paste area with real-time word counter and character counter; secondary document upload button supporting PDF, DOCX, and TXT formats.
  - **Placeholder Microcopy**: `Paste your article, essay, research paper or other content here to check for matching sources, paraphrasing, and citation accuracy...`
  - **Mode Selector Controls**:
    - `Standard Scan`: Rapid discovery of exact and near-match web sources.
    - `Deep Forensic Scan`: Deep multi-engine analysis activating paraphrase tracing, citation checking, and structural evidence mapping.
  - **Primary Action CTA**: `Check for Plagiarism` button initiating execution according to user session entitlements (guest allowance, registered free quota, or paid credit balances).
  - **Active Forensic Badges Row**: Visual indicator badges including Code AST, Table Invariance, Figure dHash, AI Rewrite Tracing, Private Corpus, and Non-Overlapping Sources.
- **Quick Capability Strip**: Displayed directly below the live workspace featuring 6 compact items with single-sentence descriptions:
  1. Exact Matches: Word-for-word textual overlaps across indexed sources.
  2. Paraphrased Content: Rewritten ideas and structural paraphrases with preserved meaning.
  3. Source Evidence: Direct source URLs, verified excerpts, and publication metadata.
  4. Citation Analysis: Differentiation of properly attributed quotations from uncited copying.
  5. Cross-Language Analysis: Identification of translated source content across supported languages.
  6. Private Corpus: Localized similarity audits against custom uploaded document archives.

### 3.3 Visual Product Evidence & Screenshot Story Integrations

The page incorporates four authentic product screenshots deployed in an alternating desktop pattern (`Text | Screenshot` and `Screenshot | Text`), collapsing to clean stacked views (`Text` above `Screenshot`) on mobile devices:

1. **Screenshot Story #1 — Results Metric Breakdown**:
   - **Image Reference**: `Screenshot_2026-09-22_065944.png`
   - **Image URL**: `https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_065944.png`
   - **Layout**: Text Left, Screenshot Right (55% container width on desktop).
   - **Content & Narrative**: Introduces the Plagiarism Forensic Intelligence Suite and breaks down the 4 metric cards:
     + *Total Similarity*: Comprehensive percentage of analyzed content matching external materials.
     + *Plagiarism Risk Level*: Contextual evaluation (Low/Medium/High) derived strictly from uncited direct matches.
     + *Uncited Direct Matches*: Text matching external material without proper citation or attribution.
     + *Properly Cited & Attributed*: Quoted or referenced material validated by citation parsing.

2. **Screenshot Story #2 — Scan Engine & Forensic Selector**:
   - **Image Reference**: `Screenshot_2026-09-22_070025.png`
   - **Image URL**: `https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_070025.png`
   - **Layout**: Screenshot Left (55% container width on desktop), Text Right.
   - **Content & Narrative**: Demonstrates operational controls between Standard and Deep Forensic Scan (17 active forensic engines), highlighting granular inspection badges for syntax trees, tables, images, and rewrite tracking.

3. **Screenshot Story #3 — Search Coverage & Provider Audit Matrix**:
   - **Image Reference**: `Screenshot_2026-09-22_070140.png`
   - **Image URL**: `https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_070140.png`
   - **Layout**: Text Left, Screenshot Right (55% container width on desktop).
   - **Content & Narrative**: Explains operational status auditing across external providers and detailed inspection tabs (Heatmap, Sources, Evidence, AI Rewrites, Citations, Timeline, Clusters, Concepts, Tables, Code, Corpus, Coverage, Telemetry, Benchmarks).

4. **Screenshot Story #4 — Private Corpus & Institutional Archive**:
   - **Image Reference**: `Screenshot_2026-09-22_070212.png`
   - **Image URL**: `https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_070212.png`
   - **Layout**: Screenshot Left (55% container width on desktop), Text Right.
   - **Content & Narrative**: Details private document repository indexing, multi-file upload management, isolated departmental archives, and localized similarity comparison without leaking private data to public indexes.

### 3.4 Forensic Diagnostic Modules & Analysis Sections

- **Product Positioning Framework (\"Go Beyond a Plagiarism Percentage\")**:
  - Clarifies limitations of single percentage scores.
  - Interactive diagnostic grid addressing 6 core questions: `What Matched?`, `Where Was It Found?`, `How Similar Is It?`, `Was It Paraphrased?`, `Is It Attributed?`, and `What Evidence Supports It?`.
- **Source Intelligence & Evidence Mapping**:
  - Granular breakdown of identified external sources with verified domain reputation, direct URLs, matched passage snippets, and discovery timestamps.
  - Source clustering logic grouping syndicated articles and mirror sites into singular primary source clusters to avoid score inflation.
  - Chronological timeline sorting matched sources by earliest discovered publication date without claiming absolute authorship certainty.
  - Side-by-side evidence inspection matching submitted passages directly against retrieved external source passages.
- **Paraphrase Intelligence & AI-Rewrite Tracing**:
  - Semantic analysis detecting sentence restructuring, clause reordering, and vocabulary substitution.
  - AI-assisted rewrite tracing identifying indicative phrasing patterns and semantic transformations, reported with calibrated non-dogmatic language (`likely paraphrased`, `shows patterns consistent with transformation`).
- **Cross-Language Similarity Analysis**:
  - Explains translation-based plagiarism detection across supported languages (EN, ES, FR, DE, PT, IT, ZH, JA, KO, AR, RU, HI) with clear confidence indications.
- **Citation Intelligence**:
  - Distinguishes raw similarity from ethical attribution.
  - Citation verification parsing styles (APA, MLA, Chicago, IEEE, Harvard) and categorizing entries as Properly Cited, Missing Citation, Broken Reference, or Incorrect Reference.
- **Search Coverage Transparency**:
  - Explicitly states audit status across engines: `Operational`, `Partial`, `Unavailable`, `Timeout`, `Authentication Error`, or `Not Checked`.
  - Clear differentiation between \"No verified matches discovered in completed searches\" and \"Guaranteed 100% original content\".

### 3.5 Harmonized Result Experience & Navigation States

The public checker seamlessly transitions across standardized UI states:
1. `Ready`: Clean input state awaiting user paste or document drop.
2. `Analyzing`: Real-time forensic telemetry showing progress across active engines.
3. `Success — Matches Found`: Full intelligence summary, interactive heatmap, source cards, and evidence navigation tabs.
4. `Success — No Verified Matches`: Explicit notification confirming no matches were found across all successfully queried providers.
5. `Partial Coverage`: Results view featuring amber notification banner indicating which providers experienced timeouts/rate limits and which returned completed results.
6. `Failed`: Clear diagnostic error message with actionable retry, never displaying a false \"0% Plagiarism\" message.

Result navigation tabs (displayed upon completed analysis): `Overview`, `Sources`, `Evidence`, `Paraphrase`, `Citations`, `Timeline`, `Clusters`, `Coverage`, and `Private Corpus`.

### 3.6 Scan Mode Comparison

Comparison matrix between scan modes:
- **Standard Scan**: Rapid web search indexing, exact match discovery, fuzzy near-match detection, basic source identification, and primary similarity calculation. Ideal for everyday draft reviews.
- **Deep Forensic Scan**: Full 17-engine pipeline activating deep semantic paraphrase tracking, AI rewrite source tracing, Crossref/OpenAlex academic citation audit, structural heading progression, cross-language comparison, and private corpus evaluation.

### 3.7 Structured Workflow: How It Works

1. **Step 1: Paste or Upload**: Input text or upload documents (PDF, DOCX, TXT) into the live workspace.
2. **Step 2: Source Discovery**: Real-time querying across accessible public web sources, scholarly repositories, and authorized private archives.
3. **Step 3: Analyze Similarity**: Multi-stage evaluation of exact phrasing, rewritten semantics, syntax structure, and citation attribution.
4. **Step 4: Review Evidence**: Detailed inspection of side-by-side evidence maps, source provenance, provider coverage status, and exportable forensic reports.

### 3.8 Target Use Cases Grid

Dedicated workflow cards for:
- **Students**: Draft integrity reviews, self-plagiarism checks against previous papers, and citation formatting verification.
- **Educators**: Academic honesty auditing, classroom repository matching, and uncited copy detection.
- **Researchers**: Crossref/OpenAlex literature overlap auditing, methodology structure comparison, and reference validation.
- **Content Writers**: Pre-publishing originality verification and accidental duplicate phrasing elimination.
- **SEO Teams**: Portfolio canonical duplication audits and syndicated content tracking.
- **Publishers**: Manuscript provenance verification, predatory source detection, and editorial integrity compliance.
- **Businesses**: Proprietary policy review, employee handbooks, and internal documentation audits.

### 3.9 Methodology, Trust, and Privacy

- **Evaluation Methodology**: High-level workflow covering Source Discovery -> Content Retrieval -> Text Comparison -> Match Classification -> Evidence Mapping -> Coverage Verification.
- **Realistic System Limitations**: Honest documentation regarding paywalled content, private intranet databases, search engine rate limiting, and recently published web pages.
- **Competitive Differentiation (\"More Than a Traditional Similarity Checker\")**: Factual comparison highlighting evidence mapping, source clustering, citation separation, and provider coverage audits without fabricating competitor deficiencies.
- **Data Privacy & Security**: User content is processed securely, never sold or added to public indexing repositories without authorization. Private Corpus uploads remain strictly tenant-isolated.

### 3.10 Educational Content, SEO & FAQ

- **Search Optimization**: Natural keyword targeting (`plagiarism checker`, `plagiarism detector`, `check plagiarism online`, `paraphrase plagiarism checker`, `plagiarism checker with sources`, `plagiarism checker for research papers`). Single H1, hierarchical H2/H3 structuring, and product-first viewport placement.
- **Internal Links**: Contextual links to existing platform tools: `/` (AI Detector), `/citation-verifier`, `/humanizer`, and `/seo-assistant`.
- **13 Educational FAQ Items**:
  1. What is a plagiarism checker?
  2. How does plagiarism detection work?
  3. Can plagiarism checkers detect paraphrasing?
  4. Can translated plagiarism be detected?
  5. What does a plagiarism percentage mean?
  6. Is similarity always plagiarism?
  7. Can I check research papers?
  8. Can citations create similarity matches?
  9. What is Deep Forensic Scan?
  10. Does AIDetector.cx show matching sources?
  11. Can I compare content against my own documents?
  12. What happens when a source provider is unavailable?
  13. Does 0% similarity guarantee original content?
- **Structured Data**: Schema markup including `WebApplication`, `SoftwareApplication`, `BreadcrumbList`, and `FAQPage`.

### 3.11 Conversion Architecture

- Primary Conversion CTA: `Start Plagiarism Check` / `Check My Content` triggering auto-scroll and focus to the above-the-fold checker workspace.
- Secondary CTAs: Deep Forensic Scan engagement and Private Corpus exploration.
- Preserves guest scan allowances, registered free tier allocations, and paid credit checkout triggers without modifying pricing structures.

## 4. Business Rules and Logic

### 4.1 Global Platform Preservation Lock

- The page rebuild is strictly isolated to the public `/plagiarism-checker` route and associated presentation layers.
- Zero alterations to unrelated platform capabilities: AI Detector (Balanced and Aggressive modes), Humanizer, SEO Assistant, Image/Video/Deepfake Detectors, Citation Verifier, Student Mode, Writing Monitor, User Authentication, Admin Dashboards, Billing, and Subscriptions.
- Existing plagiarism checking backend APIs, edge functions, credit consumption calculations, and quota models remain functional and preserved.
- Site color scheme and brand tokens remain unaltered.

### 4.2 Absolute Truthfulness and Transparency

- Strict prohibition against synthetic/mock scan scores, fake source URLs, simulated database counts, fabricated student counts, or fake university partnerships.
- Never claim access to \"the entire internet\" or unauthorized institutional proprietary databases (such as Turnitin private archives).
- Honest reporting of engine failures: if an external engine times out, display `Unavailable: [Provider] timed out` rather than falsely returning zero matches.
- Separate Similarity Percentage from Plagiarism Risk: properly cited content is excluded from the Plagiarism Risk score.

### 4.3 Calibrated Non-Dogmatic Language

- Paraphrased matches must use calibrated phrasing (`likely paraphrased`, `similar phrasing detected`).
- Cross-lingual translations must state `shows translation patterns from [Language]`.
- AI rewrite findings must specify `possible AI-assisted rewrite` without definitive assertions.
- Discovered sources must be designated `Earliest Discovered Source` rather than absolute original author.

### 4.4 Analytics Instrumentation

Existing platform analytics must record key user journey events:
- `plagiarism_page_view`: Landing page loaded.
- `plagiarism_text_pasted`: User pasted text into input area.
- `plagiarism_file_uploaded`: Document uploaded (file type recorded, text content omitted).
- `plagiarism_scan_started`: Scan execution triggered (recording mode: standard vs deep).
- `plagiarism_scan_completed`: Scan finished with result metadata.
- `plagiarism_scan_failed`: Scan encountered error.
- `plagiarism_partial_coverage`: Scan finished with provider timeout/partial state.
- `plagiarism_result_viewed`: User reviewed results interface.
- `plagiarism_source_opened`: User clicked external source link.
- `plagiarism_forensic_opened`: Deep forensic breakdown viewed.
- `plagiarism_corpus_opened`: Private corpus interface opened.
- `plagiarism_signup_started` & `plagiarism_signup_completed`: Auth conversion events.
- `plagiarism_upgrade_viewed` & `plagiarism_subscription_conversion`: Commercial conversion events.
*Privacy constraint*: Submitted user text content is strictly excluded from analytics telemetry.

## 5. Exception and Boundary Cases

| Scenario | System Handling |
|---|---|
| Submitted text under 100 words | Display cautionary notice: `Text too short for comprehensive forensic analysis. Results may be limited.` Allow user to proceed with scan. |
| External search provider rate limit or timeout | Mark specific engine as `Unavailable` in the Coverage Matrix, present partial results from active engines, and display an informational amber banner. |
| Analysis complete with 0 matches found | Display `Success — No Verified Matches Found in Searched Providers` with completed coverage audit. Never show zero matches if providers failed. |
| All discovered matches are properly cited | Calculate Total Similarity accordingly, set Plagiarism Risk to `Low (0% uncited matches)`, and display green attribution indicators. |
| Corrupted document or unsupported format upload | Display error: `Document parsing failed. Please upload a valid PDF, DOCX, or TXT file.` Retain live workspace state without reloading. |
| Private Corpus empty when selected | Prompt user to upload target comparison documents or toggle back to public web scanning mode. |
| User credit balance exhausted during scan request | Present standard credit refill modal preserving input text in workspace without data loss. |
| Cross-language translation API unavailable | Mark Cross-Language engine as `Not Checked / Unavailable`, continue remaining direct and semantic scan engines. |
| Network disconnect during active scan | Display retry button retaining input text in local session storage. |

## 6. Acceptance Criteria

1. User visits `/plagiarism-checker` and immediately observes the single H1, the above-the-fold live checker workspace, input options, and scan mode toggles without intervening marketing blocks.
2. User pastes text or uploads a document (PDF, DOCX, TXT) and initiates a Standard Scan or Deep Forensic Scan, observing real-time engine telemetry.
3. Upon scan completion, system displays the 4 forensic metric cards (Total Similarity, Plagiarism Risk Level, Uncited Direct Matches, Properly Cited & Attributed) matching the layout shown in `Screenshot_2026-09-22_065944.png`.
4. User inspects the Live Checker Scan Engine view with active forensic badges matching `Screenshot_2026-09-22_070025.png`.
5. User opens the Search Coverage & Provider Audit Matrix to inspect provider statuses and forensic tabs matching `Screenshot_2026-09-22_070140.png`.
6. User navigates to the Private Corpus section and views document upload, archive indexing, and similarity controls matching `Screenshot_2026-09-22_070212.png`.
7. User clicks through results tabs (`Overview`, `Sources`, `Evidence`, `Paraphrase`, `Citations`, `Timeline`, `Coverage`) and navigates side-by-side evidence mappings.
8. When an external provider experiences a timeout, system truthfully flags the engine as `Unavailable` in the Coverage Matrix and presents completed results without falsely claiming zero plagiarism.
9. User clicks contextual `Start Plagiarism Check` CTAs and is smoothly scrolled back to the active checker workspace.
10. All existing platform capabilities (AI Detector, Humanizer, SEO Assistant, Image/Video Detectors, Citations, Authentication, Billing) remain operational without regression.

## 7. Out of Scope for This Release

- Modifying existing backend credit consumption logic, subscription prices, or quota rules.
- Recalibrating underlying similarity algorithms or external search provider contracts.
- Real-time inline plagiarism checking inside external office plugins (Google Docs, Microsoft Word add-ins).
- Plagiarism detection for source code, compiled binaries, or programming syntax trees beyond existing preview indicators.
- Audio, video, and multimedia plagiarism forensic analysis.
- Automated bulk checking for batch folders exceeding standard document upload limits.
- Adding unverified claims of access to proprietary institutional databases.
- Redesigning unrelated platform pages (AI Detector, Humanizer, SEO Assistant, Account, Billing).