"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/constants";
import {
 checkoutLoginPath,
 clearCheckoutIntentCookieValue,
 isCheckoutPlan,
} from "@/lib/checkout-intent";

export default function CheckoutResumePage() {
 const router = useRouter();
 const [message, setMessage] = useState("Checkout voorbereiden...");

 useEffect(() => {
 const params = new URLSearchParams(window.location.search);
 const plan = params.get("plan");
 if (!isCheckoutPlan(plan)) {
 router.replace("/dashboard");
 return;
 }
 const checkoutPlan = plan;

 let cancelled = false;
 async function resumeCheckout() {
 const res = await fetch("/api/checkout", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ plan: checkoutPlan }),
 });
 const data = await res.json().catch(() => ({}));
 if (cancelled) return;
 if (data.checkoutUrl) {
 document.cookie = clearCheckoutIntentCookieValue();
 window.location.href = data.checkoutUrl;
 return;
 }
 if (res.status === 401) {
 router.replace(checkoutLoginPath(checkoutPlan));
 return;
 }
 setMessage(data.error || "Checkout kon niet worden gestart. Probeer het opnieuw vanaf de prijzenpagina.");
 }

 resumeCheckout().catch(() => {
 if (!cancelled) setMessage("Checkout kon niet worden gestart. Probeer het opnieuw vanaf de prijzenpagina.");
 });
 return () => {
 cancelled = true;
 };
 }, [router]);

 return (
 <main style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 20 }}>
 <section style={{ width: "100%", maxWidth: 430, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 34, backdropFilter: "blur(20px)", boxShadow: "0 18px 60px rgba(0,0,0,0.28)", textAlign: "center" }}>
 <h1 style={{ fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>Checkout starten</h1>
 <p style={{ fontSize: 14, color: C.dim, margin: "10px 0 0", lineHeight: 1.6 }}>{message}</p>
 </section>
 </main>
 );
}
