const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { organizationId: req.user.organizationId },
    include: { supplier: true },
    orderBy: { name: 'asc' },
  });
  res.json(products);
});

router.post('/', async (req, res) => {
  const { name, category, storageType, defaultShelfLifeDays, supplierId } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const product = await prisma.product.create({
    data: {
      name,
      category,
      storageType: storageType || 'FROID_POSITIF',
      defaultShelfLifeDays: defaultShelfLifeDays ? Number(defaultShelfLifeDays) : null,
      supplierId: supplierId || null,
      organizationId: req.user.organizationId,
    },
  });
  res.status(201).json(product);
});

router.put('/:id', async (req, res) => {
  const { name, category, storageType, defaultShelfLifeDays, supplierId } = req.body;
  const result = await prisma.product.updateMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    data: {
      name,
      category,
      storageType,
      defaultShelfLifeDays: defaultShelfLifeDays ? Number(defaultShelfLifeDays) : null,
      supplierId: supplierId || null,
    },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Produit introuvable' });
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await prisma.product.deleteMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  res.json({ ok: true });
});

module.exports = router;
