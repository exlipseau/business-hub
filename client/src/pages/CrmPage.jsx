import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search, Phone, Mail, Building2, MessageSquare, Calendar, ChevronRight } from "lucide-react";
import { api } from "../utils/api.js";
import { formatRelative, CONTACT_STATUSES, INTERACTION_TYPES } from "../utils/format.js";
import Modal from "../components/shared/Modal.jsx";
import BusinessBadge from "../components/shared/BusinessBadge.jsx";
import EmptyState from "../components/shared/EmptyState.jsx";
import { useApp } from "../context/AppContext.jsx";
import { format } from "date-fns";

const STATUS_COLOURS = {
  Prospect: "bg-blue-500/10 text-blue-400",
  "Active Client": "bg-green-500/10 text-green-400",
  "Past Client": "bg-gray-500/10 text-gray-400",
  Partner: "bg-purple-500/10 text-purple-400",
};

const INTERACTION_ICONS = { call: Phone, email: Mail, meeting: Calendar, message: MessageSquare };

function ContactForm({ contact, onSave, onClose, onDelete }) {
  const { businesses } = useApp();
  const [form, setForm] = useState({
    name: contact?.name || "",
    company: contact?.company || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    status: contact?.status || "Prospect",
    notes: contact?.notes || "",
    businessIds: contact?.interactions?.map((i) => i.businessId) || [],
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleBusiness = (id) => {
    setForm((f) => ({
      ...f,
      businessIds: f.businessIds.includes(id) ? f.businessIds.filter((x) => x !== id) : [...f.businessIds, id],
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Name</label>
          <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label block mb-1.5">Company</label>
          <input className="input" value={form.company} onChange={(e) => set("company", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label block mb-1.5">Phone</label>
          <input className="input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Status</label>
        <select className="select" value={form.status} onChange={(e) => set("status", e.target.value)}>
          {CONTACT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label block mb-2">Businesses</label>
        <div className="flex gap-3">
          {businesses.map((b) => (
            <label key={b.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.businessIds.includes(b.id)} onChange={() => toggleBusiness(b.id)} />
              <span className="text-sm text-text">{b.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save contact</button>
        {contact?.id && <button type="button" onClick={onDelete} className="btn-danger">Delete</button>}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function InteractionForm({ onSave, onClose }) {
  const [form, setForm] = useState({ type: "call", date: new Date().toISOString().split("T")[0], notes: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Type</label>
          <select className="select" value={form.type} onChange={(e) => set("type", e.target.value)}>
            {INTERACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Date</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} required />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">Log interaction</button>
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

function ContactDetail({ contact: initial, onUpdate, onClose }) {
  const [contact, setContact] = useState(initial);
  const [logModal, setLogModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const handleLogSave = async (form) => {
    const interaction = await api.post(`/crm/contacts/${contact.id}/interactions`, form);
    const updated = await api.get(`/crm/contacts/${contact.id}`);
    setContact(updated);
    onUpdate(updated);
    setLogModal(false);
  };

  const handleEditSave = async (form) => {
    const updated = await api.put(`/crm/contacts/${contact.id}`, form);
    const full = await api.get(`/crm/contacts/${contact.id}`);
    setContact(full);
    onUpdate(full);
    setEditModal(false);
  };

  const handleDelete = async () => {
    await api.delete(`/crm/contacts/${contact.id}`);
    onUpdate(null, contact.id);
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display font-bold text-xl text-text">{contact.name}</h3>
          {contact.company && <p className="text-text-muted">{contact.company}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditModal(true)} className="btn-ghost text-xs">Edit</button>
          <span className={`badge ${STATUS_COLOURS[contact.status] || "bg-border text-text-muted"}`}>{contact.status}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-mbm hover:text-blue-400"><Mail size={14} />{contact.email}</a>}
        {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-text-muted hover:text-text"><Phone size={14} />{contact.phone}</a>}
      </div>

      {contact.interactions?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contact.interactions.map((i) => <BusinessBadge key={i.id} businessId={i.businessId} />)}
        </div>
      )}

      {contact.notes && (
        <div className="bg-surface rounded-lg p-4">
          <p className="label mb-2">Notes</p>
          <p className="text-sm text-text">{contact.notes}</p>
        </div>
      )}

      {/* Interaction log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-text">Interaction log</h4>
          <button onClick={() => setLogModal(true)} className="btn-ghost text-xs flex items-center gap-1"><Plus size={12} />Log</button>
        </div>
        {contact.logs?.length === 0 ? (
          <p className="text-sm text-text-muted">No interactions logged</p>
        ) : (
          <div className="space-y-3">
            {contact.logs?.map((log) => {
              const Icon = INTERACTION_ICONS[log.type] || MessageSquare;
              return (
                <div key={log.id} className="flex gap-3 p-3 bg-surface rounded-lg">
                  <Icon size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted mb-1 capitalize">{log.type} · {format(new Date(log.date), "d MMM yyyy")}</p>
                    <p className="text-sm text-text">{log.notes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {logModal && (
        <Modal title="Log interaction" onClose={() => setLogModal(false)} size="sm">
          <InteractionForm onSave={handleLogSave} onClose={() => setLogModal(false)} />
        </Modal>
      )}
      {editModal && (
        <Modal title="Edit contact" onClose={() => setEditModal(false)}>
          <ContactForm contact={contact} onSave={handleEditSave} onClose={() => setEditModal(false)} onDelete={handleDelete} />
        </Modal>
      )}
    </div>
  );
}

export default function CrmPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [detailContact, setDetailContact] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => api.get("/crm/contacts").then(setContacts).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    const created = await api.post("/crm/contacts", form);
    setContacts((prev) => [created, ...prev]);
    setModal(false);
  };

  const handleUpdate = (updated, deletedId) => {
    if (deletedId) {
      setContacts((prev) => prev.filter((c) => c.id !== deletedId));
    } else if (updated) {
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (detailContact?.id === updated.id) setDetailContact(updated);
    }
  };

  const filtered = useMemo(() =>
    contacts.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    }), [contacts, search, statusFilter]
  );

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="font-display font-bold text-2xl text-text">CRM</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="input pl-8" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
          {[["all", "All"], ...CONTACT_STATUSES.map((s) => [s, s])].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === val ? "bg-border text-text" : "text-text-muted hover:text-text"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No contacts" description="Add your first contact to the CRM" action={<button onClick={() => setModal(true)} className="btn-primary">Add contact</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setDetailContact(contact)}
              className="card cursor-pointer hover:border-mbm/50 transition-all duration-150 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-text group-hover:text-mbm transition-colors">{contact.name}</p>
                  {contact.company && <p className="text-sm text-text-muted">{contact.company}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_COLOURS[contact.status] || "bg-border text-text-muted"}`}>{contact.status}</span>
                  <ChevronRight size={14} className="text-text-muted group-hover:text-mbm transition-colors" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                {contact.email && <span className="flex items-center gap-1"><Mail size={11} />{contact.email}</span>}
                {contact.phone && <span className="flex items-center gap-1"><Phone size={11} />{contact.phone}</span>}
              </div>
              {contact.logs?.length > 0 && (
                <p className="text-xs text-text-muted mt-2">Last: {formatRelative(contact.logs[0].date)}</p>
              )}
              <div className="flex gap-1 mt-2 flex-wrap">
                {contact.interactions?.map((i) => <BusinessBadge key={i.id} businessId={i.businessId} size="xs" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New contact" onClose={() => setModal(false)}>
          <ContactForm onSave={handleSave} onClose={() => setModal(false)} />
        </Modal>
      )}

      {detailContact && (
        <Modal title="Contact" onClose={() => setDetailContact(null)} size="lg">
          <ContactDetail contact={detailContact} onUpdate={handleUpdate} onClose={() => setDetailContact(null)} />
        </Modal>
      )}
    </div>
  );
}
