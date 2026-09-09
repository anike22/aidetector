
-- ============================================================
-- Essay Studio Schema
-- ============================================================

-- Essay Types and Status Enums
CREATE TYPE essay_type AS ENUM (
  'argumentative','persuasive','expository','analytical',
  'compare_contrast','research','literature_review','critical_analysis',
  'reflective','scholarship','admission','custom'
);

CREATE TYPE academic_level AS ENUM (
  'high_school','undergraduate','masters','doctoral','custom'
);

CREATE TYPE citation_style AS ENUM (
  'apa','mla','chicago','harvard','ieee'
);

CREATE TYPE essay_status AS ENUM (
  'draft','planning','writing','verifying','improving','submitting','archived'
);

CREATE TYPE essay_phase AS ENUM (
  'plan','outline','write','verify','improve','cite','sources','history','submit'
);

CREATE TYPE source_status AS ENUM (
  'supported','partially_supported','unsupported','contradicted','citation_required','unanalyzed'
);

CREATE TYPE event_type AS ENUM (
  'essay_created','outline_created','writing_session_start','writing_session_end',
  'edit','source_added','citation_added','ai_assist','detector_analysis','final_verification',
  'phase_change','version_saved','export'
);

-- ============================================================
-- Core Essays Table
-- ============================================================
CREATE TABLE essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Essay',
  essay_type essay_type NOT NULL DEFAULT 'argumentative',
  academic_level academic_level NOT NULL DEFAULT 'undergraduate',
  status essay_status NOT NULL DEFAULT 'draft',
  current_phase essay_phase NOT NULL DEFAULT 'plan',

  -- Planning fields
  topic text,
  assignment_instructions text,
  research_question text,
  target_word_count integer DEFAULT 1000,
  citation_style citation_style DEFAULT 'apa',
  language text DEFAULT 'English',
  deadline timestamptz,
  required_sources integer DEFAULT 0,

  -- Content
  content text DEFAULT '',
  word_count integer DEFAULT 0,
  character_count integer DEFAULT 0,

  -- Assignment link (for student→teacher assignment)
  assignment_id uuid,

  -- Progress tracking (0-100)
  overall_progress integer DEFAULT 0,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_edited_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Outline Sections
-- ============================================================
CREATE TABLE essay_outline_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES essay_outline_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  notes text DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  depth integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Versions (autosave snapshots)
-- ============================================================
CREATE TABLE essay_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  word_count integer DEFAULT 0,
  version_number integer NOT NULL DEFAULT 1,
  label text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Sources
-- ============================================================
CREATE TABLE essay_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  authors text DEFAULT '',
  publication_date text DEFAULT '',
  publisher text DEFAULT '',
  url text DEFAULT '',
  doi text DEFAULT '',
  source_type text DEFAULT 'other',
  notes text DEFAULT '',
  is_analyzed boolean DEFAULT false,
  status source_status DEFAULT 'unanalyzed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Citations
-- ============================================================
CREATE TABLE essay_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  source_id uuid REFERENCES essay_sources(id) ON DELETE SET NULL,
  citation_key text NOT NULL,
  in_text_format text NOT NULL DEFAULT '',
  bibliography_format text NOT NULL DEFAULT '',
  citation_style citation_style NOT NULL DEFAULT 'apa',
  needs_verification boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  position_hint text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Writing Events (development timeline)
-- ============================================================
CREATE TABLE essay_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  words_at_event integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Quality Scores
-- ============================================================
CREATE TABLE essay_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  overall_score integer DEFAULT 0,
  thesis_score integer DEFAULT 0,
  argument_score integer DEFAULT 0,
  evidence_score integer DEFAULT 0,
  organization_score integer DEFAULT 0,
  coherence_score integer DEFAULT 0,
  critical_thinking_score integer DEFAULT 0,
  grammar_score integer DEFAULT 0,
  readability_score integer DEFAULT 0,
  academic_tone_score integer DEFAULT 0,
  citation_quality_score integer DEFAULT 0,
  originality_score integer DEFAULT 0,
  issues jsonb DEFAULT '[]',
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Detector Results (both engines)
-- ============================================================
CREATE TABLE essay_detector_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  balanced_result jsonb DEFAULT NULL,
  aggressive_result jsonb DEFAULT NULL,
  additional_analysis jsonb DEFAULT '{}',
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Teacher Assignments
-- ============================================================
CREATE TABLE teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text DEFAULT '',
  essay_type essay_type DEFAULT 'argumentative',
  min_word_count integer DEFAULT 500,
  max_word_count integer DEFAULT 2000,
  citation_style citation_style DEFAULT 'apa',
  required_sources integer DEFAULT 3,
  rubric text DEFAULT '',
  ai_use_policy text DEFAULT '',
  deadline timestamptz,
  assignment_code text UNIQUE NOT NULL DEFAULT substring(gen_random_uuid()::text, 1, 8),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Essay Templates
