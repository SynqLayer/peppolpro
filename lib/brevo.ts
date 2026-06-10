export async function sendWelcomeEmail(to: string, name: string) {
 if (!process.env.BREVO_API_KEY) return;

 await fetch("https://api.brevo.com/v3/smtp/email", {
 method: "POST",
 headers: {
 "api-key": process.env.BREVO_API_KEY,
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 sender: { name: "PeppolPro", email: "info@synqlayer.com" },
 to: [{ email: to, name }],
 subject: "Welkom bij PeppolPro — je account staat klaar",
 htmlContent: `
 <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
 <h2 style="color:#6366f1">Welkom bij PeppolPro!</h2>
 <p>Je account is aangemaakt. Je hebt <strong>3 gratis Peppol-verzendingen</strong> klaarstaan.</p>
 <p>
 <a href="${process.env.NEXT_PUBLIC_APP_URL}/nieuw"
 style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
 Maak je eerste factuur →
 </a>
 </p>
 <p style="color:#888;font-size:12px;margin-top:2rem">
 PeppolPro — onderdeel van SynqLayer | KvK: 42041391
 </p>
 </div>`,
 }),
 });
}
