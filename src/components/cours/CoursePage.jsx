import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TerminalSquare, ArrowRight, BookOpen, Shuffle, RefreshCcw, Layers, Zap, Box, Code, Trophy, Lock, ChevronRight, Star } from 'lucide-react';
import CourseViewer from './CourseViewer';
import { SkeletonBentoCard } from './SkeletonComponents';
import { useCourses } from '../../hooks/useCourses';
import './CoursePage.css';

const LEVEL_COLORS = [
  { bg: '#4f8ff0', glow: 'rgba(79,143,240,0.2)', label: 'Débutant' },
  { bg: '#a78bfa', glow: 'rgba(167,139,250,0.2)', label: 'Élémentaire' },
  { bg: '#34d399', glow: 'rgba(52,211,153,0.2)', label: 'Intermédiaire' },
  { bg: '#facc15', glow: 'rgba(250,204,21,0.2)', label: 'Avancé' },
  { bg: '#fb7185', glow: 'rgba(251,113,133,0.2)', label: 'Expert' },
  { bg: '#c084fc', glow: 'rgba(192,132,252,0.2)', label: 'Maître' },
];

const LESSON_COUNTS = { 1: 10, 2: 10, 3: 10, 4: 12, 5: 12, 6: 9 };

// Mapping strings to components for dynamic Icons
const ICONS = {
  AlignLeft: BookOpen, 
  Shuffle: Shuffle,
  RefreshCcw: RefreshCcw,
  Layers: Layers,
  Zap: Zap,
  Box: Box,
  Code: Code,
  BookOpen: BookOpen
};

const CoursePage = () => {
  const { courses, loading, error } = useCourses();
  const [activeCourse, setActiveCourse] = useState(null);

  const handleCategorySelect = (course) => {
    window.scrollTo(0, 0);
    setActiveCourse(course);
  };

  const handleBackToGrid = () => {
    setActiveCourse(null);
  };

  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <SkeletonBentoCard key={index} large={index === 0 || index === 3} />
    ));
  };

  // Stats globales
  const totalLessons = courses.reduce((acc, c) => acc + (LESSON_COUNTS[c.level] || 0), 0);
  const completedCourses = courses.filter(c => c.progress === 100).length;
  const globalProgress = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
    : 0;

  return (
    <div className="course-page">
      <header className="course-header">
        <Link to="/" className="course-brand">
          <div className="logo-icon-wrap"><TerminalSquare size={16} /></div>
          BQL<span>algo</span>
        </Link>
        <div className="header-actions">
          <Link to="/editor" className="back-to-editor-btn">
            Ouvrir l'Éditeur <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {activeCourse ? (
        <CourseViewer course={activeCourse} onBack={handleBackToGrid} />
      ) : (
        <div className="course-scroll-area">
          <section className="course-hero">
            <div className="hero-badge">🎓 Apprentissage Interactif</div>
            <h1>Maîtrisez l'algorithmique <span style={{ background: 'linear-gradient(135deg,#4f8ff0,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>avec BQL</span></h1>
            <p>Des bases de la programmation aux concepts avancés, progressez à votre rythme à travers nos cours interactifs.</p>

            {/* Global stats bar */}
            {!loading && (
              <div className="global-stats">
                <div className="stat-item">
                  <span className="stat-value">{courses.length}</span>
                  <span className="stat-label">Cours</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{totalLessons}</span>
                  <span className="stat-label">Leçons</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value" style={{ color: '#34d399' }}>{completedCourses}</span>
                  <span className="stat-label">Complétés</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value" style={{ color: '#4f8ff0' }}>{globalProgress}%</span>
                  <span className="stat-label">Progression</span>
                </div>
              </div>
            )}
          </section>

          <section className="bento-grid">
            {loading ? renderSkeletons() : error ? (
              <div style={{ color: '#ef4444', textAlign: 'center', gridColumn: '1/-1', padding: '2rem' }}>
                Impossible de charger les cours : {error}
              </div>
            ) : (
              courses.map((course, index) => {
                const Icon = ICONS[course.icon_name] || BookOpen;
                const lvl = LEVEL_COLORS[(course.level - 1) % LEVEL_COLORS.length];
                const lessonCount = LESSON_COUNTS[course.level] || 0;
                const isCompleted = course.progress === 100;
                const isLocked = index > 0 && courses[index - 1]?.progress < 50;

                return (
                  <div
                    key={course.id}
                    className={`bento-card ${index === 0 || index === 3 ? 'bento-card-large' : ''} ${isLocked ? 'bento-card-locked' : ''}`}
                    onClick={() => !isLocked && handleCategorySelect(course)}
                    style={{ '--lvl-color': lvl.bg, '--lvl-glow': lvl.glow }}
                  >
                    {/* Level badge */}
                    <div className="bento-level-badge" style={{ background: `${lvl.bg}22`, color: lvl.bg, border: `1px solid ${lvl.bg}44` }}>
                      <Star size={10} />
                      Niveau {course.level} — {lvl.label}
                    </div>

                    <div className="bento-card-top">
                      <div className="bento-icon-wrapper" style={{ background: `${lvl.bg}18`, color: lvl.bg }}>
                        {isLocked ? <Lock size={22} /> : isCompleted ? <Trophy size={22} /> : <Icon size={22} strokeWidth={2.5} />}
                      </div>
                      {isCompleted && (
                        <div className="bento-completed-badge">✓ Complété</div>
                      )}
                    </div>

                    <h3 className="bento-title">{course.title}</h3>
                    <p className="bento-description">{course.description}</p>

                    <div className="bento-meta">
                      <span className="bento-lesson-count" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><BookOpen size={14} /> {lessonCount} leçons</span>
                      <span className="bento-start-btn">Commencer <ChevronRight size={13} /></span>
                    </div>

                    <div className="bento-progress">
                      <div className="bento-progress-bar">
                        <div
                          className="bento-progress-fill"
                          style={{ width: `${course.progress}%`, background: isCompleted ? '#34d399' : `linear-gradient(90deg, ${lvl.bg}, ${lvl.bg}cc)` }}
                        />
                      </div>
                      <span style={{ color: isCompleted ? '#34d399' : lvl.bg }}>{course.progress}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default CoursePage;
