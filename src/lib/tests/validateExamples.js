import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeCode } from '../executeCode.js';

const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const DEFAULT_INPUTS = [
  '1', '2', '3', '4', '5',
  '10', '12', '15', '20', '50', '100',
  'Ali', 'Sara', 'O', 'N', 'VRAI',
];

const SCANNED_EXTENSIONS = new Set([
  '.js', '.jsx', '.md', '.sql', '.html',
]);

const IGNORED_DIRS = new Set([
  '.git', 'dist', 'node_modules',
]);

const IGNORED_FILE_PATTERNS = [
  /^database\/(?!seed_courses\.sql)/,
  /^src\/lib\//,
  /^src\/lib\/tests\//,
  /^fix_renderers\.cjs$/,
  /^scratch_script\.js$/,
  /^out\.json$/,
];

function looksLikeBql(text) {
  return /\b(ALGORITHME|DEBUT|VARIABLES?|CONSTANTES?|ECRIRE|LIRE|POUR|TANTQUE|REPETER|SELON|TABLEAU|TYPE|ENREGISTREMENT)\b|<-|←/i.test(text);
}

function isFullProgram(text) {
  return /^\s*ALGORITHME(?:_|[A-Za-z0-9])/i.test(text)
    && /\bDEBUT\b/i.test(text)
    && /\bFIN\b/i.test(text);
}

function hasPlaceholder(text) {
  return /\.\.\.|<[^>\n]+>|\b(nom_du_programme|monprogramme)\b/i.test(text);
}

function unescapeJsString(text) {
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\`/g, '`')
    .replace(/\\\\/g, '\\');
}

function unescapeSqlString(text) {
  return text.replace(/''/g, "'");
}

function normalizeCode(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
}

function addCandidate(candidates, seen, file, kind, raw, index) {
  const code = normalizeCode(raw);
  if (!code || !looksLikeBql(code)) return;

  const key = `${file}:${kind}:${code}`;
  if (seen.has(key)) return;
  seen.add(key);

  candidates.push({
    file,
    kind,
    index,
    code,
    classification: isFullProgram(code) && !hasPlaceholder(code)
      ? 'full'
      : 'fragment',
  });
}

function extractFromMarkdown(file, content, candidates, seen) {
  const fenceRegex = /```(?:bql|txt|text|algo)?\s*\n([\s\S]*?)```/gi;
  let match;
  let index = 0;
  while ((match = fenceRegex.exec(content))) {
    addCandidate(candidates, seen, file, 'markdown-fence', match[1], index++);
  }
}

