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
    cases: Array.isArray(body?.cases) ? body.cases : [],
    constraints: body?.constraints || null,
    diagnostics: Array.isArray(body?.diagnostics) ? body.diagnostics : [],
    feedbackReport: body?.feedbackReport || null,
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
    console.log("[api/submit] request received", {
      method: req.method,
      lessonId: req.body?.lessonId || req.body?.challengeId || null,
      authHeaderPresent: Boolean(req.headers?.authorization),
    });

    const { handleSubmitRequest } = await import("../server/submitHandler.js");
    const result = await handleSubmitRequest({
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    console.log("[api/submit] response ready", {
      status: result.status,
      success: Boolean(result.body?.success),
      errorCode: result.body?.errorCode || null,
      passed: result.body?.passed || 0,
      total: result.body?.total || 0,
      durationMs: Date.now() - startedAt,
    });

    return sendJson(res, result.status, result.body, result.headers);
  } catch (error) {
    console.error("[api/submit] uncaught serverless exception", {
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
