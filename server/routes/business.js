import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  const businesses = await req.prisma.business.findMany();
  res.json(businesses);
});

router.put("/:id", async (req, res) => {
  const { name, colour } = req.body;
  const business = await req.prisma.business.update({
    where: { id: req.params.id },
    data: { name, colour },
  });
  res.json(business);
});

export default router;
