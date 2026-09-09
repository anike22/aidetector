// Essay Studio — Supabase data layer.
// All DB operations for essays, outline sections, versions, sources,
// citations, events, quality scores, detector results, assignments, templates.

import { supabase } from '@/db/supabase';
import type {
  Essay, EssayOutlineSection, EssayVersion, EssaySource, EssayCitation,
  EssayEvent, EssayQualityScore, EssayDetectorResult, TeacherAssignment,
  EssayTemplate, EssayPhase, EventType,
  StudentSubmission, SubmissionReview, SubmissionStatus,
} from '@/types/essay';

// ─── ESSAYS ───────────────────────────────────────────────────────────────────

export const essayService = {

  // ── List / fetch ────────────────────────────────────────────────────────────

  async listEssays(opts: { status?: string; search?: string; limit?: number; cursor?: string } = {}) {
    let q = supabase
      .from('essays')
      .select('id,title,essay_type,academic_level,status,current_phase,word_count,target_word_count,overall_progress,updated_at,last_edited_at,created_at,deadline,topic,citation_style,language')
      .not('status', 'eq', 'archived')
      .order('last_edited_at', { ascending: false })
      .limit(opts.limit ?? 50);

    if (opts.status) q = q.eq('status', opts.status);
    if (opts.search) q = q.ilike('title', `%${opts.search}%`);
    if (opts.cursor) q = q.lt('last_edited_at', opts.cursor);

    const { data, error } = await q;
    if (error) throw error;
    return Array.isArray(data) ? (data as Essay[]) : [];
  },

  async listArchivedEssays() {
    const { data, error } = await supabase
      .from('essays')
      .select('id,title,essay_type,status,word_count,updated_at')
      .eq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return Array.isArray(data) ? (data as Essay[]) : [];
  },

  async getEssay(id: string) {
    const { data, error } = await supabase
      .from('essays')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Essay | null;
  },

  // ── Create / Update / Delete ─────────────────────────────────────────────────

  async createEssay(payload: Partial<Essay>): Promise<Essay> {
    const { data, error } = await supabase
      .from('essays')
      .insert({ ...payload })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Essay;
  },

  async updateEssay(id: string, payload: Partial<Essay>) {
    const { error } = await supabase
      .from('essays')
      .update({ ...payload, last_edited_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async updateContent(id: string, content: string) {
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const charCount = content.length;
    const { error } = await supabase
      .from('essays')
      .update({
        content,
        word_count: wordCount,
        character_count: charCount,
        last_edited_at: new Date().toISOString(),
        status: 'writing',
      })
      .eq('id', id);
    if (error) throw error;
    return { wordCount, charCount };
  },

  async updatePhase(id: string, phase: EssayPhase) {
    const { error } = await supabase
      .from('essays')
      .update({ current_phase: phase })
      .eq('id', id);
    if (error) throw error;
  },

  async renameEssay(id: string, title: string) {
    const { error } = await supabase
      .from('essays')
      .update({ title })
      .eq('id', id);
    if (error) throw error;
  },

  async archiveEssay(id: string) {
    const { error } = await supabase
      .from('essays')
      .update({ status: 'archived' })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteEssay(id: string) {
    const { error } = await supabase.from('essays').delete().eq('id', id);
    if (error) throw error;
  },

  async duplicateEssay(id: string): Promise<Essay> {
    const original = await essayService.getEssay(id);
    if (!original) throw new Error('Essay not found');
    const { id: _id, user_id: _uid, created_at: _ca, updated_at: _ua, last_edited_at: _la, ...rest } = original;
    const copy = await essayService.createEssay({
      ...rest,
      title: `${original.title} (Copy)`,
      status: 'draft',
      current_phase: 'plan',
      content: original.content,
      word_count: original.word_count,
    });
    // Copy outline sections
    const sections = await essayService.listOutlineSections(id);
    for (const s of sections) {
      await supabase.from('essay_outline_sections').insert({
        essay_id: copy.id,
        title: s.title,
        description: s.description,
        notes: s.notes,
        position: s.position,
        depth: s.depth,
      });
    }
    return copy;
  },

  // ─── OUTLINE SECTIONS ────────────────────────────────────────────────────────

  async listOutlineSections(essayId: string): Promise<EssayOutlineSection[]> {
    const { data, error } = await supabase
      .from('essay_outline_sections')
      .select('*')
      .eq('essay_id', essayId)
      .order('position', { ascending: true })
      .limit(200);
    if (error) throw error;
    return Array.isArray(data) ? (data as EssayOutlineSection[]) : [];
  },

  async upsertOutlineSections(essayId: string, sections: Omit<EssayOutlineSection, 'id' | 'created_at' | 'updated_at'>[]) {
    // Delete existing and re-insert in order
    await supabase.from('essay_outline_sections').delete().eq('essay_id', essayId);
    if (sections.length === 0) return;
    const { error } = await supabase.from('essay_outline_sections').insert(
      sections.map((s, i) => ({ ...s, essay_id: essayId, position: i }))
    );
    if (error) throw error;
  },

  async updateOutlineSection(id: string, payload: Partial<EssayOutlineSection>) {
    const { error } = await supabase.from('essay_outline_sections').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteOutlineSection(id: string) {
    const { error } = await supabase.from('essay_outline_sections').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── VERSIONS ─────────────────────────────────────────────────────────────────

  async saveVersion(essayId: string, content: string, label = '') {
    // Get next version number
    const { data: latest } = await supabase
      .from('essay_versions')
      .select('version_number')
      .eq('essay_id', essayId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNum = (latest?.version_number ?? 0) + 1;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const { error } = await supabase.from('essay_versions').insert({
      essay_id: essayId,
      content,
      word_count: wordCount,
      version_number: nextNum,
      label: label || `Version ${nextNum}`,
    });
    if (error) throw error;
    // Prune: keep only last 50
    const { data: old } = await supabase
      .from('essay_versions')
      .select('id')
      .eq('essay_id', essayId)
      .order('version_number', { ascending: false })
      .limit(1000);
    if (old && old.length > 50) {
      const toDelete = old.slice(50).map((r) => r.id);
      await supabase.from('essay_versions').delete().in('id', toDelete);
    }
  },

  async listVersions(essayId: string): Promise<EssayVersion[]> {
    const { data, error } = await supabase
      .from('essay_versions')
      .select('id,essay_id,word_count,version_number,label,created_at')
      .eq('essay_id', essayId)
      .order('version_number', { ascending: false })
      .limit(50);
    if (error) throw error;
    return Array.isArray(data) ? (data as EssayVersion[]) : [];
  },

  async getVersion(id: string): Promise<EssayVersion | null> {
    const { data, error } = await supabase
      .from('essay_versions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as EssayVersion | null;
  },

  // ─── SOURCES ──────────────────────────────────────────────────────────────────

  async listSources(essayId: string): Promise<EssaySource[]> {
    const { data, error } = await supabase
      .from('essay_sources')
      .select('*')
      .eq('essay_id', essayId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return Array.isArray(data) ? (data as EssaySource[]) : [];
  },

  async addSource(essayId: string, payload: Partial<EssaySource>): Promise<EssaySource> {
    const { data, error } = await supabase
      .from('essay_sources')
      .insert({ ...payload, essay_id: essayId })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as EssaySource;
  },

  async updateSource(id: string, payload: Partial<EssaySource>) {
    const { error } = await supabase.from('essay_sources').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteSource(id: string) {
    const { error } = await supabase.from('essay_sources').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── CITATIONS ────────────────────────────────────────────────────────────────

  async listCitations(essayId: string): Promise<EssayCitation[]> {
    const { data, error } = await supabase
      .from('essay_citations')
      .select('*')
      .eq('essay_id', essayId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw error;
    return Array.isArray(data) ? (data as EssayCitation[]) : [];
  },

  async addCitation(essayId: string, payload: Partial<EssayCitation>): Promise<EssayCitation> {
    const { data, error } = await supabase
      .from('essay_citations')
      .insert({ ...payload, essay_id: essayId })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as EssayCitation;
  },

  async updateCitation(id: string, payload: Partial<EssayCitation>) {
    const { error } = await supabase.from('essay_citations').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteCitation(id: string) {
    const { error } = await supabase.from('essay_citations').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── EVENTS ───────────────────────────────────────────────────────────────────

  async logEvent(
    essayId: string,
    eventType: EventType,
    description = '',
    metadata: Record<string, unknown> = {},
    wordsAtEvent = 0
  ) {
    const { error } = await supabase.from('essay_events').insert({
      essay_id: essayId,
      event_type: eventType,
      description,
      metadata,
      words_at_event: wordsAtEvent,
    });
    if (error) console.error('Failed to log essay event:', error);
  },

  async listEvents(essayId: string): Promise<EssayEvent[]> {
    const { data, error } = await supabase
      .from('essay_events')
      .select('*')
      .eq('essay_id', essayId)
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) throw error;
    return Array.isArray(data) ? (data as EssayEvent[]) : [];
  },

  // ─── QUALITY SCORES ───────────────────────────────────────────────────────────

  async saveQualityScore(essayId: string, payload: Partial<EssayQualityScore>) {
    // Upsert: delete old and insert new
    await supabase.from('essay_quality_scores').delete().eq('essay_id', essayId);
    const { data, error } = await supabase
      .from('essay_quality_scores')
      .insert({ ...payload, essay_id: essayId, analyzed_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as EssayQualityScore;
  },

  async getQualityScore(essayId: string): Promise<EssayQualityScore | null> {
    const { data, error } = await supabase
      .from('essay_quality_scores')
      .select('*')
      .eq('essay_id', essayId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as EssayQualityScore | null;
  },

  // ─── DETECTOR RESULTS ─────────────────────────────────────────────────────────

  async saveDetectorResult(essayId: string, payload: Partial<EssayDetectorResult>) {
    await supabase.from('essay_detector_results').delete().eq('essay_id', essayId);
    const { data, error } = await supabase
      .from('essay_detector_results')
      .insert({ ...payload, essay_id: essayId, analyzed_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as EssayDetectorResult;
  },

  async getDetectorResult(essayId: string): Promise<EssayDetectorResult | null> {
    const { data, error } = await supabase
      .from('essay_detector_results')
      .select('*')
      .eq('essay_id', essayId)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as EssayDetectorResult | null;
  },

  // ─── TEACHER ASSIGNMENTS ──────────────────────────────────────────────────────

  async listAssignments(): Promise<TeacherAssignment[]> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return Array.isArray(data) ? (data as TeacherAssignment[]) : [];
  },

  async getAssignment(id: string): Promise<TeacherAssignment | null> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as TeacherAssignment | null;
  },

  async getAssignmentByCode(code: string): Promise<TeacherAssignment | null> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select('*')
      .eq('assignment_code', code.toUpperCase())
      .maybeSingle();
    if (error) throw error;
    return data as TeacherAssignment | null;
  },

  async createAssignment(payload: Partial<TeacherAssignment>): Promise<TeacherAssignment> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .insert({ ...payload })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as TeacherAssignment;
  },

  async updateAssignment(id: string, payload: Partial<TeacherAssignment>) {
    const { error } = await supabase.from('teacher_assignments').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase
      .from('teacher_assignments')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  // ─── TEMPLATES ────────────────────────────────────────────────────────────────

  async listTemplates(): Promise<EssayTemplate[]> {
    const { data, error } = await supabase
      .from('essay_templates')
      .select('*')
      .eq('is_published', true)
      .order('name', { ascending: true })
      .limit(100);
    if (error) throw error;
    return Array.isArray(data) ? (data as EssayTemplate[]) : [];
  },

  async getTemplate(slug: string): Promise<EssayTemplate | null> {
    const { data, error } = await supabase
      .from('essay_templates')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data as EssayTemplate | null;
  },

  // ─── STUDENT SUBMISSIONS ──────────────────────────────────────────────────────

  async submitEssay(payload: Partial<StudentSubmission>): Promise<StudentSubmission> {
    const { data, error } = await supabase
      .from('student_submissions')
      .insert({ ...payload })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as StudentSubmission;
  },

  async listMySubmissions(studentId: string): Promise<StudentSubmission[]> {
    const { data, error } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return Array.isArray(data) ? (data as StudentSubmission[]) : [];
  },

  async getSubmission(id: string): Promise<StudentSubmission | null> {
    const { data, error } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as StudentSubmission | null;
  },

  async updateSubmissionStatus(id: string, status: SubmissionStatus) {
    const { error } = await supabase
      .from('student_submissions')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  // List all submissions for a given assignment (teacher view)
  async listSubmissionsForAssignment(assignmentId: string): Promise<StudentSubmission[]> {
    const { data, error } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return Array.isArray(data) ? (data as StudentSubmission[]) : [];
  },

  // ─── SUBMISSION REVIEWS ───────────────────────────────────────────────────────

  async saveReview(payload: Partial<SubmissionReview>): Promise<SubmissionReview> {
    // Upsert by submission_id + teacher_id
    const existing = await supabase
      .from('submission_reviews')
      .select('id')
      .eq('submission_id', payload.submission_id!)
      .eq('teacher_id', payload.teacher_id!)
      .maybeSingle();
    if (existing.data?.id) {
      const { data, error } = await supabase
        .from('submission_reviews')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing.data.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as SubmissionReview;
    }
    const { data, error } = await supabase
      .from('submission_reviews')
      .insert({ ...payload })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as SubmissionReview;
  },

  async getReviewForSubmission(submissionId: string): Promise<SubmissionReview | null> {
    const { data, error } = await supabase
      .from('submission_reviews')
      .select('*')
      .eq('submission_id', submissionId)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as SubmissionReview | null;
  },
};
