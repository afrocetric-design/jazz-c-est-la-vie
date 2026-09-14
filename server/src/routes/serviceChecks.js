const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Prise de temperature des aliments pendant le service (liaison chaude/froide, plats servis)
router.get('/', async (req, res) => {
  const { siteId } = req.query;
  const where = {};
  if (siteId) {
    if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
    where.siteId = siteId;
  } else if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    where.siteId = req.user.siteId || '__none__';
  } else {
    where.site = { organizationId: req.user.organizationId };
  }
  const checks = await prisma.serviceTemperatureCheck.findMany({
    where,
    orderBy: { checkedAt: 'desc' },
    take: 300,
  });
  res.json(checks);
});

router.post('/', async (req, res) => {
  const { siteId, dishName, value, mealService, minRequired, maxRequired, checkedBy, notes } = req.body;
  if (!siteId || !dishName || value === undefined || value === '') {
    return res.status(400).json({ error: 'Etablissement, plat et temperature requis' });
  }
  if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const numValue = Number(value);
  const min = minRequired !== undefined && minRequired !== '' ? Number(minRequired) : null;
  const max = maxRequired !== undefined && maxRequired !== '' ? Number(maxRequired) : null;
  let conform = true;
  if (min !== null && numValue < min) conform = false;
  if (max !== null && numValue > max) conform = false;

  const check = await prisma.serviceTemperatureCheck.create({
    data: {
      siteId,
      dishName,
      value: numValue,
      mealService: mealService || 'DEJEUNER',
      minRequired: min,
      maxRequired: max,
      conform,
      checkedBy,
      notes,
    },
  });
  res.status(201).json(check);
});

router.delete('/:id', async (req, res) => {
  const check = await prisma.serviceTemperatureCheck.findUnique({ where: { id: req.params.id } });
  if (!check) return res.status(404).json({ error: 'Controle introuvable' });
  if (!canAccessSite(req, check.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  await prisma.serviceTemperatureCheck.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
