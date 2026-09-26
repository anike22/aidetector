# Requirements Document

## 1. Application Overview

**Application Name**: AIDetector.cx — SEO Assistant (incorporating Blogger Content Optimization)

**Description**: A comprehensive web-based SEO workspace that integrates advanced blogger content optimization workflows within the broader SEO Assistant suite. The application enables users to manage SEO project settings (including active website domain configuration), perform keyword evaluation and title validation with fixed credit deduction, draft content with real-time SEO quality analysis, execute competitive content gap and keyword coverage analysis, and run blogger-specific optimization workflows (one-click AI bypass/humanize, readability enhancement, SEO-aligned tone optimization, and targeted blogger fixes) directly within the workspace while maintaining the existing color scheme.

## 2. Users and Use Scenarios

**Target Users**:
- SEO specialists, bloggers, and content marketers managing domain-level SEO projects and drafting optimized articles.
- Editorial teams aiming to identify competitor content gaps, improve AI humanization/readability, and ensure on-page content meets strict quality and keyword standards.

**Core Use Scenarios**:
- Configuring or updating the active website domain directly within SEO Assistant project settings to persist domain context for ongoing analysis.
- Executing a 3-step content creation workflow: configuring primary/secondary keywords, validating and locking titles with a 30-credit deduction, and drafting content with continuous real-time analysis.
- Running blogger-specific optimization tools directly on drafted content to apply one-click AI bypass/humanize optimization, tone enhancements, and targeted fixes.
- Analyzing content gaps and competitor keyword coverage for the current post to uncover missing topics, high-value keywords, and competitor ranking patterns.
- Restoring previous sessions or resetting workflows seamlessly via history management.

## 3. Page Structure and Functionality

### 3.1 Information Architecture & Hierarchy

```
SEO Assistant Workspace:
  1. Global Navigation Bar
  2. Project & Domain Settings Header
     - Active SEO Project Selector
     - Website Domain Configuration (Input field, 「Save to Project」 action, persistence status)
  3. Saved Work & History Drawer
     - Session Records List (Title, Primary Keyword, Last Updated, Restore Action)
  4. SEO Assistant Workflow Container
     - Step 1: Keyword Setup & Metric Evaluation
       + Primary Keyword Input (1 field, required)
       + Related Keywords Inputs (3 fields, required)
       + Keyword Metrics Display (KD score, Monthly Volume, Search Intent, Word Count Target)
       + Action: 「Lock Keywords」
     - Step 2: Content Title & Credit Commitment
       + Content Title Input Field
       + Primary Keyword Inclusion Validation Display
       + Credit Cost Notice (Static 30 credits)
       + Action: 「Lock Title」
     - Step 3: Content Drafting & Real-Time Workstation
       + Top Toolbar: Saved Status Indicator, 「Start New」 Action
       + Content Editor / Text Area (Real-time Word, Sentence, and Paragraph counts)
       + Live Google SERP Snippet Preview (Desktop / Mobile Tabs, Character/Pixel limits, Meta Description Preview)
       + Real-Time Analysis Panels:
         * Keywords & Distribution Panel
         * Content Uniqueness Panel (Overused words threshold 1%–2%)
         * Grammar & Consecutive Spacing Panel
         * Readability & Structure Panel (Sentence length 25–30 words, paragraph length 250–300 words)
         * Internal Link Anchor Discovery Panel
       + Blogger Optimization Toolkit Module:
         * Action: 「AI Bypass & Humanize Optimization」
         * Action: 「Readability Enhancement」
         * Action: 「SEO Tone Optimization」
         * Action: 「Apply Blogger Fixes」
         * Optimization Preview & Diff Panel (Before/After comparison, Apply/Revert actions)
       + Competitor Intelligence & Content Gap Module:
         * Action: 「Check Content Gap & Competitor Keyword Coverage」
         * Competitor Coverage Overview Panel (Top competitor URLs, keyword overlap score)
         * Missing Keywords & Topics List (Actionable keyword opportunities)
         * Content Gap Recommendations
  5. Global Footer
```

### 3.2 Project & Website Domain Settings

- **Domain Configuration Field**: Allows users to input or update their website domain directly inside the SEO Assistant interface.
- **Save Domain Action**: Clicking 「Save to Project」 updates and persists the domain into the active SEO project settings in the backend database.
- **Status Indicator**: Displays confirmation when the domain is successfully linked to the active project.

### 3.3 Step 1: Keyword Setup & Evaluation

- **Keyword Inputs**: Accepts 1 primary keyword and 3 related keywords.
- **Keyword Metrics Display**: Displays Keyword Difficulty (KD), monthly search volume, search intent, and recommended ranking word count.
- **Lock Action**: Clicking 「Lock Keywords」 locks keyword fields for the session and enables Step 2.

### 3.4 Step 2: Content Title & Credit Commitment

- **Title Validation**: Checks that the entered title includes the locked primary keyword.
- **Locking & Credit Deduction**: Clicking 「Lock Title」 deducts a static 30 credits from user balance, locks the title, and unlocks Step 3.

### 3.5 Step 3: Content Drafting & Real-Time Workstation

