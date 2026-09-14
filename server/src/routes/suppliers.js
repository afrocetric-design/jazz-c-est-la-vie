const express = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
});

router.post('/', async (req, res) => {
  const { name, contact, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const supplier = await prisma.supplier.create({
    data: { name, contact, phone, email, organizationId: req.user.organizationId },
  });
  res.status(201).json(supplier);
});

router.put('/:id', async (req, res) => {
  const { name, contact, phone, email } = req.body;
  const result = await prisma.supplier.updateMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    data: { name, contact, phone, email },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Fournisseur introuvable' });
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await prisma.supplier.deleteMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  res.json({ ok: true });
});

module.exports = router;
