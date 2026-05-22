import { Router } from "express";

const router = Router();

// Contacts
router.get("/contacts", async (req, res) => {
  const { businessId, status, search } = req.query;
  const where = {};
  if (businessId) {
    where.interactions = { some: { businessId } };
  }
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
    ];
  }
  const contacts = await req.prisma.contact.findMany({
    where,
    include: {
      interactions: { include: { business: true } },
      logs: { orderBy: { date: "desc" }, take: 3 },
    },
    orderBy: { name: "asc" },
  });
  res.json(contacts);
});

router.get("/contacts/:id", async (req, res) => {
  const contact = await req.prisma.contact.findUnique({
    where: { id: req.params.id },
    include: {
      interactions: { include: { business: true } },
      logs: { orderBy: { date: "desc" } },
      leads: true,
    },
  });
  if (!contact) return res.status(404).json({ error: "Not found" });
  res.json(contact);
});

router.post("/contacts", async (req, res) => {
  const { businessIds, ...data } = req.body;
  const contact = await req.prisma.contact.create({ data });
  if (businessIds?.length) {
    await req.prisma.contactBusiness.createMany({
      data: businessIds.map((bId) => ({ contactId: contact.id, businessId: bId })),
    });
  }
  res.json(contact);
});

router.put("/contacts/:id", async (req, res) => {
  const { id, createdAt, updatedAt, interactions, logs, leads, businessIds, ...data } = req.body;
  const contact = await req.prisma.contact.update({ where: { id: req.params.id }, data });
  if (businessIds) {
    await req.prisma.contactBusiness.deleteMany({ where: { contactId: req.params.id } });
    if (businessIds.length) {
      await req.prisma.contactBusiness.createMany({
        data: businessIds.map((bId) => ({ contactId: req.params.id, businessId: bId })),
      });
    }
  }
  res.json(contact);
});

router.delete("/contacts/:id", async (req, res) => {
  await req.prisma.contactBusiness.deleteMany({ where: { contactId: req.params.id } });
  await req.prisma.interaction.deleteMany({ where: { contactId: req.params.id } });
  await req.prisma.contact.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Interactions
router.post("/contacts/:id/interactions", async (req, res) => {
  const interaction = await req.prisma.interaction.create({
    data: { ...req.body, contactId: req.params.id },
  });
  res.json(interaction);
});

router.delete("/interactions/:id", async (req, res) => {
  await req.prisma.interaction.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