-- ============================================================
CREATE TABLE essay_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  essay_type essay_type NOT NULL DEFAULT 'argumentative',
  academic_level academic_level DEFAULT 'undergraduate',
  citation_style citation_style DEFAULT 'apa',
  outline_structure jsonb DEFAULT '[]',
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_essays_user_id ON essays(user_id);
CREATE INDEX idx_essays_status ON essays(status);
CREATE INDEX idx_essays_updated_at ON essays(updated_at DESC);
CREATE INDEX idx_outline_sections_essay_id ON essay_outline_sections(essay_id);
CREATE INDEX idx_outline_sections_position ON essay_outline_sections(essay_id, position);
CREATE INDEX idx_essay_versions_essay_id ON essay_versions(essay_id);
CREATE INDEX idx_essay_versions_number ON essay_versions(essay_id, version_number DESC);
CREATE INDEX idx_essay_sources_essay_id ON essay_sources(essay_id);
CREATE INDEX idx_essay_citations_essay_id ON essay_citations(essay_id);
CREATE INDEX idx_essay_events_essay_id ON essay_events(essay_id);
CREATE INDEX idx_essay_events_created_at ON essay_events(essay_id, created_at DESC);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_code ON teacher_assignments(assignment_code);
CREATE INDEX idx_essay_templates_slug ON essay_templates(slug);

-- ============================================================
-- Auto-update updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER essays_updated_at BEFORE UPDATE ON essays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER outline_sections_updated_at BEFORE UPDATE ON essay_outline_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sources_updated_at BEFORE UPDATE ON essay_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER citations_updated_at BEFORE UPDATE ON essay_citations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON teacher_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_outline_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_detector_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_templates ENABLE ROW LEVEL SECURITY;

