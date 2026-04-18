-- ============================================================
-- BQL ALGO  SEED COMPLET (nouvelle progression, 7 niveaux)
-- Exécuter intégralement dans l'éditeur SQL de Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--  TABLE: courses 
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'BookOpen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Les cours sont visibles par tous" ON public.courses;
CREATE POLICY "Les cours sont visibles par tous" ON public.courses FOR SELECT USING (true);

--  TABLE: lessons 
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    example_code TEXT,
    exercise TEXT,
    solution TEXT,
    expected_output TEXT,
    test_cases JSONB DEFAULT '[]'::jsonb,
    lesson_type VARCHAR(50) DEFAULT 'generic',
    xp_value INTEGER DEFAULT 25,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS solution TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS expected_output TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS test_cases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'generic';
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS xp_value INTEGER DEFAULT 25;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Les leçons sont visibles par tous" ON public.lessons;
CREATE POLICY "Les leçons sont visibles par tous" ON public.lessons FOR SELECT USING (true);

--  TABLE: user_progress 
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT true,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Voir propre progression" ON public.user_progress;
DROP POLICY IF EXISTS "Insérer propre progression" ON public.user_progress;
DROP POLICY IF EXISTS "Mettre à jour propre progression" ON public.user_progress;
CREATE POLICY "Voir propre progression" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insérer propre progression" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mettre à jour propre progression" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

--  RESET 
TRUNCATE TABLE public.user_progress CASCADE;
TRUNCATE TABLE public.lessons CASCADE;
TRUNCATE TABLE public.courses CASCADE;

--  SEED 
DO $$
DECLARE
    course_bases_id    UUID := uuid_generate_v4();
    course_logic_id    UUID := uuid_generate_v4();
    course_loops_id    UUID := uuid_generate_v4();
    course_arrays_id   UUID := uuid_generate_v4();
    course_matrices_id UUID := uuid_generate_v4();
    course_structs_id  UUID := uuid_generate_v4();
    course_advanced_id UUID := uuid_generate_v4();
BEGIN

INSERT INTO public.courses (id, title, description, level, "order", icon_name) VALUES
(course_bases_id,    'Level 1 - Foundations',                'Algorithmes, DEBUT/FIN, ECRIRE, LIRE, variables, constantes, types, affectation, calculs et debogage.', 1, 1, 'AlignLeft'),
(course_logic_id,    'Level 2 - Conditions + SELON',         'Comparaisons, SI, SINONSI, SINON, conditions imbriquees, SELON, CAS, AUTRE et FINSELON.', 2, 2, 'Shuffle'),
(course_loops_id,    'Level 3 - Loops',                      'POUR, ALLANT DE, PAS, TANTQUE, REPETER/JUSQUA, compteurs, accumulateurs et boucles imbriquees.', 3, 3, 'RefreshCcw'),
(course_arrays_id,   'Level 4 - Arrays + Sorting',           'Tableaux 1D, indices, parcours, somme, max/min, recherche, inversion, doublons et tris.', 4, 4, 'Layers'),
(course_matrices_id, 'Level 5 - Matrices',                   'Matrices, M[i,j], boucles imbriquees, lignes, colonnes, diagonales, transposee et recherche.', 5, 5, 'Box'),
(course_structs_id,  'Level 6 - Records / Structures',       'TYPE ENREGISTREMENT, champs, enregistrements imbriques et tableaux d''enregistrements.', 6, 6, 'Zap'),
(course_advanced_id, 'Level 7 - Advanced Logic',             'Decomposition, problemes multi-etapes, choix de structure, mini-projets et strategies de debogage.', 7, 7, 'Target');

-- ======================================================================
-- NIVEAU 1 : BASES (10 leçons)
-- ======================================================================
INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES

-- 1. Introduction
(course_bases_id,
 'Introduction à l''algorithmique',
 'Un algorithme est une suite d''étapes logiques et ordonnées permettant de résoudre un problème. C''est la recette que le programme va suivre. En BQL, chaque programme est structuré : un nom, un corps entre DEBUT et FIN. C''est le point de départ de tout développeur.',
 'ALGORITHME_Bonjour;
DEBUT
  ECRIRE("Bonjour le monde !");
FIN',
 NULL, NULL, NULL, NULL, 'intro', 25, 1),

-- 2. Variables
(course_bases_id,
 'Les variables',
 'Une variable est une boîte mémoire nommée qui stocke une information. Elle a un nom, un type, et une valeur. En BQL on utilise VARIABLE (singulier) pour une seule, VARIABLES (pluriel) pour plusieurs. L''affectation se fait avec l''opérateur <-.',
 'ALGORITHME_Variables;
VARIABLES
  age : ENTIER;
  nom : CHAINE DE CARACTERE;
  note : REEL;
  actif : BOOLEEN;
DEBUT
  age <- 18;
  nom <- "Alice";
  note <- 14.5;
  actif <- VRAI;
  ECRIRE(nom);
  ECRIRE(age);
FIN',
 NULL, NULL, NULL, NULL, 'variables', 25, 2),

-- 3. Syntaxe de base
(course_bases_id,
 'Syntaxe de base d''un algorithme',
 'Tout algorithme BQL respecte 4 blocs obligatoires dans l''ordre : le nom (ALGORITHME_Nom), les déclarations (VARIABLE/VARIABLES), le début du code (DEBUT), et la fin (FIN). Le nom est collé sans espace.',
 'ALGORITHME_Structure;
VARIABLES
  a : ENTIER;
  b : ENTIER;
  somme : ENTIER;
DEBUT
  a <- 10;
  b <- 20;
  somme <- a + b;
  ECRIRE(somme);
FIN',
 NULL, NULL, NULL, NULL, 'syntaxe', 25, 3),

-- 4. Opérateurs
(course_bases_id,
 'Les opérateurs',
 'BQL dispose de trois familles d''opérateurs : arithmétiques (+, -, *, /), de comparaison (=, <>, <, >, <=, >=), et logiques (ET, OU, NON). Le modulo (reste de division entière) s''écrit MOD.',
 'ALGORITHME_Operateurs;
VARIABLES
  a : ENTIER;
  b : ENTIER;
  resultat : ENTIER;
  reste : ENTIER;
DEBUT
  a <- 17;
  b <- 5;
  resultat <- a + b;
  reste <- a MOD b;
  ECRIRE("Somme : ", resultat);
  ECRIRE("Reste de 17 MOD 5 : ", reste);
FIN',
 NULL, NULL, NULL, NULL, 'operateurs', 25, 4),

-- 5. Entrée / Sortie
(course_bases_id,
 'Entrée / Sortie',
 'ECRIRE() affiche un message ou une variable dans le terminal. LIRE() attend une saisie de l''utilisateur et la stocke dans une variable déclarée. C''est la base de l''interaction avec l''utilisateur.',
 'ALGORITHME_EntreeSortie;
VARIABLE
  nom : CHAINE DE CARACTERE;
DEBUT
  ECRIRE("Quel est ton prenom ?");
  LIRE(nom);
  ECRIRE("Bonjour, ", nom, " !");
FIN',
 NULL, NULL, NULL, NULL, 'io', 25, 5),

-- 6. Constantes (NOUVEAU)
(course_bases_id,
 'Les constantes',
 'Une constante est une valeur fixe qui ne change pas pendant l''exécution du programme. On la déclare avec CONSTANTE (singulier) ou CONSTANTES (pluriel) avant DEBUT. On lui affecte sa valeur à la déclaration et on ne peut plus la modifier ensuite. Utiliser des constantes rend le code lisible et facile à maintenir.',
 'ALGORITHME_Constantes;
CONSTANTES
  PI = 3.14159 : REEL;
  TVA = 0.20 : REEL;
  MAX_NOTES = 20 : ENTIER;
VARIABLES
  prix_ht : REEL;
  prix_ttc : REEL;
DEBUT
  prix_ht <- 100.0;
  prix_ttc <- prix_ht + (prix_ht * TVA);
  ECRIRE("Prix TTC : ", prix_ttc);
  ECRIRE("Valeur de PI : ", PI);
  ECRIRE("Note maximum : ", MAX_NOTES);
FIN',
 NULL, NULL, NULL, NULL, 'constantes', 30, 6),

-- 7. Expressions complexes (NOUVEAU)
(course_bases_id,
 'Expressions et calculs complexes',
 'Une expression est une combinaison d''opérandes et d''opérateurs qui produit une valeur. On peut imbriquer des calculs, utiliser des parenthèses pour forcer l''ordre d''évaluation, et combiner des types. Les parenthèses sont évaluées en premier, comme en mathématiques.',
 'ALGORITHME_Expressions;
VARIABLES
  a : ENTIER;
  b : ENTIER;
  c : ENTIER;
  resultat : REEL;
  reste : ENTIER;
DEBUT
  a <- 15;
  b <- 4;
  c <- 3;
  resultat <- (a * 2 + b) / c;
  reste <- a MOD b;
  ECRIRE("(15 * 2 + 4) / 3 = ", resultat);
  ECRIRE("15 MOD 4 = ", reste);
  ECRIRE("(a + b) * c = ", (a + b) * c);
FIN',
 NULL, NULL, NULL, NULL, 'expressions', 30, 7),

-- 8. Chaînes de caractères (NOUVEAU)
(course_bases_id,
 'Manipulation des chaînes de caractères',
 'Une chaîne de caractères est une suite de caractères entre guillemets doubles. On la stocke dans une variable de type CHAINE DE CARACTERE. On peut afficher plusieurs valeurs à la fois avec ECRIRE() en les séparant par des virgules. Les chaînes ne peuvent pas être additionnées avec + en BQL : on les passe toutes à ECRIRE.',
 'ALGORITHME_Chaines;
VARIABLES
  prenom : CHAINE DE CARACTERE;
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
  annee_naissance : ENTIER;
DEBUT
  prenom <- "Marie";
  nom <- "Dupont";
  age <- 22;
  annee_naissance <- 2026 - age;
  ECRIRE("Bonjour, je suis ", prenom, " ", nom);
  ECRIRE("J''ai ", age, " ans");
  ECRIRE("Je suis nee en ", annee_naissance);
  ECRIRE("Dans 10 ans, j''aurai ", age + 10, " ans");
FIN',
 NULL, NULL, NULL, NULL, 'chaines', 30, 8),

-- 9. ET et OU : logique de base
(course_bases_id,
 'ET et OU : logique de base',
 'Les operateurs logiques ET et OU combinent des valeurs booleennes. ET est vrai seulement si les deux valeurs sont vraies. OU est vrai si au moins une valeur est vraie. Une table de verite permet de verifier tous les cas possibles.',
 'ALGORITHME_LogiqueBase;
VARIABLES
  age_ok : BOOLEEN;
  carte_ok : BOOLEEN;
  peut_entrer : BOOLEEN;
  promotion : BOOLEEN;
DEBUT
  age_ok <- VRAI;
  carte_ok <- FAUX;
  peut_entrer <- age_ok ET carte_ok;
  promotion <- age_ok OU carte_ok;
  ECRIRE(peut_entrer);
  ECRIRE(promotion);
FIN',
 'Changez les valeurs de age_ok et carte_ok, puis prevoyez le resultat de age_ok ET carte_ok et de age_ok OU carte_ok avant d''executer.',
 NULL, NULL, NULL, 'logique_base', 30, 9),

-- 10. Exemples complets
(course_bases_id,
 'Exemples complets  Niveau 1',
 'Ce programme combine tout le Niveau 1 : constantes, variables, opérateurs, LIRE et ECRIRE. Il demande l''âge et le salaire brut de l''utilisateur, puis calcule les charges et le salaire net.',
 'ALGORITHME_SalaireNet;
CONSTANTE
  TAUX_CHARGES = 0.22 : REEL;
VARIABLES
  prenom : CHAINE DE CARACTERE;
  salaire_brut : REEL;
  charges : REEL;
  salaire_net : REEL;
DEBUT
  ECRIRE("=== Calculateur de salaire ===");
  ECRIRE("Votre prenom ?");
  LIRE(prenom);
  ECRIRE("Votre salaire brut mensuel ?");
  LIRE(salaire_brut);
  charges <- salaire_brut * TAUX_CHARGES;
  salaire_net <- salaire_brut - charges;
  ECRIRE("Bonjour ", prenom, " !");
  ECRIRE("Salaire brut  : ", salaire_brut);
  ECRIRE("Charges (22%) : ", charges);
  ECRIRE("Salaire net   : ", salaire_net);
FIN',
 NULL, NULL, NULL, NULL, 'exemples', 25, 10),

