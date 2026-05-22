import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
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
});

router.post("/", async (req, res) => {
  const task = await req.prisma.task.create({ data: req.body });
  res.json(task);
});

router.put("/:id", async (req, res) => {
  const { id, createdAt, updatedAt, ...data } = req.body;
  const task = await req.prisma.task.update({ where: { id: req.params.id }, data });
  res.json(task);
});

router.delete("/:id", async (req, res) => {
  await req.prisma.task.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
