// /netlify/functions/verify-recaptcha.js
export async function handler(event) {
  try {
    // Vérifie que c'est bien une requête POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Méthode non autorisée" };
    }

    const params = new URLSearchParams(event.body);
    const token = params.get("g-recaptcha-response");

    if (!token) {
      return { statusCode: 400, body: "Token reCAPTCHA manquant" };
    }

    // Clé secrète reCAPTCHA (la mettre dans Netlify > Settings > Environment variables)
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Appel à Google pour valider le token
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    // Analyse de la réponse
    if (data.success && data.action === "NEWSLETTER_SIGNUP") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Vérifié avec succès !" })
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: "Échec de la vérification reCAPTCHA" })
      };
    }
  } catch (err) {
    return { statusCode: 500, body: `Erreur serveur : ${err.message}` };
  }
}
