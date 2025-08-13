export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Méthode non autorisée" };
    }

    const params = new URLSearchParams(event.body);
    const token = params.get("g-recaptcha-response");
    const email = params.get("email");

    if (!token || !email) {
      return { statusCode: 400, body: "Il manque des infos" };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const fetch = (await import("node-fetch")).default;

    // Vérification reCAPTCHA
    const recaptchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`
    });
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success || recaptchaData.action !== "NEWSLETTER_SIGNUP") {
      return { statusCode: 403, body: "Échec de la vérification reCAPTCHA" };
    }

    // Ajout à Brevo
    const brevoApiKey = process.env.BREVO_API_KEY;
    const listId = process.env.BREVO_LIST_ID;

    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        email: email,
        listIds: [parseInt(listId)],
        updateEnabled: true
      })
    });

    if (brevoRes.ok) {
      // 🔄 Redirection vers la page confirmation
      return {
        statusCode: 302,
        headers: {
          Location: "/Newsletter-Confirmation.html"
        }
      };
    } else {
      const brevoData = await brevoRes.json();
      return {
        statusCode: 500,
        body: `Erreur Brevo: ${JSON.stringify(brevoData)}`
      };
    }

  } catch (err) {
    return { statusCode: 500, body: `Erreur serveur : ${err.message}` };
  }
}
