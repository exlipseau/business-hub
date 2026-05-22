import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const prisma = req.prisma;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    todayEvents,
    todayTasks,
    overdueTasksMbm,
    overdueTasksTradex,
    staleLeadsMbm,
    staleLeadsTradex,
    leadsThisWeekMbm,
    leadsThisWeekTradex,
    todayTimeEntries,
    mbmRevenue,
    tradexRevenue,
    mbmTarget,
    tradexTarget,
    activeTimer,
  ] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { start: { gte: startOfDay, lte: endOfDay } },
      include: { business: { select: { name: true, colour: true } } },
      orderBy: { start: "asc" },
    }),
    prisma.task.findMany({
      where: { completed: false, dueDate: { gte: startOfDay, lte: endOfDay } },
      orderBy: { priority: "desc" },
    }),
    prisma.task.findMany({
      where: { businessId: "mbm", completed: false, dueDate: { lt: startOfDay } },
    }),
    prisma.task.findMany({
      where: { businessId: "tradex", completed: false, dueDate: { lt: startOfDay } },
    }),
    prisma.lead.findMany({
      where: {
        businessId: "mbm",
        stage: { notIn: ["Won", "Lost"] },
        OR: [
          { nextFollowUp: { lt: now } },
          { lastContact: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) } },
        ],
      },
    }),
    prisma.lead.findMany({
      where: {
        businessId: "tradex",
        stage: { notIn: ["Won", "Lost"] },
        OR: [
          { nextFollowUp: { lt: now } },
          { lastContact: { lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) } },
        ],
      },
    }),
    prisma.lead.count({
      where: { businessId: "mbm", createdAt: { gte: startOfWeek } },
    }),
    prisma.lead.count({
      where: { businessId: "tradex", createdAt: { gte: startOfWeek } },
    }),
    prisma.timeEntry.findMany({
      where: { startTime: { gte: startOfDay } },
    }),
    prisma.project.aggregate({
      where: { businessId: "mbm", createdAt: { gte: startOfMonth } },
      _sum: { revenue: true },
    }),
    prisma.project.aggregate({
      where: { businessId: "tradex", createdAt: { gte: startOfMonth } },
      _sum: { revenue: true },
    }),
    prisma.settings.findUnique({ where: { key: "mbm_monthly_target" } }),
    prisma.settings.findUnique({ where: { key: "tradex_monthly_target" } }),
    prisma.timeEntry.findFirst({ where: { endTime: null }, include: { business: true } }),
  ]);

  const todayHours = todayTimeEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 60;

  res.json({
    todayEvents,
    todayTasks,
    overdue: {
      mbm: overdueTasksMbm,
      tradex: overdueTasksTradex,
    },
    staleLeads: {
      mbm: staleLeadsMbm,
      tradex: staleLeadsTradex,
    },
    stats: {
      leadsThisWeek: leadsThisWeekMbm + leadsThisWeekTradex,
      hoursToday: Math.round(todayHours * 10) / 10,
      mbmRevenue: mbmRevenue._sum.revenue || 0,
      tradexRevenue: tradexRevenue._sum.revenue || 0,
      mbmTarget: parseFloat(mbmTarget?.value || "5000"),
      tradexTarget: parseFloat(tradexTarget?.value || "2000"),
    },
    activeTimer,
  });
});

export default router;
