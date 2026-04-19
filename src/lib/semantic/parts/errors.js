import AlgoSemanticError from '../../errors/SemanticError.js';

const semanticErrorMethods = {
  _addError({ message, line, column = 0, value = null, hint = null }) {
    const codeLine = (line > 0 && line <= this.sourceLines.length)
      ?this.sourceLines[line - 1]
      : null;

    this.errors.push(new AlgoSemanticError({
      message,
      line,
      column,
      value,
      hint,
      codeLine,
    }));
  }
};

export default semanticErrorMethods;
