const express = require('express');
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(documents);
});

router.post('/', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'SITE_MANAGER'), async (req, res) => {
  const { title, category, content, version } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const doc = await prisma.document.create({
    data: { title, category, content, version: version || '1.0', organizationId: req.user.organizationId },
  });
  res.status(201).json(doc);
});

router.put('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'SITE_MANAGER'), async (req, res) => {
  const { title, category, content, version } = req.body;
  const result = await prisma.document.updateMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    data: { title, category, content, version },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Document introuvable' });
  res.json({ ok: true });
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  await prisma.document.deleteMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  res.json({ ok: true });
});

module.exports = router;
