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

export default router;
