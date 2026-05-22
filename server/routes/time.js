import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { businessId, from, to } = req.query;
  const where = {};
  if (businessId) where.businessId = businessId;
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) where.startTime.lte = new Date(to);
  }
  const entries = await req.prisma.timeEntry.findMany({
    where,
    orderBy: { startTime: "desc" },
    include: { project: { select: { clientName: true } } },
  });
  res.json(entries);
});

router.get("/active", async (req, res) => {
  const active = await req.prisma.timeEntry.findFirst({
    where: { endTime: null },
    include: { business: true },
  });
  res.json(active || null);
});

router.post("/", async (req, res) => {
  // Stop any active timer first
  await req.prisma.timeEntry.updateMany({
    where: { endTime: null },
    data: { endTime: new Date() },
  });
  const entry = await req.prisma.timeEntry.create({ data: req.body });
  res.json(entry);
});

router.put("/:id/stop", async (req, res) => {
  const entry = await req.prisma.timeEntry.findUnique({ where: { id: req.params.id } });
  if (!entry) return res.status(404).json({ error: "Not found" });
  const endTime = new Date();
  const duration = Math.round((endTime - entry.startTime) / 60000);
  const updated = await req.prisma.timeEntry.update({
    where: { id: req.params.id },
    data: { endTime, duration },
  });
  res.json(updated);
});

router.put("/:id", async (req, res) => {
  const { id, createdAt, business, project, ...data } = req.body;
  const entry = await req.prisma.timeEntry.update({ where: { id: req.params.id }, data });
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  await req.prisma.timeEntry.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
