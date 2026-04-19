import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CheckCircle, Loader2, Award,
  Play, Zap, Target
} from 'lucide-react';
import { useCourseDetails } from '../../hooks/useCourses';
import { XPBadge, QuickRefPanel } from './components/blocks/LessonComponents';
import { SkeletonSidebar, SkeletonLesson } from './SkeletonComponents';
import { LESSON_RENDERERS, GenericRenderer } from './LessonRenderers';
import './CoursePage.css';

//  Rich Lesson Renderer 

const RichLessonContent = ({ lesson, onTryCode }) => {
  const lt = lesson.lesson_type || 'generic';
  const Renderer = LESSON_RENDERERS[lt] || GenericRenderer;
  return <Renderer lesson={lesson} onTryCode={onTryCode} />;
};

const ProgressCard = ({ completedCount, totalLessons, totalXP, progressPct }) => (
  <div className="course-progress-card">
    <div className="course-progress-stats">
      <span>{completedCount}/{totalLessons} leçons</span>
      <span className="course-progress-xp">+{totalXP} XP</span>
    </div>
    <div className="course-progress-bar">
      <div className="course-progress-fill" style={{ width: `${progressPct}%` }} />
    </div>
    <div className={`course-progress-label ${progressPct === 100 ?'is-complete' : ''}`}>
      {progressPct === 100 ?'Cours terminé !' : `${progressPct}% complété`}
    </div>
  </div>
);

const LessonList = ({ lessons, activeIndex, userProgress, onSelect }) => (
  <div className="sidebar-nav" role="list" aria-label="Leçons du cours">
    {lessons.map((lesson, idx) => {
      const done = userProgress.has(lesson.id);
      const active = activeIndex === idx;
      const isExercise = lesson.lesson_type === 'exercice' || lesson.lesson_type === 'challenge';
      const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          onSelect(Math.min(idx + 1, lessons.length - 1));
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          onSelect(Math.max(idx - 1, 0));
        }
        if (event.key === 'Home') {
          event.preventDefault();
          onSelect(0);
        }
        if (event.key === 'End') {
          event.preventDefault();
          onSelect(lessons.length - 1);
        }
      };
      return (
        <button
          key={lesson.id}
          className={`chapter-btn ${active ?'active' : ''}`}
          onClick={() => onSelect(idx)}
          onKeyDown={handleKeyDown}
          aria-current={active ?'true' : undefined}
          aria-label={`Ouvrir la leçon ${lesson.title}`}
        >
          <span className="chapter-icon" aria-hidden="true">
            {done
              ?<CheckCircle size={15} className="chapter-icon-check" />
              : isExercise
                ?<Target size={14} className="chapter-icon-exercise" />
                : <span className={`chapter-dot ${active ?'active' : ''}`} />
            }
          </span>
          <span className="chapter-title">{lesson.title}</span>
          {active && <ChevronRight size={12} className="chapter-icon-active" aria-hidden="true" />}
        </button>
      );
    })}
  </div>
);

const MobileTopBar = ({ activeIndex, totalLessons, progressPct, onOpenSidebar }) => (
  <div className="course-mobile-topbar">
    <button
      onClick={onOpenSidebar}
      className="course-mobile-toggle"
      aria-label="Ouvrir le sommaire"
    >
      <ChevronRight size={14} aria-hidden="true" /> Sommaire
    </button>
    <div className="course-mobile-count">
      {activeIndex + 1} / {totalLessons} leçons
    </div>
    <div className="course-mobile-meter" aria-hidden="true">
      <div className="course-mobile-meter-fill" style={{ width: `${progressPct}%` }} />
    </div>
  </div>
);

const XPFlash = ({ xp }) => (
  <div className="course-xp-flash" role="status" aria-live="polite">
    <Zap size={16} fill="currentColor" aria-hidden="true" /> +{xp} XP !
  </div>
);

//  Main CourseViewer 

