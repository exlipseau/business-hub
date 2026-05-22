import { Router } from "express";

const router = Router();

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

router.get("/weekly", async (req, res, next) => {
  try {
    const { start, end } = getWeekRange();
    const prisma = req.prisma;

    const [timeEntries, tasksCompleted, tasksPending, newLeads, events, goals] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { startTime: { gte: start, lte: end } },
        include: { business: { select: { name: true, colour: true } } },
        orderBy: { startTime: "asc" },
      }),
      prisma.task.findMany({
        where: { completed: true, updatedAt: { gte: start, lte: end } },
        include: { business: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.task.findMany({
        where: { completed: false },
        include: { business: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.lead.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { business: { select: { name: true } } },
      }),
      prisma.calendarEvent.findMany({
        where: { start: { gte: start, lte: end } },
        include: { business: { select: { name: true } } },
        orderBy: { start: "asc" },
      }),
      prisma.goal.findMany({ include: { business: { select: { name: true } } } }),
    ]);

    const hoursByBusiness = {};
    const hoursByCategory = {};
    let totalMinutes = 0;
    for (const e of timeEntries) {
      const mins = e.duration || 0;
      totalMinutes += mins;
      const b = e.business?.name || "General";
      hoursByBusiness[b] = (hoursByBusiness[b] || 0) + mins;
      hoursByCategory[e.category] = (hoursByCategory[e.category] || 0) + mins;
    }

    res.json({
      period: { start, end },
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      hoursByBusiness: Object.entries(hoursByBusiness).map(([name, mins]) => ({ name, hours: Math.round((mins / 60) * 10) / 10 })),
      hoursByCategory: Object.entries(hoursByCategory).map(([name, mins]) => ({ name, hours: Math.round((mins / 60) * 10) / 10 })),
      tasksCompleted,
      tasksPending,
      newLeads,
      events,
      goals,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/monthly", async (req, res, next) => {
  try {
    const { start, end } = getMonthRange();
    const prisma = req.prisma;

    const [timeEntries, projects, leads, goals, tasksCompleted, tasksPending] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { startTime: { gte: start, lte: end } },
        include: { business: { select: { name: true, colour: true } } },
      }),
      prisma.project.findMany({
        include: { business: { select: { name: true, colour: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.lead.findMany({
        include: { business: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.goal.findMany({ include: { business: { select: { name: true } } } }),
      prisma.task.findMany({
        where: { completed: true, updatedAt: { gte: start, lte: end } },
        include: { business: { select: { name: true } } },
      }),
      prisma.task.findMany({
        where: { completed: false },
        include: { business: { select: { name: true } } },
        orderBy: { priority: "desc" },
      }),
    ]);

    const hoursByBusiness = {};
    let totalMinutes = 0;
    for (const e of timeEntries) {
      const mins = e.duration || 0;
      totalMinutes += mins;
      const b = e.business?.name || "General";
      hoursByBusiness[b] = (hoursByBusiness[b] || 0) + mins;
    }

    const revenueByBusiness = {};
    for (const p of projects) {
      const b = p.business?.name || "General";
      revenueByBusiness[b] = (revenueByBusiness[b] || 0) + (p.revenue || 0);
    }

    const leadsByStage = {};
    for (const l of leads) {
      leadsByStage[l.stage] = (leadsByStage[l.stage] || 0) + 1;
    }

    const projectsByStage = {};
    for (const p of projects) {
      projectsByStage[p.stage] = (projectsByStage[p.stage] || 0) + 1;
    }

    res.json({
      period: { start, end },
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      hoursByBusiness: Object.entries(hoursByBusiness).map(([name, mins]) => ({ name, hours: Math.round((mins / 60) * 10) / 10 })),
      revenueByBusiness: Object.entries(revenueByBusiness).map(([name, revenue]) => ({ name, revenue })),
      leadsByStage: Object.entries(leadsByStage).map(([stage, count]) => ({ stage, count })),
      projectsByStage: Object.entries(projectsByStage).map(([stage, count]) => ({ stage, count })),
      projects,
      goals,
      tasksCompleted,
      tasksPending,
      leads,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
