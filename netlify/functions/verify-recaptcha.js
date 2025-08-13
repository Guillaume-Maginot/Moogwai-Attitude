// /netlify/functions/verify-recaptcha.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Méthode non autorisée" };
    }

    const params = new URLSearchParams(event.body);
    const token = (params.get("g-recaptcha-response") || "").trim();

    if (!token) {
      return { statusCode: 400, body: "Token manquant" };
    }

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${encodeURIComponent(token)}`
    });

    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, body: `Erreur: ${e.message}` };
  }
}
