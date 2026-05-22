import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk/index.js";

const router = Router();

async function buildAppData(prisma) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [projects, tasks, leads, goals, timeEntries, upcomingEvents] = await Promise.all([
    prisma.project.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.task.findMany({ where: { completed: false }, orderBy: { dueDate: "asc" } }),
    prisma.lead.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.goal.findMany(),
    prisma.timeEntry.findMany({
      where: { startTime: { gte: startOfWeek } },
      orderBy: { startTime: "desc" },
    }),
    prisma.calendarEvent.findMany({
      where: { start: { gte: now } },
      orderBy: { start: "asc" },
      take: 10,
      include: { business: { select: { name: true } } },
    }),
  ]);

  return { projects, tasks, leads, goals, timeEntries, upcomingEvents };
}

async function getApiKey(prisma) {
  const record = await prisma.settings.findUnique({ where: { key: "anthropic_api_key" } });
  return record?.value || process.env.ANTHROPIC_API_KEY || "";
}

router.post("/chat", async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const apiKey = await getApiKey(req.prisma);
    if (!apiKey) return res.status(400).json({ error: "No Anthropic API key configured" });

    const appData = await buildAppData(req.prisma);
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are Max's business assistant. Max runs two businesses: Made by Max (web design agency) and Tradex (custom GPT product for plumbing). Be direct, practical, and concise. Today is ${new Date().toDateString()}. Here is his current data: ${JSON.stringify(appData)}`,
      messages: [...history, { role: "user", content: message }],
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    next(err);
  }
});

router.get("/briefing", async (req, res, next) => {
  try {
    const apiKey = await getApiKey(req.prisma);
    if (!apiKey) return res.status(400).json({ error: "No Anthropic API key configured" });

    const appData = await buildAppData(req.prisma);
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: `You are Max's business assistant. Be brief and direct. Today is ${new Date().toDateString()}.`,
      messages: [
        {
          role: "user",
          content: `Generate today's briefing in 4-6 bullet points covering: (1) today's key tasks and events, (2) any overdue items, (3) leads needing follow-up, (4) one sentence on goal progress. Data: ${JSON.stringify(appData)}`,
        },
      ],
    });

    res.json({ briefing: response.content[0].text });
  } catch (err) {
    next(err);
  }
});

router.get("/weekly-debrief", async (req, res, next) => {
  try {
    const apiKey = await getApiKey(req.prisma);
    if (!apiKey) return res.status(400).json({ error: "No Anthropic API key configured" });

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [timeEntries, leads, goals, projects] = await Promise.all([
      req.prisma.timeEntry.findMany({
        where: { startTime: { gte: startOfWeek } },
        include: { business: { select: { name: true } } },
      }),
      req.prisma.lead.findMany({ orderBy: { updatedAt: "desc" } }),
      req.prisma.goal.findMany(),
      req.prisma.project.findMany({ orderBy: { updatedAt: "desc" } }),
    ]);

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are Max's business assistant. Be direct and insightful. Today is ${new Date().toDateString()}.`,
      messages: [
        {
          role: "user",
          content: `Generate a weekly debrief covering: (1) total hours by business and category, (2) goal progress update, (3) lead pipeline summary, (4) one key insight about time allocation, (5) suggested focus for next week. Data: ${JSON.stringify({ timeEntries, leads, goals, projects })}`,
        },
      ],
    });

    res.json({ debrief: response.content[0].text });
  } catch (err) {
    next(err);
  }
});

router.post("/generate-tasks", async (req, res, next) => {
  try {
    const { pdfBase64, prompt, businessId = "mbm", filename = "document.pdf" } = req.body;
    if (!pdfBase64 && !prompt) return res.status(400).json({ error: "Provide a PDF, a text prompt, or both" });

    const apiKey = await getApiKey(req.prisma);
    if (!apiKey) return res.status(400).json({ error: "No Anthropic API key configured" });

    const client = new Anthropic({ apiKey });

    const SYSTEM = `You generate actionable tasks. Return ONLY a JSON array, no prose, no markdown fences. Each item has: title (string, short and actionable), category (one of: "Client Work","Admin","Development","Marketing","Sales","Meeting","Support"), priority ("low"|"medium"|"high"), dueDate (ISO date string or null), notes (optional extra detail). Today is ${new Date().toDateString()}.`;

    // Build message content
    const content = [];
    if (pdfBase64) {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } });
    }

    let textInstruction = "";
    if (pdfBase64 && prompt) {
      textInstruction = `Using the document (${filename}) as context, generate tasks based on this instruction: "${prompt}". Return ONLY a JSON array.`;
    } else if (pdfBase64) {
      textInstruction = `Extract every actionable task from this document (${filename}). Return ONLY a JSON array.`;
    } else {
      textInstruction = `Generate actionable tasks from this description: "${prompt}". Break it into individual tasks. Return ONLY a JSON array.`;
    }
    content.push({ type: "text", text: textInstruction });

    const createParams = {
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    };

    // Add beta header for PDF support
    const requestOptions = pdfBase64 ? { headers: { "anthropic-beta": "pdfs-2024-09-25" } } : {};

    const response = await client.messages.create(createParams, requestOptions);

    let raw = response.content[0].text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    let tasks;
    try {
      tasks = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({ error: "Could not parse AI response", raw });
    }
    if (!Array.isArray(tasks)) {
      return res.status(500).json({ error: "AI response was not an array", raw });
    }

    const source = pdfBase64 ? filename : "prompt";
    const created = [];
    for (const t of tasks) {
      if (!t.title) continue;
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      const data = {
        businessId,
        title: String(t.title).slice(0, 200),
        category: t.category || "Admin",
        priority: ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium",
        dueDate: dueDate && !isNaN(dueDate) ? dueDate : null,
        notes: t.notes ? `[From ${source}] ${t.notes}` : `From ${source}`,
        completed: false,
      };
      const task = await req.prisma.task.create({ data });
      created.push(task);
    }

    res.json({ created, count: created.length });
  } catch (err) {
    next(err);
  }
});

export default router;
