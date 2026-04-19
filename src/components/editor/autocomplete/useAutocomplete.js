/**
 * useAutocomplete.js
 * -----------------------------------------------------------------------------
 * Custom Hook React qui gère tout l'état de l'auto-complétion :
 * l'affichage du menu, la liste filtrée, l'index de navigation, etc.
 * -----------------------------------------------------------------------------
 */

import { useState, useCallback, useMemo } from 'react';
import { getCaretCoordinates } from './getCaretCoordinates';
import { getAutocompleteContext } from './getContext';
import { extractSymbols } from './symbols';
import { buildSuggestions, filterAndRankSuggestions } from './suggestionUtils';

export function useAutocomplete(code, onChange, textareaRef) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [currentWordState, setCurrentWordState] = useState({ word: '', start: 0, end: 0 });

  const symbols = useMemo(() => extractSymbols(code), [code]);

  const handleInput = useCallback((e) => {
    const el = e.target;
    const cursorPos = el.selectionStart;
    const context = getAutocompleteContext(code, cursorPos);
    const prefix = context.word || '';

    if (!context.isMemberAccess && prefix.length < 1) {
      setIsOpen(false);
      return;
    }

    const allSuggestions = buildSuggestions({ symbols, context });
    const matches = filterAndRankSuggestions(allSuggestions, prefix, context);

    if (matches.length === 0) {
      setIsOpen(false);
      return;
    }

    setCurrentWordState({ word: prefix, start: context.replaceStart, end: context.replaceEnd });
    setSuggestions(matches);
    setSelectedIndex(0);

    const caretCoords = getCaretCoordinates(el, cursorPos);
    setCoords({
      top: caretCoords.top + caretCoords.height + 4,
      left: caretCoords.left,
    });

    setIsOpen(true);
  }, [code, symbols]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const applySuggestion = useCallback((suggestion) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    
    // Récupérer l'indentation de la ligne courante
    const textBeforeWord = code.substring(0, currentWordState.start);
    const lastNewline = textBeforeWord.lastIndexOf('\n');
    const currentLine = textBeforeWord.substring(lastNewline + 1);
    const indentMatch = currentLine.match(/^\s*/);
    const currentIndent = indentMatch ?indentMatch[0] : '';

    let textToInsert = suggestion.insertText || suggestion.label || '';
    const originalLength = textToInsert.length;
    
    // Si c'est un snippet multi-lignes, on injecte l'indentation parente
    if ((suggestion.kind === 'snippet' || suggestion.type === 'snippet') && textToInsert.includes('\n')) {
      // On n'indente pas la première ligne, mais toutes les suivantes
      const lines = textToInsert.split('\n');
      textToInsert = lines[0] + '\n' + lines.slice(1).map(l => currentIndent + l).join('\n');
    }

    const newCode = 
      code.substring(0, currentWordState.start) + 
      textToInsert + 
      code.substring(currentWordState.end);
    
    onChange(newCode);
    setIsOpen(false);

    setTimeout(() => {
      let offset = typeof suggestion.cursorOffset === 'number' ?suggestion.cursorOffset : 0;
      
      // Si on a ajouté de l'indentation APRÈS la position cible du curseur, 
      // le décalage négatif par rapport à la fin (cursorOffset) doit être ajust? 
      // pour rester fixe par rapport au début.
      
      // La plupart des snippets ont le curseur sur la première ligne.
      // On recalcule une position absolue par rapport au début de l'insertion.
      const originalTargetFromStart = originalLength + offset; 
      const newPos = currentWordState.start + originalTargetFromStart;

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

