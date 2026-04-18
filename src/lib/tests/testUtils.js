import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const suites = [];

export function defineSuite(name, callback) {
  suites.push({ name, callback });
}

export async function runSuites() {
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    const tests = [];
    const test = (name, callback) => tests.push({ name, callback });

    suite.callback(test);
    console.log(`\n${suite.name}`);

    for (const t of tests) {
      try {
        await t.callback();
        passed++;
        console.log(`  PASS ${t.name}`);
      } catch (error) {
        failed++;
        console.error(`  FAIL ${t.name}`);
        console.error(`       ${error.message}`);
      }
    }
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

export function isDirectRun(metaUrl) {
  return fileURLToPath(metaUrl) === resolve(process.argv[1] ?? '');
}

export function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual(actual, expected, message = 'Values are not equal') {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${format(expected)}, got ${format(actual)}`);
  }
}

export function assertDeepEqual(actual, expected, message = 'Values are not deeply equal') {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}. Expected ${expectedJson}, got ${actualJson}`);
  }
}

export function assertNoErrors(errors, context = 'Unexpected errors') {
  if (errors.length > 0) {
    throw new Error(`${context}: ${errors.map(formatError).join(' | ')}`);
  }
}

export function assertHasErrors(errors, context = 'Expected at least one error') {
  if (errors.length === 0) {
    throw new Error(context);
  }
}

export function formatError(error) {
  const line = error?.line ?? 0;
  const column = error?.column ?? 0;
  const message = error?.message ?? String(error);
  return `L${line}:C${column} ${message}`;
}

function format(value) {
  return Array.isArray(value) ? JSON.stringify(value) : String(value);
}
