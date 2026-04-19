import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit3,
  Eye,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import AdminService from '../../../lib/services/AdminService';
import { normalizeValidationConfig, validateAdminLessonPayload } from '../../../lib/adminContentValidation';

const CHALLENGE_TYPES = new Set(['exercice', 'challenge']);
const LESSON_TYPES = [
  { value: 'generic', label: 'Leçon standard' },
  { value: 'intro', label: 'Introduction' },
  { value: 'variables', label: 'Variables' },
  { value: 'syntaxe', label: 'Syntaxe' },
  { value: 'operateurs', label: 'Operateurs' },
  { value: 'io', label: 'Entree / sortie' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'exercice', label: 'Exercice valide' },
];

const emptyCourse = {
  title: '',
  description: '',
  level: 1,
  order: '',
  icon_name: 'BookOpen',
};

const emptyLesson = {
  course_id: '',
  title: '',
  content: '',
  example_code: '',
  exercise: '',
  lesson_type: 'generic',
  xp_value: 25,
  order: '',
  solution: '',
  expected_output: '',
  test_cases: '[]',
  enabled: true,
};

const metric = (value) => Number(value || 0).toLocaleString();
const isChallenge = (lesson) => CHALLENGE_TYPES.has(lesson?.lesson_type || '');
const safeJsonText = (value) => {
  if (typeof value === 'string') return value || '[]';
  return JSON.stringify(value ?? [], null, 2);
};

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('levels');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState(new Set());
  const [editor, setEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const searchTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3400);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => setDebouncedSearch(value), 280);
  }, []);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await AdminService.getContentSnapshot();
      setCourses(data);
      setExpandedCourses((current) => {
        if (current.size > 0 || data.length === 0) return current;
        return new Set([data[0].id]);
      });
    } catch (err) {
      console.error('Erreur contenu admin:', err);
      setError(err.message || 'Impossible de charger le contenu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const allLessons = useMemo(() => (
    courses
      .flatMap((course) => (course.lessons || []).map((lesson) => ({
        ...lesson,
        courseTitle: course.title,
        courseLevel: course.level,
      })))
      .sort((a, b) => Number(a.courseLevel || 0) - Number(b.courseLevel || 0) || Number(a.order || 0) - Number(b.order || 0))
  ), [courses]);

  const contentStats = useMemo(() => {
    const lessonRows = allLessons.filter((lesson) => !isChallenge(lesson));
    const challengeRows = allLessons.filter(isChallenge);
    return {
      courses: courses.length,
      lessons: lessonRows.length,
      challenges: challengeRows.length,
      secrets: challengeRows.filter((lesson) => lesson.has_secret_config).length,
    };
  }, [allLessons, courses.length]);

  const visibleCourses = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return courses.filter((course) => {
      if (!needle) return true;
      return `${course.title} ${course.description}`.toLowerCase().includes(needle);
    });
  }, [courses, debouncedSearch]);

  const filteredRows = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return allLessons.filter((lesson) => {
      const typeMatches = activeTab === 'challenges' ? isChallenge(lesson) : !isChallenge(lesson);
      const courseMatches = courseFilter === 'all' || lesson.course_id === courseFilter;
      const textMatches = !needle || `${lesson.title} ${lesson.content} ${lesson.exercise} ${lesson.courseTitle}`.toLowerCase().includes(needle);
      return typeMatches && courseMatches && textMatches;
    });
  }, [activeTab, allLessons, courseFilter, debouncedSearch]);

  const nextCourseOrder = () => Math.max(0, ...courses.map((course) => Number(course.order || 0))) + 1;
  const nextLessonOrder = (courseId) => {
    const lessons = allLessons.filter((lesson) => lesson.course_id === courseId);
    return Math.max(0, ...lessons.map((lesson) => Number(lesson.order || 0))) + 1;
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses((current) => {
      const next = new Set(current);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const openCourseEditor = (course = null) => {
    setEditor({
      kind: 'course',
      title: course ?'Modifier le niveau' : 'Créer un niveau',
      values: course ?{
        id: course.id,
        title: course.title || '',
        description: course.description || '',
        level: course.level || 1,
        order: course.order || nextCourseOrder(),
        icon_name: course.icon_name || 'BookOpen',
      } : { ...emptyCourse, order: nextCourseOrder() },
    });
  };

  const openLessonEditor = (kind = 'lesson', lesson = null, course = null, duplicate = false) => {
    const targetCourseId = lesson?.course_id || course?.id || courses[0]?.id || '';
    const baseType = kind === 'challenge' ? 'challenge' : 'generic';
    const titlePrefix = duplicate ? 'Copie - ' : '';

    setEditor({
      kind: 'lesson',
      title: lesson
        ? (duplicate ? 'Dupliquer le contenu' : 'Modifier le contenu')
        : (kind === 'challenge' ? 'Créer un challenge' : 'Créer une leçon'),
      values: lesson ? {
        id: duplicate ? undefined : lesson.id,
        course_id: targetCourseId,
        title: `${titlePrefix}${lesson.title || ''}`,
        content: lesson.content || '',
        example_code: lesson.example_code || '',
        exercise: lesson.exercise || '',
        lesson_type: lesson.lesson_type || baseType,
        xp_value: lesson.xp_value || 25,
        order: duplicate ? nextLessonOrder(targetCourseId) : (lesson.order || nextLessonOrder(targetCourseId)),
        solution: lesson.solution || '',
        expected_output: lesson.expected_output || '',
        test_cases: safeJsonText(lesson.test_cases),
        enabled: lesson.enabled !== false,
      } : {
        ...emptyLesson,
        course_id: targetCourseId,
        lesson_type: baseType,
        order: nextLessonOrder(targetCourseId),
      },
    });
  };

  const updateEditorValue = (field, value) => {
    setEditor((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value,
      },
    }));
  };

  const readValidationConfig = () => {
    try {
      return normalizeValidationConfig(JSON.parse(editor?.values?.test_cases || '[]'));
    } catch {
      return { exerciseId: '', validationMode: 'result_only', cases: [] };
    }
  };

  const writeValidationConfig = (config) => {
    updateEditorValue('test_cases', JSON.stringify(config, null, 2));
  };

  const updateValidationConfigField = (field, value) => {
    const config = readValidationConfig();
    writeValidationConfig({ ...config, [field]: value });
  };

  const updateHiddenTestCase = (index, field, value) => {
    const config = readValidationConfig();
    const cases = [...(config.cases || [])];
    cases[index] = { ...(cases[index] || {}), [field]: value };
    writeValidationConfig({ ...config, cases });
  };

  const addHiddenTestCase = () => {
    const config = readValidationConfig();
    writeValidationConfig({
      ...config,
      cases: [...(config.cases || []), { name: `Test ${(config.cases || []).length + 1}`, input: '', output: '' }],
    });
  };

  const removeHiddenTestCase = (index) => {
    const config = readValidationConfig();
    writeValidationConfig({
      ...config,
      cases: (config.cases || []).filter((_, caseIndex) => caseIndex !== index),
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editor) return;

    const values = editor.values;
    setSaving(true);
    try {
      if (editor.kind === 'course') {
        if (!values.title.trim()) throw new Error('Le titre du niveau est obligatoire.');
        await AdminService.saveCourse({
          ...values,
          level: Number(values.level || 1),
          order: Number(values.order || nextCourseOrder()),
        });
        showToast('Niveau sauvegardé.');
      } else {
        const payload = validateAdminLessonPayload({
          ...values,
          xp_value: Number(values.xp_value || 25),
          order: Number(values.order || nextLessonOrder(values.course_id)),
        });

        await AdminService.saveLesson(payload);
        showToast(isChallenge(payload) ?'Challenge sauvegardé.' : 'Leçon sauvegardée.');
      }

      setEditor(null);
      await loadContent();
    } catch (err) {
      showToast(err.message || 'Sauvegarde impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirm) return;
    setBusyAction(`delete-${confirm.item.id}`);
    try {
      if (confirm.kind === 'course') {
        await AdminService.deleteCourse(confirm.item.id);
        showToast('Niveau supprimé.');
      } else {
        await AdminService.deleteLesson(confirm.item.id);
        showToast(isChallenge(confirm.item) ?'Challenge supprimé.' : 'Leçon supprimée.');
      }
      setConfirm(null);
      await loadContent();
    } catch (err) {
      showToast(err.message || 'Suppression impossible.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleEnabled = async (lesson) => {
    setBusyAction(`toggle-${lesson.id}`);
    try {
      await AdminService.saveLesson({
        id: lesson.id,
        course_id: lesson.course_id,
        title: lesson.title,
        content: lesson.content || '',
        example_code: lesson.example_code || '',
        exercise: lesson.exercise || '',
        lesson_type: lesson.lesson_type,
        xp_value: lesson.xp_value || 25,
        order: lesson.order,
        solution: lesson.solution || '',
        expected_output: lesson.expected_output || '',
        test_cases: safeJsonText(lesson.test_cases),
        enabled: !lesson.enabled,
      });
      showToast(lesson.enabled ? 'Contenu désactivé.' : 'Contenu activé.');
      await loadContent();
    } catch (err) {
      showToast(err.message || 'Impossible de changer le statut.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReorder = async (kind, item, direction) => {
    setBusyAction(`${kind}-${item.id}-${direction}`);
    try {
      if (kind === 'course') await AdminService.reorderCourse(item.id, direction);
      else await AdminService.reorderLesson(item.id, direction);
      await loadContent();
    } catch (err) {
      showToast(err.message || 'Reorganisation impossible.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const renderContentRow = (lesson, compact = false) => (
    <article className="admin-management-row" key={lesson.id}>
      <div className="admin-row-main">
        <span className={`badge ${isChallenge(lesson) ? 'challenge' : 'lesson'}`}>
          {isChallenge(lesson) ? 'Challenge' : 'Leçon'}
        </span>
        <div>
          <h4>{lesson.title}</h4>
          <p>
            Niveau {lesson.courseLevel} · {lesson.courseTitle} · Ordre {lesson.order} · {lesson.xp_value || 25} XP
          </p>
        </div>
      </div>
      <div className="admin-row-meta">
        {lesson.enabled === false && (
          <span className="badge disabled">Désactivé</span>
        )}
        {isChallenge(lesson) && (
          <span className={lesson.has_secret_config ? 'admin-secret-ok' : 'admin-secret-missing'}>
            {lesson.has_secret_config ? 'Tests configurés' : 'Tests manquants'}
          </span>
        )}
        {!compact && lesson.example_code && <span>Exemple présent</span>}
        {!compact && lesson.exercise && <span>Exercice présent</span>}
      </div>
      <div className="admin-row-actions">
        <button type="button" className="admin-preview-btn" title="Prévisualiser" onClick={() => window.open(`/cours?preview=${lesson.id}`, '_blank')}>
          <Eye size={14} /> Aperçu
        </button>
        <button
          type="button"
          className={`action-btn ${lesson.enabled === false ? 'active-status' : ''}`}
          title={lesson.enabled === false ? 'Activer' : 'Désactiver'}
          disabled={Boolean(busyAction)}
          onClick={() => handleToggleEnabled(lesson)}
          style={lesson.enabled === false ? { color: '#86efac' } : {}}
        >
          <Power size={16} />
        </button>
        <button type="button" className="action-btn" title="Monter" disabled={Boolean(busyAction)} onClick={() => handleReorder('lesson', lesson, 'up')}>
          <ChevronUp size={16} />
        </button>
        <button type="button" className="action-btn" title="Descendre" disabled={Boolean(busyAction)} onClick={() => handleReorder('lesson', lesson, 'down')}>
          <ChevronDown size={16} />
        </button>
        <button type="button" className="action-btn" title="Dupliquer" onClick={() => openLessonEditor(isChallenge(lesson) ? 'challenge' : 'lesson', lesson, null, true)}>
          <Copy size={16} />
        </button>
        <button type="button" className="action-btn" title="Modifier" onClick={() => openLessonEditor(isChallenge(lesson) ? 'challenge' : 'lesson', lesson)}>
          <Edit3 size={16} />
        </button>
        <button type="button" className="action-btn delete" title="Supprimer" onClick={() => setConfirm({ kind: 'lesson', item: lesson })}>
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton-grid">
          {Array.from({ length: 6 }).map((_, index) => <div className="admin-skeleton-card" key={index} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-alert-card">
          <h2>Contenu indisponible</h2>
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={loadContent}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page animate-fade-in">
      {toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}

      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Content management</span>
          <h2>Cours, leçons et challenges</h2>
          <p>Gestion reelle du catalogue, des exercices et des tests cachés depuis Supabase.</p>
        </div>
        <div className="admin-heading-actions">
          <button type="button" className="btn-secondary admin-touch-btn" onClick={() => openCourseEditor()}>
            <Plus size={16} /> Add level
          </button>
          <button type="button" className="btn-secondary admin-touch-btn" onClick={() => openLessonEditor('lesson')}>
            <FileText size={16} /> Add lesson
          </button>
          <button type="button" className="btn-secondary admin-touch-btn" onClick={() => openLessonEditor('challenge')}>
            <ListChecks size={16} /> Add challenge
          </button>
        </div>
      </div>

      <div className="admin-content-stats">
        <div><BookOpen size={18} /><strong>{metric(contentStats.courses)}</strong><span>niveaux</span></div>
        <div><Layers size={18} /><strong>{metric(contentStats.lessons)}</strong><span>leçons</span></div>
        <div><ListChecks size={18} /><strong>{metric(contentStats.challenges)}</strong><span>challenges</span></div>
        <div><ShieldCheck size={18} /><strong>{metric(contentStats.secrets)}</strong><span>validations</span></div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={17} />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Rechercher dans le contenu..."
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>
        <select className="admin-select" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
          <option value="all">Tous les niveaux</option>
          {courses.map((course) => (
            <option value={course.id} key={course.id}>Niveau {course.level} - {course.title}</option>
          ))}
        </select>
        <div className="admin-tabs">
          <button type="button" className={activeTab === 'levels' ?'active' : ''} onClick={() => setActiveTab('levels')}>Niveaux</button>
          <button type="button" className={activeTab === 'lessons' ?'active' : ''} onClick={() => setActiveTab('lessons')}>Leçons</button>
          <button type="button" className={activeTab === 'challenges' ?'active' : ''} onClick={() => setActiveTab('challenges')}>Challenges</button>
        </div>
      </div>

      {activeTab === 'levels' ?(
        <>
          <div className="admin-course-grid">
            {visibleCourses.map((course) => {
              const courseLessons = course.lessons || [];
              const expanded = expandedCourses.has(course.id);
              return (
                <article className="admin-course-card management" key={course.id}>
                  <div className="admin-course-card-header">
                    <div>
                      <span className="badge level">Niveau {course.level}</span>
                      <h3>{course.title}</h3>
                    </div>
                    <BookOpen size={20} />
                  </div>
                  <p>{course.description || 'Aucune description pour le moment.'}</p>
                  <div className="admin-course-stats">
                    <span><Layers size={14} /> {metric(course.lesson_count)} leçons</span>
                    <span><ListChecks size={14} /> {metric(course.challenge_count)} challenges</span>
                    <span>Ordre {course.order}</span>
                  </div>
                  <div className="admin-course-actions">
                    <button type="button" className="btn-secondary" onClick={() => openLessonEditor('lesson', null, course)}>Add lesson</button>
                    <button type="button" className="btn-secondary" onClick={() => openLessonEditor('challenge', null, course)}>Add challenge</button>
                    <button type="button" className="action-btn" title="Dupliquer le niveau" onClick={() => openCourseEditor({ ...course, id: undefined, title: `Copie - ${course.title}`, order: nextCourseOrder() })}><Copy size={16} /></button>
                    <button type="button" className="action-btn" title="Monter" disabled={Boolean(busyAction)} onClick={() => handleReorder('course', course, 'up')}><ChevronUp size={16} /></button>
                    <button type="button" className="action-btn" title="Descendre" disabled={Boolean(busyAction)} onClick={() => handleReorder('course', course, 'down')}><ChevronDown size={16} /></button>
                    <button type="button" className="action-btn" title="Modifier" onClick={() => openCourseEditor(course)}><Edit3 size={16} /></button>
                    <button type="button" className="action-btn delete" title="Supprimer" onClick={() => setConfirm({ kind: 'course', item: course })}><Trash2 size={16} /></button>
                  </div>
                  <button type="button" className="admin-expand-btn" onClick={() => toggleCourse(course.id)}>
                    {expanded ?'Masquer le contenu' : 'Voir le contenu'} {expanded ?<ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expanded && (
                    <div className="admin-management-list compact">
                      {courseLessons.length > 0
                        ?courseLessons.map((lesson) => renderContentRow({ ...lesson, courseTitle: course.title, courseLevel: course.level }, true))
                        : <div className="admin-empty-state compact">Aucune leçon dans ce niveau.</div>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {visibleCourses.length === 0 && <div className="admin-empty-state">Aucun niveau ne correspond au filtre.</div>}
        </>
      ) : (
        <div className="admin-panel admin-content-panel">
          <div className="admin-panel-header">
            <div>
              <h3>{activeTab === 'challenges' ?'Gestion des challenges' : 'Gestion des leçons'}</h3>
              <p>{filteredRows.length} élément(s) affiché(s). Les actions modifient directement la base.</p>
            </div>
          </div>
          <div className="admin-management-list">
            {filteredRows.length > 0
              ?filteredRows.map((lesson) => renderContentRow(lesson))
              : <div className="admin-empty-state">Aucun contenu ne correspond au filtre.</div>}
          </div>
        </div>
      )}

      {editor && (
        <div className="admin-editor-backdrop" role="dialog" aria-modal="true">
          <aside className="admin-editor-drawer">
            <form onSubmit={handleSave}>
              <div className="admin-editor-header">
                <div>
                  <span className="admin-kicker">Édition admin</span>
                  <h3>{editor.title}</h3>
                </div>
                <button type="button" className="admin-editor-close" aria-label="Fermer" onClick={() => setEditor(null)}>
                  <X size={18} />
                </button>
              </div>

              {editor.kind === 'course' ?(
                <div className="admin-form-grid">
                  <label className="admin-form-group full">
                    Titre
                    <input className="admin-form-input" value={editor.values.title} onChange={(event) => updateEditorValue('title', event.target.value)} />
                  </label>
                  <label className="admin-form-group full">
                    Description
                    <textarea className="admin-form-textarea small" value={editor.values.description} onChange={(event) => updateEditorValue('description', event.target.value)} />
                  </label>
                  <label className="admin-form-group">
                    Niveau
                    <input className="admin-form-input" type="number" min="1" value={editor.values.level} onChange={(event) => updateEditorValue('level', event.target.value)} />
                  </label>
                  <label className="admin-form-group">
                    Ordre
                    <input className="admin-form-input" type="number" min="1" value={editor.values.order} onChange={(event) => updateEditorValue('order', event.target.value)} />
                  </label>
                  <label className="admin-form-group full">
                    Icone
                    <input className="admin-form-input" value={editor.values.icon_name} onChange={(event) => updateEditorValue('icon_name', event.target.value)} />
                  </label>
                </div>
              ) : (
                <div className="admin-form-grid">
                  <label className="admin-form-group full">
                    Niveau / cours
                    <select className="admin-form-input" value={editor.values.course_id} onChange={(event) => updateEditorValue('course_id', event.target.value)}>
                      <option value="">Choisir un niveau</option>
                      {courses.map((course) => (
                        <option value={course.id} key={course.id}>Niveau {course.level} - {course.title}</option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-form-group full">
                    Titre
                    <input className="admin-form-input" value={editor.values.title} onChange={(event) => updateEditorValue('title', event.target.value)} />
                  </label>
                  <label className="admin-form-group">
                    Type
                    <select className="admin-form-input" value={editor.values.lesson_type} onChange={(event) => updateEditorValue('lesson_type', event.target.value)}>
                      {LESSON_TYPES.map((type) => <option value={type.value} key={type.value}>{type.label}</option>)}
                    </select>
                  </label>
                  <label className="admin-form-group">
                    XP
                    <input className="admin-form-input" type="number" min="0" value={editor.values.xp_value} onChange={(event) => updateEditorValue('xp_value', event.target.value)} />
                  </label>
                  <label className="admin-form-group">
                    Ordre
                    <input className="admin-form-input" type="number" min="1" value={editor.values.order} onChange={(event) => updateEditorValue('order', event.target.value)} />
                  </label>
                  <label className="admin-form-group full">
                    Contenu de la leçon
                    <textarea className="admin-form-textarea" value={editor.values.content} onChange={(event) => updateEditorValue('content', event.target.value)} />
                  </label>
                  <label className="admin-form-group full">
                    Exemple / starter code
                    <textarea className="admin-form-textarea code" value={editor.values.example_code} onChange={(event) => updateEditorValue('example_code', event.target.value)} />
                  </label>
                  <label className="admin-form-group full">
                    Énoncé / exercice
                    <textarea className="admin-form-textarea small" value={editor.values.exercise} onChange={(event) => updateEditorValue('exercise', event.target.value)} />
                  </label>

                  <div className="admin-toggle-row">
                    <div>
                      <label>Contenu activé</label>
                      <small>Désactivez pour masquer ce contenu aux apprenants sans le supprimer.</small>
                    </div>
                    <label className="admin-switch">
                      <input
                        type="checkbox"
                        checked={editor.values.enabled !== false}
                        onChange={(e) => updateEditorValue('enabled', e.target.checked)}
                      />
                      <span className="admin-switch-track" />
                    </label>
                  </div>

                  {CHALLENGE_TYPES.has(editor.values.lesson_type) && (
                    <div className="admin-secret-box">
                      <div>
                        <ShieldCheck size={16} />
                        <strong>Validation privée</strong>
                        <span>Visible uniquement par les admins via RPC.</span>
                      </div>
                      {(() => {
                        const config = readValidationConfig();
                        return (
                          <div className="admin-structured-tests">
                            <div className="admin-structured-row">
                              <label className="admin-form-group">
                                Exercise ID
                                <input className="admin-form-input" value={config.exerciseId || ''} onChange={(event) => updateValidationConfigField('exerciseId', event.target.value)} />
                              </label>
                              <label className="admin-form-group">
                                Mode
                                <select className="admin-form-input" value={config.validationMode || 'result_only'} onChange={(event) => updateValidationConfigField('validationMode', event.target.value)}>
                                  <option value="result_only">result_only</option>
                                  <option value="result_plus_constraints">result_plus_constraints</option>
                                  <option value="concept_training">concept_training</option>
                                  <option value="project_rubric">project_rubric</option>
                                </select>
                              </label>
                            </div>
                            <div className="admin-test-case-header">
                              <strong>Tests cachés structurés</strong>
                              <button type="button" className="btn-secondary" onClick={addHiddenTestCase}>Ajouter un test</button>
                            </div>
                            {(config.cases || []).length === 0 && (
                              <div className="admin-empty-state compact">Aucun test caché structuré.</div>
                            )}
                            {(config.cases || []).map((testCase, index) => (
                              <div className="admin-test-case-card" key={`${testCase.name}-${index}`}>
                                <div className="admin-test-case-title">
                                  <strong>Test {index + 1}</strong>
                                  <button type="button" className="action-btn delete" onClick={() => removeHiddenTestCase(index)}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <label className="admin-form-group full">
                                  Nom
                                  <input className="admin-form-input" value={testCase.name || ''} onChange={(event) => updateHiddenTestCase(index, 'name', event.target.value)} />
                                </label>
                                <label className="admin-form-group full">
                                  Entrée
                                  <textarea className="admin-form-textarea small" value={testCase.input || ''} onChange={(event) => updateHiddenTestCase(index, 'input', event.target.value)} />
                                </label>
                                <label className="admin-form-group full">
                                  Sortie attendue
                                  <textarea className="admin-form-textarea small" value={testCase.output || ''} onChange={(event) => updateHiddenTestCase(index, 'output', event.target.value)} />
                                </label>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <label className="admin-form-group full">
                        Solution de référence
                        <textarea className="admin-form-textarea code" value={editor.values.solution} onChange={(event) => updateEditorValue('solution', event.target.value)} />
                      </label>
                      <label className="admin-form-group full">
                        Sortie attendue
                        <textarea className="admin-form-textarea small" value={editor.values.expected_output} onChange={(event) => updateEditorValue('expected_output', event.target.value)} />
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="admin-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditor(null)} disabled={saving}>Annuler</button>
                <button type="submit" className="btn-primary-gradient" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={16} />}
                  Sauvegarder
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {confirm && (
        <div className="admin-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="admin-confirm-card">
            <h3>{confirm.kind === 'course' ?'Supprimer ce niveau ?' : 'Supprimer ce contenu ?'}</h3>
            <p>
              {confirm.kind === 'course'
                ?`Cette action supprime "${confirm.item.title}" et toutes ses leçons/challenges associés.`
                : `Cette action supprime "${confirm.item.title}" et sa configuration de validation privée.`}
            </p>
            <div className="admin-confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirm(null)}>Annuler</button>
              <button type="button" className="btn-danger" disabled={Boolean(busyAction)} onClick={handleDeleteConfirmed}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
