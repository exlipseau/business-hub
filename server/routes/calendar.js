import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { businessId, from, to } = req.query;
  const where = {};
  if (businessId) where.businessId = businessId;
  if (from || to) {
    where.start = {};
    if (from) { const d = new Date(from); if (!isNaN(d)) where.start.gte = d; }
    if (to) { const d = new Date(to); if (!isNaN(d)) where.start.lte = d; }
    if (!Object.keys(where.start).length) delete where.start;
  }
  const events = await req.prisma.calendarEvent.findMany({
    where,
    orderBy: { start: "asc" },
    include: { business: { select: { name: true, colour: true } } },
  });
  res.json(events);
});

router.post("/", async (req, res) => {
  const { business, ...data } = req.body;
  if (!data.businessId) data.businessId = null;
  const event = await req.prisma.calendarEvent.create({ data });
  res.json(event);
});

router.put("/:id", async (req, res) => {
  const { id, createdAt, updatedAt, business, ...data } = req.body;
  if (!data.businessId) data.businessId = null;
  const event = await req.prisma.calendarEvent.update({ where: { id: req.params.id }, data });
  res.json(event);
});

router.delete("/:id", async (req, res) => {
  await req.prisma.calendarEvent.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
