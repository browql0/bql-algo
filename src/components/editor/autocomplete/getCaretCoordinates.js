/**
 * getCaretCoordinates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Calcule la position X, Y (en pixels) du curseur dans un élément <textarea>.
 * Utilise la technique classique du "div fantôme" (shadow clone).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const properties = [
  'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
  'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
];

const isBrowser = (typeof window !== 'undefined');

export function getCaretCoordinates(element, position) {
  if (!isBrowser) return { top: 0, left: 0, height: 0 };

  const isFirefox = window.mozInnerScreenX != null;

  // Création du div clone
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);
  const isInput = element.nodeName === 'INPUT';

  // Style de base caché
  style.whiteSpace = 'pre-wrap';
  if (!isInput) style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  // Copie des propriétés CSS pertinentes
  properties.forEach(prop => {
    style[prop] = computed[prop];
  });

  // Ajustement pour Firefox
  if (isFirefox) {
    if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';
  }

  // Insertion du contenu jusqu'au curseur
  div.textContent = element.value.substring(0, position);
  if (isInput) div.textContent = div.textContent.replace(/\s/g, '\u00a0');

  // L'élément magique pour avoir la position exacte
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.'; 
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
    height: parseInt(computed['lineHeight'])
  };

  document.body.removeChild(div);

  return coordinates;
}
