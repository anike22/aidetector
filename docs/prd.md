# Requirements Document

## 1. Application Overview

**Application Name**: AIDetector.cx

**Description**: Advanced AI content detection platform providing dual-mode analysis (Balanced and Aggressive detectors), multilingual AI detection, AI/Human/Mixed content classification, sentence-level detection, and explainable results. Integrated with Essay Studio module for academic writing workflow. Includes enforced subscription, credit accounting, and live usage visibility across all tools and user tiers. Also includes a repaired and upgraded AI Image Detector, an AI Video Detector, Verified Authorship, an upgraded Humanizer, live Stripe and Paystack subscription credit refill webhook processing, and team member credit allocation and usage tracking for Business and Enterprise accounts. Also includes a Word Counter with integrated AI detection at /word-counter and an AI Summarizer at /ai-summarizer. Now includes optional Student Mode and Academic Policy Guidance feature (Phase 1) to help students understand assignment AI-use rules alongside detection results.

## 2. Users and Use Scenarios

[All existing users and use scenarios from the previous PRD version are preserved unchanged.]

Additional use scenarios:
- Student runs AI detection on assignment text, opens Student Mode, inputs assignment AI instructions or policy URL, reviews policy interpretation alongside detection results, compares detection findings with policy rules, and optionally declares AI assistance used
- Student uploads assignment policy document, reviews extracted policy text, confirms or corrects extraction, and receives structured policy interpretation
- Student encounters conflicting policy instructions from multiple sources, receives clear conflict notice, and is advised to ask instructor for clarification
- Student reviews numerical threshold interpretation, understands distinction between detector score and policy-defined AI use limits, and receives factual comparison without false compliance labels
- Student declares AI assistance activities used, compares declaration with policy rules, and receives restrained factual guidance without guarantees of compliance or approval

## 3. Page Structure and Functionality

### 3.1 System Architecture

[Preserved unchanged from previous PRD version, with the following addition to the Module Structure:]

```
Student Mode (optional feature integrated into detection results pages)
```

### 3.2 Navigation Bar and Footer Organization

[Preserved unchanged from previous PRD version.]

### 3.3 — 3.14

[Sections 3.3 through 3.14 are preserved unchanged from the previous PRD version.]

### 3.15 Student Mode and Academic Policy Guidance (Phase 1)

#### 3.15.1 Feature Purpose and Non-Negotiable Constraints

**Feature purpose**:
- Help students understand assignment AI-use rules alongside detection results
- Distinguish: what detector reports, what assignment permits, what student declared, and what can/cannot be concluded
- Provide factual comparison without false compliance labels

**Non-negotiable preservation**:
- Do not change, remove, replace, recalibrate, or interfere with Balanced or Aggressive detection engines, prompts, models, thresholds, scoring, cup visualization, uploads, auth, pricing/credits, saved results, or follow-up actions
- Student Mode is strictly additive and consumes existing results through a separate adapter
- Student info and policy text must never be inserted into detector inputs or alter detector outputs

**Zero false compliance labels**:
- Prohibited labels: College approved, Safe to submit, Guaranteed acceptance, Passed academic integrity, Verified human authorship, Cheating confirmed
- All guidance must be factual, restrained, and avoid guarantees of compliance or approval

#### 3.15.2 Optional Entry Point

**Entry point design**:
- Compact, accessible control near detector results: \"Student? Check your assignment's AI rules.\"
- Collapsed by default
- No registration requirement to view or open
- No mandatory pre-detection questionnaire
- Normal Analyze button stays in workflow
- Works before or after detection without rerunning detection

**Placement**:
- Positioned near detection results on AI Detector results page
- Visible but non-intrusive
- Expandable panel or modal

#### 3.15.3 Student Info and Policy Inputs

**Input fields**:
- Institution name (optional text input)
- Course/module (optional text input)
- Assignment title (optional text input)
- Term/date (optional text input)
- Assignment AI instructions (primary input, multiline text area)
- Official policy URL (optional URL input)
- Document upload (optional file upload)

**Clear separation**:
- Assignment text in detector and policy document in Student Mode are clearly separated
- Policy inputs are never mixed with detection inputs
- Policy text is processed independently from detection text

**Document upload**:
- Supported formats: PDF, DOCX, TXT
- Text extraction with review and fallback
- User can review extracted text and correct if needed
- Extraction failures display clear error message with manual input fallback

