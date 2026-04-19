export const saveEditorFiles = (files) => {
  localStorage.setItem('bql_files_cache', JSON.stringify(files));
};

export const saveEditorSettings = (settings) => {
  localStorage.setItem('bql_editor_settings', JSON.stringify(settings));
};

export const loadEditorHistory = () => {
  try {
    const saved = localStorage.getItem('bql_terminal_history');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const saveEditorHistory = (lines) => {
  localStorage.setItem('bql_terminal_history', JSON.stringify(lines));
};

export const clearEditorHistory = () => {
  localStorage.removeItem('bql_terminal_history');
};
