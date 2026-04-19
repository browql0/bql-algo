import { supabase } from "../supabase";
import { isE2EMode } from "../e2eFixtures";

const SUBMISSION_ENDPOINT =
  import.meta.env.VITE_SUBMISSION_API_URL || "/api/submit";

const REQUEST_TIMEOUT_MS = 20000;

function normalizeResult(result, httpStatus = 0) {
  return {
    success: Boolean(result?.success),
    passed: Number(result?.passed || 0),
    total: Number(result?.total || 0),
    message: result?.message || "Validation terminee.",
    errorCode: result?.errorCode || null,
    details: result?.details || null,
    validationMode: result?.validationMode || null,
    exerciseId: result?.exerciseId || null,
    cases: Array.isArray(result?.cases) ?result.cases : [],
    constraints: result?.constraints || null,
    diagnostics: Array.isArray(result?.diagnostics) ?result.diagnostics : [],
    feedbackReport: result?.feedbackReport || null,
    xpAwarded: Number(result?.xpAwarded || 0),
    progress: result?.progress || null,
    httpStatus,
  };
}

function nonJsonMessage(status, contentType, bodyText) {
  const preview = String(bodyText || "").replace(/\s+/g, " ").slice(0, 180);
  return {
    success: false,
    passed: 0,
    total: 0,
    errorCode: "MALFORMED_VALIDATION_RESPONSE",
    message:
      "Le serveur de validation n'a pas renvoye de JSON. Verifiez que /api/submit pointe vers le backend.",
    details: `HTTP ${status}; content-type: ${contentType || "inconnu"}; debut reponse: ${preview || "vide"}`,
    httpStatus: status,
  };
}

export async function submitLessonSolution({ lessonId, code }) {
  if (isE2EMode) {
    const success = lessonId === "lesson-foundations-challenge-e2e"
      && /ECRIRE\s*\(\s*"BQL est genial"\s*\)/i.test(code || "");

    return normalizeResult({
      success,
      passed: success ?1 : 0,
      total: 1,
      message: success
        ? "Solution valide. Elle est acceptée par le validateur de test."
        : "Le programme s'exécute, mais la sortie attendue n'est pas encore correcte.",
      validationMode: "result_only",
      exerciseId: "e2e_affichage_simple",
      cases: [{
        name: "Test E2E",
        passed: success,
        input: "",
        expected: "BQL est genial",
        actual: success ? "BQL est genial" : "",
      }],
      diagnostics: success ? [] : [{
        type: "output",
        title: "Sortie incorrecte",
        message: "Affiche exactement BQL est genial.",
      }],
      feedbackReport: {
        progress: success ? ["Syntaxe correcte", "Programme exécuté", "1/1 test validé"] : ["Syntaxe correcte", "Programme exécuté"],
        remainingIssue: success ? null : "La sortie affichée ne correspond pas au texte attendu.",
        nextAction: success ? "Tu peux passer à la suite." : "Vérifie le texte dans ECRIRE.",
      },
    }, 200);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      success: false,
      passed: 0,
      total: 0,
      message: "Vous devez etre connecte pour valider un challenge.",
      errorCode: "AUTH_REQUIRED",
      details: null,
      httpStatus: 401,
    };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SUBMISSION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ lessonId, code }),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const bodyText = await response.text();
    let parsed = null;

    if (bodyText.trim()) {
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        return nonJsonMessage(response.status, contentType, bodyText);
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return nonJsonMessage(response.status, contentType, bodyText);
    }

    const result = normalizeResult(parsed, response.status);
    if (!response.ok && !result.errorCode) {
      result.errorCode = `HTTP_${response.status}`;
    }
    return result;
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        success: false,
        passed: 0,
        total: 0,
        message: "Le serveur de validation n'a pas repondu a temps.",
        errorCode: "BACKEND_TIMEOUT",
        details: `Endpoint appele: ${SUBMISSION_ENDPOINT}`,
        httpStatus: 0,
      };
    }

    return {
      success: false,
      passed: 0,
      total: 0,
      message: "Impossible de joindre le serveur de validation.",
      errorCode: "BACKEND_UNREACHABLE",
      details: `${error?.message || "Erreur reseau"}; endpoint appele: ${SUBMISSION_ENDPOINT}`,
      httpStatus: 0,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
