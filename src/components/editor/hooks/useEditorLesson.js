import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useEditorLesson = (setFiles, setActiveFileId) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCourseLesson, setActiveCourseLesson] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bql_active_lesson');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (location.state && location.state.codeToRun) {
      const code = location.state.codeToRun;

      const lessonData = {
        lessonId: location.state.lessonId,
        lessonTitle: location.state.lessonTitle,
        isChallenge: location.state.isChallenge,
        lessonExercise: location.state.lessonExercise,
        lessonContent: location.state.lessonContent,
      };

      window.setTimeout(() => setActiveCourseLesson(lessonData), 0);
      sessionStorage.setItem('bql_active_lesson', JSON.stringify(lessonData));

      navigate(location.pathname, { replace: true, state: {} });

      const EXERCICE_ID = 9999;
      setFiles((currFiles) => {
        const hasExercice = currFiles.some((f) => f.id === EXERCICE_ID);
        if (hasExercice) {
          return currFiles.map((f) =>
            f.id === EXERCICE_ID ? { ...f, content: code } : f,
          );
        }
        return [
          ...currFiles,
          { id: EXERCICE_ID, name: 'exercice.bql', content: code },
        ];
      });
      setActiveFileId(EXERCICE_ID);
    }
  }, [location.state, location.pathname, navigate, setFiles, setActiveFileId]);

  return { activeCourseLesson, setActiveCourseLesson };
};
