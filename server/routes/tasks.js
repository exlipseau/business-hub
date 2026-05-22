import { Router } from "express";

const router = Router();

function coerce(data) {
  const out = { ...data };
  if (out.businessId === "") out.businessId = null;
  if (out.dueDate !== undefined) out.dueDate = out.dueDate ? new Date(out.dueDate) : null;
  if (out.startTime !== undefined) out.startTime = out.startTime ? new Date(out.startTime) : null;
  if (out.duration !== undefined && out.duration !== null && out.duration !== "") {
    out.duration = parseInt(out.duration, 10) || null;
  } else if (out.duration === "") {
    out.duration = null;
  }
  return out;
}

router.get("/", async (req, res, next) => {
  try {
    const { businessId, completed, dueToday } = req.query;
    const where = {};
    if (businessId) where.businessId = businessId;
    if (completed !== undefined) where.completed = completed === "true";
    if (dueToday === "true") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      where.dueDate = { gte: start, lte: end };
    }
    const tasks = await req.prisma.task.findMany({ where, orderBy: { dueDate: "asc" } });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, ...raw } = req.body;
    const task = await req.prisma.task.create({ data: coerce(raw) });
    res.json(task);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, ...raw } = req.body;
    const task = await req.prisma.task.update({
      where: { id: req.params.id },
      data: coerce(raw),
    });
    res.json(task);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await req.prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
