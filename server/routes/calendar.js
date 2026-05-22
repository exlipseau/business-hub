import { Router } from "express";

const router = Router();

function coerce(data) {
  return {
    ...data,
    start: data.start ? new Date(data.start) : undefined,
    end: data.end ? new Date(data.end) : undefined,
  };
}

router.get("/", async (req, res, next) => {
  try {
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
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { business, ...raw } = req.body;
    if (!raw.businessId) raw.businessId = null;
    const event = await req.prisma.calendarEvent.create({ data: coerce(raw) });
    res.json(event);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, ...raw } = req.body;
    if (!raw.businessId) raw.businessId = null;
    const event = await req.prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: coerce(raw),
    });
    res.json(event);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await req.prisma.calendarEvent.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
