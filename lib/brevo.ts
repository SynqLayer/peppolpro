const BREVO_API = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "PeppolPro", email: "info@synqlayer.com" };
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://peppolpro.nl";

export async function sendWelcomeEmail(to: string, name: string) {
 if (!process.env.BREVO_API_KEY) return;

 const html = `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
 <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px">
 <tr><td align="center">
 <table width="580" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden">
 <tr>
 <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:40px 40px 32px;text-align:center">
 <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">PeppolPro</div>
 <div style="font-size:13px;color:#a5b4fc;margin-top:4px">Peppol-facturatie voor ondernemers</div>
 </td>
 </tr>
 <tr>
 <td style="padding:40px">
 <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 16px;line-height:1.3">
 Welkom bij PeppolPro${name ? `, ${name}` : ""}!
 </h1>
 <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px">
 Je account is aangemaakt. Je hebt direct
 <strong style="color:#ffffff">3 gratis Peppol-verzendingen</strong>
 klaarstaan — geen creditcard, geen verplichtingen.
 </p>
 <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px">
 ${[
 ["1", "Maak je eerste factuur", "Vul bedrijfs- en klantgegevens in via het formulier"],
 ["2", "Download of verstuur via Peppol", "Ontvang een 100% conforme Peppol BIS 3.0 XML"],
 ["3", "Klant ontvangt direct", "Via het Europese Peppol-netwerk, in seconden"],
 ].map(([num, title, desc]) => `
 <tr>
 <td style="padding:12px 0;border-bottom:1px solid #1e1e2e">
 <table cellpadding="0" cellspacing="0">
 <tr>
 <td style="width:36px;height:36px;background:#1e1b4b;border-radius:50%;text-align:center;vertical-align:middle;color:#a5b4fc;font-weight:700;font-size:14px">
 ${num}
 </td>
 <td style="padding-left:14px">
 <div style="color:#ffffff;font-weight:600;font-size:14px">${title}</div>
 <div style="color:#64748b;font-size:13px;margin-top:2px">${desc}</div>
 </td>
 </tr>
 </table>
 </td>
 </tr>`).join("")}
 </table>
 <table width="100%" cellpadding="0" cellspacing="0">
 <tr>
 <td align="center">
 <a href="${APP_URL}/nieuw" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.2px">
 Maak je eerste factuur →
 </a>
 </td>
 </tr>
 </table>
 <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:20px;margin-top:32px;text-align:center">
 <div style="color:#94a3b8;font-size:13px;line-height:1.6">
 <strong style="color:#ffffff">Gratis plan</strong>
 — onbeperkt genereren & downloaden + 3 Peppol-verzendingen<br>
 <span style="color:#6366f1">Upgrade naar Compleet voor €9/mnd</span>
 voor onbeperkt verzenden + Peppol Inbox
 </div>
 </div>
 </td>
 </tr>
 <tr>
 <td style="padding:24px 40px;border-top:1px solid #1e1e2e;text-align:center">
 <p style="color:#475569;font-size:12px;margin:0;line-height:1.6">
 PeppolPro — onderdeel van
 <a href="https://synqlayer.com" style="color:#6366f1;text-decoration:none">SynqLayer</a>
 | KvK: 42041391<br>
 <a href="${APP_URL}/voorwaarden" style="color:#475569;text-decoration:none">Voorwaarden</a>
 &nbsp;·&nbsp;
 <a href="${APP_URL}/privacy" style="color:#475569;text-decoration:none">Privacy</a>
 </p>
 </td>
 </tr>
 </table>
 </td></tr>
 </table>
</body>
</html>`;

 await fetch(BREVO_API, {
 method: "POST",
 headers: {
 "api-key": process.env.BREVO_API_KEY,
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 sender: SENDER,
 to: [{ email: to, name: name || to.split("@")[0] }],
 subject: "Welkom bij PeppolPro — je 3 gratis verzendingen staan klaar",
 htmlContent: html,
 }),
 });
}
