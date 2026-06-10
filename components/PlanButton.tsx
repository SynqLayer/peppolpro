"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanButton({
 plan,
 label,
 style,
}: {
 plan: string;
 label: string;
 style?: React.CSSProperties;
}) {
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 async function handleClick() {
 setLoading(true);
 try {
 const res = await fetch("/api/checkout", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ plan }),
 });
 const data = await res.json();
 if (data.checkoutUrl) {
 window.location.href = data.checkoutUrl;
 } else if (res.status === 401) {
 router.push("/login");
 } else {
 alert(data.error || "Iets ging mis, probeer opnieuw.");
 }
 } finally {
 setLoading(false);
 }
 }

 return (
 <button
 onClick={handleClick}
 disabled={loading}
 style={{
 background: "#6366f1",
 color: "#fff",
 border: "none",
 padding: "12px 24px",
 borderRadius: 8,
 fontWeight: 600,
 fontSize: 15,
 cursor: loading ? "not-allowed" : "pointer",
 opacity: loading ? 0.7 : 1,
 width: "100%",
 ...style,
 }}
 >
 {loading ? "Doorsturen..." : label}
 </button>
 );
}
