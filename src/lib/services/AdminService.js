import { supabase } from '../supabase';
import { getE2EContentSnapshot, getE2EDashboardSnapshot, isE2EMode } from '../e2eFixtures';

const EMPTY_SNAPSHOT = {
  stats: {
    totalUsers: 0,
    activeToday: 0,
    totalXpEarned: 0,
    completedLessons: 0,
    totalLessons: 0,
    totalCourses: 0,
    coursesStarted: 0,
    coursesCompleted: 0,
    challengesCompleted: 0,
    challengeAttempts: 0,
    challengeSuccessRate: 0,
    averageProgress: 0,
  },
  registrations: [],
  difficultChallenges: [],
  mostCompletedLessons: [],
  progressByLevel: [],
  recentActivity: [],
};

function normalizeSnapshot(snapshot) {
  return {
    ...EMPTY_SNAPSHOT,
    ...(snapshot || {}),
    stats: {
      ...EMPTY_SNAPSHOT.stats,
      ...(snapshot?.stats || {}),
    },
    registrations: Array.isArray(snapshot?.registrations) ?snapshot.registrations : [],
    difficultChallenges: Array.isArray(snapshot?.difficultChallenges) ?snapshot.difficultChallenges : [],
    mostCompletedLessons: Array.isArray(snapshot?.mostCompletedLessons) ?snapshot.mostCompletedLessons : [],
    progressByLevel: Array.isArray(snapshot?.progressByLevel) ?snapshot.progressByLevel : [],
    recentActivity: Array.isArray(snapshot?.recentActivity) ?snapshot.recentActivity : [],
  };
}

class AdminService {
  static async getDashboardSnapshot() {
    if (isE2EMode) return normalizeSnapshot(getE2EDashboardSnapshot());

    const { data, error } = await supabase.rpc('admin_dashboard_snapshot');
    if (error) throw error;
    return normalizeSnapshot(data);
  }

  static async fetchUsers(page = 1, limit = 50, search = '') {
    if (isE2EMode) {
      return {
        data: [{
          id: '00000000-0000-4000-8000-000000000001',
          email: 'e2e-admin@bql.local',
          full_name: 'Admin E2E',
          role: 'admin',
          xp: 125,
          status: 'active',
        }],
        count: 1,
      };
    }

    const { data, error } = await supabase.rpc('admin_users_overview', {
      p_search: search || '',
      p_limit: limit,
      p_offset: (page - 1) * limit,
    });

    if (error) throw error;
    return {
      data: Array.isArray(data?.rows) ?data.rows : [],
      count: Number(data?.count || 0),
    };
  }

  static async getCoursesOverview() {
    if (isE2EMode) {
      const snapshot = getE2EContentSnapshot();
      return { data: snapshot.data, count: snapshot.count };
    }

    const { data, error } = await supabase.rpc('admin_courses_overview');
    if (error) throw error;
    return {
      data: Array.isArray(data?.rows) ?data.rows : [],
      count: Number(data?.count || 0),
    };
  }

  static async getContentSnapshot() {
    if (isE2EMode) return getE2EContentSnapshot();

    const { data, error } = await supabase.rpc('admin_content_snapshot');
    if (error) throw error;
    return {
      data: Array.isArray(data?.courses) ?data.courses : [],
      count: Number(data?.count || 0),
    };
  }

  static async saveCourse(course) {
    const { data, error } = await supabase.rpc('admin_upsert_course', {
      p_course: course,
    });
    if (error) throw error;
    if (data?.success === false) throw new Error(data.message || data.errorCode || 'Impossible de sauvegarder le niveau.');
    return data?.course;
  }

  static async deleteCourse(courseId) {
    const { data, error } = await supabase.rpc('admin_delete_course', {
      p_course_id: courseId,
    });
    if (error) throw error;
    return Boolean(data?.success);
  }

  static async saveLesson(lesson) {
    const { data, error } = await supabase.rpc('admin_upsert_lesson', {
      p_lesson: lesson,
    });
    if (error) throw error;
    if (data?.success === false) throw new Error(data.message || data.errorCode || 'Impossible de sauvegarder la leçon.');
    return data?.lesson;
  }

  static async deleteLesson(lessonId) {
    const { data, error } = await supabase.rpc('admin_delete_lesson', {
      p_lesson_id: lessonId,
    });
    if (error) throw error;
    return Boolean(data?.success);
  }

  static async reorderCourse(courseId, direction) {
    const { data, error } = await supabase.rpc('admin_reorder_course', {
      p_course_id: courseId,
      p_direction: direction,
    });
    if (error) throw error;
    return Boolean(data?.success);
  }

  static async reorderLesson(lessonId, direction) {
    const { data, error } = await supabase.rpc('admin_reorder_lesson', {
      p_lesson_id: lessonId,
      p_direction: direction,
    });
    if (error) throw error;
    return Boolean(data?.success);
  }

  static async getActivityFeed(type = 'all', limit = 50) {
    const { data, error } = await supabase.rpc('admin_activity_feed', {
      p_type: type,
      p_limit: limit,
    });
    if (error) throw error;
    return {
      data: Array.isArray(data?.rows) ?data.rows : [],
      count: Number(data?.count || 0),
    };
  }

  static async getGlobalStats() {
    const snapshot = await this.getDashboardSnapshot();
    return {
      totalUsers: snapshot.stats.totalUsers,
      activeToday: snapshot.stats.activeToday,
      totalLessons: snapshot.stats.completedLessons,
      totalXpEarned: snapshot.stats.totalXpEarned,
      xpGenerated: snapshot.stats.totalXpEarned,
      completionRate: snapshot.stats.totalLessons
        ?Math.round((snapshot.stats.completedLessons / snapshot.stats.totalLessons) * 100)
        : 0,
      coursesStarted: snapshot.stats.coursesStarted,
      coursesCompleted: snapshot.stats.coursesCompleted,
      challengeAttempts: snapshot.stats.challengeAttempts,
      challengeSuccessRate: snapshot.stats.challengeSuccessRate,
    };
  }

  static async getRegistrationsData() {
    const snapshot = await this.getDashboardSnapshot();
    return snapshot.registrations;
  }

  static async getExerciseInsights() {
    const snapshot = await this.getDashboardSnapshot();
    return snapshot.difficultChallenges.map((item) => ({
      ...item,
      failRate: Number(item.fail_rate || item.failRate || 0),
      total: Number(item.total || 0),
      failed: Number(item.failed || 0),
    }));
  }

  static async deleteUser(userId) {
    const { data, error } = await supabase.rpc('admin_delete_profile', {
      p_user_id: userId,
    });
    if (error) throw error;
    return Boolean(data?.success);
  }

  static async updateUserStatus(userId, status) {
    const { data, error } = await supabase.rpc('admin_update_user_status', {
      p_user_id: userId,
      p_status: status,
    });
    if (error) throw error;
    return Boolean(data?.success);
  }
}

export default AdminService;
