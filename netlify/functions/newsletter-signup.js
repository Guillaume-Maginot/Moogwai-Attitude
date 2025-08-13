// /netlify/functions/newsletter-signup.js
export async function handler(event) {
  console.log("Moogwai Function is running (single-endpoint) 🦉");

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Méthode non autorisée" };
    }

    const params = new URLSearchParams(event.body);
    const token = params.get("g-recaptcha-response");
    const email = params.get("email");

    if (!token || !email) {
      return { statusCode: 400, body: "Il manque des informations (token ou email)" };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Vérification reCAPTCHA (fetch natif Node 18)
    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${encodeURIComponent(token)}`
    });
    const verifyData = await verifyRes.json();

    const isSuccess = !!verifyData.success;
    const actionOk = !("action" in verifyData) || verifyData.action === "NEWSLETTER_SIGNUP";
    const scoreOk = !("score" in verifyData) || (verifyData.score >= 0.5);

    if (!isSuccess || !actionOk || !scoreOk) {
      const why = JSON.stringify({
        success: verifyData.success,
        action: verifyData.action,
        score: verifyData.score,
        errors: verifyData["error-codes"]
      });
      return { statusCode: 403, body: `Échec reCAPTCHA: ${why}` };
    }

    // Ajout/MAJ du contact dans Brevo
    const brevoApiKey = process.env.BREVO_API_KEY;
    const listId = parseInt(process.env.BREVO_LIST_ID, 10);

    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true
      })
    });

    if (!brevoRes.ok) {
      const detail = await brevoRes.text();
      return { statusCode: 500, body: `Erreur Brevo: ${detail}` };
    }

    // Redirection confirmation
    return {
      statusCode: 302,
      headers: {
        Location: "/Newsletter-Confirmation.html",
        "Cache-Control": "no-store"
      }
    };

  } catch (err) {
    return { statusCode: 500, body: `Erreur serveur: ${err.message}` };
  }
}