#### 3.15.4 Policy Sources and Trust Labels

**Policy source types**:
- User-provided instructions: text entered directly by student
- Retrieved policy: fetched from official policy URL
- Administrator-reviewed policy: pre-verified policy from institutional database (future capability)

**Policy display**:
- Show policy excerpt
- Show source (user-provided, retrieved URL, administrator-reviewed)
- Show scope (course-specific, institution-wide, department-level)
- Show retrieval date (for retrieved policies)
- Show content hash (for integrity verification)

**Conflict notice**:
- When multiple policy sources conflict, display clear notice: \"These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.\"
- Highlight conflicting sections
- Do not attempt to resolve conflicts automatically

#### 3.15.5 Policy Retrieval and Document Safety

**Safe URL retrieval**:
- SSRF protection: block private IPs, cloud metadata endpoints, localhost
- Validate redirects: follow only HTTPS redirects, limit redirect depth
- Size limits: enforce maximum document size (e.g., 10MB)
- Timeout limits: enforce maximum retrieval time (e.g., 30 seconds)
- Sanitize extracted text: remove scripts, HTML tags, unsafe content
- Treat as untrusted data: validate and escape all extracted content
- Prompt injection immunity: policy text is never inserted into model prompts as instructions

**Document processing**:
- Extract text from PDF, DOCX, TXT
- Display extracted text for user review
- Allow user to correct or replace extracted text
- Handle extraction failures gracefully with manual input fallback

#### 3.15.6 Structured Policy Interpretation

**Separate interpreter service**:
- Independent service that does not modify detector prompts
- Consumes policy text and outputs structured interpretation
- Does not alter detection results or scoring

**Extracted policy elements**:
- AI use status: prohibited, restricted, permitted, required, unclear
- Allowed activities: list of explicitly permitted AI uses
- Prohibited activities: list of explicitly prohibited AI uses
- Disclosure rules: requirements for declaring AI assistance
- Record retention rules: requirements for keeping AI interaction records
- Numerical thresholds and meaning: specific percentages or scores with context
- Measurement method: how AI use is measured (if specified)
- Conditions: circumstances under which rules apply
- Scope: which assignments or activities the policy covers
- Excerpts: relevant quoted text from policy
- Ambiguities: unclear or conflicting statements

**Interpretation display**:
- Present structured interpretation in clear sections
- Use plain language summaries
- Include policy excerpts to support interpretation
- Highlight ambiguities and recommend clarification from instructor

#### 3.15.7 Numerical Thresholds Strict Interpretation

**Distinct handling of threshold types**:

**No numerical threshold**:
- Display: \"Accepted detection percentage: Not specified in the supplied policy\"
- Do not infer or assume thresholds

**Actual AI use limits**:
- Interpret as limits on actual AI assistance used, not detector score
- Example: \"Policy states: No more than 20% of the assignment may be AI-generated\"
- Do not compare detector score to AI use limits
- Clarify: \"This limit refers to the actual amount of AI assistance you used, not the detector score\"

**External detector thresholds**:
- Recognize references to Turnitin, GPTZero, or other detectors
- Explain non-interchangeability: \"This policy references [external detector]. AIDetector.cx scores are not directly comparable to [external detector] scores\"
- Do not convert or map scores between detectors

**AIDetector.cx-specific thresholds**:
- Recognize thresholds explicitly referencing AIDetector.cx
- Strict semantics: compare detector score to stated threshold
- Factual wording: \"Below the stated numerical threshold. This numerical comparison does not establish compliance with every assignment rule\"
- Avoid false compliance labels

**Threshold comparison display**:
- Show detector score
- Show policy threshold (if specified)
- Show factual comparison (above/below threshold)
- Include disclaimer: \"This comparison is based solely on the numerical threshold. Other policy rules may apply\"

#### 3.15.8 Student Declaration of AI Assistance

**Optional checklist**:
- No AI assistance used
- Brainstorming or idea generation
- Outlining or structuring
- Grammar or spelling checking
- Translation
- Rewriting or paraphrasing
- Generated text or content
- Research or information gathering
- Coding or programming assistance
- Other (with text input)
- Prefer not to specify

**Declaration handling**:
- Student can select multiple activities
- Declaration is optional
- Declaration is stored with detection results (if user is logged in)
- Declaration is not sent to detector or used in scoring