-- 11. Exercice Niveau 1
(course_bases_id,
 'EXERCICE : Valider le Niveau 1',
 'Prouvez que vous maîtrisez les bases en créant un algorithme qui affiche exactement la phrase demandée.',
 'ALGORITHME_Validation1;
DEBUT
  // écrivez votre code ici
FIN',
 'Créez un algorithme qui affiche exactement le texte : "BQL est genial" (sans les guillemets). Utilisez ECRIRE en respectant la casse exacte.',
 'ALGORITHME_Validation1;
DEBUT
  ECRIRE("BQL est genial");
FIN',
 'BQL est genial', NULL, 'exercice', 50, 11);


-- ======================================================================
-- NIVEAU 2 : CONDITIONS (10 leçons)
-- ======================================================================
INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES

-- 1. SI simple
(course_logic_id,
 'Condition SI simple',
 'La condition SI permet d''exécuter un bloc d''instructions uniquement si une condition est vraie. Si la condition est fausse, le bloc est ignoré. On ferme toujours avec FINSI.',
 'ALGORITHME_SiSimple;
VARIABLE
  note : ENTIER;
DEBUT
  note <- 15;
  SI note >= 10 ALORS
    ECRIRE("Admis");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'condition_si', 25, 1),

-- 2. SI / SINON
(course_logic_id,
 'Condition SI / SINON',
 'Le bloc SINON est le chemin alternatif qui s''exécute quand la condition SI est fausse. Il ne peut y avoir qu''un seul SINON par bloc SI. Ensemble ils forment un branchement binaire.',
 'ALGORITHME_SiSinon;
VARIABLE
  note : ENTIER;
DEBUT
  note <- 8;
  SI note >= 10 ALORS
    ECRIRE("Admis");
  SINON
    ECRIRE("Recale");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'condition_sinon', 25, 2),

-- 3. SINONSI
(course_logic_id,
 'Conditions en chaîne (SINONSI)',
 'SINONSI permet d''enchaîner plusieurs conditions. BQL évalue chaque condition dans l''ordre et exécute le premier bloc vrai trouvé. Placez les conditions du plus restrictif au plus général.',
 'ALGORITHME_SinonSi;
VARIABLE
  temp : ENTIER;
DEBUT
  temp <- 22;
  SI temp > 30 ALORS
    ECRIRE("Tres chaud");
  SINONSI temp > 20 ALORS
    ECRIRE("Agreable");
  SINONSI temp > 10 ALORS
    ECRIRE("Frais");
  SINON
    ECRIRE("Froid");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'sinon_si', 25, 3),

-- 4. Conditions imbriquées
(course_logic_id,
 'Conditions imbriquées',
 'On peut placer un bloc SI à l''intérieur d''un autre SI. C''est utile pour vérifier plusieurs critères indépendants. Chaque SI doit avoir son propre FINSI. Indentez soigneusement pour ne pas vous perdre.',
 'ALGORITHME_SiImbrique;
VARIABLES
  age : ENTIER;
  score : ENTIER;
DEBUT
  age <- 20;
  score <- 75;
  SI age >= 18 ALORS
    SI score >= 50 ALORS
      ECRIRE("Majeur et qualifie");
    SINON
      ECRIRE("Majeur mais score insuffisant");
    FINSI
  SINON
    ECRIRE("Mineur, non autorise");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'condition_imbrique', 25, 4),

-- 5. Opérateurs logiques ET, OU, NON (NOUVEAU)
(course_logic_id,
 'Opérateurs logiques  ET, OU, NON',
 'Les opérateurs logiques combinent plusieurs conditions en une seule expression. ET exige que TOUTES les conditions soient vraies. OU exige qu''AU MOINS UNE le soit. NON inverse le résultat d''une condition (VRAI devient FAUX, et inversement).',
 'ALGORITHME_OpLogiques;
VARIABLES
  age : ENTIER;
  score : ENTIER;
  inscrit : BOOLEEN;
DEBUT
  age <- 20;
  score <- 75;
  inscrit <- VRAI;
  // ET : les DEUX doivent être vraies
  SI age >= 18 ET score >= 50 ALORS
    ECRIRE("Eligible au tournoi");
  FINSI
  // OU : au moins UNE vraie
  SI age < 16 OU score < 20 ALORS
    ECRIRE("Disqualifie");
  FINSI
  // NON : inverse la condition
  SI NON inscrit ALORS
    ECRIRE("Vous devez vous inscrire");
  SINON
    ECRIRE("Deja inscrit, bonne chance !");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'operateurs_logiques', 35, 5),

-- 6. SELON
(course_logic_id,
 'SELON  sélection multiple',
 'SELON est l''équivalent du "switch" dans d''autres langages. Il évalue une variable et exécute le CAS correspondant à sa valeur. AUTRE est le cas par défaut, exécuté si aucun CAS ne correspond.',
 'ALGORITHME_Selon;
VARIABLE
  jour : ENTIER;
DEBUT
  jour <- 2;
  SELON jour FAIRE
    CAS 1:
      ECRIRE("Lundi");
    CAS 2:
      ECRIRE("Mardi");
    CAS 3:
      ECRIRE("Mercredi");
    CAS 4:
      ECRIRE("Jeudi");
    CAS 5:
      ECRIRE("Vendredi");
    AUTRE:
      ECRIRE("Week-end");
  FINSELON
FIN',
 NULL, NULL, NULL, NULL, 'selon', 25, 6),

-- 7. SELON imbriqué
(course_logic_id,
 'SELON imbriqué',
 'Un SELON peut contenir d''autres conditions à l''intérieur de ses CAS. C''est utile pour des logiques de sélection à plusieurs niveaux. Dans un CAS, utilisez des SI/SINON plutôt qu''un autre SELON si cela suffit.',
 'ALGORITHME_SelonImbrique;
VARIABLES
  categorie : ENTIER;
  niveau : ENTIER;
DEBUT
  categorie <- 1;
  niveau <- 2;
  SELON categorie FAIRE
    CAS 1:
      SI niveau = 1 ALORS
        ECRIRE("Debutant - Categorie A");
      SINON
        ECRIRE("Avance - Categorie A");
      FINSI
    CAS 2:
      SI niveau = 1 ALORS
        ECRIRE("Debutant - Categorie B");
      SINON
        ECRIRE("Avance - Categorie B");
      FINSI
    AUTRE:
      ECRIRE("Categorie inconnue");
  FINSELON
FIN',
 NULL, NULL, NULL, NULL, 'selon_imbrique', 30, 7),

-- 8. Conditions combinées (NOUVEAU)
(course_logic_id,
 'Conditions combinées  ET et OU ensemble',
 'En pratique, on combine souvent ET, OU et NON dans la même expression. L''ordre d''évaluation est : NON en premier, puis ET, puis OU. Utilisez des parenthèses pour rendre vos intentions claires et éviter les surprises.',
 'ALGORITHME_CondCombinees;
VARIABLES
  note : ENTIER;
  absences : ENTIER;
  projet : ENTIER;
DEBUT
  note <- 13;
  absences <- 2;
  projet <- 15;
  // Note passable ET assidu ET bon projet
  SI note >= 10 ET absences <= 3 ET projet >= 12 ALORS
    ECRIRE("Admis avec mention");
  SINONSI note >= 10 ET absences > 3 ALORS
    ECRIRE("Admis mais trop absent  avertissement");
  SINONSI (note >= 10) OU (projet >= 18) ALORS
    ECRIRE("Admis grace au projet");
  SINON
    ECRIRE("Recale");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'conditions_combinees', 35, 8),

-- 9. Plages de valeurs (NOUVEAU)
(course_logic_id,
 'Plages de valeurs  notes et catégories',
 'Quand on teste des plages de valeurs (09, 1012, 1315, 1620), SINONSI en cascade est le bon outil. SELON ne convient que pour des valeurs exactes, pas pour des intervalles. La règle d''or : du plus restrictif au plus général.',
 'ALGORITHME_SelonPlage;
VARIABLES
  note : ENTIER;
  bmi : REEL;
DEBUT
  note <- 14;
  // Classification des notes
  SI note >= 16 ALORS
    ECRIRE("Tres bien");
  SINONSI note >= 14 ALORS
    ECRIRE("Bien");
  SINONSI note >= 12 ALORS
    ECRIRE("Assez bien");
  SINONSI note >= 10 ALORS
    ECRIRE("Passable");
  SINON
    ECRIRE("Echec");
  FINSI
  bmi <- 22.5;
  // Classification IMC
  SI bmi < 18.5 ALORS
    ECRIRE("Insuffisance ponderale");
  SINONSI bmi < 25.0 ALORS
    ECRIRE("Poids normal");
  SINONSI bmi < 30.0 ALORS
    ECRIRE("Surpoids");
  SINON
    ECRIRE("Obesite");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'selon_plage', 35, 9),

-- 10. Exercice Niveau 2
(course_logic_id,
 'EXERCICE : Valider le Niveau 2',
 'Mettez en pratique vos connaissances sur SELON.',
 'ALGORITHME_Validation2;
VARIABLE
  meteo : ENTIER;
DEBUT
  meteo <- 1;
  // Utilisez SELON pour afficher "Soleil" si meteo = 1
FIN',
 'Déclarez une variable "meteo" valant 1. Utilisez un SELON où CAS 1 écrit "Soleil", CAS 2 écrit "Nuageux" et AUTRE écrit "Pluie". Le programme doit afficher : Soleil',
 'ALGORITHME_Validation2;
VARIABLE
  meteo : ENTIER;
DEBUT
  meteo <- 1;
  SELON meteo FAIRE
    CAS 1:
      ECRIRE("Soleil");
    CAS 2:
      ECRIRE("Nuageux");
    AUTRE:
      ECRIRE("Pluie");
  FINSELON
FIN',
 'Soleil', NULL, 'exercice', 50, 10);


-- ======================================================================
-- NIVEAU 3 : BOUCLES (10 leçons)
-- ======================================================================
INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES

-- 1. Introduction aux boucles
(course_loops_id,
 'Introduction aux boucles',
 'Une boucle permet de répéter automatiquement un bloc d''instructions. Sans boucle, afficher 100 nombres nécessite 100 lignes. Avec une boucle POUR, 3 lignes suffisent. BQL propose trois types de boucles selon la situation.',
 'ALGORITHME_IntroBoucle;
VARIABLE
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 1 A 5 FAIRE
    ECRIRE("Tour numero ", i);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'boucle_intro', 25, 1),

-- 2. Boucle POUR
(course_loops_id,
 'Boucle POUR  itérations fixes',
 'La boucle POUR est utilisée quand on connaît à l''avance le nombre d''itérations. La variable de boucle est automatiquement incrémentée de 1 à chaque tour. La syntaxe est : POUR variable ALLANT DE debut A fin FAIRE ... FINPOUR.',
 'ALGORITHME_BouclePour;
VARIABLE
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 1 A 3 FAIRE
    ECRIRE(i);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'boucle_pour', 25, 2),

-- 3. POUR avec PAS (NOUVEAU)
(course_loops_id,
 'Boucle POUR avec PAS  incrément personnalisé',
 'Par défaut, la boucle POUR incrémente de 1. Avec PAS, on peut changer cet incrément : compter de 2 en 2, de 10 en 10, ou même décrémenter (PAS -1). C''est puissant pour les parcours spéciaux.',
 'ALGORITHME_PourPas;
VARIABLE
  i : ENTIER;
DEBUT
  // Compter de 0 à 10 par pas de 2
  ECRIRE("Nombres pairs :");
  POUR i ALLANT DE 0 A 10 PAS 2 FAIRE
    ECRIRE(i);
  FINPOUR
  // Compte à rebours
  ECRIRE("Compte a rebours :");
  POUR i ALLANT DE 5 A 1 PAS -1 FAIRE
    ECRIRE(i);
  FINPOUR
  ECRIRE("Decollage !");
FIN',
 NULL, NULL, NULL, NULL, 'boucle_pour_pas', 30, 3),

