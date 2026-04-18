/* global process */
import { createClient } from "@supabase/supabase-js";
import { submitLessonSolution } from "./services/submissionService.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

function log(event, payload = {}) {
  console.log(`[submitHandler] ${event}`, payload);
}

function corsHeaders(origin = "") {
  const configured = (process.env.SUBMISSION_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowOrigin =
    configured.length === 0 || configured.includes(origin) ? origin || "*" : configured[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(status, body, headers = {}) {
  return {
    status,
    headers: { ...JSON_HEADERS, ...headers },
    body: {
      success: Boolean(body?.success),
      passed: Number(body?.passed || 0),
      total: Number(body?.total || 0),
      message: body?.message || "Validation terminee.",
      errorCode: body?.errorCode || null,
      details: body?.details || null,
      validationMode: body?.validationMode || null,
      exerciseId: body?.exerciseId || null,
      cases: Array.isArray(body?.cases) ? body.cases : [],
      constraints: body?.constraints || null,
      diagnostics: Array.isArray(body?.diagnostics) ? body.diagnostics : [],
      feedbackReport: body?.feedbackReport || null,
      xpAwarded: Number(body?.xpAwarded || 0),
      progress: body?.progress || null,
    },
  };
}

function createSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    log("supabase config missing", {
      hasUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
    });
    return {
      error: {
        errorCode: "SERVER_NOT_CONFIGURED",
        message:
          "Serveur de validation non configure: SUPABASE_URL/VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.",
      },
    };
  }

  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    log("supabase admin client created", {
      hasUrl: true,
      hasServiceRoleKey: true,
    });
    return { client };
  } catch (error) {
    log("supabase admin client creation failed", {
      message: error?.message,
    });
    return {
      error: {
        errorCode: "SERVER_NOT_CONFIGURED",
        message: "Impossible d'initialiser le client Supabase serveur.",
        details: error?.message || null,
      },
    };
  }
}

function extractToken(headers = {}) {
  const authorization = headers.authorization || headers.Authorization || "";
  if (typeof authorization !== "string") return null;
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : null;
}

async function parseBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (typeof body !== "string") return {};

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function handleSubmitRequest({ method, headers = {}, body }) {
  const startedAt = Date.now();
  const responseHeaders = corsHeaders(headers.origin || headers.Origin || "");
  const requestMethod = String(method || "").toUpperCase();

  try {
    const bodyPreview = typeof body === "object" && body !== null ? body : {};
    log("request received", {
      method: requestMethod,
      lessonId: bodyPreview.lessonId || bodyPreview.challengeId || null,
      authHeaderPresent: Boolean(headers.authorization || headers.Authorization),
    });

    if (requestMethod === "OPTIONS") {
      return json(200, { success: true, message: "OK" }, responseHeaders);
    }

    if (requestMethod !== "POST") {
      return json(
        405,
        {
          success: false,
          errorCode: "METHOD_NOT_ALLOWED",
          message: "Methode non autorisee. Utilisez POST /api/submit.",
        },
        responseHeaders,
      );
    }

    const { client: supabaseAdmin, error: configError } = createSupabaseAdmin();
    if (configError) {
      return json(500, { success: false, passed: 0, total: 0, ...configError }, responseHeaders);
    }

    const parsedBody = await parseBody(body);
    if (parsedBody === null) {
      log("malformed json body");
      return json(
        400,
        {
          success: false,
          errorCode: "MALFORMED_JSON",
          message: "Requete invalide: le corps JSON est mal forme.",
        },
        responseHeaders,
      );
    }

    log("body parsed", {
      lessonId: parsedBody.lessonId || parsedBody.challengeId || null,
      hasCode: typeof parsedBody.code === "string" && parsedBody.code.trim() !== "",
    });

    const token = extractToken(headers);
    if (!token) {
      log("auth token missing");
      return json(
        401,
        {
          success: false,
          errorCode: "AUTH_REQUIRED",
          message: "Authentification requise: token Bearer manquant.",
        },
        responseHeaders,
      );
    }

    let authResult;
    try {
      authResult = await supabaseAdmin.auth.getUser(token);
    } catch (error) {
      log("supabase auth request crashed", {
        message: error?.message,
      });
      return json(
        500,
        {
          success: false,
          errorCode: "SUPABASE_AUTH_FAILED",
          message: "Impossible de verifier la session avec Supabase.",
          details: error?.message || null,
        },
        responseHeaders,
      );
    }

    const {
      data: { user } = {},
      error: authError,
    } = authResult || {};

    log("supabase auth checked", {
      success: Boolean(user && !authError),
      userId: user?.id || null,
      error: authError?.message || null,
    });

    if (authError || !user) {
      return json(
        401,
        {
          success: false,
          errorCode: "INVALID_TOKEN",
          message: "Session invalide ou expiree. Reconnectez-vous puis reessayez.",
          details: authError?.message || null,
        },
        responseHeaders,
      );
    }

    const result = await submitLessonSolution({
      supabaseAdmin,
      user,
      lessonId: parsedBody.lessonId || parsedBody.challengeId,
      code: parsedBody.code,
    });

    log("validation completed", {
      success: Boolean(result.success),
      errorCode: result.errorCode || null,
      passed: result.passed || 0,
      total: result.total || 0,
      durationMs: Date.now() - startedAt,
    });

    return json(result.httpStatus || (result.success ? 200 : 400), result, responseHeaders);
  } catch (error) {
    log("uncaught handler exception", {
      message: error?.message,
      stack: error?.stack,
      durationMs: Date.now() - startedAt,
    });

    return json(
      500,
      {
        success: false,
        passed: 0,
        total: 0,
        errorCode: "SERVER_EXCEPTION",
        message: "Erreur interne du serveur de validation.",
        details: error?.message || null,
      },
      responseHeaders,
    );
  }
}
