import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const { businessId, stage } = req.query;
  const where = {};
  if (businessId) where.businessId = businessId;
  if (stage) where.stage = stage;
  const leads = await req.prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" } });
  res.json(leads);
});

router.get("/:id", async (req, res) => {
  const lead = await req.prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: "Not found" });
  res.json(lead);
});

router.post("/", async (req, res) => {
  const lead = await req.prisma.lead.create({ data: req.body });
  res.json(lead);
});

router.put("/:id", async (req, res) => {
  const { id, createdAt, updatedAt, ...data } = req.body;
  const lead = await req.prisma.lead.update({ where: { id: req.params.id }, data });
  res.json(lead);
});

router.delete("/:id", async (req, res) => {
  await req.prisma.lead.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
