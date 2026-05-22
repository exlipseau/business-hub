import { Router } from "express";

const router = Router();

function coerce(data) {
  return {
    ...data,
    revenue: data.revenue !== undefined && data.revenue !== "" ? parseFloat(data.revenue) : 0,
    hoursLogged: data.hoursLogged !== undefined && data.hoursLogged !== "" ? parseFloat(data.hoursLogged) : 0,
    deadline: data.deadline ? new Date(data.deadline) : null,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { businessId } = req.query;
    const where = businessId ? { businessId } : {};
    const projects = await req.prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    });
    res.json(projects);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const project = await req.prisma.project.findUnique({
      where: { id: req.params.id },
      include: { timeEntries: { orderBy: { startTime: "desc" } } },
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, timeEntries, tasks, _count, ...raw } = req.body;
    const project = await req.prisma.project.create({ data: coerce(raw) });
    res.json(project);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, timeEntries, tasks, _count, ...raw } = req.body;
    const project = await req.prisma.project.update({
      where: { id: req.params.id },
      data: coerce(raw),
    });
    res.json(project);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await req.prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
