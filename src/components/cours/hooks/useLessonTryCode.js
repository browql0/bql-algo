import { useCallback } from 'react';

export const useLessonTryCode = (lesson, onTryCode) => {
  return useCallback(() => onTryCode(lesson), [lesson, onTryCode]);
};
