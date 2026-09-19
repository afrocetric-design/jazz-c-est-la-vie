const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { siteId } = req.query;
  const where = {};
  if (siteId) {
    if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse a cet etablissement' });
    where.siteId = siteId;
  } else if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    where.siteId = req.user.siteId || '__none__';
  } else {
    where.site = { organizationId: req.user.organizationId };
  }
  const receptions = await prisma.reception.findMany({
    where,
    include: { supplier: true, product: true },
    orderBy: { receivedAt: 'desc' },
    take: 300,
  });
  res.json(receptions);
});

router.post('/', async (req, res) => {
  const { siteId, supplierId, productId, lotNumber, dlc, quantity, unit, temperatureAtReception, conform, nonConformityNote, receivedBy } = req.body;
  if (!siteId || !supplierId || !productId || !lotNumber) {
    return res.status(400).json({ error: 'Etablissement, fournisseur, produit et numero de lot requis' });
  }
  if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse a cet etablissement' });

  const reception = await prisma.reception.create({
    data: {
      siteId,
      supplierId,
      productId,
      lotNumber,
      dlc: dlc ? new Date(dlc) : null,
      quantity: quantity ? Number(quantity) : null,
      unit,
      temperatureAtReception: temperatureAtReception !== undefined && temperatureAtReception !== '' ? Number(temperatureAtReception) : null,
      conform: conform !== undefined ? Boolean(conform) : true,
      nonConformityNote,
      receivedBy,
    },
  });
  res.status(201).json(reception);
});

router.delete('/:id', async (req, res) => {
  const reception = await prisma.reception.findUnique({ where: { id: req.params.id } });
  if (!reception) return res.status(404).json({ error: 'Reception introuvable' });
  if (!canAccessSite(req, reception.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  await prisma.reception.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
