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

function buildCredentials({ timeEntries, tasksCompleted, tasksPending, interactions, events, leads, goals, projects }) {
  const totalMinutes = timeEntries.reduce((s, e) => s + (e.duration || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  const overdueCount = tasksPending.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length;
  const onTimeCount = tasksCompleted.filter((t) => !t.dueDate || new Date(t.updatedAt) <= new Date(t.dueDate)).length;

  const uniqueTrackingDays = new Set(timeEntries.map((e) => new Date(e.startTime).toDateString())).size;

  const goalsWithProgress = goals.filter((g) => g.current > 0);
  const goalsOnTrack = goals.filter((g) => g.target > 0 && (g.current / g.target) >= 0.5).length;

  const meetingCount = interactions.filter((i) => i.type === "meeting").length;
  const callCount = interactions.filter((i) => i.type === "call").length;
  const emailCount = interactions.filter((i) => i.type === "email").length;
  const totalInteractions = interactions.length;

  const calendarMeetings = events.filter((e) => e.category === "Meeting" || e.category === "Sales");
  const clientProjects = projects.filter((p) => p.stage !== "Live" && p.stage !== "Cancelled");

  const leadsContacted = leads.filter((l) => l.lastContact).length;

  return {
    communication: {
      score: Math.min(100, (totalInteractions * 15) + (calendarMeetings.length * 10) + (leads.length * 5)),
      meetings: meetingCount,
      calls: callCount,
      emails: emailCount,
      totalInteractions,
      calendarMeetings: calendarMeetings.length,
      leadsContacted,
      activeClients: clientProjects.length,
      evidence: interactions.slice(0, 5),
    },
    empiricalReasoning: {
      score: Math.min(100, (projects.length * 12) + (leads.length * 8) + (goals.length * 10)),
      projectsManaged: projects.length,
      leadsInPipeline: leads.length,
      stagesTracked: [...new Set(projects.map((p) => p.stage))].length,
      goalsSet: goals.length,
      businessesAnalysed: 2,
      evidence: projects.slice(0, 4),
    },
    quantitativeReasoning: {
      score: Math.min(100, (totalHours * 2) + (goals.length * 15)),
      hoursTracked: totalHours,
      trackingDays: uniqueTrackingDays,
      goalsWithData: goalsWithProgress.length,
      revenue: projects.reduce((s, p) => s + (p.revenue || 0), 0),
      hoursByBusiness: Object.entries(
        timeEntries.reduce((acc, e) => {
          const b = e.business?.name || "General";
          acc[b] = (acc[b] || 0) + (e.duration || 0);
          return acc;
        }, {})
      ).map(([name, mins]) => ({ name, hours: Math.round((mins / 60) * 10) / 10 })),
      goals,
    },
    personalQualities: {
      score: Math.min(100, (tasksCompleted.length * 10) + (onTimeCount * 5) + (uniqueTrackingDays * 8) + (goalsOnTrack * 15)),
      tasksCompleted: tasksCompleted.length,
      tasksPending: tasksPending.length,
      onTimeCount,
      overdueCount,
      uniqueTrackingDays,
      goalsOnTrack,
      totalGoals: goals.length,
      selfDirected: totalHours,
    },
  };
}

router.get("/weekly", async (req, res, next) => {
  try {
    const { start, end } = getWeekRange();
    const prisma = req.prisma;

    const [timeEntries, tasksCompleted, tasksPending, newLeads, events, goals, interactions, projects] = await Promise.all([
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
      prisma.interaction.findMany({
        where: { date: { gte: start, lte: end } },
        include: { contact: { select: { name: true, company: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.project.findMany({ include: { business: { select: { name: true } } } }),
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

    const leads = await prisma.lead.findMany({ include: { business: { select: { name: true } } } });

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
      interactions,
      credentials: buildCredentials({ timeEntries, tasksCompleted, tasksPending, interactions, events, leads, goals, projects }),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/monthly", async (req, res, next) => {
  try {
    const { start, end } = getMonthRange();
    const prisma = req.prisma;

    const [timeEntries, projects, leads, goals, tasksCompleted, tasksPending, interactions, events] = await Promise.all([
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
      prisma.interaction.findMany({
        where: { date: { gte: start, lte: end } },
        include: { contact: { select: { name: true, company: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.calendarEvent.findMany({
        where: { start: { gte: start, lte: end } },
        include: { business: { select: { name: true } } },
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
      interactions,
      credentials: buildCredentials({ timeEntries, tasksCompleted, tasksPending, interactions, events, leads, goals, projects }),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
