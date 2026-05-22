import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const settings = await req.prisma.settings.findMany();
  const map = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  // Never expose the PIN
  delete map.pin;
  res.json(map);
});

router.put("/", async (req, res) => {
  const updates = req.body;
  const results = {};
  for (const [key, value] of Object.entries(updates)) {
    const s = await req.prisma.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
    results[s.key] = s.value;
  }
  res.json(results);
});

router.put("/pin", async (req, res) => {
  const { currentPin, newPin } = req.body;
  const setting = await req.prisma.settings.findUnique({ where: { key: "pin" } });
  if (!setting || setting.value !== currentPin) {
    return res.status(401).json({ error: "Current PIN incorrect" });
  }
  await req.prisma.settings.update({ where: { key: "pin" }, data: { value: newPin } });
  res.json({ ok: true });
});

export default router;
