import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { businessId, type } = req.query;
  const where = {};
  if (businessId) where.businessId = businessId;
  if (type) where.type = type;
  const goals = await req.prisma.goal.findMany({ where, orderBy: { createdAt: "asc" } });
  res.json(goals);
});

router.post("/", async (req, res) => {
  const goal = await req.prisma.goal.create({ data: req.body });
  res.json(goal);
});

router.put("/:id", async (req, res) => {
  const { id, createdAt, updatedAt, business, ...data } = req.body;
  const goal = await req.prisma.goal.update({ where: { id: req.params.id }, data });
  res.json(goal);
});

router.delete("/:id", async (req, res) => {
  await req.prisma.goal.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
