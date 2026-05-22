import { Router } from "express";

const router = Router();

function coerce(data) {
  const out = { ...data };
  if (out.businessId === "") out.businessId = null;
  if (out.target !== undefined) out.target = out.target === "" || out.target == null ? 0 : parseFloat(out.target);
  if (out.current !== undefined) out.current = out.current === "" || out.current == null ? 0 : parseFloat(out.current);
  return out;
}

router.get("/", async (req, res, next) => {
  try {
    const { businessId, type } = req.query;
    const where = {};
    if (businessId) where.businessId = businessId;
    if (type) where.type = type;
    const goals = await req.prisma.goal.findMany({ where, orderBy: { createdAt: "asc" } });
    res.json(goals);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, ...raw } = req.body;
    const goal = await req.prisma.goal.create({ data: coerce(raw) });
    res.json(goal);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, ...raw } = req.body;
    const goal = await req.prisma.goal.update({
      where: { id: req.params.id },
      data: coerce(raw),
    });
    res.json(goal);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await req.prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
