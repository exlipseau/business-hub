import { Router } from "express";

const router = Router();

function coerce(data) {
  const out = { ...data };
  // value: empty string → null, otherwise float
  if (out.value === "" || out.value === undefined) {
    out.value = null;
  } else if (out.value !== null) {
    out.value = parseFloat(out.value) || null;
  }
  // dates: empty string → null
  if (out.lastContact !== undefined) {
    out.lastContact = out.lastContact ? new Date(out.lastContact) : null;
    if (out.lastContact && isNaN(out.lastContact)) out.lastContact = null;
  }
  if (out.nextFollowUp !== undefined) {
    out.nextFollowUp = out.nextFollowUp ? new Date(out.nextFollowUp) : null;
    if (out.nextFollowUp && isNaN(out.nextFollowUp)) out.nextFollowUp = null;
  }
  return out;
}

router.get("/", async (req, res, next) => {
  try {
    const { businessId, stage } = req.query;
    const where = {};
    if (businessId) where.businessId = businessId;
    if (stage) where.stage = stage;
    const leads = await req.prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" } });
    res.json(leads);
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const lead = await req.prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ error: "Not found" });
    res.json(lead);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, contact, ...raw } = req.body;
    const lead = await req.prisma.lead.create({ data: coerce(raw) });
    res.json(lead);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id, createdAt, updatedAt, business, contact, ...raw } = req.body;
    const lead = await req.prisma.lead.update({ where: { id: req.params.id }, data: coerce(raw) });
    res.json(lead);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await req.prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
