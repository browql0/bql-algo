import { useState, useEffect } from 'react';

export const useEditorMobile = (activeMobilePane, activeRightTab) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (
        mobile &&
        activeMobilePane === 'editor' &&
        activeRightTab !== 'terminal'
      ) {
        // Optionally sync here or let user decide
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeMobilePane, activeRightTab]);

  return { isMobile, isMobileMenuOpen, setIsMobileMenuOpen };
};