**Comparison with policy rules**:
- Compare declared activities with policy-allowed and policy-prohibited activities
- Display factual guidance: \"Your declaration includes [activity]. The policy states [relevant rule]\"
- Restrained wording: avoid guarantees, approvals, or compliance labels
- Highlight potential conflicts: \"Your declaration includes [prohibited activity]. The policy prohibits this activity\"
- Recommend clarification: \"If you are unsure whether your use is permitted, ask your instructor\"

#### 3.15.9 Student Mode Workflow

**Workflow steps**:
1. Student runs AI detection (existing workflow)
2. Student opens Student Mode panel (optional)
3. Student inputs institution, course, assignment details (optional)
4. Student inputs assignment AI instructions or policy URL or uploads policy document
5. System retrieves or extracts policy text
6. Student reviews extracted policy text (if applicable)
7. System interprets policy and displays structured interpretation
8. Student reviews policy interpretation alongside detection results
9. Student optionally declares AI assistance used
10. System compares declaration with policy rules and displays factual guidance
11. Student reviews all information and decides on next steps

**Workflow flexibility**:
- Student can open Student Mode before or after running detection
- Student can edit policy inputs and re-interpret without rerunning detection
- Student can save or export combined results (detection + policy interpretation + declaration)

#### 3.15.10 Integration with Existing Detection Results

**Adapter pattern**:
- Student Mode consumes existing detection results through a separate adapter
- Adapter reads detection results (score, classification, sentence-level data) without modifying them
- Adapter presents detection results alongside policy interpretation
- No feedback loop from Student Mode to detector

**Display integration**:
- Detection results and policy interpretation displayed side-by-side or in adjacent sections
- Clear visual separation between detector output and policy guidance
- Unified export option for combined results

#### 3.15.11 Privacy and Data Handling

**Student data**:
- Institution, course, assignment details are optional and stored only if user is logged in
- Policy text and interpretation are stored with detection results (if user is logged in)
- Student declaration is stored with detection results (if user is logged in)
- Guest users can use Student Mode without storing data

**Policy retrieval**:
- Retrieved policy URLs and content are logged for security monitoring
- Retrieved policy text is not shared with third parties
- Policy interpretation is performed server-side

### 3.16 Subscription Credit Allocation Investigation and Fix

[Preserved unchanged from previous PRD version.]

### 3.17 Live Video Monitoring Investigation and Repair (UPDATED)

[Preserved unchanged from previous PRD version.]

## 4. Business Rules and Logic

[Sections 4.1 through 4.20 are preserved unchanged from the previous PRD version.]

### 4.21 Student Mode and Academic Policy Guidance Rules

- Student Mode is strictly additive and does not modify Balanced or Aggressive detection engines, prompts, models, thresholds, scoring, cup visualization, uploads, auth, pricing/credits, saved results, or follow-up actions
- Student info and policy text must never be inserted into detector inputs or alter detector outputs
- Student Mode consumes existing detection results through a separate adapter
- Zero false compliance labels: prohibited labels include College approved, Safe to submit, Guaranteed acceptance, Passed academic integrity, Verified human authorship, Cheating confirmed
- Entry point is compact, accessible, collapsed by default, no registration requirement to view or open, no mandatory pre-detection questionnaire
- Normal Analyze button stays in workflow; Student Mode works before or after detection without rerunning detection
- Assignment text in detector and policy document in Student Mode are clearly separated
- Policy inputs are never mixed with detection inputs
- Policy retrieval uses SSRF protection: block private IPs, cloud metadata, localhost; validate redirects; size/timeout limits; sanitize extracted text; treat as untrusted data; prompt injection immunity
- Policy interpreter service is independent and does not modify detector prompts
- Numerical thresholds are strictly interpreted: no threshold specified, actual AI use limits (not compared to detector score), external detector thresholds (explain non-interchangeability), AIDetector.cx-specific thresholds (strict semantics, factual wording)
- Student declaration is optional, stored with detection results (if logged in), not sent to detector or used in scoring
- Comparison with policy rules uses restrained factual guidance without guarantees, approvals, or compliance labels
- Conflicting policy instructions display clear conflict notice: \"These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.\"
- Policy sources are labeled: user-provided instructions, retrieved policy, administrator-reviewed policy
- Policy display includes excerpt, source, scope, retrieval date, content hash
- Document upload supports PDF, DOCX, TXT with text extraction, review, and fallback
- Student Mode workflow is flexible: can be opened before or after detection, policy inputs can be edited and re-interpreted without rerunning detection
- Student data (institution, course, assignment details, policy text, interpretation, declaration) is stored only if user is logged in
- Guest users can use Student Mode without storing data
- Retrieved policy URLs and content are logged for security monitoring
- Policy interpretation is performed server-side

