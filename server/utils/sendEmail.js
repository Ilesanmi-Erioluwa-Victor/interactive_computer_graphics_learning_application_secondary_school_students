const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const htmlToText = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const sendEmail = async ({ to, subject, html, text = '' }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[EMAIL] BREVO_API_KEY not configured — skipping email send.');
    return { skipped: true };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@icgla.example.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'ICGLA';

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text || htmlToText(html),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Brevo API responded with ${response.status}: ${detail}`);
    }

    return { skipped: false };
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${to}: ${error.message}`);
    return { skipped: false, error: error.message };
  }
};

export default sendEmail;
