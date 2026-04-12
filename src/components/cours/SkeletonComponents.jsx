import React from 'react';
import { Target, Info, AlertTriangle, Lightbulb, CheckCircle, ChevronLeft, ChevronRight, Lock, BookOpen } from 'lucide-react';

/* ─── Base Blocks ───────────────────────────────────────────────────────── */

const SkeletonBlock = ({ width = '100%', height = '16px', borderRadius = '4px', style = {}, ...props }) => (
  <div 
    className="animate-shimmer" 
    style={{ width, height, borderRadius, ...style }} 
    {...props} 
  />
);

export const SkeletonText = ({ lines = 3, widths = ['100%', '85%', '60%'], style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', ...style }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock key={i} height="14px" width={widths[i % widths.length]} />
    ))}
  </div>
);

/* ─── Bento Grid Skeleton (CoursePage) ──────────────────────────────────── */

export const SkeletonBentoCard = ({ large = false }) => (
  <div className={`bento-card fade-in-content ${large ? 'bento-card-large' : ''}`} style={{ cursor: 'default', pointerEvents: 'none' }}>
    {/* level badge mockup */}
    <div style={{ display: 'flex', marginBottom: '1.5rem', alignItems: 'center' }}>
      <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
    </div>
    <SkeletonBlock height="22px" width="70%" style={{ marginBottom: '1rem' }} />
    <SkeletonText lines={2} widths={['100%', '60%']} />
    
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1.5rem' }}>
      <SkeletonBlock height="12px" width="30%" />
      <SkeletonBlock height="6px" width="100%" borderRadius="100px" />
    </div>
  </div>
);

/* ─── Sidebar Skeleton (CourseViewer) ───────────────────────────────────── */

export const SkeletonSidebarItem = () => (
  <div style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
    <SkeletonBlock width="20px" height="20px" borderRadius="50%" />
    <SkeletonBlock width="70%" height="14px" />
  </div>
);

export const SkeletonSidebar = ({ isMobile }) => {
  const content = (
    <>
      <div className="sidebar-header" style={{ borderBottom: 'none' }}>
        <SkeletonBlock width="100px" height="14px" style={{ marginBottom: '1.5rem' }} />
        <SkeletonBlock width="80%" height="24px" style={{ marginBottom: '1rem' }} />
        {/* Progress box */}
        <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <SkeletonBlock width="40px" height="10px" />
            <SkeletonBlock width="30px" height="10px" />
          </div>
          <SkeletonBlock height="5px" width="100%" borderRadius="4px" />
        </div>
      </div>
      <div className="sidebar-nav">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonSidebarItem key={i} />)}
      </div>
    </>
  );

  return (
    <div className={`course-sidebar fade-in-content ${isMobile ? 'mobile-skeleton' : ''}`}
         style={isMobile ? { position: 'fixed', top: 0, left: 0, bottom: 0, width: '82vw', maxWidth: '320px', zIndex: 201, transform: 'translateX(0)' } : {}}>
      {content}
    </div>
  );
};

/* ─── Lesson Content Skeletons ──────────────────────────────────────────── */

export const SkeletonCard = ({ type = 'info' }) => {
  const colors = {
    info: { border: '#4f8ff0', icon: Info },
    warning: { border: '#fb7185', icon: AlertTriangle },
    tip: { border: '#facc15', icon: Lightbulb },
    summary: { border: '#34d399', icon: CheckCircle }
  };
  
  const ctx = colors[type] || colors.info;
  const Icon = ctx.icon;

  if (type === 'summary') {
    return (
      <div style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '14px', padding: '1.4rem 1.6rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Icon size={15} color="#34d399" />
          <SkeletonBlock width="120px" height="14px" />
        </div>
        <SkeletonText lines={4} widths={['90%', '75%', '85%', '60%']} />
      </div>
    );
  }

  return (
    <div style={{ background: `rgba(255,255,255,0.01)`, border: `1px solid rgba(255,255,255,0.05)`, borderLeft: `3px solid ${ctx.border}`, borderRadius: '12px', padding: '1.1rem 1.4rem', marginBottom: '1.4rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <Icon size={17} color={ctx.border} />
      <div style={{ flex: 1 }}>
        <SkeletonBlock width="30%" height="12px" style={{ marginBottom: '1rem' }} />
        <SkeletonText lines={2} widths={['100%', '80%']} />
      </div>
    </div>
  );
};

export const SkeletonCodeBlock = () => (
  <div style={{ background: '#0b1120', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden', marginBottom: '2rem' }}>
    <div style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />)}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <SkeletonBlock width="65px" height="24px" borderRadius="6px" />
        <SkeletonBlock width="80px" height="24px" borderRadius="6px" />
      </div>
    </div>
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <SkeletonBlock width="40%" height="14px" />
      <SkeletonBlock width="25%" height="14px" />
      <SkeletonBlock width="60%" height="14px" style={{ marginLeft: '1.5rem' }} />
      <SkeletonBlock width="55%" height="14px" style={{ marginLeft: '1.5rem' }} />
      <SkeletonBlock width="15%" height="14px" />
    </div>
  </div>
);

export const SkeletonDiagram = () => (
  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', margin: '1.5rem 0', background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1.4rem 1.6rem' }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <React.Fragment key={i}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <SkeletonBlock width="90px" height="32px" borderRadius="10px" />
          <SkeletonBlock width="50px" height="10px" />
        </div>
        {i < 3 && <ChevronRight size={14} color="rgba(255,255,255,0.1)" />}
      </React.Fragment>
    ))}
  </div>
);

/* ─── Full Lesson Assembly ──────────────────────────────────────────────── */

export const SkeletonLesson = () => (
  <div className="fade-in-content" style={{ paddingBottom: '2rem' }}>
    {/* Mobile toolbar mockup */}
    <div className="mobile-only-skeleton" style={{ display: 'none' }}>
      {/* Handled by media query or explicit logic in CourseViewer, but let's keep it simple */}
    </div>
    
    {/* Top bar */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <SkeletonBlock width="120px" height="26px" borderRadius="100px" />
    </div>
    
    {/* Definition card */}
    <SkeletonCard type="info" />
    
    {/* Section 1 */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', paddingBottom: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem', marginTop: '3rem' }}>
      <SkeletonBlock width="26px" height="26px" borderRadius="50%" />
      <SkeletonBlock width="200px" height="22px" />
    </div>
    
    <SkeletonText lines={2} style={{ marginBottom: '1.5rem' }} />
    <SkeletonDiagram />

    {/* Section 2 */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', paddingBottom: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem', marginTop: '3rem' }}>
      <SkeletonBlock width="26px" height="26px" borderRadius="50%" />
      <SkeletonBlock width="180px" height="22px" />
    </div>
    
    <SkeletonText lines={1} widths={['50%']} style={{ marginBottom: '1.5rem' }} />
    <SkeletonCodeBlock />
    
    <SkeletonCard type="tip" />
    <SkeletonCard type="summary" />
  </div>
);
