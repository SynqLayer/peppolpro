"use client";
import { ReactNode } from "react";
import Reveal from "./Reveal";
import { C } from "../lib/constants";

interface GlassCardProps {
 children: ReactNode;
 delay?: number;
 highlight?: boolean;
 reveal?: boolean;
 style?: React.CSSProperties;
}

export default function GlassCard({ children, delay = 0, highlight = false, reveal = true, style = {} }: GlassCardProps) {
 const card = (
 <div
 style={{
 background: highlight
 ? "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.05))"
 : C.card,
 border: `1px solid ${highlight ? "rgba(59,130,246,0.2)" : C.border}`,
 borderRadius: 16,
 padding: "32px 28px",
 position: "relative",
 overflow: "hidden",
 backdropFilter: "blur(20px)",
 transition: "border-color 0.3s, box-shadow 0.3s",
 height: "100%",
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.borderColor = highlight
 ? "rgba(59,130,246,0.35)"
 : "rgba(59,130,246,0.15)";
 e.currentTarget.style.boxShadow = `0 0 30px ${C.glow}`;
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.borderColor = highlight
 ? "rgba(59,130,246,0.2)"
 : C.border;
 e.currentTarget.style.boxShadow = "none";
 }}
 >
 {highlight && (
 <div
 style={{
 position: "absolute",
 top: -1,
 left: "10%",
 right: "10%",
 height: 1,
 background: `linear-gradient(90deg, transparent, ${C.blue}66, transparent)`,
 }}
 />
 )}
 {children}
 </div>
 );

 if (!reveal) {
 return card;
 }

 return (
 <Reveal delay={delay} style={style}>
 {card}
 </Reveal>
 );
}
