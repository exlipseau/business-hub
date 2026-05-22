import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function LoginPage() {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = [useRef(), useRef(), useRef(), useRef()];
  const { login } = useApp();

  useEffect(() => { inputs[0].current?.focus(); }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    setError("");
    if (val && i < 3) inputs[i + 1].current?.focus();
    if (next.every((d) => d !== "") && val) {
      submit(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      inputs[i - 1].current?.focus();
    }
  };

  const submit = async (code) => {
    setLoading(true);
    try {
      await login(code);
    } catch {
      setError("Incorrect PIN");
      setPin(["", "", "", ""]);
      setTimeout(() => inputs[0].current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mbm to-blue-400 flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-display font-bold text-2xl">M</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-text mb-1">Business Hub</h1>
        <p className="text-text-muted mb-10">Enter your PIN to continue</p>

        <div className="flex gap-4 justify-center mb-6">
          {pin.map((d, i) => (
            <input
              key={i}
              ref={inputs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-2xl font-mono font-bold rounded-xl border-2 bg-surface text-text focus:outline-none transition-all duration-150 ${
                error
                  ? "border-danger bg-danger/10"
                  : d
                  ? "border-mbm"
                  : "border-border focus:border-mbm"
              }`}
            />
          ))}
        </div>

        {error && <p className="text-danger text-sm mb-4 animate-fade-in">{error}</p>}

        {loading && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-mbm border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <p className="text-text-muted text-xs mt-8">Default PIN: 1234</p>
      </div>
    </div>
  );
}
