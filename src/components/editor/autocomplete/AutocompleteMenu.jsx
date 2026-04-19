import React, { useEffect, useRef } from 'react';
import { Type, Box, Zap, CaseLower } from 'lucide-react';
import './AutocompleteMenu.css';

export default function AutocompleteMenu({
  isOpen,
  suggestions,
  selectedIndex,
  coords,
  onSelect,
  setSelectedIndex
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const activeEl = menuRef.current.querySelector('.ac-item--active');
      if (activeEl) {
        const menuRect = menuRef.current.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        if (activeRect.bottom > menuRect.bottom) {
          menuRef.current.scrollTop += (activeRect.bottom - menuRect.bottom) + 4;
        } else if (activeRect.top < menuRect.top) {
          menuRef.current.scrollTop -= (menuRect.top - activeRect.top) + 4;
        }
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen || suggestions.length === 0) return null;

  const style = {
    top: `${coords.top}px`,
    left: `${coords.left}px`,
  };

  return (
    <div className="autocomplete-menu" style={style} ref={menuRef}>
      <ul className="ac-list">
        {suggestions.map((sug, i) => {
          const isActive = i === selectedIndex;
          return (
            <li
              key={`${sug.type}-${sug.label}-${i}`}
              className={`ac-item ${isActive ?'ac-item--active' : ''}`}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => onSelect(sug)}
            >
              <div className="ac-item-icon">
                {getIconForType(sug.type)}
              </div>
              <div className="ac-item-content">
                <span className="ac-item-label">{sug.label}</span>
                {sug.detail && <span className="ac-item-detail">{sug.detail}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getIconForType(type) {
  switch (type) {
    case 'keyword':  return <Box size={14} color="#c084fc" />; 
    case 'type':     return <Type size={14} color="#fb7185" />; 
    case 'snippet':  return <Zap size={14} color="#facc15" />; 
    case 'variable': return <CaseLower size={14} color="#60a5fa" />; 
    default:         return <Box size={14} color="#94a3b8" />;
  }
}
