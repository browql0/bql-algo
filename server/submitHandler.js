import { createClient } from "@supabase/supabase-js";
import { submitLessonSolution } from "./services/submissionService.js";

const NODE_ENV = process.env.NODE_ENV || "development";
const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const RATE_LIMIT_WINDOW_MS = Number(process.env.SUBMISSION_RATE_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.SUBMISSION_RATE_LIMIT || 60);
const RATE_BUCKETS = new Map();

const LOG_LEVEL = process.env.SUBMISSION_LOG_LEVEL || (NODE_ENV === "production" ? "warn" : "info");
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

function log(level, event, payload = {}) {
  const threshold = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.info;
  const severity = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  if (severity > threshold) return;

  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  logger(`[submitHandler] ${event}`, payload);
}

function getAllowedOrigins() {
  const configured = (process.env.SUBMISSION_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configured.length > 0) return configured;
  if (NODE_ENV === "production") {
    throw new Error("SUBMISSION_ALLOWED_ORIGINS is required in production.");
  }

  return DEFAULT_DEV_ORIGINS;
}

function resolveOrigin(origin = "") {
  const allowedOrigins = getAllowedOrigins();
  if (!origin) {
    return { allowed: true, allowOrigin: "" };
  }

  return {
    allowed: allowedOrigins.includes(origin),
    allowOrigin: origin,
  };
}

function corsHeaders(origin = "") {
  const { allowed, allowOrigin } = resolveOrigin(origin);
  const headers = {
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (allowed && allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  return { allowed, headers };
}

function extractIp(headers = {}) {
  const forwarded = headers["x-forwarded-for"] || headers["X-Forwarded-For"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = headers["x-real-ip"] || headers["X-Real-IP"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

function pruneRateBuckets(now) {
  for (const [key, bucket] of RATE_BUCKETS.entries()) {
    if (bucket.resetAt <= now) {
      RATE_BUCKETS.delete(key);
    }
  }
}

function checkRateLimit(key) {
  const now = Date.now();
  pruneRateBuckets(now);

  const existing = RATE_BUCKETS.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    RATE_BUCKETS.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }

  existing.count += 1;
  if (existing.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - existing.count, resetAt: existing.resetAt };
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
      cases: Array.isArray(body?.cases) ?body.cases : [],
      constraints: body?.constraints || null,
      diagnostics: Array.isArray(body?.diagnostics) ?body.diagnostics : [],
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
    log("warn", "supabase config missing", {
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

    return { client };
  } catch (error) {
    log("error", "supabase admin client creation failed", {
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
  return authorization.startsWith("Bearer ") ?authorization.slice("Bearer ".length).trim() : null;
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
  const origin = headers.origin || headers.Origin || "";
  let responseHeaders = {};
  let corsAllowed = false;

  try {
    const cors = corsHeaders(origin);
    responseHeaders = cors.headers;
    corsAllowed = cors.allowed;
  } catch (error) {
    log("error", "cors configuration invalid", { message: error?.message });
    return json(
      500,
      {
        success: false,
        errorCode: "CORS_NOT_CONFIGURED",
        message: "Configuration CORS manquante. Configurez SUBMISSION_ALLOWED_ORIGINS.",
        details: error?.message || null,
      },
      responseHeaders,
    );
  }
  const requestMethod = String(method || "").toUpperCase();

  try {
    if (!corsAllowed) {
      log("warn", "cors origin rejected", { origin });
      return json(
        403,
        {
          success: false,
          errorCode: "CORS_ORIGIN_DENIED",
          message: "Origine non autorisee.",
        },
        responseHeaders,
      );
    }

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

    const rateKey = `ip:${extractIp(headers)}`;
    const rateResult = checkRateLimit(rateKey);
    if (!rateResult.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateResult.resetAt - Date.now()) / 1000));
      return json(
        429,
        {
          success: false,
          errorCode: "RATE_LIMITED",
          message: "Trop de requetes. Veuillez reessayer bientot.",
          details: `Limite: ${RATE_LIMIT_MAX} requetes par minute.`,
        },
        { ...responseHeaders, "Retry-After": String(retryAfter) },
      );
    }

    const { client: supabaseAdmin, error: configError } = createSupabaseAdmin();
    if (configError) {
      return json(500, { success: false, passed: 0, total: 0, ...configError }, responseHeaders);
    }

    const parsedBody = await parseBody(body);
    if (parsedBody === null) {
      log("warn", "malformed json body");
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

    const token = extractToken(headers);
    if (!token) {
      log("warn", "auth token missing");
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
      log("error", "supabase auth request crashed", {
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

    log("info", "validation completed", {
      success: Boolean(result.success),
      errorCode: result.errorCode || null,
      passed: result.passed || 0,
      total: result.total || 0,
      userId: user?.id || null,
      durationMs: Date.now() - startedAt,
    });

    return json(result.httpStatus || (result.success ?200 : 400), result, responseHeaders);
  } catch (error) {
    log("error", "uncaught handler exception", {
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
