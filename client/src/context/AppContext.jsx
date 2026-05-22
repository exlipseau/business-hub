import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../utils/api.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [filterBusiness, setFilterBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);

  const mbm = businesses.find((b) => b.id === "mbm");
  const tradex = businesses.find((b) => b.id === "tradex");

  const loadBusinesses = useCallback(async () => {
    try {
      const data = await api.get("/business");
      setBusinesses(data);
    } catch {}
  }, []);

  const refreshActiveTimer = useCallback(async () => {
    try {
      const timer = await api.get("/time/active");
      setActiveTimer(timer);
    } catch {}
  }, []);

  useEffect(() => {
    loadBusinesses();
    refreshActiveTimer();
    setLoading(false);
  }, [loadBusinesses, refreshActiveTimer]);

  const getBusinessColour = (businessId) => {
    if (businessId === "mbm") return "#3b82f6";
    if (businessId === "tradex") return "#f59e0b";
    return "#7070a0";
  };

  const getBusinessName = (businessId) => {
    const b = businesses.find((x) => x.id === businessId);
    return b?.name || "—";
  };

  return (
    <AppContext.Provider
      value={{
        businesses,
        mbm,
        tradex,
        filterBusiness,
        setFilterBusiness,
        loading,
        loadBusinesses,
        getBusinessColour,
        getBusinessName,
        activeTimer,
        setActiveTimer,
        refreshActiveTimer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
