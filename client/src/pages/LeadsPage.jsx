import React, { useEffect, useState, useMemo } from "react";
import { Plus, AlertCircle, DollarSign } from "lucide-react";
import { api } from "../utils/api.js";
import { formatCurrency, formatDate, leadStageColour, STAGES_LEAD, SOURCES } from "../utils/format.js";
import { isAfter, parseISO } from "date-fns";
import Modal from "../components/shared/Modal.jsx";
import BusinessBadge from "../components/shared/BusinessBadge.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";
import { useApp } from "../context/AppContext.jsx";

const STAGES = ["New", "Contacted", "Proposal Sent", "Negotiating", "Won", "Lost"];

function LeadForm({ lead, onSave, onClose, onDelete }) {
  const { businesses } = useApp();
  const [form, setForm] = useState({
    businessId: lead?.businessId || "mbm",
    name: lead?.name || "",
    company: lead?.company || "",
    value: lead?.value || "",
    source: lead?.source || "Website",
    stage: lead?.stage || "New",
    lastContact: lead?.lastContact ? new Date(lead.lastContact).toISOString().split("T")[0] : "",
    nextFollowUp: lead?.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split("T")[0] : "",
    notes: lead?.notes || "",
    wonLostReason: lead?.wonLostReason || "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Name</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Contact name" />
        </div>
        <div>
          <label className="label block mb-1.5">Company</label>
          <input className="input" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Company (optional)" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label block mb-1.5">Business</label>
          <select className="select" value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Stage</label>
          <select className="select" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Value (£)</label>
          <input className="input" type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Source</label>
          <select className="select" value={form.source} onChange={(e) => set("source", e.target.value)}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Last contact</label>
          <input className="input" type="date" value={form.lastContact} onChange={(e) => set("lastContact", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Next follow-up</label>
        <input className="input" type="date" value={form.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} />
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {["Won", "Lost"].includes(form.stage) && (
        <div>
          <label className="label block mb-1.5">Won/Lost reason</label>
          <input className="input" value={form.wonLostReason} onChange={(e) => set("wonLostReason", e.target.value)} placeholder="Reason..." />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save lead</button>
        {lead?.id && <button type="button" onClick={onDelete} className="btn-danger">Delete</button>}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function isStale(lead) {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (lead.nextFollowUp && isAfter(now, parseISO(lead.nextFollowUp))) return true;
  if (lead.lastContact && isAfter(threeDaysAgo, parseISO(lead.lastContact))) return true;
  return false;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [bFilter, setBFilter] = useState("all");
  const { getBusinessColour } = useApp();

  useEffect(() => {
    api.get("/leads").then(setLeads).finally(() => setLoading(false));
  }, []);

  const handleSave = async (form) => {
    if (selected?.id) {
      const updated = await api.put(`/leads/${selected.id}`, form);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } else {
      const created = await api.post("/leads", form);
      setLeads((prev) => [created, ...prev]);
    }
    setModal(false);
    setSelected(null);
  };

  const handleDelete = async () => {
    await api.delete(`/leads/${selected.id}`);
    setLeads((prev) => prev.filter((l) => l.id !== selected.id));
    setModal(false);
    setSelected(null);
  };

  const filtered = useMemo(() => leads.filter((l) => bFilter === "all" || l.businessId === bFilter), [leads, bFilter]);

  const stageGroups = useMemo(() =>
    STAGES.reduce((acc, s) => ({ ...acc, [s]: filtered.filter((l) => l.stage === s) }), {}),
    [filtered]
  );

  const activePipeline = filtered.filter((l) => !["Won", "Lost"].includes(l.stage));
  const pipelineValue = activePipeline.reduce((s, l) => s + (l.value || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="font-display font-bold text-2xl text-text">Lead Tracker</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
            {[["all", "All"], ["mbm", "Made by Max"], ["tradex", "Tradex"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setBFilter(val)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${bFilter === val ? "bg-border text-text" : "text-text-muted hover:text-text"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => { setSelected(null); setModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="stat-label">Active leads</span>
          <span className="stat-value">{activePipeline.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pipeline value</span>
          <span className="stat-value text-mbm">{formatCurrency(pipelineValue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Needs follow-up</span>
          <span className="stat-value text-warning">{activePipeline.filter(isStale).length}</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-surface border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className={`badge ${leadStageColour(stage)}`}>{stage}</span>
              <span className="text-xs text-text-muted font-mono">{stageGroups[stage]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(stageGroups[stage] || []).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => { setSelected(lead); setModal(true); }}
                  className="p-3 rounded-lg bg-card border border-border hover:border-mbm/50 cursor-pointer transition-all duration-150 group relative"
                >
                  {isStale(lead) && !["Won", "Lost"].includes(lead.stage) && (
                    <AlertCircle size={12} className="text-warning absolute top-2 right-2" />
                  )}
                  <p className="text-sm font-medium text-text leading-tight mb-1">{lead.name}</p>
                  {lead.company && <p className="text-xs text-text-muted truncate">{lead.company}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <BusinessBadge businessId={lead.businessId} size="xs" />
                    {lead.value && <span className="text-xs font-mono text-mbm">{formatCurrency(lead.value)}</span>}
                  </div>
                  {lead.nextFollowUp && (
                    <p className="text-[10px] text-text-muted mt-1">Follow-up: {formatDate(lead.nextFollowUp)}</p>
                  )}
                </div>
              ))}
              {(stageGroups[stage] || []).length === 0 && (
                <p className="text-xs text-text-muted text-center py-4">—</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="mt-8">
          <EmptyState icon={Users} title="No leads yet" description="Start tracking your sales pipeline" action={<button onClick={() => setModal(true)} className="btn-primary">Add first lead</button>} />
        </div>
      )}

      {modal && (
        <Modal title={selected ? "Edit lead" : "New lead"} onClose={() => { setModal(false); setSelected(null); }}>
          <LeadForm lead={selected} onSave={handleSave} onClose={() => { setModal(false); setSelected(null); }} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
}
