import React, { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus } from "lucide-react";
import { api } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";
import Modal from "../components/shared/Modal.jsx";
import { CATEGORIES } from "../utils/format.js";

function EventForm({ event, onSave, onClose, onDelete }) {
  const { businesses } = useApp();
  const [form, setForm] = useState({
    title: event?.title || "",
    businessId: event?.businessId || "",
    category: event?.category || "Client Work",
    start: event?.start ? new Date(event.start).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    end: event?.end ? new Date(event.end).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    allDay: event?.allDay || false,
    isDeadline: event?.isDeadline || false,
    notes: event?.notes || "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label block mb-1.5">Title</label>
        <input className="input" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Business</label>
          <select className="select" value={form.businessId} onChange={(e) => set("businessId", e.target.value)}>
            <option value="">No business</option>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label block mb-1.5">Category</label>
          <select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label block mb-1.5">Start</label>
          <input className="input" type="datetime-local" value={form.start} onChange={(e) => set("start", e.target.value)} />
        </div>
        <div>
          <label className="label block mb-1.5">End</label>
          <input className="input" type="datetime-local" value={form.end} onChange={(e) => set("end", e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" checked={form.allDay} onChange={(e) => set("allDay", e.target.checked)} />
          <span className="text-sm text-text">All day</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded" checked={form.isDeadline} onChange={(e) => set("isDeadline", e.target.checked)} />
          <span className="text-sm text-text">Deadline</span>
        </label>
      </div>
      <div>
        <label className="label block mb-1.5">Notes</label>
        <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1">Save event</button>
        {event?.id && (
          <button type="button" onClick={onDelete} className="btn-danger">Delete</button>
        )}
        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
      </div>
    </form>
  );
}

export default function CalendarPage() {
  const { getBusinessColour } = useApp();
  const calRef = useRef();
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async (fetchInfo) => {
    const from = fetchInfo.startStr;
    const to = fetchInfo.endStr;
    const data = await api.get(`/calendar?from=${from}&to=${to}`);
    return data.map((ev) => ({
      id: ev.id,
      title: ev.isDeadline ? `⚑ ${ev.title}` : ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      backgroundColor: ev.businessId ? getBusinessColour(ev.businessId) : "#4a4a6a",
      borderColor: "transparent",
      extendedProps: ev,
    }));
  }, [getBusinessColour]);

  const openNew = (selectInfo) => {
    setSelectedEvent({ start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay });
    setModal("create");
  };

  const openEdit = (clickInfo) => {
    setSelectedEvent(clickInfo.event.extendedProps);
    setModal("edit");
  };

  const handleSave = async (form) => {
    if (modal === "edit" && selectedEvent?.id) {
      await api.put(`/calendar/${selectedEvent.id}`, form);
    } else {
      await api.post("/calendar", form);
    }
    calRef.current?.getApi().refetchEvents();
    setModal(null);
  };

  const handleDelete = async () => {
    if (selectedEvent?.id) {
      await api.delete(`/calendar/${selectedEvent.id}`);
      calRef.current?.getApi().refetchEvents();
      setModal(null);
    }
  };

  const handleDrop = async (info) => {
    const ev = info.event.extendedProps;
    await api.put(`/calendar/${ev.id}`, {
      ...ev,
      start: info.event.startStr,
      end: info.event.endStr,
      allDay: info.event.allDay,
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="font-display font-bold text-2xl text-text">Calendar</h1>
        <button
          onClick={() => { setSelectedEvent(null); setModal("create"); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add event
        </button>
      </div>

      <div className="card overflow-hidden">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          editable
          selectable
          selectMirror
          dayMaxEvents
          height="calc(100vh - 180px)"
          events={loadEvents}
          select={openNew}
          eventClick={openEdit}
          eventDrop={handleDrop}
          eventResize={handleDrop}
          nowIndicator
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
        />
      </div>

      {modal && (
        <Modal
          title={modal === "edit" ? "Edit event" : "New event"}
          onClose={() => setModal(null)}
        >
          <EventForm
            event={selectedEvent}
            onSave={handleSave}
            onClose={() => setModal(null)}
            onDelete={handleDelete}
          />
        </Modal>
      )}
    </div>
  );
}
