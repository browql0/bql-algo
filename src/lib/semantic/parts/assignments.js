import { isValidVariableName } from './utils.js';

const assignmentAnalysisMethods = {
  _analyzeAssign(node) {
    const target = node.target; // IdentifierNode, ArrayAccessNode, or MemberAccessNode
    
    // Si c'est un noeud basique (AssignNode sans target mais avec name pour compat)
    if (!target) {
       // fallback ancien code
       const name = node.name;
       if (!isValidVariableName(name)) {
         if (node.value) this._analyzeExpr(node.value);
         return;
       }
       const entry = this.symbolTable.variables[name] || this.symbolTable.constantes[name];
       if (!entry) {
         this._addError({
           message: `Identifiant '${name}' non déclaré`,
           line: node.line,
           column: node.column,
           value: name,
           hint: `Déclarez '${name}' dans le bloc VARIABLE(S) avant DEBUT : ${name} : ENTIER;`,
         });
       } else if (entry.immutable) {
         this._addError({
           message: `Impossible de modifier la constante '${name}'`,
           line: node.line,
           column: node.column,
           value: name,
         });
       } else if (entry.isArray) {
          const _dims = entry.dimensions ?? 1;
          const _idxEx = _dims === 1
            ?name + '[i]'
            : name + '[' + Array.from({length:_dims},(_,k)=>(['i','j','k'][k]||('i'+k))).join(', ') + ']';
          this._addError({
            message: `Affectation invalide : le tableau '${name}' ne peut pas recevoir une valeur scalaire`,
            line: node.line,
            column: node.column,
            value: name,
            hint: `Affectez case par case : ${_idxEx} <- valeur;`,
          });
       } else {
         entry.initialized = true;
         if (node.value) {
            this._analyzeExpr(node.value);
            const inferredType = this._inferExprType(node.value);
            if (inferredType && !this._isTypeCompatible(entry.type, inferredType)) {
               this._addError({
                 message: `Type incompatible : impossible d'affecter une valeur de type ${inferredType.toUpperCase()} à '${name}' déclaré comme ${entry.type.toUpperCase()}`,
                 line: node.line,
                 column: node.column,
                 value: name,
               });
            }
         }
       }
       return;
    }

    const type = this._analyzeTarget(target, true, false);
    if (node.value) {
      this._analyzeExpr(node.value);
      const inferredType = this._inferExprType(node.value);
      if (type && inferredType && !this._isTypeCompatible(type, inferredType)) {
        this._addError({
          message: `Type incompatible : impossible d'affecter une valeur de type ${inferredType.toUpperCase()} à la cible de type ${type.toUpperCase()}`,
          line: node.line,
          column: node.column,
        });
      }
    }
  }
};

export default assignmentAnalysisMethods;