## 5. Exception and Boundary Cases

[All existing exception and boundary cases from the previous PRD version are preserved unchanged.]

Additional cases:

| Scenario | Handling |
|---|---|
| User opens Student Mode with no detection results | Display message: \"Run AI detection first to use Student Mode\" |
| User inputs policy URL that is unreachable | Display error: \"Unable to retrieve policy from URL. Please check the URL or enter policy text manually\" |
| User uploads unsupported policy document format | Reject with validation message listing accepted formats (PDF, DOCX, TXT) |
| Policy document extraction fails | Display error message with manual input fallback |
| User inputs conflicting policy instructions from multiple sources | Display clear conflict notice: \"These instructions appear to conflict or may apply to different assessments. Ask your instructor which rule applies.\" |
| Policy text contains prompt injection attempts | Policy text is treated as untrusted data; prompt injection immunity ensures no execution of embedded instructions |
| Policy interpretation detects ambiguous or unclear rules | Highlight ambiguities and recommend clarification from instructor |
| Policy references external detector (Turnitin, GPTZero) | Explain non-interchangeability: \"This policy references [external detector]. AIDetector.cx scores are not directly comparable to [external detector] scores\" |
| Policy specifies numerical threshold for AIDetector.cx | Display factual comparison: \"Below the stated numerical threshold. This numerical comparison does not establish compliance with every assignment rule\" |
| Policy does not specify numerical threshold | Display: \"Accepted detection percentage: Not specified in the supplied policy\" |
| Student declares prohibited activity | Display factual guidance: \"Your declaration includes [prohibited activity]. The policy prohibits this activity. If you are unsure whether your use is permitted, ask your instructor\" |
| Student declares activity not mentioned in policy | Display: \"Your declaration includes [activity]. The policy does not explicitly address this activity. If you are unsure whether your use is permitted, ask your instructor\" |
| Student edits policy inputs after interpretation | Allow re-interpretation without rerunning detection |
| Guest user uses Student Mode | Student Mode functions normally; no data is stored |
| Logged-in user uses Student Mode | Student data, policy text, interpretation, and declaration are stored with detection results |
| User attempts to export combined results (detection + policy + declaration) | Export includes all relevant data in unified format |
| Policy retrieval encounters SSRF attack attempt | SSRF protection blocks request; display error message |
| Policy document exceeds size limit | Reject with error message: \"Policy document exceeds maximum size (10MB)\" |
| Policy retrieval exceeds timeout limit | Display error: \"Policy retrieval timed out. Please try again or enter policy text manually\" |
| User reviews extracted policy text and finds errors | User can correct or replace extracted text before interpretation |

## 6. Acceptance Criteria

[All existing acceptance criteria from the previous PRD version (items 1 through 291) are preserved unchanged.]

Additional acceptance criteria:

