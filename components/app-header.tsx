"use client";

import Link from "next/link";
import { DatabaseZap, HardHat, Radio, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader({ active }: { active: "leads" | "contacts" }) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><HardHat /></div>
        <div><p className="eyebrow">MC STEEL MERCHANDISING INC.</p><p className="brand-title">Lead Monitor</p></div>
      </div>
      <nav className="top-nav" aria-label="Primary navigation">
        <Link className={cn("nav-link", active === "leads" && "nav-link-active")} href="/"><Radio /> Leads</Link>
        <Link className={cn("nav-link", active === "contacts" && "nav-link-active")} href="/contacts"><UsersRound /> Contacts</Link>
      </nav>
      <div className="sync-chip" title="Collection runs automatically from configured sources"><DatabaseZap /> Continuous collection</div>
    </header>
  );
}
