import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { businessId } = req.query;
  const where = businessId ? { businessId } : {};
  const projects = await req.prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  res.json(projects);
});

router.get("/:id", async (req, res) => {
  const project = await req.prisma.project.findUnique({
    where: { id: req.params.id },
    include: { timeEntries: { orderBy: { startTime: "desc" } } },
  });
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

router.post("/", async (req, res) => {
  const project = await req.prisma.project.create({ data: req.body });
  res.json(project);
});

router.put("/:id", async (req, res) => {
  const { id, createdAt, updatedAt, ...data } = req.body;
  const project = await req.prisma.project.update({
    where: { id: req.params.id },
    data,
  });
  res.json(project);
});

router.delete("/:id", async (req, res) => {
  await req.prisma.project.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