**Student Mode and Academic Policy Guidance (Phase 1)**
292. Student Mode entry point is compact, accessible, and positioned near detection results
293. Entry point is collapsed by default
294. No registration requirement to view or open Student Mode
295. No mandatory pre-detection questionnaire
296. Normal Analyze button stays in workflow
297. Student Mode works before or after detection without rerunning detection
298. Student Mode does not modify Balanced or Aggressive detection engines, prompts, models, thresholds, scoring, cup visualization, uploads, auth, pricing/credits, saved results, or follow-up actions
299. Student info and policy text are never inserted into detector inputs or alter detector outputs
300. Student Mode consumes existing detection results through a separate adapter
301. Zero false compliance labels are enforced: no College approved, Safe to submit, Guaranteed acceptance, Passed academic integrity, Verified human authorship, Cheating confirmed
302. Input fields include institution name, course/module, assignment title, term/date, assignment AI instructions, official policy URL, document upload
303. Assignment text in detector and policy document in Student Mode are clearly separated
304. Policy inputs are never mixed with detection inputs
305. Document upload supports PDF, DOCX, TXT
306. Text extraction displays extracted text for user review
307. User can correct or replace extracted text before interpretation
308. Extraction failures display clear error message with manual input fallback
309. Policy sources are labeled: user-provided instructions, retrieved policy, administrator-reviewed policy
310. Policy display includes excerpt, source, scope, retrieval date, content hash
311. Conflicting policy instructions display clear conflict notice
312. Policy retrieval uses SSRF protection: block private IPs, cloud metadata, localhost
313. Redirects are validated: follow only HTTPS redirects, limit redirect depth
314. Size limits are enforced: maximum document size 10MB
315. Timeout limits are enforced: maximum retrieval time 30 seconds
316. Extracted text is sanitized: remove scripts, HTML tags, unsafe content
317. Policy text is treated as untrusted data: validate and escape all extracted content
318. Prompt injection immunity: policy text is never inserted into model prompts as instructions
319. Policy interpreter service is independent and does not modify detector prompts
320. Structured interpretation extracts: AI use status, allowed activities, prohibited activities, disclosure rules, record retention rules, numerical thresholds, measurement method, conditions, scope, excerpts, ambiguities
321. Interpretation display presents structured interpretation in clear sections
322. Plain language summaries are used
323. Policy excerpts support interpretation
324. Ambiguities are highlighted with recommendation to ask instructor
325. No numerical threshold displays: \"Accepted detection percentage: Not specified in the supplied policy\"
326. Actual AI use limits are interpreted as limits on actual AI assistance used, not detector score
327. External detector thresholds explain non-interchangeability
328. AIDetector.cx-specific thresholds use strict semantics and factual wording
329. Threshold comparison displays detector score, policy threshold, factual comparison, disclaimer
330. Student declaration checklist includes: No AI, brainstorming, outlining, grammar/spelling, translation, rewriting, generated text, research, coding, other, prefer not to specify
331. Declaration is optional
332. Declaration is stored with detection results (if logged in)
333. Declaration is not sent to detector or used in scoring
334. Comparison with policy rules displays factual guidance without guarantees, approvals, or compliance labels
335. Potential conflicts are highlighted with recommendation to ask instructor
336. Student Mode workflow allows opening before or after detection
337. Policy inputs can be edited and re-interpreted without rerunning detection
338. Combined results (detection + policy interpretation + declaration) can be saved or exported
339. Detection results and policy interpretation are displayed side-by-side or in adjacent sections
340. Clear visual separation between detector output and policy guidance
341. Unified export option for combined results
342. Student data is stored only if user is logged in
343. Guest users can use Student Mode without storing data
344. Retrieved policy URLs and content are logged for security monitoring
345. Policy interpretation is performed server-side
346. All Student Mode functionality is tested with guest and logged-in users
347. All policy source types are tested: user-provided, retrieved URL, uploaded document
348. All numerical threshold types are tested: no threshold, AI use limits, external detector, AIDetector.cx-specific
349. All student declaration scenarios are tested: no AI, multiple activities, prohibited activities, activities not mentioned in policy
350. All error scenarios are tested: unreachable URL, unsupported format, extraction failure, SSRF attack, size/timeout limits
351. All conflict scenarios are tested: conflicting instructions, ambiguous rules
352. All privacy scenarios are tested: guest user, logged-in user, data storage, export

## 7. Out of Scope for This Release

[All existing out-of-scope items from the previous PRD version are preserved unchanged.]

Additional out-of-scope items:
- Administrator-reviewed policy database (deferred to future phase)
- Institutional policy repository integration (deferred to future phase)
- Automated policy conflict resolution (deferred to future phase)
- AI-powered policy interpretation beyond structured extraction (deferred to future phase)
- Student Mode integration with Essay Studio (deferred to future phase)
- Student Mode integration with Humanizer (deferred to future phase)
- Student Mode integration with Plagiarism Checker (deferred to future phase)
- Student Mode integration with Citation Verifier (deferred to future phase)
- Student Mode mobile app support (deferred to future phase)
- Student Mode API endpoint (deferred to future phase)
- Student Mode team collaboration features (deferred to future phase)
- Student Mode instructor dashboard (deferred to future phase)
- Student Mode institutional reporting (deferred to future phase)
- Student Mode policy version tracking (deferred to future phase)
- Student Mode policy change notifications (deferred to future phase)