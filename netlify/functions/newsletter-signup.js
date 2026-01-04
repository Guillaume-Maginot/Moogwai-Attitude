// netlify/functions/newsletter-signup.js

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { email, attributes } = JSON.parse(event.body || "{}");
    if (!email) {
      return { statusCode: 400, body: "Missing email" };
    }

    const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: "Missing BREVO_API_KEY" };
    }

    const payload = {
      email,
      attributes: attributes || {},
      // si tu utilises une liste :
      // listIds: [parseInt(process.env.BREVO_LIST_ID, 10)].filter(Boolean),
      updateEnabled: true,
    };

    const resp = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: text || "Brevo error",
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Function error: ${err.message || String(err)}`,
    };
  }
};