-- 4. TANTQUE
(course_loops_id,
 'Boucle TANTQUE  condition avant',
 'La boucle TANTQUE évalue sa condition AVANT chaque itération. Si la condition est fausse dès le départ, le bloc ne s''exécute jamais. N''oubliez pas de modifier la variable de condition à l''intérieur du bloc !',
 'ALGORITHME_Tantque;
VARIABLE
  compteur : ENTIER;
DEBUT
  compteur <- 1;
  TANTQUE compteur <= 4 FAIRE
    ECRIRE(compteur);
    compteur <- compteur + 1;
  FINTANTQUE
FIN',
 NULL, NULL, NULL, NULL, 'boucle_tantque', 25, 4),

-- 5. REPETER JUSQUA
(course_loops_id,
 'Boucle REPETER JUSQUA - condition après',
 'La boucle REPETER s''exécute AU MOINS UNE FOIS car la condition est vérifiée APRES l''exécution du bloc. Elle s''arrête quand la condition devient VRAIE : logique inverse de TANTQUE.',
 'ALGORITHME_Repeter;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 1;
  REPETER
    ECRIRE(x);
    x <- x + 1;
  JUSQUA x > 3
FIN',
 NULL, NULL, NULL, NULL, 'boucle_repeter', 25, 5),

-- 6. Compteurs et accumulateurs (NOUVEAU)
(course_loops_id,
 'Compteurs et accumulateurs',
 'Un compteur est une variable qui s''incrémente à chaque tour de boucle pour compter des événements. Un accumulateur cumule des valeurs (somme, produit). On les initialise AVANT la boucle. C''est le moteur de 90 % des algorithmes réels.',
 'ALGORITHME_CompteurAccum;
VARIABLES
  i : ENTIER;
  somme : ENTIER;
  produit : ENTIER;
  pairs : ENTIER;
DEBUT
  somme <- 0;
  produit <- 1;
  pairs <- 0;
  POUR i ALLANT DE 1 A 5 FAIRE
    somme <- somme + i;
    produit <- produit * i;
    SI i MOD 2 = 0 ALORS
      pairs <- pairs + 1;
    FINSI
  FINPOUR
  ECRIRE("Somme 1..5 : ", somme);
  ECRIRE("Produit 1..5 : ", produit);
  ECRIRE("Nombres pairs : ", pairs);
FIN',
 NULL, NULL, NULL, NULL, 'boucle_compteur', 35, 6),

-- 7. Boucles imbriquées
(course_loops_id,
 'Boucles imbriquées',
 'On peut placer une boucle dans une autre. La boucle interne s''exécute complètement à chaque tour de la boucle externe. Pour des boucles de taille N et M, on obtient N  M itérations. Indispensable pour les tableaux 2D.',
 'ALGORITHME_BouclesImbr;
VARIABLES
  i : ENTIER;
  j : ENTIER;
DEBUT
  POUR i ALLANT DE 1 A 3 FAIRE
    POUR j ALLANT DE 1 A 2 FAIRE
      ECRIRE("i=", i, " j=", j);
    FINPOUR
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'boucle_imbrique', 30, 7),

-- 8. Recherche avec boucle (NOUVEAU)
(course_loops_id,
 'Recherche séquentielle',
 'La recherche séquentielle parcourt une séquence de valeurs une par une jusqu''à trouver la cible. On utilise un booléen "trouve" initialisé à FAUX, mis à VRAI quand on trouve. C''est l''algorithme de recherche le plus basique et le plus universel.',
 'ALGORITHME_RechercheSeq;
VARIABLES
  i : ENTIER;
  cible : ENTIER;
  trouve : BOOLEEN;
DEBUT
  cible <- 7;
  trouve <- FAUX;
  // Simuler la recherche dans les valeurs 1 à 10
  POUR i ALLANT DE 1 A 10 FAIRE
    SI i = cible ALORS
      trouve <- VRAI;
      ECRIRE("Trouvee a la position ", i);
    FINSI
  FINPOUR
  SI NON trouve ALORS
    ECRIRE("Valeur non trouvee");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'boucle_recherche', 35, 8),

-- 9. Validation par boucle (NOUVEAU)
(course_loops_id,
 'Validation de saisie  boucle de contrôle',
 'Une boucle TANTQUE peut valider une saisie utilisateur : on répète la demande tant que la valeur est incorrecte. C''est un pattern fondamental pour les applications robustes. La boucle ne s''arrête que quand l''utilisateur entre une valeur valide.',
 'ALGORITHME_Validation;
VARIABLES
  note : ENTIER;
  age : ENTIER;
DEBUT
  // Valider une note entre 0 et 20
  ECRIRE("Entrez une note entre 0 et 20 :");
  LIRE(note);
  TANTQUE note < 0 OU note > 20 FAIRE
    ECRIRE("Valeur invalide ! Entrez un nombre entre 0 et 20 :");
    LIRE(note);
  FINTANTQUE
  ECRIRE("Note validee : ", note);
  // Valider un age
  ECRIRE("Entrez votre age :");
  LIRE(age);
  TANTQUE age < 0 OU age > 130 FAIRE
    ECRIRE("Age impossible ! Recommencez :");
    LIRE(age);
  FINTANTQUE
  ECRIRE("Age valide : ", age, " ans");
FIN',
 NULL, NULL, NULL, NULL, 'boucle_validation', 35, 9),

