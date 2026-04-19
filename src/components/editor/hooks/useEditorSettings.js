import { useState, useCallback } from 'react';
import { loadInitialEditorSettings } from '../editorPersistence';
import { saveEditorSettings } from '../services/editorStorage';

export const useEditorSettings = () => {
  const [settings, setSettings] = useState(loadInitialEditorSettings);

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    saveEditorSettings(newSettings);
  }, []);

  return { settings, setSettings, handleSaveSettings };
};
