export const isE2EMode = import.meta.env.VITE_E2E === 'true';

export const e2eUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e-admin@bql.local',
  isAdmin: true,
  profile: {
    role: 'admin',
    full_name: 'Admin E2E',
    xp: 125,
    level: 1,
  },
};

export const e2eCourses = [
  {
    id: 'course-foundations-e2e',
    title: 'Niveau 1 - Foundations',
    description: 'Bases, variables, calculs et validation.',
    level: 1,
    order: 1,
    icon_name: 'BookOpen',
    progress: 50,
    lesson_count: 2,
  },
  {
    id: 'course-conditions-e2e',
    title: 'Niveau 2 - Conditions',
    description: 'SI, SINONSI, SINON et SELON.',
    level: 2,
    order: 2,
    icon_name: 'Shuffle',
    progress: 0,
    lesson_count: 1,
  },
];

export const e2eLessons = [
  {
    id: 'lesson-foundations-intro-e2e',
    course_id: 'course-foundations-e2e',
    title: 'Introduction E2E',
    content: 'Une leçon de test qui vérifie que le parcours cours fonctionne.',
    example_code: 'ALGORITHME_Bonjour;\nDEBUT\n  ECRIRE("Bonjour E2E");\nFIN',
    exercise: '',
    lesson_type: 'intro',
    xp_value: 25,
    order: 1,
    created_at: '2026-04-19T00:00:00Z',
  },
  {
    id: 'lesson-foundations-challenge-e2e',
    course_id: 'course-foundations-e2e',
    title: 'Défi E2E : Affichage simple',
    content: 'Écris un programme qui affiche exactement le texte demandé.',
    example_code: 'ALGORITHME_DefiE2E;\nDEBUT\n  ECRIRE("BQL est genial");\nFIN',
    exercise: 'Affiche exactement : BQL est genial',
    lesson_type: 'challenge',
    xp_value: 50,
    order: 2,
    created_at: '2026-04-19T00:00:00Z',
    has_secret_config: true,
    test_cases: {
      exerciseId: 'e2e_affichage_simple',
      validationMode: 'result_only',
      cases: [{ input: '', output: 'BQL est genial' }],
    },
  },
  {
    id: 'lesson-conditions-e2e',
    course_id: 'course-conditions-e2e',
    title: 'Condition simple E2E',
    content: 'Une leçon de test sur SI.',
    example_code: 'ALGORITHME_SiE2E;\nVARIABLE\n  age : ENTIER;\nDEBUT\n  age <- 18;\n  SI age >= 18 ALORS\n    ECRIRE("Majeur");\n  FINSI\nFIN',
    exercise: '',
    lesson_type: 'conditions',
    xp_value: 25,
    order: 1,
    created_at: '2026-04-19T00:00:00Z',
  },
];

export function getE2ELessonsForCourse(courseId) {
  return e2eLessons
    .filter((lesson) => lesson.course_id === courseId)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function getE2EContentSnapshot() {
  return {
    data: e2eCourses.map((course) => ({
      ...course,
      lessons: getE2ELessonsForCourse(course.id),
    })),
    count: e2eCourses.length,
  };
}

export function getE2EDashboardSnapshot() {
  return {
    stats: {
      totalUsers: 1,
      activeToday: 1,
      totalXpEarned: 125,
      completedLessons: 1,
      totalLessons: e2eLessons.length,
      totalCourses: e2eCourses.length,
      coursesStarted: 1,
      coursesCompleted: 0,
      challengesCompleted: 1,
      challengeAttempts: 1,
      challengeSuccessRate: 100,
      averageProgress: 50,
    },
    registrations: [],
    difficultChallenges: [],
    mostCompletedLessons: [],
    progressByLevel: [],
    recentActivity: [],
  };
}
