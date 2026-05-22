import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, RefreshCw, Calendar, FileUp, CheckCircle2 } from "lucide-react";
import { api } from "../utils/api.js";

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-mbm/20" : "bg-surface border border-border"}`}>
        {isUser ? <User size={15} className="text-mbm" /> : <Bot size={15} className="text-text-muted" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-mbm/20 text-text rounded-tr-sm" : "bg-surface border border-border text-text rounded-tl-sm"}`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>li]:mb-1">
            {msg.content.split("\n").map((line, i) => {
              if (line.startsWith("• ") || line.startsWith("- ")) {
                return <p key={i} className="flex gap-2"><span>·</span><span>{line.slice(2)}</span></p>;
              }
              return line ? <p key={i}>{line}</p> : <br key={i} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AiPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState(null);
  const [debrief, setDebrief] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [taskGenLoading, setTaskGenLoading] = useState(false);
  const [taskGenResult, setTaskGenResult] = useState(null);
  const [taskGenBusiness, setTaskGenBusiness] = useState("mbm");
  const [taskGenPrompt, setTaskGenPrompt] = useState("");
  const [selectedPdf, setSelectedPdf] = useState(null); // { name, base64 }
  const fileInputRef = useRef();
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadBriefing = async () => {
    setBriefingLoading(true);
    try {
      const { briefing: b } = await api.get("/ai/briefing");
      setBriefing(b);
    } catch (e) {
      if (e.message?.includes("API key")) setNoApiKey(true);
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    loadBriefing();
  }, []);

  const loadDebrief = async () => {
    setDebriefLoading(true);
    try {
      const { debrief: d } = await api.get("/ai/weekly-debrief");
      setDebrief(d);
    } catch (e) {
      if (e.message?.includes("API key")) setNoApiKey(true);
    } finally {
      setDebriefLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await api.post("/ai/chat", { message: userMsg.content, history });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      if (e.message?.includes("API key")) setNoApiKey(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setTaskGenResult({ error: "Please select a PDF file" });
      return;
    }
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setSelectedPdf({ name: file.name, base64 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateTasks = async () => {
    if (!taskGenPrompt.trim() && !selectedPdf) return;
    setTaskGenLoading(true);
    setTaskGenResult(null);
    try {
      const payload = { businessId: taskGenBusiness };
      if (selectedPdf) { payload.pdfBase64 = selectedPdf.base64; payload.filename = selectedPdf.name; }
      if (taskGenPrompt.trim()) payload.prompt = taskGenPrompt.trim();
      const data = await api.post("/ai/generate-tasks", payload);
      setTaskGenResult({ count: data.count, tasks: data.created });
      setTaskGenPrompt("");
      setSelectedPdf(null);
    } catch (err) {
      if (err.message?.includes("API key")) setNoApiKey(true);
      setTaskGenResult({ error: err.message || "Failed to generate tasks" });
    } finally {
      setTaskGenLoading(false);
    }
  };

  const QUICK = [
    "What's overdue?",
    "How many leads did I close this month?",
    "Am I on track for my revenue goals?",
    "What should I focus on today?",
    "Give me a summary of Made by Max projects",
    "How's Tradex pipeline looking?",
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-text">AI Assistant</h1>
            <p className="text-xs text-text-muted">Powered by Claude</p>
          </div>
        </div>
        <button onClick={loadDebrief} disabled={debriefLoading} className="btn-ghost flex items-center gap-2">
          <Calendar size={15} />
          {debriefLoading ? "Generating..." : "Weekly Debrief"}
        </button>
      </div>

      {noApiKey && (
        <div className="card border-warning/30 bg-warning/5 mb-6">
          <p className="text-sm text-warning">No Anthropic API key configured. Add your key in <a href="/settings" className="underline">Settings</a>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="xl:col-span-2 flex flex-col">
          <div className="card flex flex-col" style={{ height: "calc(100vh - 240px)" }}>
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Bot size={32} className="text-text-muted mx-auto mb-3" />
                  <p className="font-semibold text-text mb-1">Ask me anything about your businesses</p>
                  <p className="text-sm text-text-muted">I have access to your projects, leads, goals, and time data</p>
                </div>
              )}
              {messages.map((msg, i) => <Message key={i} msg={msg} />)}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
                    <Bot size={15} className="text-text-muted" />
                  </div>
                  <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                    <Loader2 size={15} className="text-text-muted animate-spin" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-text-muted hover:border-mbm hover:text-mbm transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Ask about your business..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-3">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Briefing + Debrief */}
        <div className="space-y-4">
          {/* Daily briefing */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Today's briefing</h2>
              <button onClick={loadBriefing} disabled={briefingLoading} className="text-text-muted hover:text-text transition-colors">
                <RefreshCw size={14} className={briefingLoading ? "animate-spin" : ""} />
              </button>
            </div>
            {briefingLoading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm py-4">
                <Loader2 size={14} className="animate-spin" /> Generating briefing...
              </div>
            ) : briefing ? (
              <div className="space-y-2 text-sm text-text">
                {briefing.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className={line.startsWith("•") || line.startsWith("-") ? "flex gap-2" : ""}>
                    {(line.startsWith("•") || line.startsWith("-")) ? <><span className="text-mbm">·</span><span>{line.slice(1).trim()}</span></> : line}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">{noApiKey ? "Add your API key to see the briefing" : "Click refresh to generate"}</p>
            )}
          </div>

          {/* Generate Tasks */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <FileUp size={15} className="text-mbm" />
              <h2 className="section-title">Generate Tasks</h2>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Describe what you need done, upload a PDF, or both — Claude will create the tasks automatically.
            </p>
            <div className="space-y-3">
              <div>
                <label className="label block mb-1.5">Add tasks to</label>
                <select
                  className="select w-full"
                  value={taskGenBusiness}
                  onChange={(e) => setTaskGenBusiness(e.target.value)}
                  disabled={taskGenLoading}
                >
                  <option value="mbm">Made by Max</option>
                  <option value="tradex">Tradex</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1.5">Describe the tasks</label>
                <textarea
                  className="input resize-none w-full"
                  rows={3}
                  placeholder="e.g. Build the contact form, design the homepage hero, write copy for the about page..."
                  value={taskGenPrompt}
                  onChange={(e) => setTaskGenPrompt(e.target.value)}
                  disabled={taskGenLoading}
                />
              </div>
              <div>
                <label className="label block mb-1.5">Attach a PDF <span className="text-text-muted">(optional)</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  disabled={taskGenLoading}
                  className="hidden"
                  id="pdf-upload"
                />
                {selectedPdf ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface border border-mbm/40 text-sm">
                    <span className="text-text truncate">{selectedPdf.name}</span>
                    <button onClick={() => setSelectedPdf(null)} className="text-text-muted hover:text-danger ml-2 flex-shrink-0 text-xs">✕</button>
                  </div>
                ) : (
                  <label
                    htmlFor="pdf-upload"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-text-muted hover:border-mbm hover:text-mbm cursor-pointer transition-colors text-sm"
                  >
                    <FileUp size={14} /> Choose PDF file
                  </label>
                )}
              </div>
              <button
                onClick={handleGenerateTasks}
                disabled={taskGenLoading || (!taskGenPrompt.trim() && !selectedPdf)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {taskGenLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Generating...</>
                ) : (
                  "Generate tasks"
                )}
              </button>
              {taskGenResult?.error && (
                <p className="text-xs text-danger">{taskGenResult.error}</p>
              )}
              {taskGenResult?.count > 0 && (
                <div className="bg-success/10 border border-success/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-success" />
                    <p className="text-sm font-medium text-success">
                      Added {taskGenResult.count} task{taskGenResult.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ul className="space-y-1 text-xs text-text">
                    {taskGenResult.tasks.slice(0, 6).map((t) => (
                      <li key={t.id} className="flex gap-2">
                        <span className="text-success">·</span>
                        <span className="truncate">{t.title}</span>
                      </li>
                    ))}
                    {taskGenResult.tasks.length > 6 && (
                      <li className="text-text-muted">…and {taskGenResult.tasks.length - 6} more</li>
                    )}
                  </ul>
                </div>
              )}
              {taskGenResult?.count === 0 && (
                <p className="text-xs text-text-muted">No tasks found. Try being more specific.</p>
              )}
            </div>
          </div>

          {/* Weekly debrief */}
          {debrief && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Weekly debrief</h2>
              </div>
              <div className="space-y-2 text-sm text-text">
                {debrief.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
