"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/constants";
import { getCheckoutProduct, isCreditBundle } from "@/lib/plans";
import {
 CHECKOUT_TERMS_VERSION,
 checkoutLoginPath,
 clearCheckoutIntentCookieValue,
 isCheckoutPlan,
} from "@/lib/checkout-intent";

export default function CheckoutResumePage() {
 const router = useRouter();
 const [plan, setPlan] = useState<string | null>(null);
 const [confirmed, setConfirmed] = useState(false);
 const [loading, setLoading] = useState(false);
 const [message, setMessage] = useState("");

 useEffect(() => {
  const selected = new URLSearchParams(window.location.search).get("plan");
  if (!isCheckoutPlan(selected)) {
   router.replace("/prijzen");
   return;
  }
  setPlan(selected);
 }, [router]);

 const product = useMemo(() => plan ? getCheckoutProduct(plan) : null, [plan]);
 const priceLabel = product ? `${product.price}${product.period ? ` ${product.period}` : ""}` : "";
 const purchaseKind = product ? (isCreditBundle(product.id) ? "Eenmalige aankoop" : "Maandabonnement") : "";

 async function startCheckout() {
  if (!plan || !product || !confirmed) return;
  setLoading(true);
  setMessage("");
  try {
   const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, confirmPurchase: true, termsVersion: CHECKOUT_TERMS_VERSION }),
   });
   const data = await res.json().catch(() => ({}));
   if (data.checkoutUrl) {
    document.cookie = clearCheckoutIntentCookieValue();
    window.location.href = data.checkoutUrl;
    return;
   }
   if (res.status === 401) {
    router.push(checkoutLoginPath(plan));
    return;
   }
   setMessage(data.error || "Checkout kon niet worden gestart. Probeer het opnieuw.");
  } catch {
   setMessage("Checkout kon niet worden gestart. Probeer het opnieuw.");
  } finally {
   setLoading(false);
  }
 }

 return (
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: 20 }}>
 <section style={{ width: "100%", maxWidth: 560, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)" }}>
  <Link href="/prijzen" style={{ color: "#93c5fd", textDecoration: "none", fontSize: 13 }}>← Terug naar prijzen</Link>
  <h1 style={{ fontSize: 28, fontWeight: 900, color: C.white, margin: "20px 0 8px" }}>Controleer je aankoop</h1>
  <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.7, margin: 0 }}>We starten pas een Mollie-checkout nadat jij hieronder de prijs, looptijd en voorwaarden hebt gecontroleerd en zelf op de betaalbutton klikt.</p>

  {!product ? (
   <p style={{ marginTop: 24, color: C.gray }}>Productgegevens laden...</p>
  ) : (
   <>
    <dl style={{ marginTop: 28, display: "grid", gap: 12, background: "rgba(15,23,42,0.8)", border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
     <div><dt style={{ color: C.gray, fontSize: 12 }}>Product</dt><dd style={{ color: C.white, fontWeight: 800, marginTop: 3 }}>{product.name}</dd></div>
     <div><dt style={{ color: C.gray, fontSize: 12 }}>Type</dt><dd style={{ color: C.white, fontWeight: 800, marginTop: 3 }}>{purchaseKind}</dd></div>
     <div><dt style={{ color: C.gray, fontSize: 12 }}>Prijs</dt><dd style={{ color: C.white, fontSize: 24, fontWeight: 900, marginTop: 3 }}>{priceLabel} <span style={{ color: C.gray, fontSize: 13, fontWeight: 700 }}>incl. btw</span></dd></div>
     {isCreditBundle(product.id) ? <div><dt style={{ color: C.gray, fontSize: 12 }}>Geldigheid tegoed</dt><dd style={{ color: C.white, fontWeight: 800, marginTop: 3 }}>{product.validMonths} maanden vanaf aankoop</dd></div> : <div><dt style={{ color: C.gray, fontSize: 12 }}>Opzeggen</dt><dd style={{ color: C.white, fontWeight: 800, marginTop: 3 }}>Online opzegbaar; geen nieuwe verlenging na succesvolle opzegging</dd></div>}
    </dl>

    <div style={{ marginTop: 20, fontSize: 13, color: C.gray, lineHeight: 1.7 }}>
     Lees vóór betaling de <Link href="/voorwaarden" target="_blank" style={{ color: "#93c5fd" }}>algemene voorwaarden</Link>, <Link href="/annuleren-terugbetaling" target="_blank" style={{ color: "#93c5fd" }}>opzeg- en terugbetalingsregels</Link> en <Link href="/privacy" target="_blank" style={{ color: "#93c5fd" }}>privacyverklaring</Link>.
    </div>

    <label style={{ marginTop: 20, display: "flex", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 10, border: `1px solid ${C.border}`, color: "#e2e8f0", fontSize: 13, lineHeight: 1.6 }}>
     <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
     <span>Ik bevestig dat ik deze aankoop zakelijk doe, 18 jaar of ouder ben en bevoegd ben voor de onderneming te handelen. Ik heb de prijs, eventuele maandelijkse verlenging en de voorwaarden hierboven gecontroleerd.</span>
    </label>

    {message && <p role="alert" style={{ marginTop: 16, color: "#fca5a5", fontSize: 13 }}>{message}</p>}

    <button type="button" onClick={startCheckout} disabled={!confirmed || loading} style={{ marginTop: 20, width: "100%", padding: "14px 18px", borderRadius: 10, border: 0, background: confirmed ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})` : "#334155", color: "white", fontWeight: 900, fontSize: 15, cursor: !confirmed || loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
     {loading ? "Checkout starten..." : `Doorgaan naar betalen — ${priceLabel}`}
    </button>
    <p style={{ marginTop: 10, color: C.gray, fontSize: 12, lineHeight: 1.6, textAlign: "center" }}>Deze knop start de betaalomgeving. Er worden geen extra betaalde opties vooraf geselecteerd.</p>
   </>
  )}
 </section>
 </main>
 );
}
