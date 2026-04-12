const fs = require('fs');
const path = 'c:/Users/Mypc/Desktop/ALGO/src/components/cours/LessonRenderers.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the known broken text
content = content.replace(/mais appelée \[, \]/g, "mais appelée M[ligne, colonne]");
content = content.replace(/Tableau \[, \] : TYPE/g, "Tableau M[L, C] : TYPE");
content = content.replace(/Accès : <Mono>\[, \]/g, "Accès : <Mono>M[i, j]");
content = content.replace(/'Tableau \[, \] : TYPE'/g, "'Tableau M[L, C] : TYPE'");
content = content.replace(/\['\[, \] → ligne i, colonne j/g, "['M[i, j] → ligne i, colonne j");
content = content.replace(/Tableau \[, \] : ENTIER \(2 lignes, 3 colonnes\)/g, "Tableau M[2, 3] : ENTIER (2 lignes, 3 colonnes)");

content = content.replace(/\['Tout à 0', '\[, \] <- 0;'/g, "['Tout à 0', 'M[i, j] <- 0;'");
content = content.replace(/\['Identité', 'SI i=j ALORS \[, \]<-1 SINON \[, \]<-0'/g, "['Identité', 'SI i=j ALORS M[i, j]<-1 SINON M[i, j]<-0'");
content = content.replace(/\['i\+j', '\[, \] <- i \+ j;'/g, "['i+j', 'M[i, j] <- i + j;'");

content = content.replace(/Diagonale principale : \[, \]/g, "Diagonale principale : M[i, i]");
content = content.replace(/cellule \[, \]/g, "cellule M[i, j]");
content = content.replace(/valeur \[, \]/g, "valeur M[i, j]");
content = content.replace(/somme \+ \[, \]/g, "somme + M[i, j]");
content = content.replace(/max <- \[, \]/g, "max <- M[0, 0]");
content = content.replace(/Symétrie — \[, \] = \[, \]/g, "Symétrie — M[i, j] = M[j, i]");
content = content.replace(/symétrique : \[, \] = \[, \]/g, "symétrique : M[i, j] = M[j, i]");
content = content.replace(/Transposée : \[, \] devient \[, \]/g, "Transposée : M[i, j] devient T[j, i]");
content = content.replace(/\[, \] devient \[, \]/g, "M[i, j] devient T[j, i]");
content = content.replace(/Tableau T\[, \]/g, "Tableau T[C, L]");

// Global catch-alls for remaining `[, ]` where it means M[i, j]
content = content.replace(/\[, \]/g, "M[i, j]");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed LessonRenderers.jsx');