function extractFromTemplateLiterals(file, content, candidates, seen) {
  const templateRegex = /`((?:\\`|[\s\S])*?)`/g;
  let match;
  let index = 0;
  while ((match = templateRegex.exec(content))) {
    if (match[1].includes('${')) continue;
    addCandidate(candidates, seen, file, 'template-literal', unescapeJsString(match[1]), index++);
  }
}

function extractFromQuotedJsStrings(file, content, candidates, seen) {
  const stringRegex = /(['"])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let match;
  let index = 0;
  while ((match = stringRegex.exec(content))) {
    const raw = match[2];
    if (!raw.includes('\\n')) continue;
    addCandidate(candidates, seen, file, 'js-string', unescapeJsString(raw), index++);
  }
}

function extractFromSqlStrings(file, content, candidates, seen) {
  const sqlStringRegex = /'((?:''|[^'])*)'/g;
  let match;
  let index = 0;
  while ((match = sqlStringRegex.exec(content))) {
    const raw = unescapeSqlString(match[1]);
    if (!raw.includes('\n')) continue;
    addCandidate(candidates, seen, file, 'sql-string', raw, index++);
  }
}

function findSuspiciousPatterns(file, content) {
  const findings = [];
  if (/database\/(?!seed_courses\.sql)/.test(file)) return findings;
  if (file === 'src/components/cours/AlgoVisualizer.jsx') return findings;

  const lines = content.split(/\r?\n/);

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const normalized = line.replace(/\\n/g, '\n');
    if (file === 'docs/BQL_SPEC.md' && normalized.trim().startsWith('* `')) {
      return;
    }
    if (/\b(erreur|incorrect|interdit|au lieu de|non support|n'est pas|ne pas|c, java|forbidden)\b/i.test(normalized)) {
      return;
    }
    const add = pattern => findings.push({ file, line: lineNo, pattern, text: line.trim() });

    if (/\bPOUR\s+\w+\s+DE\b/.test(normalized)) add('POUR without ALLANT DE');
    if (/\bSINON\s+SI\b/.test(normalized)) add('SINON SI alias');
    if (/\w+\[[^\]\n]+\]\[[^\]\n]+\]/.test(normalized)) add('M[i][j] matrix access');
    if (/\bFINREPETER\b/i.test(normalized)) add('FINREPETER');
    if (/\w+->\w+/.test(normalized) && looksLikeBql(normalized)) add('record arrow operator');
  });

  return findings;
}

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path, files);
    } else if (SCANNED_EXTENSIONS.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

async function validateCandidate(candidate) {
  if (candidate.classification !== 'full') {
    return { ...candidate, status: 'fragment', errors: [] };
  }

  const result = await executeCode(candidate.code, {
    inputs: Array.from({ length: 20 }, (_, index) => DEFAULT_INPUTS[index % DEFAULT_INPUTS.length]),
    terminalSpeed: 'instant',
    maxSteps: 10_000,
    output: () => {},
  });

  return {
    ...candidate,
    status: result.errors.length === 0 ? 'valid' : 'invalid',
    errors: result.errors.map(error => ({
      line: error.line ?? 0,
      column: error.column ?? 0,
      message: error.message ?? String(error),
    })),
  };
}

export async function collectBqlExamples() {
  const files = await walk(ROOT);
  const candidates = [];
  const suspicious = [];
  const seen = new Set();

  for (const absoluteFile of files) {
    const file = relative(ROOT, absoluteFile).replace(/\\/g, '/');
    if (IGNORED_FILE_PATTERNS.some(pattern => pattern.test(file))) continue;
    const content = await readFile(absoluteFile, 'utf8');

    extractFromMarkdown(file, content, candidates, seen);
    extractFromTemplateLiterals(file, content, candidates, seen);
    extractFromQuotedJsStrings(file, content, candidates, seen);
    if (extname(file) === '.sql') {
      extractFromSqlStrings(file, content, candidates, seen);
    }

    suspicious.push(...findSuspiciousPatterns(file, content));
  }

  const results = [];
  for (const candidate of candidates) {
    results.push(await validateCandidate(candidate));
  }

  return { results, suspicious };
}

function printSummary({ results, suspicious }) {
  const full = results.filter(item => item.classification === 'full');
  const fragments = results.filter(item => item.classification === 'fragment');
  const invalid = results.filter(item => item.status === 'invalid');

  console.log('\nBQL example validation');
  console.log(`  Full examples: ${full.length}`);
  console.log(`  Valid full examples: ${full.length - invalid.length}`);
  console.log(`  Invalid full examples: ${invalid.length}`);
  console.log(`  Fragments/placeholders: ${fragments.length}`);
  console.log(`  Suspicious syntax lines: ${suspicious.length}`);

  if (invalid.length > 0) {
    console.log('\nInvalid full examples:');
    invalid.forEach(item => {
      console.log(`\n- ${item.file} (${item.kind} #${item.index})`);
      item.errors.slice(0, 5).forEach(error => {
        console.log(`  L${error.line}:C${error.column} ${error.message}`);
      });
    });
  }

  if (suspicious.length > 0) {
    console.log('\nSuspicious syntax lines:');
    suspicious.slice(0, 80).forEach(item => {
      console.log(`- ${item.file}:${item.line} [${item.pattern}] ${item.text}`);
    });
    if (suspicious.length > 80) {
      console.log(`  ... ${suspicious.length - 80} more`);
    }
  }
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '')) {
  const summary = await collectBqlExamples();
  printSummary(summary);

  const invalid = summary.results.filter(item => item.status === 'invalid');
  if (invalid.length > 0 || summary.suspicious.length > 0) {
    process.exitCode = 1;
  }
}
