const express = require('express');
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Liste des etablissements de l'organisation de l'utilisateur
router.get('/', async (req, res) => {
  const where = { organizationId: req.user.organizationId };
  if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    where.id = req.user.siteId || '__none__';
  }
  const sites = await prisma.site.findMany({ where, orderBy: { name: 'asc' } });
  res.json(sites);
});

router.post('/', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });
  const site = await prisma.site.create({
    data: { name, address, organizationId: req.user.organizationId },
  });
  res.status(201).json(site);
});

router.put('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  const { name, address } = req.body;
  const site = await prisma.site.updateMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    data: { name, address },
  });
  if (site.count === 0) return res.status(404).json({ error: 'Etablissement introuvable' });
  res.json({ ok: true });
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  await prisma.site.deleteMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  res.json({ ok: true });
});

module.exports = router;
