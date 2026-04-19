import express from "express";
import { handleSubmitRequest } from "./submitHandler.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const NODE_ENV = process.env.NODE_ENV || "development";

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

function sendJson(res, status, body, headers = {}) {
  res.status(status);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  return res.json({
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

assertServerEnv();

app.use(express.json({ limit: "128kb" }));

app.all("/api/submit", async (req, res) => {
  try {
    const result = await handleSubmitRequest({
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    return sendJson(res, result.status, result.body, result.headers);
  } catch (error) {
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
    );
  }
});

app.use((err, _req, res, _next) => {
  sendJson(
    res,
    500,
    {
      success: false,
      passed: 0,
      total: 0,
      errorCode: "UNHANDLED_EXCEPTION",
      message: "Erreur interne du serveur.",
      details: err?.message || "Internal server error",
    },
  );
});

app.listen(port, () => {
  console.log(`BQL submission server listening on http://localhost:${port}`);
});