const CourseViewer = ({ course, onBack }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [completingId, setCompletingId] = useState(null);
  const [xpFlash, setXpFlash] = useState(null);
  const [lessonKey, setLessonKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { lessons, loading, userProgress, courseXp, markLessonComplete } = useCourseDetails(course?.id);

  const displayLessons = useMemo(() => {
    const isChallenge = (lesson) => lesson.lesson_type === 'challenge';
    const normalLessons = lessons.filter(lesson => !isChallenge(lesson));
    const challengeLessons = lessons.filter(isChallenge);
    return [...normalLessons, ...challengeLessons];
  }, [lessons]);

  const currentIndex = displayLessons.length === 0
    ? 0
    : Math.min(activeChapterIndex, displayLessons.length - 1);

  const scrollTop = () => {
    if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryCode = (lesson) => {
    navigate('/editor', {
      state: {
        codeToRun: lesson.example_code,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        isChallenge: lesson.lesson_type === 'challenge',
        lessonExercise: lesson.exercise,
        lessonContent: lesson.content
      }
    });
  };

  const goToLesson = (idx) => {
    setActiveChapterIndex(idx);
    setLessonKey(k => k + 1);
    setSidebarOpen(false); // close mobile drawer on lesson select
    scrollTop();
  };

  const autoCompleteAndNext = async () => {
    const lesson = displayLessons[currentIndex];
    if (!lesson) return;
    const isCompleted = userProgress.has(lesson.id);
    const isExercise = lesson.lesson_type === 'exercice' || lesson.lesson_type === 'challenge';

    if (!isCompleted && !isExercise) {
      setCompletingId(lesson.id);
      const result = await markLessonComplete(lesson.id);
      if (result?.success && Number(result.xpAwarded || 0) > 0) {
        setXpFlash(Number(result.xpAwarded || 0));
        setTimeout(() => setXpFlash(null), 2500);
      }
      setCompletingId(null);
    }

    if (currentIndex < displayLessons.length - 1) {
      goToLesson(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) goToLesson(currentIndex - 1);
  };

  //  Loading state   skeleton
  if (loading) {
    return (
      <div className="course-viewer-container">
        <SkeletonSidebar isMobile={isMobile} />
        <div className="course-content-area course-content-area--loading">
          <div className="course-content-inner">
            <SkeletonLesson />
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = displayLessons[currentIndex];
  if (!currentLesson) return null;

  const isCompleted = userProgress.has(currentLesson.id);
  const isExercise = currentLesson.lesson_type === 'exercice' || currentLesson.lesson_type === 'challenge';
  const totalXP = courseXp;
  const progressPct = displayLessons.length > 0 ?Math.round((userProgress.size / displayLessons.length) * 100) : 0;
  const sidebarClass = `course-sidebar ${isMobile ?'course-sidebar-mobile' : ''} ${sidebarOpen ?'is-open' : ''}`;

  return (
    <div className="course-viewer-container">
      {/*  Mobile Sidebar Overlay  */}
      {isMobile && sidebarOpen && (
        <div
          className="course-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/*  Sidebar  */}
      <div className={sidebarClass}>
        <div className="sidebar-header">
          <button className="sidebar-back-btn" onClick={onBack} aria-label="Retour à la liste des cours">
            <ChevronLeft size={14} /> Tous les cours
          </button>
          <h2 className="sidebar-title">{course.title}</h2>

          <ProgressCard
            completedCount={userProgress.size}
            totalLessons={displayLessons.length}
            totalXP={totalXP}
            progressPct={progressPct}
          />
        </div>

        <LessonList
          lessons={displayLessons}
          activeIndex={currentIndex}
          userProgress={userProgress}
          onSelect={goToLesson}
        />
      </div>

      {/*  Content area  */}
      <div className="course-content-area" ref={contentRef}>
        <div className="course-content-inner">

          {/* Mobile top bar with lesson progress + sidebar toggle */}
          {isMobile && (
            <MobileTopBar
              activeIndex={currentIndex}
              totalLessons={displayLessons.length}
              progressPct={progressPct}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          )}

          {/* Top bar */}
          <div className="course-top-bar">
            <div className="course-top-left">
              <div className="hero-badge course-lesson-badge">
                Leçon {currentIndex + 1} / {displayLessons.length}
              </div>
              {isExercise && (
                <div className="course-exercise-badge" aria-label="Leçon de type exercice">
                  <Target size={14} aria-hidden="true" /> Exercice
                </div>
              )}
            </div>
            {isCompleted && (
              <div className="course-completed-badge" aria-label="Leçon terminée">
                <CheckCircle size={14} aria-hidden="true" />
                <span>Terminée</span>
                <XPBadge xp={currentLesson.xp_value || 25} />
              </div>
            )}
          </div>

          {/* XP Flash */}
          {xpFlash && <XPFlash xp={xpFlash} />}

          {/* Lesson title */}
          <h1 className="course-lesson-title">{currentLesson.title}</h1>

          {/* Lesson content with fade-in animation */}
          <div key={lessonKey} className="course-lesson-content">
            <RichLessonContent lesson={currentLesson} onTryCode={handleTryCode} />
          </div>

          {/* Footer nav */}
          <div className="course-footer-nav course-footer-wrap">
            <button className="nav-pill" onClick={handlePrev} disabled={currentIndex === 0} aria-label="Leçon précédente">
              <ChevronLeft size={15} /> Précédent
            </button>

            <div className="course-footer-actions">
              {isExercise && !isCompleted && (
                <button
                  onClick={() => handleTryCode(currentLesson)}
                  className="course-resolve-btn"
                  aria-label="Résoudre l'exercice"
                >
                  <Play size={14} fill="currentColor" aria-hidden="true" /> Résoudre l'exercice
                </button>
              )}

              {currentIndex < displayLessons.length - 1 && (
                <button
                  className={`nav-pill ${isExercise && !isCompleted ?'nav-pill-muted' : 'nav-pill-primary'}`}
                  onClick={autoCompleteAndNext}
                  disabled={completingId === currentLesson.id}
                  aria-label="Aller à la leçon suivante"
                >
                  {completingId === currentLesson.id
                    ?<Loader2 size={14} className="spin" aria-hidden="true" />
                    : null}
                  Suivant <ChevronRight size={15} aria-hidden="true" />
                </button>
              )}

              {currentIndex === displayLessons.length - 1 && (
                <button className="nav-pill nav-pill-success" onClick={onBack} aria-label="Terminer le cours">
                  <Award size={15} aria-hidden="true" /> Terminer le cours
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BQL Quick Reference */}
      <QuickRefPanel />

    </div>
  );
};

export default CourseViewer;


