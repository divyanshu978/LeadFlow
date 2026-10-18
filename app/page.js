"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const statuses = [
  ["", "All statuses"],
  ["NEW", "New"],
  ["CONTACTED", "Contacted"],
  ["QUALIFIED", "Qualified"],
  ["PROPOSAL_SENT", "Proposal sent"],
  ["WON", "Won"],
  ["LOST", "Lost"],
];

const statusLabel = Object.fromEntries(statuses);

function formatTimeAgo(value) {
  if (!value) return "No discussions yet";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value)) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isOverdue(value) {
  return value && new Date(value) < new Date() && !isToday(value);
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

async function request(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong");
  return payload.data;
}

export default function Home() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeads = useCallback(async () => {
    try {
      setError("");
      const query = new URLSearchParams();
      if (filter) query.set("status", filter);
      if (search) query.set("search", search);
      setLeads(await request(`/api/leads?${query}`));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(loadLeads, 150);
    return () => clearTimeout(timer);
  }, [loadLeads]);

  const followUps = useMemo(
    () => leads.filter((lead) => isToday(lead.followUpAt)),
    [leads],
  );

  async function addLead(form) {
    const lead = await request("/api/leads", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setLeads((current) => [lead, ...current]);
    setIsAdding(false);
  }

  function updateLead(updated) {
    setLeads((current) =>
      current.map((lead) => (lead.id === updated.id ? updated : lead)),
    );
    setSelectedLead(updated);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>LeadFlow</span></div>
        <div className="topbar-user"><span className="avatar">AK</span><span>Alex Kim</span><span className="chevron">⌄</span></div>
      </header>
      <section className="content">
        <div className="page-heading">
          <div><p className="eyebrow">Workspace / Leads</p><h1>All leads</h1><p className="subheading">Keep your conversations moving forward.</p></div>
          <button className="primary-button" onClick={() => setIsAdding(true)}>＋ Add new lead</button>
        </div>
        <div className="toolbar">
          <label className="search-box"><span>⌕</span><input placeholder="Search leads..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <div className="filter-label">FILTERS:</div><div className="filter-list">{statuses.map(([value, label]) => <button key={label} className={filter === value ? "filter active" : "filter"} onClick={() => setFilter(value)}>{value === "" ? "All" : label}</button>)}</div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        {followUps.length > 0 && <section className="follow-up-section"><div className="section-heading"><h2>Today&apos;s follow-ups</h2><span>{followUps.length}</span></div><div className="follow-up-grid">{followUps.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} highlight />)}</div></section>}
        <section className="lead-section"><div className="section-heading"><h2>{filter ? statusLabel[filter] : "All leads"}</h2><span>{leads.length}</span></div>{loading ? <div className="empty-state">Loading leads...</div> : leads.length === 0 ? <div className="empty-state">No leads match your search.</div> : <div className="lead-grid">{leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />)}</div>}</section>
      </section>
      {selectedLead && <TimelineDialog lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={updateLead} />}
      {isAdding && <AddLeadDialog onClose={() => setIsAdding(false)} onSave={addLead} />}
    </main>
  );
}

function LeadCard({ lead, onClick, highlight }) {
  const note = lead.discussions?.[0]?.note;
  return <button className={`lead-card ${highlight ? "highlight" : ""}`} onClick={onClick}><div className="card-top"><div className="lead-name"><strong>{lead.name} <small>{lead.company ? `(${lead.company})` : ""}</small></strong><span className="last-note"><b>Last Note:</b> {note || "No discussion logged yet."} <em>{formatTimeAgo(lead.discussions?.[0]?.createdAt)}</em></span></div><span className={`status status-${lead.status.toLowerCase()}`}>{statusLabel[lead.status]}</span></div>{lead.followUpAt && <div className={`follow-up ${isOverdue(lead.followUpAt) ? "overdue" : ""}`}>🔔 Follow-up {isOverdue(lead.followUpAt) ? "overdue" : isToday(lead.followUpAt) ? "today" : new Date(lead.followUpAt).toLocaleDateString()}</div>}</button>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-header"><h2>{title}</h2><button className="close-button" onClick={onClose}>×</button></div>{children}</div></div>;
}

function TimelineDialog({ lead, onClose, onUpdate }) {
  const [note, setNote] = useState("");
  const [followUpAt, setFollowUpAt] = useState(toInputDate(lead.followUpAt));
  const [status, setStatus] = useState(lead.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveDiscussion(event) {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await request(`/api/leads/${lead.id}/discussions`, { method: "POST", body: JSON.stringify({ note, ...(followUpAt ? { followUpAt: new Date(followUpAt).toISOString() } : { followUpAt: null }) }) });
      const updated = await request(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      onUpdate(updated);
      setNote("");
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  }

  return <Modal title="Lead timeline" onClose={onClose}><div className="lead-profile"><span className="lead-avatar large">{lead.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><h3>{lead.name}</h3><p>{lead.company || "Independent"} {lead.phone && `· ${lead.phone}`}</p></div><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.slice(1).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="timeline">{(lead.discussions || []).map((discussion) => <article className="timeline-item" key={discussion.id}><span className="timeline-dot" /><div><div className="timeline-meta"><strong>You</strong><time>{new Date(discussion.createdAt).toLocaleString()}</time></div><p>{discussion.note}</p></div></article>)}{!lead.discussions?.length && <p className="muted">No discussions yet. Start the conversation below.</p>}</div><form className="discussion-form" onSubmit={saveDiscussion}><label>Add a discussion note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you discuss?" rows="3" required /></label><div className="form-row"><label>Follow-up date & time<input type="datetime-local" value={followUpAt} onChange={(event) => setFollowUpAt(event.target.value)} /></label><button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save discussion"}</button></div>{error && <p className="form-error">{error}</p>}</form></Modal>;
}

function AddLeadDialog({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", company: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) { event.preventDefault(); setSaving(true); try { await onSave(form); } catch (saveError) { setError(saveError.message); } finally { setSaving(false); } }
  return <Modal title="Add new lead" onClose={onClose}><form className="add-form" onSubmit={submit}><label>Name *<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Priya Shah" /></label><label>Company<input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Company name" /></label><label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" /></label>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Adding..." : "Add lead"}</button></div></form></Modal>;
}