- **Continuous Real-Time Editor**: Real-time evaluation runs on input without manual triggers or added credit deductions.
- **SERP Snippet Preview**: Displays desktop and mobile search snippet simulations with character and pixel warning indicators for the locked title.
- **Content Quality Checks**:
  - Flags overused words only when frequency exceeds 1%–2% of total word count.
  - Detects consecutive double or multiple whitespace characters inside text lines while ignoring valid markdown and paragraph breaks.
  - Evaluates sentence length (target 25–30 words) and paragraph length (target 250–300 words).
  - Discovers internal link anchor suggestions.
- **Blogger Optimization Toolkit**:
  - **AI Bypass & Humanize**: One-click action to rewrite robotic patterns into natural, humanized phrasing while retaining keyword intent.
  - **Readability Enhancement**: Rephrases complex sentences and adjusts paragraph flow to optimize readability scores.
  - **SEO Tone Optimization**: Adjusts content tone to align with authoritative, engaging blogging standards suitable for organic ranking.
  - **Blogger-Targeted Fixes**: Applies automated corrections to weak hooks, abrupt transitions, and passive structures.
  - **Preview & Diff**: Displays proposed changes side-by-side with options to accept or revert back to the original draft.
- **Competitor Content Gap & Keyword Coverage Analysis**:
  - Trigger button: 「Check Content Gap & Competitor Keyword Coverage」.
  - Compares the current article text and target keywords against top-ranking competitor pages for the primary keyword.
  - Displays competitor keyword coverage percentage and highlights missing keywords/topics not yet covered in the drafted content.

### 3.6 History & Workflow Reset

- **Saved History**: Restores sessions directly into Step 3 in locked state with draft content, optimization results, and gap analysis reports intact at 0 credits.
- **Start New Workflow**: Automatically saves the active session state to history before clearing fields and resetting to Step 1.

## 4. Business Rules and Logic

### 4.1 Project & Domain Association

- Saving a website domain directly updates the project record associated with the current user.
- The saved domain serves as the default context for domain-level analyses within the active SEO project.

### 4.2 Blogger Optimization Logic

- Running blogger optimization actions modifies or generates preview diffs based on the locked primary and secondary keywords, ensuring target terms are preserved.
- Users can review the diff before committing optimizations into the active editor.
- Applying optimizations automatically triggers immediate updates to all real-time analysis panels without requiring page refresh.

### 4.3 Content Gap & Competitor Analysis Logic

- Triggering competitor analysis fetches top-ranking pages for the locked primary keyword and compares keyword presence and topical coverage against the active editor content.
- The analysis identifies keywords present in top competitor content but missing or under-represented in the user draft.

### 4.4 Credit & Session Rules

- A fixed deduction of 30 credits occurs strictly once upon locking the title in Step 2.
- Continuous real-time quality checks, blogger optimizations, and content gap analyses within Step 3 do not deduct additional credits for the active session.
- Opening saved history records incurs 0 credits and preserves locked states.

## 5. Exception and Boundary Cases

| Scenario | System Handling |
|---|---|
| User saves an invalid domain format | Display validation warning indicating proper domain format is required. |
| User clicks save domain without an active project selected | Notify user to select or initialize an active SEO project first. |
| Blogger optimization triggered with empty editor | Prompt user to input content before running optimization tools. |
| Competitor gap analysis triggered with empty or minimal content (< 50 words) | Prompt user to draft sufficient content before running competitor gap evaluation. |
| Competitor data unavailable for the target keyword | Display notification that competitor benchmarks cannot be retrieved, while keeping real-time quality analysis active. |
| Insufficient credit balance (< 30 credits) at Step 2 | Block title locking and display balance replenishment notice. |
| Title does not contain primary keyword | Block title locking and display inline validation prompt. |
| User enters multiple consecutive spaces within a line | Highlight spacing violation in real time without penalizing valid markdown syntax. |
| User opens history record | Load workspace directly at Step 3 with locked state and 0 credit charge. |

## 6. Acceptance Criteria

1. Users can enter a website domain and persist it directly into the active SEO project settings via 「Save to Project」.
2. Step 1 accepts 1 primary and 3 related keywords, displaying realistic KD, search volume, intent, and target word counts before locking.
3. Step 2 validates primary keyword presence in the title, deducts a static 30 credits upon locking, and unlocks Step 3.
4. Step 3 provides continuous real-time analysis for keywords, overused words (1%–2% threshold), spacing rules, readability metrics, and SERP snippet preview.
5. Users can execute blogger optimization actions (AI Bypass/Humanize, Readability Enhancement, SEO Tone Optimization, and Blogger Fixes) directly in Step 3, preview changes via diff, and apply them to the editor.
6. The 「Check Content Gap & Competitor Keyword Coverage」 action calculates and displays competitor keyword coverage and missing keyword opportunities for the current post.
7. History restoration loads previous sessions into Step 3 with locked states and all prior data loaded at 0 additional credits.
8. Clicking 「Start New」 auto-saves the current session before returning the workspace to Step 1.

## 7. Out of Scope for This Release

- Direct CMS export or one-click live publishing integrations.
- Multi-domain bulk migration tools.
- Dynamic variable-rate credit billing structures.