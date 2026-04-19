import { useState, useMemo, useEffect, useCallback } from 'react';
import { loadInitialEditorFiles } from '../editorPersistence';
import { saveEditorFiles } from '../services/editorStorage';

export const useEditorFiles = (settings) => {
  const [files, setFiles] = useState(loadInitialEditorFiles);

  const [activeFileId, setActiveFileId] = useState(() => files[0]?.id || 1);
  const [fileCounter, setFileCounter] = useState(() => {
    if (files.length === 0) return 2;
    const ids = files.map((f) => f.id);
    return Math.max(...ids) + 1;
  });

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) || files[0],
    [files, activeFileId],
  );

  useEffect(() => {
    if (settings.autoSave !== false) {
      saveEditorFiles(files);
    }
  }, [files, settings.autoSave]);

  const handleCodeChange = useCallback(
    (newCode) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, content: newCode } : f)),
      );
    },
    [activeFileId],
  );

  const createNewFile = useCallback(() => {
    const newFile = {
      id: fileCounter,
      name: `fichier${fileCounter}.bql`,
      content: '',
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setFileCounter(fileCounter + 1);
  }, [fileCounter]);

  const closeFile = useCallback(
    (e, idToClose) => {
      e.stopPropagation();
      if (files.length === 1) return;

      if (settings.confirmBeforeReset !== false) {
        const fileToClose = files.find((f) => f.id === idToClose);
        if (fileToClose && fileToClose.content.trim() !== '') {
          if (
            !window.confirm(
              `Êtes-vous sûr de vouloir fermer "${fileToClose.name}" ? Vous risquez de perdre son contenu.`,
            )
          ) {
            return;
          }
        }
      }

      const newFiles = files.filter((f) => f.id !== idToClose);
      setFiles(newFiles);
      if (activeFileId === idToClose) {
        setActiveFileId(newFiles[newFiles.length - 1].id);
      }
    },
    [files, settings.confirmBeforeReset, activeFileId],
  );

  return {
    files,
    setFiles,
    activeFile,
    activeFileId,
    setActiveFileId,
    handleCodeChange,
    createNewFile,
    closeFile,
  };
};
