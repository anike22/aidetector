/**
 * Application feature flags and configuration toggles.
 * Allows graceful toggling of experimental or phase-based features without code removal.
 */

export const FEATURE_FLAGS = {
  /**
   * Student Mode and Academic Policy Guidance Feature
   * When enabled (default true), provides non-intrusive syllabus/policy interpretation
   * and student declaration tools alongside detector results.
   */
  ENABLE_STUDENT_MODE:
    import.meta.env.VITE_ENABLE_STUDENT_MODE !== 'false' &&
    import.meta.env.VITE_DISABLE_STUDENT_MODE !== 'true',
};

export function isStudentModeEnabled(): boolean {
  return FEATURE_FLAGS.ENABLE_STUDENT_MODE;
}
