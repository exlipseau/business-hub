import React, { useEffect, useState } from "react";
import { Save, Eye, EyeOff, Check } from "lucide-react";
import { api } from "../utils/api.js";
import { useApp } from "../context/AppContext.jsx";

function Section({ title, children }) {
  return (
    <div className="card mb-6">
      <h2 className="section-title mb-6 pb-4 border-b border-border">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { businesses, loadBusinesses } = useApp();
  const [settings, setSettings] = useState({});
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState({});
  const [targets, setTargets] = useState({ mbm_monthly_target: "", tradex_monthly_target: "" });
  const [businessForms, setBusinessForms] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings").then((s) => {
      setSettings(s);
      setApiKey(s.anthropic_api_key || "");
      setTargets({
        mbm_monthly_target: s.mbm_monthly_target || "5000",
        tradex_monthly_target: s.tradex_monthly_target || "2000",
      });
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (businesses.length) {
      setBusinessForms(businesses.reduce((acc, b) => ({ ...acc, [b.id]: { name: b.name, colour: b.colour } }), {}));
    }
  }, [businesses]);

  const flash = (key) => { setSaved((s) => ({ ...s, [key]: true })); setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000); };

  const saveApiKey = async () => {
    await api.put("/settings", { anthropic_api_key: apiKey });
    flash("api");
  };

  const saveTargets = async () => {
    await api.put("/settings", targets);
    flash("targets");
  };

  const saveBusiness = async (id) => {
    await api.put(`/business/${id}`, businessForms[id]);
    await loadBusinesses();
    flash(`biz_${id}`);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-mbm border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-text">Settings</h1>
        <p className="text-text-muted text-sm mt-1">Configure your Business Hub</p>
      </div>

      {/* AI */}
      <Section title="AI Assistant">
        <div className="space-y-4">
          <div>
            <label className="label block mb-2">Anthropic API Key</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  className="input pr-10"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
                <button type="button" onClick={() => setShowKey((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button onClick={saveApiKey} className="btn-primary flex items-center gap-2">
                {saved.api ? <Check size={15} /> : <Save size={15} />}
                {saved.api ? "Saved!" : "Save"}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">Get your key at console.anthropic.com. Stored locally only.</p>
          </div>
        </div>
      </Section>

      {/* Businesses */}
      <Section title="Businesses">
        {businesses.map((b) => (
          <div key={b.id} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.colour }} />
              <span className="font-medium text-text">{b.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Business name</label>
                <input
                  className="input"
                  value={businessForms[b.id]?.name || ""}
                  onChange={(e) => setBusinessForms((f) => ({ ...f, [b.id]: { ...f[b.id], name: e.target.value } }))}
                />
              </div>
              <div>
                <label className="label block mb-1.5">Accent colour</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={businessForms[b.id]?.colour || b.colour}
                    onChange={(e) => setBusinessForms((f) => ({ ...f, [b.id]: { ...f[b.id], colour: e.target.value } }))}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-surface"
                  />
                  <input
                    className="input"
                    value={businessForms[b.id]?.colour || ""}
                    onChange={(e) => setBusinessForms((f) => ({ ...f, [b.id]: { ...f[b.id], colour: e.target.value } }))}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
            <button onClick={() => saveBusiness(b.id)} className="btn-primary mt-3 flex items-center gap-2">
              {saved[`biz_${b.id}`] ? <Check size={14} /> : <Save size={14} />}
              {saved[`biz_${b.id}`] ? "Saved!" : "Save changes"}
            </button>
          </div>
        ))}
      </Section>

      {/* Revenue targets */}
      <Section title="Revenue Targets">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {businesses.map((b) => (
            <div key={b.id}>
              <label className="label block mb-1.5">{b.name} monthly target (A$)</label>
              <input
                className="input"
                type="number"
                value={targets[`${b.id}_monthly_target`] || ""}
                onChange={(e) => setTargets((t) => ({ ...t, [`${b.id}_monthly_target`]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button onClick={saveTargets} className="btn-primary flex items-center gap-2">
          {saved.targets ? <Check size={14} /> : <Save size={14} />}
          {saved.targets ? "Saved!" : "Save targets"}
        </button>
      </Section>

    </div>
  );
}
