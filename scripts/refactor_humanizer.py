#!/usr/bin/env python3
from pathlib import Path

path = Path('/workspace/app-c18l1vf2nz7l/src/pages/humanizer/HumanizerInputPage.tsx')
text = path.read_text()

start = text.find('  const updateSetting = (key: keyof HumanizerSettings, value: any) => {')
end = text.find('  );\n\n  return (', start)
if end == -1:
    # Try alternative ending
    end = text.find('  );\n\n  //', start)
if end == -1:
    print('Could not locate end of AdvancedControlsContent')
    exit(1)

replacement = """  const updateSetting = (key: keyof HumanizerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const openAdvanced = () => {
    setAdvancedDraft(settings);
    setAdvancedOpen(true);
    trackToolUsage('advanced_controls_opened', { level: settings.level });
  };

  const closeAdvanced = () => {
    setAdvancedOpen(false);
    setAdvancedDraft(settings);
  };

  const applyAdvanced = () => {
    setSettings(advancedDraft);
    setAdvancedOpen(false);
    trackToolUsage('controls_applied', {
      level: advancedDraft.level,
      preserve_facts: advancedDraft.preserveFacts,
      sentence_variation: advancedDraft.increaseSentenceVariation,
    });
  };

  const resetAdvanced = () => {
    setAdvancedDraft(DEFAULT_SETTINGS);
    trackToolUsage('controls_reset', { level: settings.level });
  };
"""

text = text[:start] + replacement + text[end+4:]
path.write_text(text)
print('Replaced AdvancedControlsContent with advanced control helpers')
