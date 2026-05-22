import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res) => {
  const { pin } = req.body;
  const setting = await req.prisma.settings.findUnique({ where: { key: "pin" } });
  if (!setting || setting.value !== pin) {
    return res.status(401).json({ error: "Invalid PIN" });
  }
  const token = jwt.sign({ user: "max" }, process.env.JWT_SECRET, { expiresIn: "30d" });
  res.json({ token });
});

router.post("/verify", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  try {
    jwt.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
