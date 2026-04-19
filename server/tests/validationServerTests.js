import assert from 'node:assert/strict';
import { handleSubmitRequest } from '../submitHandler.js';
import { submitLessonSolution } from '../services/submissionService.js';

function makeQuery(table, state) {
  return {
    select() { return this; },
    eq() { return this; },
    maybeSingle: async () => {
      if (table === 'lessons') {
        return state.lesson
          ? { data: state.lesson, error: null }
          : { data: null, error: null };
      }
      if (table === 'lesson_secrets') {
        return state.secrets
          ? { data: state.secrets, error: null }
          : { data: null, error: null };
      }
      return { data: null, error: null };
    },
    insert(payload) {
      state.insertedAttempts.push(payload);
      return {
        select() {
          return {
            single: async () => ({ data: { id: `attempt-${state.insertedAttempts.length}` }, error: null }),
          };
        },
      };
    },
  };
}

function makeSupabaseAdmin({ lesson, secrets, rpcResults = [] } = {}) {
  const state = {
    lesson,
    secrets,
    rpcResults,
    insertedAttempts: [],
  };

  return {
    state,
    from(table) {
      return makeQuery(table, state);
    },
    schema() {
      return {
        from(table) {
          return makeQuery(table, state);
        },
      };
    },
    rpc: async (fnName) => {
      if (fnName === "get_lesson_secrets") {
        return {
          data: state.secrets ? [state.secrets] : [],
          error: null,
        };
      }

      return {
        data: state.rpcResults.length > 0
          ? state.rpcResults.shift()
          : { success: true, xpAwarded: 0 },
        error: null,
      };
    },
  };
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

await test('/api/submit returns JSON method error for GET', async () => {
  const result = await handleSubmitRequest({ method: 'GET', headers: {}, body: undefined });

  assert.equal(result.status, 405);
  assert.equal(result.headers['Content-Type'], 'application/json; charset=utf-8');
  assert.equal(result.body.success, false);
  assert.equal(result.body.errorCode, 'METHOD_NOT_ALLOWED');
});

await test('/api/submit reports missing server config as JSON', async () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldViteUrl = process.env.VITE_SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  const result = await handleSubmitRequest({
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: JSON.stringify({ lessonId: 'lesson-1', code: 'ALGORITHME_T; DEBUT FIN' }),
  });

  restoreEnv('SUPABASE_URL', oldUrl);
  restoreEnv('VITE_SUPABASE_URL', oldViteUrl);
  restoreEnv('SUPABASE_SERVICE_ROLE_KEY', oldKey);

  assert.equal(result.status, 500);
  assert.equal(result.body.errorCode, 'SERVER_NOT_CONFIGURED');
});

await test('/api/submit rejects malformed JSON before auth', async () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  const result = await handleSubmitRequest({
    method: 'POST',
    headers: { authorization: 'Bearer token' },
    body: '{not json',
  });

  restoreEnv('SUPABASE_URL', oldUrl);
  restoreEnv('SUPABASE_SERVICE_ROLE_KEY', oldKey);

  assert.equal(result.status, 400);
  assert.equal(result.body.errorCode, 'MALFORMED_JSON');
});

await test('submission service reports missing lesson secrets clearly', async () => {
  const supabaseAdmin = makeSupabaseAdmin({
    lesson: { id: 'lesson-1', lesson_type: 'challenge', title: 'Challenge' },
    secrets: null,
  });

  const result = await submitLessonSolution({
    supabaseAdmin,
    user: { id: 'user-1' },
    lessonId: 'lesson-1',
    code: 'ALGORITHME_T; DEBUT ECRIRE("OK"); FIN',
  });

  assert.equal(result.httpStatus, 500);
  assert.equal(result.errorCode, 'TESTS_MISSING');
  assert.match(result.message, /Aucun test serveur/i);
});

await test('submission service rejects invalid exercise config', async () => {
  const supabaseAdmin = makeSupabaseAdmin({
    lesson: { id: 'lesson-1', lesson_type: 'challenge', title: 'Challenge' },
    secrets: { expected_output: null, test_cases: { exerciseId: 'broken_config' } },
  });

  const result = await submitLessonSolution({
    supabaseAdmin,
    user: { id: 'user-1' },
    lessonId: 'lesson-1',
    code: 'ALGORITHME_T; DEBUT ECRIRE("OK"); FIN',
  });

  assert.equal(result.success, false);
  assert.equal(result.errorCode, 'TESTS_MISSING');
});

await test('submission service records attempts and prevents duplicate XP through backend RPC result', async () => {
  const supabaseAdmin = makeSupabaseAdmin({
    lesson: { id: 'lesson-1', lesson_type: 'challenge', title: 'Challenge' },
    secrets: {
      expected_output: null,
      test_cases: { exerciseId: 'generic_ok', cases: [{ input: '', output: 'OK' }] },
    },
    rpcResults: [
      { success: true, xpAwarded: 50 },
      { success: true, xpAwarded: 0 },
    ],
  });

  const first = await submitLessonSolution({
    supabaseAdmin,
    user: { id: 'user-1' },
    lessonId: 'lesson-1',
    code: 'ALGORITHME_T; DEBUT ECRIRE("OK"); FIN',
  });
  const second = await submitLessonSolution({
    supabaseAdmin,
    user: { id: 'user-1' },
    lessonId: 'lesson-1',
    code: 'ALGORITHME_T; DEBUT ECRIRE("OK"); FIN',
  });

  assert.equal(first.success, true);
  assert.equal(first.xpAwarded, 50);
  assert.equal(second.success, true);
  assert.equal(second.xpAwarded, 0);
  assert.equal(supabaseAdmin.state.insertedAttempts.length, 2);
});

console.log('Backend validation route/service tests passed.');