-- 10. Exercice Niveau 3
(course_loops_id,
 'EXERCICE : Valider le Niveau 3',
 'Mettez en pratique les boucles TANTQUE.',
 'ALGORITHME_Validation3;
VARIABLE
  n : ENTIER;
DEBUT
  n <- 1;
  // 0crire une boucle TANTQUE qui affiche 1, 2, 3
FIN',
 'Créez une boucle TANTQUE qui affiche les nombres de 1 à 3, un par ligne. Le programme doit afficher exactement : 1 (retour ligne) 2 (retour ligne) 3',
 'ALGORITHME_Validation3;
VARIABLE
  n : ENTIER;
DEBUT
  n <- 1;
  TANTQUE n <= 3 FAIRE
    ECRIRE(n);
    n <- n + 1;
  FINTANTQUE
FIN',
 '1
2
3', NULL, 'exercice', 50, 10);


-- ======================================================================
-- NIVEAU 4 : TABLEAUX 1D (10 leçons)
-- ======================================================================
INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES

-- 1. Définition et accès
(course_arrays_id,
 'Définition et accès aux cases',
 'Un tableau est une variable spéciale qui stocke plusieurs valeurs du même type. On le déclare avec "Tableau Nom[taille] : TYPE". Les cases sont numérotées à partir de 0. On accède à une case avec T[indice].',
 'ALGORITHME_Tableau1D;
VARIABLE
  Tableau T[3] : ENTIER;
DEBUT
  T[0] <- 10;
  T[1] <- 20;
  T[2] <- 30;
  ECRIRE(T[0]);
  ECRIRE(T[1]);
  ECRIRE(T[2]);
FIN',
 NULL, NULL, NULL, NULL, 'tableau', 25, 1),

-- 2. Initialisation d'un tableau (NOUVEAU)
(course_arrays_id,
 'Initialisation d''un tableau',
 'Initialiser un tableau consiste à affecter une valeur de départ à chaque case avant de l''utiliser. On utilise une boucle POUR pour initialiser toutes les cases en une fois. C''est une bonne pratique : ne jamais lire une case non initialisée.',
 'ALGORITHME_TabInit;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
DEBUT
  // Initialiser toutes les cases à 0
  POUR i ALLANT DE 0 A 4 FAIRE
    T[i] <- 0;
  FINPOUR
  // Affecter des valeurs spécifiques
  T[0] <- 100;
  T[2] <- 200;
  T[4] <- 300;
  // Afficher le tableau
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE("T[", i, "] = ", T[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_init', 30, 2),

-- 3. Parcours avec boucle
(course_arrays_id,
 'Parcours avec boucle POUR',
 'La boucle POUR est idéale pour parcourir un tableau. On utilise la variable de boucle comme indice : T[i] accède à la case i. On commence à 0 et on va jusqu''à taille-1.',
 'ALGORITHME_ParcoursTablau;
VARIABLES
  Tableau notes[4] : ENTIER;
  i : ENTIER;
DEBUT
  notes[0] <- 12;
  notes[1] <- 15;
  notes[2] <- 9;
  notes[3] <- 18;
  POUR i ALLANT DE 0 A 3 FAIRE
    ECRIRE(notes[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_parcours', 25, 3),

-- 4. Somme et moyenne (NOUVEAU)
(course_arrays_id,
 'Calculer somme et moyenne d''un tableau',
 'Calculer la somme d''un tableau nécessite un accumulateur initialisé à 0 avant la boucle. On additionne chaque élément dans la boucle. La moyenne est la somme divisée par le nombre d''éléments. Attention : la division d''entiers donne un entier, utilisez REEL si besoin.',
 'ALGORITHME_SommeMoyenne;
VARIABLES
  Tableau notes[5] : ENTIER;
  i : ENTIER;
  somme : ENTIER;
  moyenne : REEL;
DEBUT
  notes[0] <- 12;
  notes[1] <- 15;
  notes[2] <- 9;
  notes[3] <- 18;
  notes[4] <- 11;
  somme <- 0;
  POUR i ALLANT DE 0 A 4 FAIRE
    somme <- somme + notes[i];
  FINPOUR
  moyenne <- somme / 5;
  ECRIRE("Somme des notes : ", somme);
  ECRIRE("Moyenne : ", moyenne);
  SI moyenne >= 10 ALORS
    ECRIRE("Classe admise !");
  SINON
    ECRIRE("Classe recalee.");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'tableau_somme', 35, 4),

-- 5. Maximum et minimum (NOUVEAU)
(course_arrays_id,
 'Trouver le maximum et le minimum',
 'Pour trouver le maximum, on suppose que le premier élément est le max, puis on parcourt le reste : si on trouve plus grand, on met à jour le max. Même logique pour le minimum. On retient aussi l''indice du max/min pour savoir où il se trouve.',
 'ALGORITHME_MaxMin;
VARIABLES
  Tableau prix[5] : ENTIER;
  i : ENTIER;
  max : ENTIER;
  min : ENTIER;
  indice_max : ENTIER;
  indice_min : ENTIER;
DEBUT
  prix[0] <- 45;
  prix[1] <- 12;
  prix[2] <- 78;
  prix[3] <- 33;
  prix[4] <- 6;
  max <- prix[0];
  min <- prix[0];
  indice_max <- 0;
  indice_min <- 0;
  POUR i ALLANT DE 1 A 4 FAIRE
    SI prix[i] > max ALORS
      max <- prix[i];
      indice_max <- i;
    FINSI
    SI prix[i] < min ALORS
      min <- prix[i];
      indice_min <- i;
    FINSI
  FINPOUR
  ECRIRE("Prix maximum : ", max, " (indice ", indice_max, ")");
  ECRIRE("Prix minimum : ", min, " (indice ", indice_min, ")");
FIN',
 NULL, NULL, NULL, NULL, 'tableau_max_min', 35, 5),

-- 6. Recherche dans un tableau (NOUVEAU)
(course_arrays_id,
 'Recherche dans un tableau',
 'La recherche séquentielle parcourt le tableau case par case jusqu''à trouver la valeur cherchée. On stocke l''indice de la valeur trouvée (-1 si absente). C''est l''algorithme de recherche le plus simple.',
 'ALGORITHME_TabRecherche;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
  cible : ENTIER;
  indice : ENTIER;
DEBUT
  T[0] <- 10;
  T[1] <- 25;
  T[2] <- 8;
  T[3] <- 42;
  T[4] <- 17;
  cible <- 42;
  indice <- -1;
  POUR i ALLANT DE 0 A 4 FAIRE
    SI T[i] = cible ALORS
      indice <- i;
    FINSI
  FINPOUR
  SI indice <> -1 ALORS
    ECRIRE("Valeur ", cible, " trouvee a l''indice ", indice);
  SINON
    ECRIRE("Valeur ", cible, " non trouvee dans le tableau");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'tableau_recherche', 35, 6),

-- 7. Insertion et modification (NOUVEAU)
(course_arrays_id,
 'Insertion et modification d''éléments',
 'Modifier un élément d''un tableau se fait simplement par affectation : T[i] <- nouvelle_valeur. On peut aussi remplir un tableau programmatiquement avec une boucle. Utile pour créer des séquences (multiples, puissances, etc.).',
 'ALGORITHME_TabModif;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
DEBUT
  // Remplir avec les multiples de 3
  POUR i ALLANT DE 0 A 4 FAIRE
    T[i] <- (i + 1) * 3;
  FINPOUR
  ECRIRE("Tableau initial :");
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE("T[", i, "] = ", T[i]);
  FINPOUR
  // Modifier l''element central
  T[2] <- 999;
  ECRIRE("Apres modification de T[2] :");
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE("T[", i, "] = ", T[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_insertion', 30, 7),

-- 8. Copie de tableau (NOUVEAU)
(course_arrays_id,
 'Copier un tableau',
 'Copier un tableau consiste à recopier chaque élément un par un dans un nouveau tableau. On ne peut pas écrire B <- A pour copier un tableau entier : il faut une boucle. Modifier B après copie ne change pas A, et inversement.',
 'ALGORITHME_TabCopie;
VARIABLES
  Tableau A[4] : ENTIER;
  Tableau B[4] : ENTIER;
  i : ENTIER;
DEBUT
  A[0] <- 5;
  A[1] <- 10;
  A[2] <- 15;
  A[3] <- 20;
  // Copier A dans B
  POUR i ALLANT DE 0 A 3 FAIRE
    B[i] <- A[i];
  FINPOUR
  // Modifier B ne change pas A
  B[0] <- 999;
  ECRIRE("A apres modification de B :");
  POUR i ALLANT DE 0 A 3 FAIRE
    ECRIRE("A[", i, "] = ", A[i]);
  FINPOUR
  ECRIRE("B apres modification :");
  POUR i ALLANT DE 0 A 3 FAIRE
    ECRIRE("B[", i, "] = ", B[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_copie', 35, 8),

-- 9. Tri à bulles (NOUVEAU)
(course_arrays_id,
 'Tri à bulles  trier un tableau',
 'Le tri à bulles compare des paires d''éléments adjacents et les échange si ils sont dans le mauvais ordre. On répète ce processus jusqu''à ce que le tableau soit trié. C''est le tri le plus simple à comprendre, même si ce n''est pas le plus rapide.',
 'ALGORITHME_TriBulles;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  temp : ENTIER;
DEBUT
  T[0] <- 64;
  T[1] <- 25;
  T[2] <- 12;
  T[3] <- 22;
  T[4] <- 11;
  ECRIRE("Avant tri :");
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(T[i]);
  FINPOUR
  // Tri a bulles
  POUR i ALLANT DE 0 A 3 FAIRE
    POUR j ALLANT DE 0 A 3 FAIRE
      SI T[j] > T[j+1] ALORS
        temp <- T[j];
        T[j] <- T[j+1];
        T[j+1] <- temp;
      FINSI
    FINPOUR
  FINPOUR
  ECRIRE("Apres tri :");
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(T[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_tri', 40, 9),

-- 10. Inverser un tableau (NOUVEAU)
(course_arrays_id,
 'Inverser les éléments d''un tableau',
 'Inverser un tableau consiste à échanger le premier élément avec le dernier, le deuxième avec l''avant-dernier, etc. On utilise une boucle qui s''arrête à la moitié du tableau, et une variable temporaire pour l''échange.',
 'ALGORITHME_TabInverse;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
  temp : ENTIER;
  N : ENTIER;
DEBUT
  T[0] <- 10; T[1] <- 20; T[2] <- 30; T[3] <- 40; T[4] <- 50;
  N <- 5;
  POUR i ALLANT DE 0 A 1 FAIRE
    temp <- T[i];
    T[i] <- T[N - 1 - i];
    T[N - 1 - i] <- temp;
  FINPOUR
  ECRIRE("Tableau inverse :");
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(T[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_inverse', 40, 10),

-- 11. Décalage des éléments (NOUVEAU)
(course_arrays_id,
 'Décalage des éléments',
 'Le décalage (shift en anglais) consiste à déplacer chaque élément vers la gauche ou la droite. Pour un décalage à droite, on commence par la fin pour ne pas écraser les valeurs. Le dernier élément peut être mis de côté et replacé au début (décalage circulaire).',
 'ALGORITHME_TabDecalage;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
  dernier : ENTIER;
DEBUT
  T[0] <- 1; T[1] <- 2; T[2] <- 3; T[3] <- 4; T[4] <- 5;
  dernier <- T[4];
  // Decalage simple sans syntaxe PAS
  T[4] <- T[3];
  T[3] <- T[2];
  T[2] <- T[1];
  T[1] <- T[0];
  T[0] <- dernier;
  ECRIRE("Apres decalage circulaire :");
  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(T[i]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'tableau_decalage', 40, 11),

-- 12. Exercice Niveau 4
(course_arrays_id,
 'EXERCICE : Valider le Niveau 4',
 'Mettez en pratique la déclaration et l''accès à un tableau.',
 'ALGORITHME_Validation4;
VARIABLE
  Tableau T[2] : ENTIER;
DEBUT
  // Affecter T[0] = 7, T[1] = 9, puis afficher T[1]
FIN',
 'Créez un tableau T de taille 2 (type ENTIER). Affectez T[0] = 7 et T[1] = 9. Affichez uniquement T[1]. La sortie attendue est : 9',
 'ALGORITHME_Validation4;
VARIABLE
  Tableau T[2] : ENTIER;
DEBUT
  T[0] <- 7;
  T[1] <- 9;
  ECRIRE(T[1]);
FIN',
 '9', NULL, 'exercice', 50, 12);


-- ======================================================================
-- NIVEAU 5 : MATRICES 2D (10 leçons)
-- ======================================================================
INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES

-- 1. Déclaration et accès
(course_matrices_id,
 'Déclaration et accès aux cellules',
 'Une matrice est un tableau à deux dimensions. On la déclare avec "Tableau Nom[lignes, colonnes] : TYPE". L''accès se fait avec M[i, j] où i est la ligne et j la colonne. Les indices commencent à 0 dans les deux dimensions.',
 'ALGORITHME_Matrice2D;
VARIABLE
  Tableau M[2, 3] : ENTIER;
DEBUT
  M[0, 0] <- 1; M[0, 1] <- 2; M[0, 2] <- 3;
  M[1, 0] <- 4; M[1, 1] <- 5; M[1, 2] <- 6;
  ECRIRE("M[0, 2] = ", M[0, 2]);
  ECRIRE("M[1, 1] = ", M[1, 1]);
FIN',
 NULL, NULL, NULL, NULL, 'matrice', 25, 1),

-- 2. Initialisation d'une matrice (NOUVEAU)
(course_matrices_id,
 'Initialisation d''une matrice',
 'Pour initialiser toutes les cellules d''une matrice, on utilise deux boucles imbriquées : la boucle externe pour les lignes, la boucle interne pour les colonnes. On peut créer la matrice identité (1 sur la diagonale, 0 ailleurs) de cette façon.',
 'ALGORITHME_MatInit;
VARIABLES
  Tableau M[3, 3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
DEBUT
  // Initialiser tout à 0
  POUR i ALLANT DE 0 A 2 FAIRE
    POUR j ALLANT DE 0 A 2 FAIRE
      M[i, j] <- 0;
    FINPOUR
  FINPOUR
  // Placer 1 sur la diagonale principale (matrice identite)
  POUR i ALLANT DE 0 A 2 FAIRE
    M[i, i] <- 1;
  FINPOUR
  // Afficher
  POUR i ALLANT DE 0 A 2 FAIRE
    POUR j ALLANT DE 0 A 2 FAIRE
      ECRIRE(M[i, j]);
    FINPOUR
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'matrice_init', 30, 2),

-- 3. Parcours en double boucle
(course_matrices_id,
 'Parcours en double boucle',
 'Pour parcourir une matrice complète, on utilise deux boucles imbriquées : la boucle externe parcourt les lignes (i), la boucle interne parcourt les colonnes (j). On lit chaque cellule M[i, j].',
 'ALGORITHME_ParcoursMatrice;
VARIABLES
  Tableau M[2, 2] : ENTIER;
  i : ENTIER;
  j : ENTIER;
DEBUT
  M[0, 0] <- 1; M[0, 1] <- 2;
  M[1, 0] <- 3; M[1, 1] <- 4;
  POUR i ALLANT DE 0 A 1 FAIRE
    POUR j ALLANT DE 0 A 1 FAIRE
      ECRIRE(M[i, j]);
    FINPOUR
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'matrice_parcours', 25, 3),

-- 4. Somme des éléments (NOUVEAU)
(course_matrices_id,
 'Calculer la somme de tous les éléments',
 'Pour additionner tous les éléments d''une matrice, on utilise un accumulateur initialisé à 0 et deux boucles imbriquées. On additionne M[i, j] à chaque itération interne.',
 'ALGORITHME_MatSomme;
VARIABLES
  Tableau M[3, 3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  somme : ENTIER;
DEBUT
  M[0, 0] <- 1; M[0, 1] <- 2; M[0, 2] <- 3;
  M[1, 0] <- 4; M[1, 1] <- 5; M[1, 2] <- 6;
  M[2, 0] <- 7; M[2, 1] <- 8; M[2, 2] <- 9;
  somme <- 0;
  POUR i ALLANT DE 0 A 2 FAIRE
    POUR j ALLANT DE 0 A 2 FAIRE
      somme <- somme + M[i, j];
    FINPOUR
  FINPOUR
  ECRIRE("Somme de tous les elements : ", somme);
FIN',
 NULL, NULL, NULL, NULL, 'matrice_somme', 35, 4),

-- 5. Diagonale principale (NOUVEAU)
(course_matrices_id,
 'La diagonale principale',
 'La diagonale principale d''une matrice carrée contient les éléments M[i, i] (même ligne et colonne). Pour une matrice NN, la diagonale a N éléments. Un seul POUR suffit pour la parcourir, sans boucle imbriquée.',
 'ALGORITHME_Diagonale;
VARIABLES
  Tableau M[4, 4] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  somme_diag : ENTIER;
DEBUT
  // Remplir la matrice avec i*4+j+1
  POUR i ALLANT DE 0 A 3 FAIRE
    POUR j ALLANT DE 0 A 3 FAIRE
      M[i, j] <- i * 4 + j + 1;
    FINPOUR
  FINPOUR
  // Calculer la somme de la diagonale
  somme_diag <- 0;
  POUR i ALLANT DE 0 A 3 FAIRE
    ECRIRE("Diagonale M[", i, ", ", i, "] = ", M[i, i]);
    somme_diag <- somme_diag + M[i, i];
  FINPOUR
  ECRIRE("Somme de la diagonale : ", somme_diag);
FIN',
 NULL, NULL, NULL, NULL, 'matrice_diagonale', 35, 5),

-- 6. Somme ligne et colonne (NOUVEAU)
(course_matrices_id,
 'Somme d''une ligne et d''une colonne',
 'Pour calculer la somme d''une ligne spécifique i, on parcourt j de 0 à C-1. Pour calculer la somme d''une colonne spécifique j, on parcourt i de 0 à L-1. Un seul POUR suffit dans chaque cas.',
 'ALGORITHME_LigneCol;
VARIABLES
  Tableau M[3, 3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  somme_lig : ENTIER;
  somme_col : ENTIER;
DEBUT
  M[0, 0] <- 1; M[0, 1] <- 2; M[0, 2] <- 3;
  M[1, 0] <- 4; M[1, 1] <- 5; M[1, 2] <- 6;
  M[2, 0] <- 7; M[2, 1] <- 8; M[2, 2] <- 9;
  // Somme de la ligne 1
  somme_lig <- 0;
  POUR j ALLANT DE 0 A 2 FAIRE
    somme_lig <- somme_lig + M[1, j];
  FINPOUR
  ECRIRE("Somme ligne 1 : ", somme_lig);
  // Somme de la colonne 2
  somme_col <- 0;
  POUR i ALLANT DE 0 A 2 FAIRE
    somme_col <- somme_col + M[i, 2];
  FINPOUR
  ECRIRE("Somme colonne 2 : ", somme_col);
FIN',
 NULL, NULL, NULL, NULL, 'matrice_ligne_col', 35, 6),

-- 7. Maximum dans une matrice (NOUVEAU)
(course_matrices_id,
 'Trouver le maximum d''une matrice',
 'Trouver le maximum d''une matrice suit la même logique que pour un tableau : on suppose que M[0, 0] est le max, puis on compare chaque cellule. On retient aussi la position (ligne, colonne) du maximum.',
 'ALGORITHME_MatMax;
VARIABLES
  Tableau M[3, 4] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  max : ENTIER;
  lig_max : ENTIER;
  col_max : ENTIER;
DEBUT
  M[0, 0] <- 3; M[0, 1] <- 7; M[0, 2] <- 1; M[0, 3] <- 9;
  M[1, 0] <- 5; M[1, 1] <- 2; M[1, 2] <- 8; M[1, 3] <- 4;
  M[2, 0] <- 6; M[2, 1] <- 0; M[2, 2] <- 15; M[2, 3] <- 3;
  max <- M[0, 0];
  lig_max <- 0;
  col_max <- 0;
  POUR i ALLANT DE 0 A 2 FAIRE
    POUR j ALLANT DE 0 A 3 FAIRE
      SI M[i, j] > max ALORS
        max <- M[i, j];
        lig_max <- i;
        col_max <- j;
      FINSI
    FINPOUR
  FINPOUR
  ECRIRE("Maximum : ", max);
  ECRIRE("Position : ligne ", lig_max, ", colonne ", col_max);
FIN',
 NULL, NULL, NULL, NULL, 'matrice_max', 40, 7),

-- 8. Vérification de symétrie (NOUVEAU)
(course_matrices_id,
 'Vérifier la symétrie d''une matrice',
 'Une matrice carrée est symétrique si M[i, j] = M[j, i] pour tous i et j. On vérifie cela en comparant la partie triangulaire supérieure à la partie inférieure. Un seul élément différent suffit à invalider la symétrie.',
 'ALGORITHME_Symetrie;
VARIABLES
  Tableau M[3, 3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  symetrique : BOOLEEN;
DEBUT
  M[0, 0] <- 1; M[0, 1] <- 2; M[0, 2] <- 3;
  M[1, 0] <- 2; M[1, 1] <- 5; M[1, 2] <- 4;
  M[2, 0] <- 3; M[2, 1] <- 4; M[2, 2] <- 9;
  symetrique <- VRAI;
  POUR i ALLANT DE 0 A 2 FAIRE
    POUR j ALLANT DE 0 A 2 FAIRE
      SI M[i, j] <> M[j, i] ALORS
        symetrique <- FAUX;
      FINSI
    FINPOUR
  FINPOUR
  SI symetrique ALORS
    ECRIRE("La matrice est symetrique");
  SINON
    ECRIRE("La matrice n''est PAS symetrique");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'matrice_symetrie', 40, 8),

-- 9. Transposée d'une matrice (NOUVEAU)
(course_matrices_id,
 'Transposée d''une matrice',
 'La transposée d''une matrice M de taille LC est une matrice T de taille CL où T[j, i] = M[i, j]. On "retourne" la matrice autour de sa diagonale : les lignes deviennent colonnes et vice versa.',
 'ALGORITHME_Transposee;
VARIABLES
  Tableau M[2, 3] : ENTIER;
  Tableau T[3, 2] : ENTIER;
  i : ENTIER;
  j : ENTIER;
DEBUT
  M[0, 0] <- 1; M[0, 1] <- 2; M[0, 2] <- 3;
  M[1, 0] <- 4; M[1, 1] <- 5; M[1, 2] <- 6;
  // Transposer
  POUR i ALLANT DE 0 A 1 FAIRE
    POUR j ALLANT DE 0 A 2 FAIRE
      T[j, i] <- M[i, j];
    FINPOUR
  FINPOUR
  ECRIRE("Matrice transposee T[3, 2] :");
  POUR i ALLANT DE 0 A 2 FAIRE
    POUR j ALLANT DE 0 A 1 FAIRE
      ECRIRE("T[", i, ", ", j, "] = ", T[i, j]);
    FINPOUR
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'matrice_transposee', 45, 9),

-- 10. Inverser les lignes d'une matrice (NOUVEAU)
(course_matrices_id,
 'Inverser les lignes d''une matrice',
 'Pour inverser une matrice verticalement, on peut échanger ses lignes : la première ligne prend la place de la dernière. On utilise la même logique que pour inverser un tableau, mais appliqué aux indices des lignes.',
 'ALGORITHME_MatriceInverse;
VARIABLES
  Tableau M[4, 3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  temp : ENTIER;
  L : ENTIER;
DEBUT
  L <- 4; // 4 lignes
  M[0, 0]<-1; M[0, 1]<-1; M[0, 2]<-1;
  M[1, 0]<-2; M[1, 1]<-2; M[1, 2]<-2;
  M[2, 0]<-3; M[2, 1]<-3; M[2, 2]<-3;
  M[3, 0]<-4; M[3, 1]<-4; M[3, 2]<-4;
  POUR i ALLANT DE 0 A 1 FAIRE
    POUR j ALLANT DE 0 A 2 FAIRE
      temp <- M[i, j];
      M[i, j] <- M[L - 1 - i, j];
      M[L - 1 - i, j] <- temp;
    FINPOUR
  FINPOUR
  ECRIRE("Lignes inversees");
FIN',
 NULL, NULL, NULL, NULL, 'matrice_inverse', 45, 10),

-- 11. Décalage dans une matrice (NOUVEAU)
(course_matrices_id,
 'Décalage dans une matrice',
 'Le décalage peut s''appliquer aux colonnes ou aux lignes. Pour décaler toutes les colonnes vers la droite, il faut parcourir chaque ligne et appliquer l''algorithme de décalage vu dans les tableaux.',
 'ALGORITHME_MatriceDecalage;
VARIABLES
  Tableau M[2, 3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  dernier : ENTIER;
DEBUT
  M[0, 0]<-1; M[0, 1]<-2; M[0, 2]<-3;
  M[1, 0]<-4; M[1, 1]<-5; M[1, 2]<-6;
  POUR i ALLANT DE 0 A 1 FAIRE
     dernier <- M[i, 2];
     // Decalage manuel sans boucle decroissante
     M[i, 2] <- M[i, 1];
     M[i, 1] <- M[i, 0];
     M[i, 0] <- dernier;
     ECRIRE(M[i, 0], " ", M[i, 1], " ", M[i, 2]);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'matrice_decalage', 45, 11),

-- 12. Exercice Niveau 5
(course_matrices_id,
 'EXERCICE : Valider le Niveau 5',
 'Mettez en pratique les matrices.',
 'ALGORITHME_Validation5;
VARIABLE
  Tableau M[1, 1] : ENTIER;
DEBUT
  // Affecter 100 a M[0, 0] et l''afficher
FIN',
 'Créez une matrice M de taille 1x1 (type ENTIER). Affectez la valeur 100 à M[0, 0] et affichez-la. La sortie attendue est : 100',
 'ALGORITHME_Validation5;
VARIABLE
  Tableau M[1, 1] : ENTIER;
DEBUT
  M[0, 0] <- 100;
  ECRIRE(M[0, 0]);
FIN',
 '100', NULL, 'exercice', 50, 12);


-- ======================================================================
-- NIVEAU 6 : ENREGISTREMENTS (9 leçons)
-- ======================================================================
INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES

-- 1. Définition et utilisation
(course_structs_id,
 'Définition et utilisation d''un enregistrement',
 'Un ENREGISTREMENT regroupe plusieurs variables de types différents sous un même nom. On le définit avec TYPE...ENREGISTREMENT...FIN. On instancie une variable de ce type. L''accès aux champs se fait avec la notation pointée : variable.champ.',
 'ALGORITHME_Struct;
TYPE Personne = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
  score : REEL;
FIN Personne

VARIABLE
  p : Personne;
DEBUT
  p.nom <- "Alice";
  p.age <- 25;
  p.score <- 17.5;
  ECRIRE(p.nom);
  ECRIRE(p.age);
  ECRIRE(p.score);
FIN',
 NULL, NULL, NULL, NULL, 'struct', 25, 1),

-- 2. Accès aux champs (NOUVEAU)
(course_structs_id,
 'Accès aux champs avec conditions',
 'On peut utiliser les champs d''un enregistrement dans des expressions et des conditions. La logique est la même qu''avec des variables ordinaires, mais on accède aux données via la notation pointée.',
 'ALGORITHME_StructChamps;
TYPE Etudiant = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  note : REEL;
  admis : BOOLEEN;
FIN Etudiant

VARIABLE
  e : Etudiant;
DEBUT
  e.nom <- "Lucas";
  e.note <- 14.5;
  e.admis <- VRAI;
  ECRIRE("Nom    : ", e.nom);
  ECRIRE("Note   : ", e.note);
  SI e.note >= 10 ALORS
    e.admis <- VRAI;
    ECRIRE("Statut : Admis !");
  SINON
    e.admis <- FAUX;
    ECRIRE("Statut : Recale.");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'struct_champs', 30, 2),

-- 3. Modification de champs (NOUVEAU)
(course_structs_id,
 'Modifier les champs d''un enregistrement',
 'Les champs d''un enregistrement sont modifiables comme n''importe quelle variable. On peut calculer de nouvelles valeurs à partir des champs existants. Parfait pour modéliser des objets dont l''état change (compte bancaire, stock de produits, etc.).',
 'ALGORITHME_StructModif;
TYPE CompteBancaire = ENREGISTREMENT
  titulaire : CHAINE DE CARACTERE;
  solde : REEL;
  transactions : ENTIER;
FIN CompteBancaire

VARIABLE
  c : CompteBancaire;
DEBUT
  c.titulaire <- "Jean Martin";
  c.solde <- 1500.0;
  c.transactions <- 0;
  ECRIRE("Solde initial : ", c.solde, " euros");
  // Depot
  c.solde <- c.solde + 500.0;
  c.transactions <- c.transactions + 1;
  ECRIRE("Apres depot de 500 : ", c.solde, " euros");
  // Retrait
  c.solde <- c.solde - 200.0;
  c.transactions <- c.transactions + 1;
  ECRIRE("Apres retrait de 200 : ", c.solde, " euros");
  ECRIRE("Nombre de transactions : ", c.transactions);
FIN',
 NULL, NULL, NULL, NULL, 'struct_modification', 30, 3),

-- 4. Affichage formaté (NOUVEAU)
(course_structs_id,
 'Affichage formaté d''un enregistrement',
 'En pratique, on crée souvent des procédures d''affichage pour les enregistrements. En BQL basique, on affiche chaque champ manuellement avec ECRIRE. On peut combiner des conditions pour enrichir l''affichage.',
 'ALGORITHME_StructAffichage;
TYPE Produit = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  prix : REEL;
  stock : ENTIER;
  disponible : BOOLEEN;
FIN Produit

VARIABLE
  p : Produit;
DEBUT
  p.nom <- "Clavier Mecanique";
  p.prix <- 89.99;
  p.stock <- 15;
  p.disponible <- VRAI;
  ECRIRE("=== Fiche Produit ===");
  ECRIRE("Nom      : ", p.nom);
  ECRIRE("Prix     : ", p.prix, " euros");
  ECRIRE("Stock    : ", p.stock, " unites");
  SI p.stock > 0 ALORS
    ECRIRE("Statut   : Disponible");
  SINON
    ECRIRE("Statut   : Rupture de stock");
  FINSI
  SI p.prix > 50 ALORS
    ECRIRE("Categorie: Produit premium");
  SINON
    ECRIRE("Categorie: Produit economique");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'struct_affichage', 30, 4),

-- 5. Tableau d'enregistrements (NOUVEAU)
(course_structs_id,
 'Tableau d''enregistrements',
 'On peut créer un tableau dont chaque case est un enregistrement. On accède aux champs d''un élément avec tableau[indice].champ. C''est la base des bases de données en mémoire : une liste de fiches.',
 'ALGORITHME_TableauStructs;
TYPE Eleve = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  note : ENTIER;
  mention : CHAINE DE CARACTERE;
FIN Eleve

VARIABLES
  Tableau classe[4] : Eleve;
  i : ENTIER;
DEBUT
  classe[0].nom <- "Alice"; classe[0].note <- 17;
  classe[1].nom <- "Bob"; classe[1].note <- 11;
  classe[2].nom <- "Chloe"; classe[2].note <- 9;
  classe[3].nom <- "David"; classe[3].note <- 14;
  // Affecter mentions
  POUR i ALLANT DE 0 A 3 FAIRE
    SI classe[i].note >= 16 ALORS
      classe[i].mention <- "Tres bien";
    SINONSI classe[i].note >= 14 ALORS
      classe[i].mention <- "Bien";
    SINONSI classe[i].note >= 12 ALORS
      classe[i].mention <- "Assez bien";
    SINONSI classe[i].note >= 10 ALORS
      classe[i].mention <- "Passable";
    SINON
      classe[i].mention <- "Insuffisant";
    FINSI
  FINPOUR
  // Afficher le bulletin
  POUR i ALLANT DE 0 A 3 FAIRE
    ECRIRE(classe[i].nom, " : ", classe[i].note, "/20 - ", classe[i].mention);
  FINPOUR
FIN',
 NULL, NULL, NULL, NULL, 'struct_tableau', 40, 5),

-- 6. Recherche dans un tableau de structs (NOUVEAU)
(course_structs_id,
 'Recherche dans un tableau d''enregistrements',
 'Chercher le meilleur élève dans un tableau d''enregistrements consiste à chercher la valeur maximale d''un champ. On retient l''indice du meilleur, puis on accède à ses autres champs. Pattern fondamental des bases de données.',
 'ALGORITHME_StructRecherche;
TYPE Joueur = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  score : ENTIER;
  niveau : ENTIER;
FIN Joueur

VARIABLES
  Tableau joueurs[4] : Joueur;
  i : ENTIER;
  meilleur : ENTIER;
DEBUT
  joueurs[0].nom <- "Zizou"; joueurs[0].score <- 950; joueurs[0].niveau <- 5;
  joueurs[1].nom <- "Messi"; joueurs[1].score <- 1200; joueurs[1].niveau <- 8;
  joueurs[2].nom <- "Ronaldo"; joueurs[2].score <- 1100; joueurs[2].niveau <- 7;
  joueurs[3].nom <- "Neymar"; joueurs[3].score <- 880; joueurs[3].niveau <- 4;
  meilleur <- 0;
  POUR i ALLANT DE 1 A 3 FAIRE
    SI joueurs[i].score > joueurs[meilleur].score ALORS
      meilleur <- i;
    FINSI
  FINPOUR
  ECRIRE("=== Meilleur joueur ===");
  ECRIRE("Nom    : ", joueurs[meilleur].nom);
  ECRIRE("Score  : ", joueurs[meilleur].score);
  ECRIRE("Niveau : ", joueurs[meilleur].niveau);
FIN',
 NULL, NULL, NULL, NULL, 'struct_recherche', 40, 6),

-- 7. Comparaison d'enregistrements (NOUVEAU)
(course_structs_id,
 'Comparer des enregistrements',
 'Comparer deux enregistrements signifie comparer leurs champs. On ne peut pas écrire r1 = r2 pour comparer deux enregistrements : il faut comparer champ par champ. On peut calculer des valeurs dérivées (aire, volume) et les comparer.',
 'ALGORITHME_StructComp;
TYPE Rectangle = ENREGISTREMENT
  largeur : ENTIER;
  hauteur : ENTIER;
FIN Rectangle

VARIABLES
  r1 : Rectangle;
  r2 : Rectangle;
  aire1 : ENTIER;
  aire2 : ENTIER;
  perim1 : ENTIER;
  perim2 : ENTIER;
DEBUT
  r1.largeur <- 8; r1.hauteur <- 5;
  r2.largeur <- 4; r2.hauteur <- 11;
  aire1 <- r1.largeur * r1.hauteur;
  aire2 <- r2.largeur * r2.hauteur;
  perim1 <- 2 * (r1.largeur + r1.hauteur);
  perim2 <- 2 * (r2.largeur + r2.hauteur);
  ECRIRE("Rectangle 1 : ", r1.largeur, "x", r1.hauteur);
  ECRIRE("  Aire : ", aire1, " | Perimetre : ", perim1);
  ECRIRE("Rectangle 2 : ", r2.largeur, "x", r2.hauteur);
  ECRIRE("  Aire : ", aire2, " | Perimetre : ", perim2);
  SI aire1 > aire2 ALORS
    ECRIRE("R1 a la plus grande aire");
  SINONSI aire2 > aire1 ALORS
    ECRIRE("R2 a la plus grande aire");
  SINON
    ECRIRE("Meme aire !");
  FINSI
FIN',
 NULL, NULL, NULL, NULL, 'struct_comparaison', 40, 7),

-- 8. Structures complexes (NOUVEAU)
(course_structs_id,
 'Structures complexes  plusieurs types liés',
 'On peut définir plusieurs types d''enregistrements et les utiliser ensemble. Chaque type modélise un concept du monde réel. Ensemble, ils permettent de construire des systèmes de données élaborés.',
 'ALGORITHME_StructComplexe;
TYPE Adresse = ENREGISTREMENT
  ville : CHAINE DE CARACTERE;
  code_postal : ENTIER;
  pays : CHAINE DE CARACTERE;
FIN Adresse

TYPE Employe = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
  salaire : REEL;
  poste : CHAINE DE CARACTERE;
FIN Employe

VARIABLES
  emp : Employe;
  adr : Adresse;
  salaire_annuel : REEL;
FIN',
 'ALGORITHME_StructComplexe;
TYPE Adresse = ENREGISTREMENT
  ville : CHAINE DE CARACTERE;
  code_postal : ENTIER;
  pays : CHAINE DE CARACTERE;
FIN Adresse

TYPE Employe = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
  salaire : REEL;
  poste : CHAINE DE CARACTERE;
FIN Employe

VARIABLES
  emp : Employe;
  adr : Adresse;
  salaire_annuel : REEL;
DEBUT
  emp.nom <- "Sophie Lemaire";
  emp.age <- 31;
  emp.salaire <- 3200.0;
  emp.poste <- "Developpeur Senior";
  adr.ville <- "Lyon";
  adr.code_postal <- 69001;
  adr.pays <- "France";
  salaire_annuel <- emp.salaire * 12;
  ECRIRE("=== Fiche Employe ===");
  ECRIRE("Nom    : ", emp.nom);
  ECRIRE("Age    : ", emp.age, " ans");
  ECRIRE("Poste  : ", emp.poste);
  ECRIRE("Ville  : ", adr.ville, " (", adr.code_postal, ")");
  ECRIRE("Pays   : ", adr.pays);
  ECRIRE("Salaire mensuel  : ", emp.salaire, " euros");
  ECRIRE("Salaire annuel   : ", salaire_annuel, " euros");
FIN', NULL, NULL, NULL, 'struct_complexe', 45, 8),

-- 9. Exercice Niveau 6
(course_structs_id,
 'EXERCICE : Valider le Niveau 6',
 'Mettez en pratique les enregistrements.',
 'ALGORITHME_Validation6;
// Déclarez un TYPE Joueur avec nom et score
// Puis créez une variable j de type Joueur
DEBUT
FIN',
 'Déclarez un type "Joueur" avec un champ "nom" (CHAINE DE CARACTERE) et un champ "score" (ENTIER). Créez une variable j de type Joueur. Affectez "Zizou" au nom et 10 au score. Affichez uniquement le nom. Sortie attendue : Zizou',
 'ALGORITHME_Validation6;
TYPE Joueur = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  score : ENTIER;
FIN Joueur

VARIABLE
  j : Joueur;
DEBUT
  j.nom <- "Zizou";
  j.score <- 10;
  ECRIRE(j.nom);
FIN',
 'Zizou', NULL, 'exercice', 50, 9);

-- ======================================================================
-- MAJ DES D0FIS FINAUX
-- ======================================================================

UPDATE public.lessons
SET lesson_type = 'challenge',
    title = 'Défi Final : Facture Simplifiée',
    content = 'Vous êtes développeur pour une boutique en ligne. Votre mission est de créer un petit programme de caisse. Le programme doit demander à l''utilisateur de fournir le montant hors taxes (HT) d''un article, puis la quantité souhaitée. Vous devrez ensuite calculer le prix total Toutes Taxes Comprises (TTC) en sachant que le taux de TVA fixe est de 20%. Enfin, affichez uniquement le montant total en sortie.',
    exercise = 'Analysez bien les entrées requises et le calcul à réaliser. Réfléchissez à la façon de stocker la TVA de manière sécurisée puisque c''est une valeur qui ne change jamais.',
    test_cases = '{"exerciseId": "facture_simplifiee", "validationMode": "result_plus_constraints", "goal": "Lire un prix HT et une quantite, appliquer une TVA de 20%, puis afficher uniquement le total TTC.", "inputs": [{"name": "prixHT", "type": "number"}, {"name": "quantite", "type": "integer"}], "expectedOutput": {"kind": "single_number", "strict": true}, "required_keywords": ["CONSTANTE", "LIRE", "ECRIRE"], "hints": ["Lire le prix HT puis la quantite.", "Multiplier par 1.20 pour appliquer la TVA.", "Afficher uniquement le total final."], "cases": [{"input": "100\n2", "output": "240"}, {"input": "50\n1", "output": "60"}]}'::jsonb
WHERE title = 'EXERCICE : Valider le Niveau 1';

UPDATE public.lessons
SET lesson_type = 'challenge',
    title = 'Défi Final : Réduction VIP',
    content = 'Un magasin souhaite automatiser les offres à la caisse. Le programme vous fournira deux données : le montant total des achats du client et son statut (1 pour les clients VIP, 2 pour les clients normaux). Règles : Si le client est VIP (statut 1), il bénéficie d''une réduction spéciale en fonction du montant: si son panier dépasse ou est égal à 100, on lui retire 20 du total. Sinon, on lui offre 5 de remise. Si le client a un statut 2, il n''a aucune réduction. Si tout autre statut est saisi, le programme doit impérativement afficher "Erreur" puis la valeur d''origine. Affichez la somme finale à payer.',
    exercise = 'Construisez une logique décisionnelle à plusieurs embranchements. Pensez à vérifier le statut global d''abord, avant d''affiner le calcul avec des conditions plus précises sur les montants.',
    test_cases = '{"exerciseId": "reduction_vip", "validationMode": "result_plus_constraints", "goal": "Lire un montant et un statut client, appliquer la reduction correcte, puis afficher le montant final.", "inputs": [{"name": "montant", "type": "number"}, {"name": "statut", "type": "integer"}], "expectedOutput": {"kind": "final_output", "strict": true}, "required_keywords": ["SELON", "CAS", "SI", "SINON", "LIRE"], "hints": ["Traiter le statut VIP, normal et invalide.", "Pour un VIP, verifier ensuite le montant.", "Afficher Erreur puis le montant original pour un statut invalide."], "cases": [{"input": "120\n1", "output": "100"}, {"input": "50\n1", "output": "45"}, {"input": "200\n2", "output": "200"}, {"input": "100\n5", "output": "Erreur\n100"}]}'::jsonb
WHERE title = 'EXERCICE : Valider le Niveau 2';

UPDATE public.lessons
SET lesson_type = 'challenge',
    title = 'Défi Final : La Caisse Enregistreuse',
    content = 'Le patron d''une épicerie a besoin d''un logiciel pour calculer le total des paniers. Comme le nombre de produits varie, votre algorithme doit d''abord demander combien d''articles le client achète (N). Ensuite, pour chaque article, l''algorithme doit lire son prix. Afin d''éviter les erreurs de saisie, si un prix scanné est strictement négatif, celui-ci doit être ignoré, le système affichera "Invalide", et ce prix ne sera pas comptabilisé. Une fois tous les articles scannés et validés par le programme, le montant total du panier doit s''afficher à l''écran.',
    exercise = 'Vous allez avoir besoin d''une structure qui se répète le bon nombre de fois et d''une variable qui accumule des valeurs. N''oubliez pas les vérifications d''intégrité des prix avant de les ajouter au total cumulé.',
    test_cases = '{"exerciseId": "caisse_enregistreuse", "validationMode": "result_plus_constraints", "goal": "Lire un nombre d articles, additionner les prix valides et ignorer les prix negatifs.", "inputs": [{"name": "n", "type": "integer"}, {"name": "prix", "type": "number", "repeated": true}], "expectedOutput": {"kind": "final_output", "strict": true}, "required_keywords": ["POUR", "LIRE", "ECRIRE", "SI"], "hints": ["Utiliser un accumulateur pour le total.", "Tester chaque prix avant de l ajouter.", "Afficher Invalide pour un prix negatif."], "cases": [{"input": "3\n10\n-5\n20", "output": "Invalide\n30"}, {"input": "2\n15\n15", "output": "30"}]}'::jsonb
WHERE title = 'EXERCICE : Valider le Niveau 3';

UPDATE public.lessons
SET lesson_type = 'challenge',
    title = 'Défi Final : 0valuation de Classe',
    content = 'Un professeur de mathématiques vous demande un outil d''analyse globale des examens. L''objectif est d''analyser les notes de 3 étudiants. Créez une structure capable de mémoriser 3 notes. Remplissez cette structure en lisant successivement les valeurs. Dans un second temps, parcourez les notes mémorisées pour extraire deux statistiques clés : 1. Trouvez la meilleure note parmi ces évaluations. 2. Comptez exactement combien d''étudiants ont obtenu au moins la moyenne (10 ou plus). Votre algorithme doit d''abord afficher la meilleure note de la classe, suivie, sur une nouvelle ligne, de la quantité d''étudiants ayant réussi.',
    exercise = 'Pour stocker des séries de données liées, utilisez la structure dédiée à l''indexation. Séparez de préférence le remplissage des données de leur analyse statistique lors de la lecture.',
    test_cases = '{"exerciseId": "evaluation_classe", "validationMode": "result_plus_constraints", "goal": "Lire trois notes dans un tableau, trouver la meilleure note et compter les notes au moins egales a 10.", "inputs": [{"name": "notes", "type": "number[]", "count": 3}], "expectedOutput": {"kind": "final_output", "strict": true}, "required_keywords": ["TABLEAU", "POUR", "LIRE", "SI", "ECRIRE"], "hints": ["Remplir le tableau avec une premiere boucle.", "Parcourir les notes pour calculer le maximum et le compteur.", "Afficher la meilleure note puis le nombre de reussites."], "cases": [{"input": "8\n12\n15", "output": "15\n2"}, {"input": "5\n9\n20", "output": "20\n1"}]}'::jsonb
WHERE title = 'EXERCICE : Valider le Niveau 4';

UPDATE public.lessons
SET lesson_type = 'challenge',
    title = 'Défi Final : Carte aux trésors',
    content = 'Vous développez un jeu d''exploration en 2D. Le plateau est représenté par une petite grille de 2 lignes et 2 colonnes. Certaines cases sont vides (0) et d''autres contiennent des pièces d''or (valeur positive). Votre mission : demandez à l''utilisateur les valeurs de votre matrice une par une. Ensuite, parcourez chaque cellule pour calculer puis afficher le butin de toutes les pièces amassées réunies.',
    exercise = 'Utilisez une double boucle non seulement pour remplir votre tableau 2D (LIRE) mais aussi pour en visiter chaque case, afin d''alimenter votre variable accumulatrice.',
    test_cases = '{"exerciseId": "carte_tresors", "validationMode": "result_plus_constraints", "goal": "Lire une matrice 2x2 et afficher la somme de toutes ses valeurs.", "inputs": [{"name": "grille", "type": "number[][]", "rows": 2, "cols": 2}], "expectedOutput": {"kind": "single_number", "strict": true}, "required_keywords": ["POUR", "LIRE", "ECRIRE"], "hints": ["Utiliser deux boucles pour parcourir les lignes et les colonnes.", "Ajouter chaque case a un accumulateur.", "Afficher uniquement le total."], "cases": [{"input": "0\n10\n5\n20", "output": "35"}, {"input": "0\n0\n0\n0", "output": "0"}]}'::jsonb
WHERE title = 'EXERCICE : Valider le Niveau 5';

UPDATE public.lessons
SET lesson_type = 'challenge',
    title = 'Défi Final : Match esport',
    content = 'Vous arbitrez un 1 contre 1. Créez un TYPE Joueur contenant son "pseudo" (chaîne) et ses "degats" infligés (réel). Définissez deux variables de ce type. Le programme doit LIRE dans l''ordre : le pseudo puis les dégâts du joueur 1, suivi du pseudo et dégâts du joueur 2. Comparez les champs "degats" de vos enregistrements et affichez uniquement le pseudo de celui qui a infligé le plus de dégâts (on ignore les égalités).',
    exercise = 'Le type ENREGISTREMENT doit précéder les variables globales. N''oubliez pas la syntaxe à point (joueur.champ) lors de l''affectation et des comparaisons.',
    test_cases = '{"exerciseId": "match_esport", "validationMode": "result_plus_constraints", "goal": "Lire deux joueurs avec leurs degats et afficher le pseudo du joueur le plus performant.", "inputs": [{"name": "joueur1", "type": "record"}, {"name": "joueur2", "type": "record"}], "expectedOutput": {"kind": "final_output", "strict": true}, "required_keywords": ["TYPE", "ENREGISTREMENT", "LIRE", "SI", "ECRIRE"], "hints": ["Modeliser un joueur avec un enregistrement.", "Comparer le champ degats des deux joueurs.", "Afficher uniquement le pseudo gagnant."], "cases": [{"input": "Faker\n12500\nShowmaker\n11200", "output": "Faker"}, {"input": "P1\n8000\nP2\n9500", "output": "P2"}]}'::jsonb
WHERE title = 'EXERCICE : Valider le Niveau 6';

-- ======================================================================
-- EXERCICES SUPPLEMENTAIRES VALIDES PAR METADATA BACKEND
-- ======================================================================

INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES
(course_bases_id,
 'Challenge pratique : Moyenne de trois notes',
 'Objectif : consolider les variables, les entrees, les calculs arithmetiques et l''affichage simple. Le programme lit trois notes, calcule leur moyenne, puis affiche uniquement le resultat numerique.',
 'ALGORITHME_MoyenneTroisNotes;
VARIABLES
  note1 : REEL;
  note2 : REEL;
  note3 : REEL;
  moyenne : REEL;
DEBUT
  // Lisez les trois notes, calculez la moyenne, puis affichez-la.
FIN',
 'Lisez trois notes dans l''ordre, calculez leur moyenne et affichez uniquement la moyenne finale.',
 'ALGORITHME_MoyenneTroisNotes;
VARIABLES
  note1 : REEL;
  note2 : REEL;
  note3 : REEL;
  moyenne : REEL;
DEBUT
  LIRE(note1);
  LIRE(note2);
  LIRE(note3);
  moyenne <- (note1 + note2 + note3) / 3;
  ECRIRE(moyenne);
FIN',
 NULL,
 '{"exerciseId": "moyenne_trois_notes", "validationMode": "result_only"}'::jsonb,
 'challenge', 40, 12),

(course_logic_id,
 'Challenge pratique : Pair ou impair',
 'Objectif : utiliser une condition pour prendre une decision a partir d''un calcul simple. Le programme lit un entier et affiche Pair ou Impair.',
 'ALGORITHME_PairOuImpair;
VARIABLE
  n : ENTIER;
DEBUT
  // Lisez n, puis utilisez SI/SINON pour afficher Pair ou Impair.
FIN',
 'Lisez un entier. Affichez exactement Pair si le nombre est pair, sinon Impair.',
 'ALGORITHME_PairOuImpair;
VARIABLE
  n : ENTIER;
DEBUT
  LIRE(n);
  SI n MOD 2 = 0 ALORS
    ECRIRE("Pair");
  SINON
    ECRIRE("Impair");
  FINSI
FIN',
 NULL,
 '{"exerciseId": "pair_ou_impair", "validationMode": "result_plus_constraints"}'::jsonb,
 'challenge', 45, 11),

(course_loops_id,
 'Challenge pratique : Somme de 1 a n',
 'Objectif : apprendre le schema compteur + accumulateur. Le programme lit n, additionne tous les entiers de 1 a n, puis affiche la somme.',
 'ALGORITHME_SommeN;
VARIABLES
  n : ENTIER;
  i : ENTIER;
  somme : ENTIER;
DEBUT
  // Lisez n, parcourez 1..n avec une boucle, puis affichez la somme.
FIN',
 'Lisez n, calculez 1 + 2 + ... + n avec une boucle, puis affichez uniquement la somme.',
 'ALGORITHME_SommeN;
VARIABLES
  n : ENTIER;
  i : ENTIER;
  somme : ENTIER;
DEBUT
  LIRE(n);
  somme <- 0;
  POUR i ALLANT DE 1 A n FAIRE
    somme <- somme + i;
  FINPOUR
  ECRIRE(somme);
FIN',
 NULL,
 '{"exerciseId": "somme_1_a_n", "validationMode": "result_plus_constraints"}'::jsonb,
 'challenge', 45, 11),

(course_loops_id,
 'Challenge pratique : Table de multiplication',
 'Objectif : repeter un calcul selon un compteur. Le programme lit un entier n et affiche les dix premiers multiples de n, un par ligne.',
 'ALGORITHME_TableMultiplication;
VARIABLES
  n : ENTIER;
  i : ENTIER;
DEBUT
  // Lisez n, puis affichez n*1 jusqu''a n*10.
FIN',
 'Lisez n. Affichez les produits n*1, n*2, ..., n*10, chacun sur une ligne, sans texte supplementaire.',
 'ALGORITHME_TableMultiplication;
VARIABLES
  n : ENTIER;
  i : ENTIER;
DEBUT
  LIRE(n);
  POUR i ALLANT DE 1 A 10 FAIRE
    ECRIRE(n * i);
  FINPOUR
FIN',
 NULL,
 '{"exerciseId": "table_multiplication", "validationMode": "result_plus_constraints"}'::jsonb,
 'challenge', 45, 12),

(course_arrays_id,
 'Challenge pratique : Recherche dans un tableau',
 'Objectif : stocker une serie de valeurs et la parcourir. Le programme lit cinq nombres, lit une cible, puis indique si la cible existe dans le tableau.',
 'ALGORITHME_RechercheTableau;
VARIABLES
  Tableau T[5] : ENTIER;
  cible : ENTIER;
  i : ENTIER;
  trouve : BOOLEEN;
DEBUT
  // Lisez le tableau, lisez la cible, puis affichez Trouve ou Absent.
FIN',
 'Lisez cinq entiers dans un tableau, puis lisez une cible. Affichez exactement Trouve si la cible existe, sinon Absent.',
 'ALGORITHME_RechercheTableau;
VARIABLES
  Tableau T[5] : ENTIER;
  cible : ENTIER;
  i : ENTIER;
  trouve : BOOLEEN;
DEBUT
  POUR i ALLANT DE 0 A 4 FAIRE
    LIRE(T[i]);
  FINPOUR
  LIRE(cible);
  trouve <- FAUX;
  POUR i ALLANT DE 0 A 4 FAIRE
    SI T[i] = cible ALORS
      trouve <- VRAI;
    FINSI
  FINPOUR
  SI trouve ALORS
    ECRIRE("Trouve");
  SINON
    ECRIRE("Absent");
  FINSI
FIN',
 NULL,
 '{"exerciseId": "recherche_tableau", "validationMode": "result_plus_constraints"}'::jsonb,
 'challenge', 55, 14),

(course_structs_id,
 'Challenge pratique : Moyenne d''un groupe d''etudiants',
 'Objectif : utiliser un enregistrement pour modeliser des donnees liees. Le programme lit trois etudiants avec leur note, puis affiche uniquement la moyenne des notes.',
 'ALGORITHME_MoyenneGroupe;
TYPE Etudiant = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  note : REEL;
FIN Etudiant

VARIABLES
  Tableau groupe[3] : Etudiant;
  i : ENTIER;
  somme : REEL;
  moyenne : REEL;
DEBUT
  // Lisez les noms et notes, calculez la moyenne, puis affichez-la.
FIN',
 'Creez un TYPE Etudiant avec nom et note. Lisez trois noms et trois notes dans un tableau d''etudiants, puis affichez uniquement la moyenne des notes.',
 'ALGORITHME_MoyenneGroupe;
TYPE Etudiant = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  note : REEL;
FIN Etudiant

VARIABLES
  Tableau groupe[3] : Etudiant;
  i : ENTIER;
  somme : REEL;
  moyenne : REEL;
DEBUT
  somme <- 0;
  POUR i ALLANT DE 0 A 2 FAIRE
    LIRE(groupe[i].nom);
    LIRE(groupe[i].note);
    somme <- somme + groupe[i].note;
  FINPOUR
  moyenne <- somme / 3;
  ECRIRE(moyenne);
FIN',
 NULL,
 '{"exerciseId": "moyenne_groupe_etudiants", "validationMode": "result_plus_constraints"}'::jsonb,
 'challenge', 60, 10);

-- ======================================================================
-- LEVEL 4 : TRI PAR SELECTION ET TRI PAR INSERTION
-- ======================================================================

INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES
(course_arrays_id,
 'Tri par selection',
 'Le tri par selection cherche le plus petit element dans la zone non triee, puis l''echange avec la premiere case libre. La zone triee grandit de gauche a droite. Le visualiseur montre l''indice courant, le minimum provisoire et l''echange final.',
 'ALGORITHME_TriSelection;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  indiceMin : ENTIER;
  temp : ENTIER;
DEBUT
  T[0] <- 29;
  T[1] <- 10;
  T[2] <- 14;
  T[3] <- 37;
  T[4] <- 13;

  POUR i ALLANT DE 0 A 3 FAIRE
    indiceMin <- i;
    j <- i + 1;
    TANTQUE j <= 4 FAIRE
      SI T[j] < T[indiceMin] ALORS
        indiceMin <- j;
      FINSI
      j <- j + 1;
    FINTANTQUE

    temp <- T[i];
    T[i] <- T[indiceMin];
    T[indiceMin] <- temp;
  FINPOUR

  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(T[i]);
  FINPOUR
FIN',
 'Completez le tri par selection sur un tableau de 5 entiers. Affichez les valeurs triees en ordre croissant.',
 NULL, NULL, '[]'::jsonb, 'tri_selection', 45, 12),

(course_arrays_id,
 'Tri par insertion',
 'Le tri par insertion fonctionne comme des cartes que l''on range dans la main. On prend une valeur cle, on decale les valeurs plus grandes vers la droite, puis on insere la cle a sa bonne position.',
 'ALGORITHME_TriInsertion;
VARIABLES
  Tableau T[5] : ENTIER;
  i : ENTIER;
  j : ENTIER;
  cle : ENTIER;
  continuer : BOOLEEN;
DEBUT
  T[0] <- 8;
  T[1] <- 4;
  T[2] <- 6;
  T[3] <- 2;
  T[4] <- 9;

  POUR i ALLANT DE 1 A 4 FAIRE
    cle <- T[i];
    j <- i - 1;
    continuer <- VRAI;

    TANTQUE continuer FAIRE
      SI j >= 0 ALORS
        SI T[j] > cle ALORS
          T[j + 1] <- T[j];
          j <- j - 1;
        SINON
          continuer <- FAUX;
        FINSI
      SINON
        continuer <- FAUX;
      FINSI
    FINTANTQUE

    T[j + 1] <- cle;
  FINPOUR

  POUR i ALLANT DE 0 A 4 FAIRE
    ECRIRE(T[i]);
  FINPOUR
FIN',
 'Triez un tableau par insertion. Observez la valeur cle, les decalages et l''insertion finale.',
 NULL, NULL, '[]'::jsonb, 'tri_insertion', 45, 13);

-- ======================================================================
-- LEVEL 7 : ADVANCED LOGIC
-- ======================================================================

INSERT INTO public.lessons (course_id, title, content, example_code, exercise, solution, expected_output, test_cases, lesson_type, xp_value, "order") VALUES
(course_advanced_id,
 'Decomposer un probleme',
 'Un probleme avance doit etre coupe en blocs simples : lire les donnees, traiter, decider, afficher. Cette methode rend le programme plus lisible, plus testable et plus facile a corriger.',
 'ALGORITHME_BilanClasse;
VARIABLES
  Tableau notes[4] : REEL;
  i : ENTIER;
  somme : REEL;
  moyenne : REEL;
DEBUT
  somme <- 0;

  POUR i ALLANT DE 0 A 3 FAIRE
    LIRE(notes[i]);
    somme <- somme + notes[i];
  FINPOUR

  moyenne <- somme / 4;

  SI moyenne >= 10 ALORS
    ECRIRE("Classe valide");
  SINON
    ECRIRE("Classe fragile");
  FINSI
FIN',
 'Decoupez un probleme en quatre blocs : lecture, calcul, decision, affichage. Ecrivez un petit bilan a partir de quatre notes.',
 NULL, NULL, '{"exerciseId":"bilan_classe_advanced","projectId":"bilan_classe_advanced","validationMode":"concept_training","requiredModules":["arrays","loops","conditions"],"minimumFeatures":["read class notes","calculate average","display class status"],"optionalBonusFeatures":["count passing notes","class status categories"],"weights":{"correctness":45,"logic":25,"structure":20,"clarity":10},"hiddenScenarios":["average exactly 10","all notes below 10","all notes above 10"],"edgeCases":["decimal notes","same notes repeated"],"maintainabilitySignals":["clear variable names","separate reading calculation decision output"]}'::jsonb, 'advanced_decomposition', 50, 1),

(course_advanced_id,
 'Combiner tableaux, boucles et conditions',
 'Les vrais exercices melangent souvent plusieurs notions. Ici, le tableau stocke les notes, la boucle les parcourt, la condition compte les notes valides, puis l''affichage donne le resultat final.',
 'ALGORITHME_NotesValides;
VARIABLES
  Tableau notes[5] : REEL;
  i : ENTIER;
  valides : ENTIER;
DEBUT
  valides <- 0;

  POUR i ALLANT DE 0 A 4 FAIRE
    LIRE(notes[i]);
    SI notes[i] >= 10 ALORS
      valides <- valides + 1;
    FINSI
  FINPOUR

  ECRIRE(valides);
FIN',
 'Lisez cinq notes et affichez combien sont superieures ou egales a 10.',
 NULL, NULL, '{"exerciseId":"notes_valides_advanced","projectId":"notes_valides_advanced","validationMode":"result_plus_constraints","requiredModules":["arrays","loops","conditions","counter"],"minimumFeatures":["read five notes","count notes >= 10","print the count"],"optionalBonusFeatures":["class average","best note"],"weights":{"correctness":50,"logic":25,"structure":15,"clarity":10},"hiddenScenarios":["no passing notes","all passing notes","only last note passes"],"edgeCases":["note exactly 10","note 0","note 20"],"maintainabilitySignals":["counter initialized once","explicit condition","no manual repeated comparisons"]}'::jsonb, 'advanced_data_flow', 55, 2),

(course_advanced_id,
 'Tracer et deboguer un algorithme',
 'Deboguer signifie rejouer le programme au ralenti. On note les valeurs des variables apres chaque instruction pour trouver le moment exact ou la logique change mal.',
 'ALGORITHME_DebugSomme;
VARIABLES
  Tableau T[3] : ENTIER;
  i : ENTIER;
  somme : ENTIER;
DEBUT
  T[0] <- 4;
  T[1] <- 7;
  T[2] <- 9;
  somme <- 0;

  POUR i ALLANT DE 0 A 2 FAIRE
    somme <- somme + T[i];
    ECRIRE(somme);
  FINPOUR
FIN',
 'Tracez a la main les valeurs de i, T[i] et somme. Verifiez que la sortie progressive est 4, puis 11, puis 20.',
 NULL, NULL, '{"exerciseId":"debug_somme_trace","projectId":"debug_somme_trace","validationMode":"concept_training","requiredModules":["debugging","trace table","accumulator"],"minimumFeatures":["show accumulator values","identify divergence","explain fix"],"optionalBonusFeatures":["trace i and T[i]","compare expected and actual output"],"weights":{"correctness":35,"logic":25,"structure":20,"clarity":20},"hiddenScenarios":["accumulator not initialized","wrong loop bound","wrong increment"],"edgeCases":["first value only","last value skipped"],"maintainabilitySignals":["debug prints removed from final answer","trace explains first wrong step"]}'::jsonb, 'advanced_debug', 50, 3),

(course_advanced_id,
 'Mini-projet : gestion de notes',
 'Un mini-projet assemble modelisation, tableau, boucle, calcul et decision. Le TYPE Etudiant regroupe les informations liees, puis le tableau permet de traiter plusieurs etudiants.',
 'ALGORITHME_GestionNotes;
TYPE Etudiant = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  note : REEL;
FIN Etudiant

VARIABLES
  Tableau groupe[3] : Etudiant;
  i : ENTIER;
  meilleur : ENTIER;
  somme : REEL;
  moyenne : REEL;
DEBUT
  somme <- 0;
  meilleur <- 0;

  POUR i ALLANT DE 0 A 2 FAIRE
    LIRE(groupe[i].nom);
    LIRE(groupe[i].note);
    somme <- somme + groupe[i].note;

    SI groupe[i].note > groupe[meilleur].note ALORS
      meilleur <- i;
    FINSI
  FINPOUR

  moyenne <- somme / 3;
  ECRIRE(moyenne);
  ECRIRE(groupe[meilleur].nom);
FIN',
 'Creez un mini-projet qui lit trois etudiants, calcule la moyenne du groupe et affiche le nom du meilleur etudiant.',
 NULL, NULL, '{"exerciseId":"mini_gestion_notes","projectId":"mini_gestion_notes","validationMode":"project_rubric","requiredModules":["records","arrays","loops","accumulators","maximum search"],"minimumFeatures":["read students","calculate class average","display best student"],"optionalBonusFeatures":["search student","passing count","ranking"],"weights":{"correctness":50,"logic":25,"structure":15,"clarity":10},"hiddenScenarios":["best student first","best student last","tie in top notes"],"edgeCases":["decimal notes","same note repeated"],"maintainabilitySignals":["meaningful field names","no duplicated student variables","best index tracking"]}'::jsonb, 'advanced_mini_project', 65, 4),

(course_advanced_id,
 'Choisir la bonne structure',
 'Un bon algorithme commence par un bon choix de structure. Une variable garde une valeur simple, un tableau garde une liste, une matrice garde une grille et un enregistrement garde des champs lies.',
 'ALGORITHME_ChoixStructure;
TYPE Produit = ENREGISTREMENT
  nom : CHAINE DE CARACTERE;
  prix : REEL;
FIN Produit

VARIABLES
  note : REEL;
  Tableau notes[3] : REEL;
  Tableau grille[2,2] : ENTIER;
  article : Produit;
DEBUT
  note <- 15.5;
  notes[0] <- 12;
  notes[1] <- 14;
  notes[2] <- 16;
  grille[0,0] <- 1;
  grille[0,1] <- 2;
  grille[1,0] <- 3;
  grille[1,1] <- 4;
  article.nom <- "Clavier";
  article.prix <- 250;

  ECRIRE(note);
  ECRIRE(notes[1]);
  ECRIRE(grille[1,0]);
  ECRIRE(article.nom);
FIN',
 'Pour chaque probleme, choisissez : variable, tableau, matrice ou enregistrement. Expliquez pourquoi avant de coder.',
 NULL, NULL, '{"exerciseId":"choix_structure_advanced","projectId":"choix_structure_advanced","validationMode":"concept_training","requiredModules":["variables","arrays","matrices","records"],"minimumFeatures":["choose appropriate structure","justify the choice"],"optionalBonusFeatures":["combine structures for realistic example"],"weights":{"correctness":40,"logic":25,"structure":25,"clarity":10},"hiddenScenarios":["grid data","student profile","list of prices"],"edgeCases":["single value that does not need array","object data that should be a record"],"maintainabilitySignals":["related data grouped together","parallel arrays avoided when records are clearer"]}'::jsonb, 'advanced_review', 50, 5);

END $$;

-- ======================================================================
-- SECURITY: move answer material out of public.lessons after seeding.
-- The seed temporarily uses solution/expected_output/test_cases so the
-- large INSERT blocks stay readable, then stores them in private storage.
-- ======================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.lesson_secrets (
  lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  solution TEXT,
  expected_output TEXT,
  test_cases JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE private.lesson_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO private.lesson_secrets (lesson_id, solution, expected_output, test_cases)
SELECT id, solution, expected_output, COALESCE(test_cases, '[]'::jsonb)
FROM public.lessons
WHERE solution IS NOT NULL
   OR expected_output IS NOT NULL
   OR (test_cases IS NOT NULL AND test_cases <> '[]'::jsonb)
ON CONFLICT (lesson_id) DO UPDATE
SET solution = EXCLUDED.solution,
    expected_output = EXCLUDED.expected_output,
    test_cases = EXCLUDED.test_cases,
    updated_at = NOW();

REVOKE ALL ON private.lesson_secrets FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Les leçons sont visibles par tous" ON public.lessons;
DROP POLICY IF EXISTS "Public lessons safe read" ON public.lessons;
CREATE POLICY "Public lessons safe read"
ON public.lessons
FOR SELECT
USING (true);

REVOKE SELECT ON public.lessons FROM anon, authenticated;
GRANT SELECT (
  id,
  course_id,
  title,
  content,
  example_code,
  exercise,
  lesson_type,
  xp_value,
  "order",
  created_at
) ON public.lessons TO anon, authenticated;

ALTER TABLE public.lessons DROP COLUMN IF EXISTS solution;
ALTER TABLE public.lessons DROP COLUMN IF EXISTS expected_output;
ALTER TABLE public.lessons DROP COLUMN IF EXISTS test_cases;
