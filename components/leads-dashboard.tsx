"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FilterX, LoaderCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Lead = { id: number; source: string; sourceUrl: string; title: string; body: string; authorName: string | null; location: string | null; publishedAt: string; collectedAt: string; matchedKeywords: string[]; intentScore: number; status: string };
type Stats = { totalLeads: number; todayLeads: number; newLeads: number; contacts: number };
const STATUS_OPTIONS = [["new", "New"], ["reviewed", "Reviewed"], ["contacted", "Contacted"], ["quoted", "Quoted"], ["won", "Won"], ["not_relevant", "Not relevant"]] as const;

function dateInput(daysAgo: number): string { const date = new Date(); date.setDate(date.getDate() - daysAgo); return date.toISOString().slice(0, 10); }
function formatDate(value: string): string { return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value)); }
function sourceClass(source: string): string { return `source-${source.toLowerCase().replace(/[^a-z]+/g, "-")}`; }

export function LeadsDashboard() {
  const [items, setItems] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ totalLeads: 0, todayLeads: 0, newLeads: 0, contacts: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("active");
  const [order, setOrder] = useState("newest");
  const [from, setFrom] = useState(dateInput(30));
  const [to, setTo] = useState(dateInput(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search), 350); return () => window.clearTimeout(timer); }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadAll() {
      setLoading(true); setError(null); const accumulated: Lead[] = []; let offset: number | null = 0;
      try {
        while (offset !== null) {
          const params = new URLSearchParams({ from, to, source, status, order, search: debouncedSearch, offset: String(offset), limit: "500" });
          const response = await fetch(`/api/leads?${params}`, { signal: controller.signal });
          const payload = (await response.json()) as { items?: Lead[]; nextOffset?: number | null; error?: string };
          if (!response.ok) throw new Error(payload.error ?? "Unable to load leads.");
          accumulated.push(...(payload.items ?? [])); setItems([...accumulated]); offset = payload.nextOffset ?? null;
        }
      } catch (caught) { if ((caught as Error).name !== "AbortError") setError((caught as Error).message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void loadAll(); return () => controller.abort();
  }, [from, to, source, status, order, debouncedSearch]);

  useEffect(() => { fetch("/api/stats").then(async (response) => { const payload = await response.json(); if (response.ok) setStats(payload as Stats); }).catch(() => undefined); }, []);
  const sources = useMemo(() => [...new Set(items.map((item) => item.source))].sort(), [items]);

  async function updateStatus(id: number, nextStatus: string) {
    const previous = items; setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    const response = await fetch(`/api/leads/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    if (!response.ok) { setItems(previous); setError("The lead status could not be saved."); }
  }
  function resetFilters() { setSearch(""); setSource("all"); setStatus("active"); setOrder("newest"); setFrom(dateInput(30)); setTo(dateInput(0)); }

  return (
    <main className="app-shell">
      <AppHeader active="leads" />
      <section className="workspace">
        <div className="page-heading"><div><div className="live-label"><span /> LIVE BUYER SIGNALS</div><h1>Construction material inquiries</h1><p>Monitor qualifying public requests, remove duplicates, and open the original post.</p></div><div className="privacy-stamp"><ShieldCheck /> Public details only</div></div>
        <section className="stats-grid" aria-label="Lead totals">
          <article><span>All collected</span><strong>{stats.totalLeads.toLocaleString()}</strong><small>Database has no display cap</small></article>
          <article><span>Posted today</span><strong>{stats.todayLeads.toLocaleString()}</strong><small>Philippine monitoring window</small></article>
          <article><span>Needs review</span><strong>{stats.newLeads.toLocaleString()}</strong><small>Fresh opportunities</small></article>
          <article className="stat-accent"><span>Contacts captured</span><strong>{stats.contacts.toLocaleString()}</strong><small>Explicitly published details</small></article>
        </section>
        <section className="filter-panel" aria-label="Lead filters">
          <label className="search-field"><Search /><Input aria-label="Search leads" placeholder="Search product, buyer or location" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <label><span>From</span><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label><span>To</span><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          <label><span>Source</span><Select value={source} onValueChange={setSource}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All sources</SelectItem>{sources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
          <label><span>Status</span><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Buyer leads</SelectItem><SelectItem value="all">All including excluded</SelectItem>{STATUS_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
          <label><span>Order</span><Select value={order} onValueChange={setOrder}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem></SelectContent></Select></label>
          <Button variant="outline" onClick={resetFilters}><FilterX /> Reset</Button>
        </section>
        <section className="data-panel">
          <div className="table-toolbar"><div><strong>{items.length.toLocaleString()} matching posts</strong><span>{loading ? "Loading every matching result…" : "All matching results loaded"}</span></div>{loading && <LoaderCircle className="spin" aria-label="Loading" />}</div>
          {error && <div className="error-banner">{error}</div>}
          {!error && !loading && items.length === 0 && <div className="empty-state"><Sparkles /><h2>No matching leads in this date range</h2><p>Adjust the dates or connect a search/RSS source using the setup guide.</p></div>}
          {items.length > 0 && <Table><TableHeader><TableRow><TableHead>Signal</TableHead><TableHead>Buyer request</TableHead><TableHead>Product match</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}>
            <TableCell><div className="signal-cell"><Badge className={sourceClass(item.source)} variant="outline">{item.source}</Badge><strong>{item.authorName || "Public poster"}</strong><span>{item.location || "Location not stated"}</span><time>{formatDate(item.publishedAt)}</time></div></TableCell>
            <TableCell className="request-cell"><strong>{item.title || "Public inquiry"}</strong><p>{item.body}</p></TableCell>
            <TableCell><div className="keyword-list">{item.matchedKeywords.map((keyword) => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}</div></TableCell>
            <TableCell><div className="score-ring" data-high={item.intentScore >= 75}>{item.intentScore}</div></TableCell>
            <TableCell><Select value={item.status} onValueChange={(value) => void updateStatus(item.id, value)}><SelectTrigger size="sm"><SelectValue /></SelectTrigger><SelectContent>{STATUS_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></TableCell>
            <TableCell className="text-right"><Button asChild size="sm"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open post <ExternalLink /></a></Button></TableCell>
          </TableRow>)}</TableBody></Table>}
        </section>
      </section>
    </main>
  );
}
