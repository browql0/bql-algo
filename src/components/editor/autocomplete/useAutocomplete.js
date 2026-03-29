/**
 * useAutocomplete.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom Hook React qui gère tout l'état de l'auto-complétion :
 * l'affichage du menu, la liste filtrée, l'index de navigation, etc.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import { getCaretCoordinates } from './getCaretCoordinates';
import { getCurrentWord, parseVariables } from './getContext';
import { globalSuggestions } from './suggestions';

export function useAutocomplete(code, onChange, textareaRef) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [currentWordState, setCurrentWordState] = useState({ word: '', start: 0, end: 0 });

  const handleInput = useCallback((e) => {
    const el = e.target;
    const cursorPos = el.selectionStart;

    const wordInfo = getCurrentWord(code, cursorPos);
    const word = wordInfo.word;

    if (!word || word.length < 1) {
      setIsOpen(false);
      return;
    }

    const variables = parseVariables(code);
    const upperWord = word.toUpperCase();
    const allCandidates = [...variables, ...globalSuggestions];

    let matches = allCandidates.filter(c => c.label.toUpperCase().startsWith(upperWord));
    if (matches.length === 0) {
      matches = allCandidates.filter(c => c.label.toUpperCase().includes(upperWord));
    }

    if (matches.length > 0) {
      setCurrentWordState(wordInfo);
      setSuggestions(matches);
      setSelectedIndex(0);

      const caretCoords = getCaretCoordinates(el, cursorPos);
      setCoords({
        top: caretCoords.top + caretCoords.height + 4,
        left: caretCoords.left,
      });

      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [code]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const applySuggestion = useCallback((suggestion) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    
    const textToInsert = suggestion.insertText;
    const newCode = 
      code.substring(0, currentWordState.start) + 
      textToInsert + 
      code.substring(currentWordState.end);
    
    onChange(newCode);
    setIsOpen(false);

    setTimeout(() => {
      const offset = typeof suggestion.cursorOffset === 'number' ? suggestion.cursorOffset : 0;
      const newPos = currentWordState.start + textToInsert.length + offset;
      el.focus();
      el.setSelectionRange(newPos, newPos);
    }, 0);
  }, [code, currentWordState, onChange, textareaRef]);

  const onKeyDown = useCallback((e) => {
    if (!isOpen) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return true;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return true;

      case 'Tab':
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) applySuggestion(suggestions[selectedIndex]);
        return true;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        return true;

      default:
        return false;
    }
  }, [isOpen, suggestions, selectedIndex, applySuggestion]);

  return {
    isOpen,
    suggestions,
    selectedIndex,
    coords,
    handleInput,
    closeMenu,
    onKeyDown,
    applySuggestion,
    setSelectedIndex
  };
}
