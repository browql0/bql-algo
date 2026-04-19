import { NodeType } from '../../parser/AST/nodes.js';
import { isValidVariableName } from './utils.js';

const declarationAnalysisMethods = {
  _processCustomTypes(customTypes) {
    if (!Array.isArray(customTypes)) return;

    for (const typeDecl of customTypes) {
      if (!typeDecl || !typeDecl.name) continue;
      const tName = typeDecl.name;
      
      if (this.symbolTable.customTypes[tName]) {
        this._addError({
          message: `Le type '${tName}' est déjà déclaré`,
          line: typeDecl.line,
          column: typeDecl.column,
          value: tName,
        });
      } else {
        const fields = {};
        for (const field of typeDecl.fields) {
          if (fields[field.name]) {
            this._addError({
              message: `Le champ '${field.name}' est dupliqu? dans l'enregistrement '${tName}'`,
              line: field.line,
              column: field.column,
              value: field.name,
            });
          } else {
            fields[field.name] = field.varType;
          }
        }
        this.symbolTable.customTypes[tName] = { 
          nom: tName,
          fields: fields 
        };
      }
    }
  },

  _processConstants(constants) {
    if (!Array.isArray(constants)) return;

    for (const decl of constants) {
      if (!decl) continue;
      const name = decl.name;
      if (!isValidVariableName(name)) continue;

      if (this.symbolTable.constantes[name] || this.symbolTable.variables[name]) {
        this._addError({
          message: `L'identifiant '${name}' est déjà déclaré`,
          line: decl.line,
          column: decl.column,
          value: name,
        });
      } else {
        this.symbolTable.constantes[name] = {
          nom: name,
          type: decl.constType || 'inconnu',
          line: decl.line,
          immutable: true,
          initialized: true
        };
      }
    }
  },

  _processDeclarations(declarations) {
    if (!Array.isArray(declarations)) return;

    for (const decl of declarations) {
      if (!decl) continue;

      // Cas : Tableau T[10] : ENTIER;
      if (decl.type === NodeType.ARRAY_DECL) {
        const name = decl.name;
        if (!isValidVariableName(name)) continue;

        if (this.symbolTable.variables[name] || this.symbolTable.constantes[name]) {
          this._addError({
            message: `Le tableau '${name}' est déjà déclaré`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ou tableau ne peut être déclaré qu'une seule fois.`,
          });
        } else {
          const isDynamicPlaceholder = decl.sizes.some(s => s === null);
          this.symbolTable.variables[name] = {
            type: `${decl.varType}[]`,
            line: decl.line,
            initialized: true, // "initialisé" dans le sens où l'identifiant existe
            isArray: true,
            isAllocated: !isDynamicPlaceholder,
            isDynamicPlaceholder: isDynamicPlaceholder,
            dimensions: decl.sizes?.length ?? 1,
            baseType: decl.varType
          };
        }
        
        // Analyser les expressions de taille (pour les statiques uniquement)
        if (decl.sizes) {
          for (const size of decl.sizes) {
            if (size !== null) {
              this._analyzeExpr(size);
            }
          }
        }
        continue;
      }

      // Cas standard : a, b : ENTIER;
      if (!Array.isArray(decl.names)) continue;

      for (const name of decl.names) {
        // Ignorer les noms invalides (résidus d'erreurs de parsing)
        if (!isValidVariableName(name)) continue;

        if (this.symbolTable.variables[name] || this.symbolTable.constantes[name]) {
          this._addError({
            message: `La variable '${name}' est déjà déclarée`,
            line: decl.line,
            column: decl.column,
            value: name,
            hint: `Chaque variable ne peut être déclaré qu'une seule fois dans le bloc VARIABLES.`,
          });
        } else {
          this.symbolTable.variables[name] = {
            type: decl.varType,
            line: decl.line,
            initialized: false, // sera mis à true lors de l'affectation ou LIRE
          };
        }
      }
    }
  }
};

export default declarationAnalysisMethods;

