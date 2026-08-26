"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FilterX, LoaderCircle, Mail, Phone, Search, ShieldAlert, UserRoundCheck } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Contact = { id: number; leadId: number; name: string | null; emails: string[]; phones: string[]; sourceUrl: string; capturedAt: string; reviewStatus: string; source: string; postTitle: string; publishedAt: string; leadStatus: string };
const REVIEW_OPTIONS = [["unreviewed", "Unreviewed"], ["verified", "Verified"], ["invalid", "Invalid"], ["do_not_contact", "Do not contact"]] as const;
function dateInput(daysAgo: number): string { const date = new Date(); date.setDate(date.getDate() - daysAgo); return date.toISOString().slice(0, 10); }
function formatDate(value: string): string { return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(value)); }

export function ContactsDashboard() {
  const [items, setItems] = useState<Contact[]>([]); const [search, setSearch] = useState(""); const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("all"); const [reviewStatus, setReviewStatus] = useState("all"); const [from, setFrom] = useState(dateInput(30)); const [to, setTo] = useState(dateInput(0));
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), 350); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    async function loadAll() {
      setLoading(true); setError(null); const accumulated: Contact[] = []; let offset: number | null = 0;
      try { while (offset !== null) { const params = new URLSearchParams({ from, to, source, reviewStatus, search: debouncedSearch, offset: String(offset), limit: "500" }); const response = await fetch(`/api/contacts?${params}`, { signal: controller.signal }); const payload = (await response.json()) as { items?: Contact[]; nextOffset?: number | null; error?: string }; if (!response.ok) throw new Error(payload.error ?? "Unable to load contacts."); accumulated.push(...(payload.items ?? [])); setItems([...accumulated]); offset = payload.nextOffset ?? null; } }
      catch (caught) { if ((caught as Error).name !== "AbortError") setError((caught as Error).message); } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void loadAll(); return () => controller.abort();
  }, [from, to, source, reviewStatus, debouncedSearch]);
  const sources = useMemo(() => [...new Set(items.map((item) => item.source))].sort(), [items]);
  async function updateReview(id: number, nextStatus: string) { const previous = items; setItems((current) => current.map((item) => item.id === id ? { ...item, reviewStatus: nextStatus } : item)); const response = await fetch(`/api/contacts/${id}/review`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewStatus: nextStatus }) }); if (!response.ok) { setItems(previous); setError("The contact review status could not be saved."); } }
  function resetFilters() { setSearch(""); setSource("all"); setReviewStatus("all"); setFrom(dateInput(30)); setTo(dateInput(0)); }

  return <main className="app-shell"><AppHeader active="contacts" /><section className="workspace">
    <div className="page-heading"><div><div className="live-label"><span /> EXTRACTED PUBLIC CONTACTS</div><h1>Buyer contact directory</h1><p>Names, emails and numbers explicitly included in qualifying public inquiries.</p></div><div className="privacy-stamp"><ShieldAlert /> Verify before outreach</div></div>
    <div className="compliance-note"><UserRoundCheck /><div><strong>Responsible outreach</strong><p>Use these details only to answer the original construction-material request. Respect do-not-contact requests and avoid bulk unsolicited messaging.</p></div></div>
    <section className="filter-panel contact-filters" aria-label="Contact filters">
      <label className="search-field"><Search /><Input aria-label="Search contacts" placeholder="Search name, email, phone or post" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label><span>From</span><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label><span>To</span><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      <label><span>Source</span><Select value={source} onValueChange={setSource}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem>{sources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
      <label><span>Review</span><Select value={reviewStatus} onValueChange={setReviewStatus}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All contacts</SelectItem>{REVIEW_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
      <Button variant="outline" onClick={resetFilters}><FilterX /> Reset</Button>
    </section>
    <section className="data-panel"><div className="table-toolbar"><div><strong>{items.length.toLocaleString()} contact records</strong><span>{loading ? "Loading every matching record…" : "All matching contacts loaded"}</span></div>{loading && <LoaderCircle className="spin" aria-label="Loading" />}</div>
      {error && <div className="error-banner">{error}</div>}{!error && !loading && items.length === 0 && <div className="empty-state"><UserRoundCheck /><h2>No public contact details found</h2><p>Contacts appear here only when the qualifying post explicitly publishes them.</p></div>}
      {items.length > 0 && <Table><TableHeader><TableRow><TableHead>Buyer</TableHead><TableHead>Contact details</TableHead><TableHead>Source post</TableHead><TableHead>Published</TableHead><TableHead>Review</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}>
        <TableCell><div className="signal-cell"><strong>{item.name || "Name not stated"}</strong><Badge variant="outline">{item.source}</Badge><span>Lead #{item.leadId}</span></div></TableCell>
        <TableCell><div className="contact-stack">{item.emails.map((email) => <a key={email} href={`mailto:${email}`}><Mail />{email}</a>)}{item.phones.map((phone) => <a key={phone} href={`tel:${phone}`}><Phone />{phone}</a>)}{!item.emails.length && !item.phones.length && <span>Name only</span>}</div></TableCell>
        <TableCell className="request-cell"><strong>{item.postTitle || "Public inquiry"}</strong><p>Status: {item.leadStatus.replace("_", " ")}</p></TableCell><TableCell>{formatDate(item.publishedAt)}</TableCell>
        <TableCell><Select value={item.reviewStatus} onValueChange={(value) => void updateReview(item.id, value)}><SelectTrigger size="sm"><SelectValue /></SelectTrigger><SelectContent>{REVIEW_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></TableCell>
        <TableCell className="text-right"><Button asChild size="sm"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open post <ExternalLink /></a></Button></TableCell>
      </TableRow>)}</TableBody></Table>}
    </section>
  </section></main>;
}