-- Essays: owner full access
CREATE POLICY "essays_owner_all" ON essays FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Outline sections: via essay ownership (SECURITY DEFINER helper)
CREATE OR REPLACE FUNCTION get_essay_user_id(p_essay_id uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT user_id FROM essays WHERE id = p_essay_id;
$$;

CREATE POLICY "outline_owner_all" ON essay_outline_sections FOR ALL TO authenticated
  USING (get_essay_user_id(essay_id) = auth.uid())
  WITH CHECK (get_essay_user_id(essay_id) = auth.uid());

CREATE POLICY "versions_owner_all" ON essay_versions FOR ALL TO authenticated
  USING (get_essay_user_id(essay_id) = auth.uid())
  WITH CHECK (get_essay_user_id(essay_id) = auth.uid());

CREATE POLICY "sources_owner_all" ON essay_sources FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "citations_owner_all" ON essay_citations FOR ALL TO authenticated
  USING (get_essay_user_id(essay_id) = auth.uid())
  WITH CHECK (get_essay_user_id(essay_id) = auth.uid());

CREATE POLICY "events_owner_all" ON essay_events FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "quality_owner_all" ON essay_quality_scores FOR ALL TO authenticated
  USING (get_essay_user_id(essay_id) = auth.uid())
  WITH CHECK (get_essay_user_id(essay_id) = auth.uid());

CREATE POLICY "detector_owner_all" ON essay_detector_results FOR ALL TO authenticated
  USING (get_essay_user_id(essay_id) = auth.uid())
  WITH CHECK (get_essay_user_id(essay_id) = auth.uid());

CREATE POLICY "assignments_teacher_all" ON teacher_assignments FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

-- Templates: public read
CREATE POLICY "templates_public_read" ON essay_templates FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- ============================================================
-- Seed Essay Templates
-- ============================================================
INSERT INTO essay_templates (slug, name, description, essay_type, academic_level, citation_style, seo_title, seo_description, outline_structure) VALUES
('argumentative-essay', 'Argumentative Essay', 'A structured essay that presents a clear position on a debatable topic, supported by evidence and logical reasoning.', 'argumentative', 'undergraduate', 'apa',
 'Argumentative Essay Template | AIDetector.cx Essay Studio',
 'Use our argumentative essay template to build a strong, evidence-backed argument with a clear thesis, supporting claims, counterarguments, and a compelling conclusion.',
 '[{"title":"Introduction","description":"Hook → Background Context → Thesis Statement","position":0},{"title":"Body Paragraph 1 — Main Argument","description":"Topic Sentence → Evidence → Analysis → Citation","position":1},{"title":"Body Paragraph 2 — Supporting Argument","description":"Topic Sentence → Evidence → Analysis → Citation","position":2},{"title":"Body Paragraph 3 — Counterargument & Rebuttal","description":"Counterargument → Rebuttal → Strengthened Position","position":3},{"title":"Conclusion","description":"Restate Thesis → Synthesis → Call to Action or Implications","position":4}]'),

('persuasive-essay', 'Persuasive Essay', 'An essay designed to convince the reader to adopt a particular viewpoint or take a specific action.', 'persuasive', 'undergraduate', 'mla',
 'Persuasive Essay Template | AIDetector.cx Essay Studio',
 'Build a compelling persuasive essay with emotional appeal, logical reasoning, and a powerful call to action.',
 '[{"title":"Introduction","description":"Attention-Grabbing Hook → Issue Background → Clear Position Statement","position":0},{"title":"Reason 1 — Logical Appeal (Logos)","description":"Claim → Data/Statistics → Explanation","position":1},{"title":"Reason 2 — Emotional Appeal (Pathos)","description":"Narrative or Example → Emotional Connection → Reinforcement","position":2},{"title":"Reason 3 — Ethical Appeal (Ethos)","description":"Expert Authority → Credibility → Supporting Evidence","position":3},{"title":"Counterargument","description":"Present Opposing View → Refute Effectively","position":4},{"title":"Conclusion","description":"Restate Position → Summary → Compelling Call to Action","position":5}]'),

('research-paper', 'Research Paper', 'An academic paper presenting original research, analysis, or a synthesis of existing knowledge on a topic.', 'research', 'undergraduate', 'apa',
 'Research Paper Template | AIDetector.cx Essay Studio',
 'Structure your research paper with a proper abstract, literature review, methodology, findings, and conclusion using APA or MLA format.',
 '[{"title":"Abstract","description":"Brief summary of research question, methodology, findings, and conclusions (150–250 words)","position":0},{"title":"Introduction","description":"Background → Research Problem → Research Question → Thesis → Paper Overview","position":1},{"title":"Literature Review","description":"Existing Research → Theoretical Framework → Research Gaps → Your Contribution","position":2},{"title":"Methodology","description":"Research Design → Data Collection → Analysis Approach → Limitations","position":3},{"title":"Results/Findings","description":"Present Data → Organized by Theme or Question → Tables/Figures if applicable","position":4},{"title":"Discussion","description":"Interpret Results → Connect to Literature → Implications → Limitations","position":5},{"title":"Conclusion","description":"Restate Research Question → Summarize Findings → Future Research Directions","position":6},{"title":"References","description":"Full bibliography in selected citation style","position":7}]'),

('compare-contrast', 'Compare & Contrast Essay', 'Analyzes the similarities and differences between two or more subjects.', 'compare_contrast', 'undergraduate', 'mla',
 'Compare and Contrast Essay Template | AIDetector.cx Essay Studio',
 'Write a well-organized compare and contrast essay using our structured template with subject-by-subject or point-by-point organization.',
 '[{"title":"Introduction","description":"Introduce Both Subjects → Context → Thesis Stating Key Similarities/Differences","position":0},{"title":"Subject A — Overview","description":"Key characteristics, background, and context for Subject A","position":1},{"title":"Subject B — Overview","description":"Key characteristics, background, and context for Subject B","position":2},{"title":"Comparison Point 1","description":"Compare and contrast both subjects on first major criterion","position":3},{"title":"Comparison Point 2","description":"Compare and contrast both subjects on second major criterion","position":4},{"title":"Comparison Point 3","description":"Compare and contrast both subjects on third major criterion","position":5},{"title":"Conclusion","description":"Synthesize findings → Overall Assessment → Significance of Comparison","position":6}]'),

('analytical-essay', 'Analytical Essay', 'An essay that examines a text, concept, or phenomenon through close analysis and critical thinking.', 'analytical', 'undergraduate', 'mla',
 'Analytical Essay Template | AIDetector.cx Essay Studio',
 'Break down complex texts or concepts with our analytical essay template — structured for thesis-driven analysis with evidence.',
 '[{"title":"Introduction","description":"Brief Context → Central Claim/Thesis → Analytical Lens","position":0},{"title":"Analysis Section 1","description":"Observation → Evidence (Quote/Example) → Interpretation → Significance","position":1},{"title":"Analysis Section 2","description":"Observation → Evidence (Quote/Example) → Interpretation → Significance","position":2},{"title":"Analysis Section 3","description":"Observation → Evidence (Quote/Example) → Interpretation → Significance","position":3},{"title":"Synthesis","description":"Connect all analytical points → Broader implications → Address complexities","position":4},{"title":"Conclusion","description":"Reaffirm thesis → Summarize analytical insights → Final interpretation","position":5}]'),

('critical-analysis', 'Critical Analysis', 'A detailed evaluation of a work, idea, or argument, assessing its strengths, weaknesses, and broader implications.', 'critical_analysis', 'undergraduate', 'chicago',
 'Critical Analysis Essay Template | AIDetector.cx Essay Studio',
 'Evaluate texts, arguments, and ideas with our critical analysis template — designed for academic rigor and structured critical evaluation.',
 '[{"title":"Introduction","description":"Subject Introduction → Summary of Work → Your Critical Stance (Thesis)","position":0},{"title":"Summary","description":"Objective overview of the work being analyzed (no evaluation yet)","position":1},{"title":"Analysis — Strengths","description":"Identify effective elements → Evidence → Why they work","position":2},{"title":"Analysis — Weaknesses","description":"Identify weaknesses or limitations → Evidence → Impact","position":3},{"title":"Theoretical Framework","description":"Apply relevant theory or scholarly perspective to your evaluation","position":4},{"title":"Your Interpretation","description":"Your informed critical position → Nuanced judgment","position":5},{"title":"Conclusion","description":"Restate critical position → Overall assessment → Broader significance","position":6}]'),

('literature-review', 'Literature Review', 'A comprehensive survey and synthesis of existing research on a topic, identifying trends, gaps, and debates.', 'literature_review', 'masters', 'apa',
 'Literature Review Template | AIDetector.cx Essay Studio',
 'Write a comprehensive literature review with our template — covering thematic organization, source synthesis, gap identification, and research context.',
 '[{"title":"Introduction","description":"Topic Overview → Scope and Purpose of Review → Search Strategy","position":0},{"title":"Theoretical Background","description":"Key concepts, definitions, and theoretical frameworks","position":1},{"title":"Theme 1 — [Major Theme]","description":"Group related sources → Synthesize findings → Note agreements/disagreements","position":2},{"title":"Theme 2 — [Major Theme]","description":"Group related sources → Synthesize findings → Note agreements/disagreements","position":3},{"title":"Theme 3 — [Major Theme]","description":"Group related sources → Synthesize findings → Note agreements/disagreements","position":4},{"title":"Research Gaps","description":"What has not been studied → Contradictions → Methodological limitations","position":5},{"title":"Conclusion","description":"Summary of field → How your research addresses gaps → Transition to your study","position":6}]'),

('reflective-essay', 'Reflective Essay', 'A personal essay examining your experiences, thoughts, and learning, often using a structured reflective framework.', 'reflective', 'undergraduate', 'apa',
 'Reflective Essay Template | AIDetector.cx Essay Studio',
 'Write a thoughtful reflective essay using our structured template — organize your experience, feelings, evaluation, and learning for maximum impact.',
 '[{"title":"Introduction","description":"What you are reflecting on → Why it matters → Thesis (what you learned)","position":0},{"title":"Description","description":"What happened? Factual account of the experience or event","position":1},{"title":"Feelings","description":"What were you thinking and feeling during the experience?","position":2},{"title":"Evaluation","description":"What was good and bad about the experience? Be honest and specific.","position":3},{"title":"Analysis","description":"Why did things happen this way? What sense can you make of it?","position":4},{"title":"Conclusion","description":"What have you learned? How will this change your future approach?","position":5}]'),

('college-essay', 'College Admission Essay', 'A personal statement for college applications — authentic, specific, and memorable.', 'admission', 'high_school', 'mla',
 'College Essay Template | AIDetector.cx Essay Studio',
 'Write your authentic college admissions essay with our guided template — structured for personal storytelling and self-reflection.',
 '[{"title":"Opening Hook","description":"Vivid scene, moment, or detail that draws the reader in immediately","position":0},{"title":"The Story","description":"Narrative development — what happened, what you experienced, who you are","position":1},{"title":"The Turn","description":"The moment of realization, change, or growth","position":2},{"title":"What You Learned","description":"Reflection on how this experience shaped your values, goals, or perspective","position":3},{"title":"Looking Forward","description":"How this connects to your future — why this college, this program, this path","position":4}]'),

('scholarship-essay', 'Scholarship Essay', 'A targeted essay demonstrating why you deserve a scholarship — focused on achievements, goals, and fit.', 'scholarship', 'undergraduate', 'apa',
 'Scholarship Essay Template | AIDetector.cx Essay Studio',
 'Craft a compelling scholarship essay that showcases your achievements, goals, and unique qualifications.',
 '[{"title":"Introduction — Who You Are","description":"Brief, memorable opening that establishes your identity and purpose","position":0},{"title":"Your Achievements","description":"Specific accomplishments (academic, community, personal) with context and impact","position":1},{"title":"Your Goals","description":"Clear, specific goals — short-term and long-term — and why they matter","position":2},{"title":"Why This Scholarship","description":"Specific connection to the scholarship criteria, values, and mission","position":3},{"title":"Conclusion","description":"Reaffirm your candidacy → Express gratitude → Memorable closing","position":4}]'),

('apa-essay', 'APA Format Essay', 'A general academic essay formatted in APA 7th edition — used in social sciences, education, and psychology.', 'research', 'undergraduate', 'apa',
 'APA Essay Template | AIDetector.cx Essay Studio',
 'Write a correctly formatted APA essay with our template — includes title page, abstract, headings, in-text citations, and references list guidance.',
 '[{"title":"Title Page","description":"Running Head → Title → Author Name → Institutional Affiliation → Course → Date","position":0},{"title":"Abstract","description":"150–250 word summary of purpose, method, results, and conclusions. Keywords below.","position":1},{"title":"Introduction","description":"Background → Literature Context → Research Problem → Thesis/Purpose Statement","position":2},{"title":"Body Section 1 (Level 1 Heading)","description":"Main argument or finding with in-text citations (Author, Year)","position":3},{"title":"Body Section 2 (Level 1 Heading)","description":"Second main point with evidence and APA citations","position":4},{"title":"Discussion","description":"Interpret findings → Limitations → Implications → Future Directions","position":5},{"title":"Conclusion","description":"Summary of key points → Restate thesis → Final takeaway","position":6},{"title":"References","description":"Hanging indent, alphabetical, all cited sources in APA 7 format","position":7}]'),

('mla-essay', 'MLA Format Essay', 'A general academic essay formatted in MLA 9th edition — used in literature, humanities, and arts.', 'analytical', 'undergraduate', 'mla',
 'MLA Essay Template | AIDetector.cx Essay Studio',
 'Structure your MLA essay correctly with our template — covers header, in-text citations, Works Cited page, and proper formatting for humanities writing.',
 '[{"title":"MLA Header","description":"Your Name → Professor Name → Course → Date (top-left, double-spaced)","position":0},{"title":"Introduction","description":"Engaging opening → Context → Thesis (last sentence of introduction)","position":1},{"title":"Body Paragraph 1","description":"Topic Sentence → Evidence with MLA citation (Author page) → Analysis → Transition","position":2},{"title":"Body Paragraph 2","description":"Topic Sentence → Evidence with MLA citation → Analysis → Transition","position":3},{"title":"Body Paragraph 3","description":"Topic Sentence → Evidence with MLA citation → Analysis → Transition","position":4},{"title":"Conclusion","description":"Restate thesis in new words → Synthesize arguments → Broader significance","position":5},{"title":"Works Cited","description":"Hanging indent, alphabetical, MLA 9 format for all cited sources","position":6}]');
