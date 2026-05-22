import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import businessRoutes from "./routes/business.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import leadRoutes from "./routes/leads.js";
import crmRoutes from "./routes/crm.js";
import goalRoutes from "./routes/goals.js";
import timeRoutes from "./routes/time.js";
import calendarRoutes from "./routes/calendar.js";
import aiRoutes from "./routes/ai.js";
import settingsRoutes from "./routes/settings.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
}
app.use(express.json());

app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Serve built React app in production
if (isProd) {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

async function initData() {
  // Create businesses if missing (idempotent)
  await prisma.business.upsert({
    where: { id: "mbm" },
    update: {},
    create: { id: "mbm", name: "Made by Max", colour: "#3b82f6", type: "agency" },
  });
  await prisma.business.upsert({
    where: { id: "tradex" },
    update: {},
    create: { id: "tradex", name: "Tradex", colour: "#f59e0b", type: "product" },
  });

  // Create default settings if missing (never overwrites existing values)
  const defaults = [
    { key: "mbm_monthly_target", value: "5000" },
    { key: "tradex_monthly_target", value: "2000" },
    { key: "anthropic_api_key", value: process.env.ANTHROPIC_API_KEY || "" },
  ];
  for (const s of defaults) {
    await prisma.settings.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log("✅ Data initialized");
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await initData();
  } catch (e) {
    console.error("Init error:", e.message);
  }
});
