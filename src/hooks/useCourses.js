import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('order', { ascending: true });

      if (coursesError) throw coursesError;

      let progressByCourse = {};

      if (user) {
        const { data: userProg, error: progError } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id);
          
        if (progError) throw progError;

        const { data: lessons, error: lessError } = await supabase
          .from('lessons')
          .select('id, course_id');
          
        if (lessError) throw lessError;

        const totalLessonsMap = {};
        lessons.forEach(l => {
          totalLessonsMap[l.course_id] = (totalLessonsMap[l.course_id] || 0) + 1;
        });

        const completedMap = {};
        const completedSet = new Set(userProg.filter(p => p.completed).map(p => p.lesson_id));

        lessons.forEach(l => {
          if (completedSet.has(l.id)) {
            completedMap[l.course_id] = (completedMap[l.course_id] || 0) + 1;
          }
        });

        coursesData.forEach(c => {
          const total = totalLessonsMap[c.id] || 0;
          const completed = completedMap[c.id] || 0;
          progressByCourse[c.id] = total === 0 ? 0 : Math.round((completed / total) * 100);
        });
      }

      setCourses(coursesData.map(c => ({
        ...c,
        progress: progressByCourse[c.id] || 0
      })));

    } catch (err) {
      console.error("Erreur récupération cours:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refresh: fetchCourses };
};

export const useCourseDetails = (courseId) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState(new Set()); 

  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, course_id, title, content, example_code, exercise, lesson_type, xp_value, order, created_at')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      if (error) throw error;
      setLessons(data);

      if (user) {
        const lessonIds = data.map(l => l.id);
        const { data: prog, error: pError } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        
        if (!pError && prog) {
          const completed = new Set(prog.filter(p => p.completed).map(p => p.lesson_id));
          setUserProgress(completed);
        }
      }
    } catch (err) {
      console.error("Erreur recup leçons:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const markLessonComplete = async (lessonId) => {
    if (!user) return false;
    try {
      // Upsert
      const { error } = await supabase
        .from('user_progress')
        .upsert({ user_id: user.id, lesson_id: lessonId, completed: true }, { onConflict: 'user_id,lesson_id' });
      
      if (error) throw error;
      setUserProgress(prev => new Set(prev).add(lessonId));
      return true;
    } catch (err) {
      console.error("Erreur sauvegarde progression:", err);
      return false;
    }
  };

  return { lessons, loading, userProgress, markLessonComplete, refresh: fetchLessons };
};
