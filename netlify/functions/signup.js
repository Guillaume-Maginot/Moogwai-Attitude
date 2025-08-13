// /netlify/functions/newsletter-signup.js
export async function handler(event) {
  console.log("Moogwai signup live (no node-fetch) 🦉");
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Méthode non autorisée" };
    }

    const params = new URLSearchParams(event.body);
    const token = (params.get("g-recaptcha-response") || "").trim();
    const email = (params.get("email") || "").trim();
    if (!token || !email) {
      return { statusCode: 400, body: "Il manque des informations (token ou email)" };
    }

    // Vérification reCAPTCHA (fetch natif Node 18+)
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${encodeURIComponent(token)}`
    });
    const verifyData = await verifyRes.json();

    const isSuccess = !!verifyData.success;
    const actionOk = !("action" in verifyData) || verifyData.action === "NEWSLETTER_SIGNUP";
    const scoreOk  = !("score" in verifyData)  || (verifyData.score >= 0.5);
    if (!isSuccess || !actionOk || !scoreOk) {
      const why = JSON.stringify({ success: verifyData.success, action: verifyData.action, score: verifyData.score, errors: verifyData["error-codes"] });
      return { statusCode: 403, body: `Échec reCAPTCHA: ${why}` };
    }

    // Parse robuste des listIds (ex: "2" ou "2,7")
    const raw = (process.env.BREVO_LIST_ID || "").trim();
    const listIds = raw.split(",").map(s => Number(s.trim())).filter(n => Number.isInteger(n) && n > 0);
    console.log("[newsletter] BREVO_LIST_ID raw =", JSON.stringify(raw), "-> parsed =", listIds);
    if (!listIds.length) {
      return { statusCode: 500, body: `Mauvaise config: BREVO_LIST_ID doit être un entier ou une liste d'entiers (>0). Reçu: ${JSON.stringify(raw)}` };
    }

    // Envoi à Brevo
    const payload = { email, listIds, updateEnabled: true };
    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });
    const text = await brevoRes.text();
    if (!brevoRes.ok) {
      console.log("[newsletter] Brevo Status =", brevoRes.status, "Body =", text);
      return { statusCode: 500, body: `Erreur Brevo: ${text}` };
    }

    // Redirection confirmation
    return { statusCode: 302, headers: { Location: "/Newsletter-Confirmation.html", "Cache-Control": "no-store" } };
  } catch (err) {
    console.log("[newsletter] Exception:", err);
    return { statusCode: 500, body: `Erreur serveur: ${err.message}` };
  }
}
