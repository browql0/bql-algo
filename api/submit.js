const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL = process.env.SUBMISSION_LOG_LEVEL || (NODE_ENV === "production" ? "warn" : "info");
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function assertServerEnv() {
  if (NODE_ENV !== "production") return;

  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.SUBMISSION_ALLOWED_ORIGINS) missing.push("SUBMISSION_ALLOWED_ORIGINS");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

assertServerEnv();

function log(level, event, payload = {}) {
  const threshold = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.info;
  const severity = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  if (severity > threshold) return;

  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  logger(`[api/submit] ${event}`, payload);
}

function applyJsonHeaders(res, headers = {}) {
  const normalizedHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  };

  for (const [key, value] of Object.entries(normalizedHeaders)) {
    res.setHeader(key, value);
  }
}

function sendJson(res, status, body, headers = {}) {
  applyJsonHeaders(res, headers);
  return res.status(status).json({
    success: Boolean(body?.success),
    passed: Number(body?.passed || 0),
    total: Number(body?.total || 0),
    message: body?.message || "Erreur serveur.",
    errorCode: body?.errorCode || null,
    details: body?.details || null,
    validationMode: body?.validationMode || null,
    exerciseId: body?.exerciseId || null,
    cases: Array.isArray(body?.cases) ?body.cases : [],
    constraints: body?.constraints || null,
    diagnostics: Array.isArray(body?.diagnostics) ?body.diagnostics : [],
    feedbackReport: body?.feedbackReport || null,
    xpAwarded: Number(body?.xpAwarded || 0),
    progress: body?.progress || null,
  });
}

function fallbackCorsHeaders(origin = "") {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default async function handler(req, res) {
  const startedAt = Date.now();
  const origin = req.headers?.origin || "";
  const fallbackHeaders = fallbackCorsHeaders(origin);

  try {
    const { handleSubmitRequest } = await import("../server/submitHandler.js");
    const result = await handleSubmitRequest({
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    log("info", "response ready", {
      status: result.status,
      success: Boolean(result.body?.success),
      errorCode: result.body?.errorCode || null,
      passed: result.body?.passed || 0,
      total: result.body?.total || 0,
      durationMs: Date.now() - startedAt,
    });

    return sendJson(res, result.status, result.body, result.headers);
  } catch (error) {
    log("error", "uncaught serverless exception", {
      message: error?.message,
      stack: error?.stack,
      durationMs: Date.now() - startedAt,
    });

    return sendJson(
      res,
      500,
      {
        success: false,
        passed: 0,
        total: 0,
        errorCode: "SERVER_EXCEPTION",
        message: "Erreur interne du serveur de validation.",
        details: error?.message || "Internal server error",
      },
      fallbackHeaders,
    );
  }
}
