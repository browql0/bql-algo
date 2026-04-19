import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { e2eCourses, getE2ELessonsForCourse, isE2EMode } from '../lib/e2eFixtures';

export const useCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (isE2EMode) {
        setCourses(e2eCourses);
        return;
      }

      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, description, level, order, icon_name')
        .order('order', { ascending: true });

      if (coursesError) throw coursesError;

      const { data: lessons, error: lessError } = await supabase
        .from('lessons')
        .select('id, course_id');

      if (lessError) throw lessError;

      const totalLessonsMap = {};
      lessons.forEach(l => {
        totalLessonsMap[l.course_id] = (totalLessonsMap[l.course_id] || 0) + 1;
      });

      let progressByCourse = {};

      if (user) {
        const { data: userProg, error: progError } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id);
          
        if (progError) throw progError;

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
          progressByCourse[c.id] = total === 0 ?0 : Math.round((completed / total) * 100);
        });
      }

      setCourses(coursesData.map(c => ({
        ...c,
        lesson_count: totalLessonsMap[c.id] || 0,
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
  const [courseXp, setCourseXp] = useState(0);

  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      if (isE2EMode) {
        setLessons(getE2ELessonsForCourse(courseId));
        setUserProgress(new Set(['lesson-foundations-intro-e2e']));
        setCourseXp(25);
        return;
      }

      const { data, error } = await supabase
        .from('lessons')
        .select('id, course_id, title, content, example_code, exercise, lesson_type, xp_value, order, created_at')
        .eq('course_id', courseId)
        .order('order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLessons(data);

      const lessonById = new Map(data.map(lesson => [lesson.id, lesson]));

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

          const totalXp = Array.from(completed).reduce((acc, lessonId) => {
            const xpValue = Number(lessonById.get(lessonId)?.xp_value || 0);
            return acc + xpValue;
          }, 0);
          setCourseXp(totalXp);
        } else {
          setUserProgress(new Set());
          setCourseXp(0);
        }
      } else {
        setUserProgress(new Set());
        setCourseXp(0);
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
    if (!user) return { success: false, xpAwarded: 0, errorCode: 'AUTH_REQUIRED' };
    if (isE2EMode) {
      setUserProgress(prev => new Set(prev).add(lessonId));
      return { success: true, xpAwarded: 25 };
    }

    try {
      const { data, error } = await supabase.rpc('complete_lesson', {
        p_lesson_id: lessonId,
      });
      
      if (error) throw error;
      if (!data?.success) {
        return data || { success: false, xpAwarded: 0 };
      }

      const xpAwarded = Number(data.xpAwarded || 0);
      setUserProgress(prev => new Set(prev).add(lessonId));
      if (xpAwarded > 0) {
        setCourseXp(prev => prev + xpAwarded);
      }
      return data;
    } catch (err) {
      console.error("Erreur sauvegardé progression:", err);
      return { success: false, xpAwarded: 0, errorCode: err.code || 'PROGRESS_SAVE_FAILED', message: err.message };
    }
  };

  return { lessons, loading, userProgress, courseXp, markLessonComplete, refresh: fetchLessons };
};

