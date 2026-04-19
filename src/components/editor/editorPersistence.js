import { DEFAULT_SETTINGS } from './editorDefaults.js';

export function loadInitialEditorSettings() {
  try {
    const saved = localStorage.getItem('bql_editor_settings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    return DEFAULT_SETTINGS;
  }
  return DEFAULT_SETTINGS;
}

export function loadInitialEditorFiles() {
  let shouldRestore = DEFAULT_SETTINGS.restoreLastSession;
  try {
    const savedSettings = localStorage.getItem('bql_editor_settings');
    if (savedSettings) {
      shouldRestore = JSON.parse(savedSettings).restoreLastSession;
    }

    if (shouldRestore !== false) {
      const savedFiles = localStorage.getItem('bql_files_cache');
      if (savedFiles) {
        const parsed = JSON.parse(savedFiles);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    return [{ id: 1, name: 'main.bql', content: '' }];
  }

  return [{ id: 1, name: 'main.bql', content: '' }];
}
