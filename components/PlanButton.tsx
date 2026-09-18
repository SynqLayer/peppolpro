"use client";

import { useRouter } from "next/navigation";
import { checkoutResumePath } from "@/lib/checkout-intent";

export default function PlanButton({
 plan,
 label,
 style,
}: {
 plan: string;
 label: string;
 style?: React.CSSProperties;
}) {
 const router = useRouter();

 function handleClick() {
  router.push(checkoutResumePath(plan));
 }

 return (
 <button
 type="button"
 onClick={handleClick}
 style={{
 background: "#6366f1",
 color: "#fff",
 border: "none",
 padding: "12px 24px",
 borderRadius: 8,
 fontWeight: 600,
 fontSize: 15,
 cursor: "pointer",
 width: "100%",
 ...style,
 }}
 >
 {label}
 </button>
 );
}
