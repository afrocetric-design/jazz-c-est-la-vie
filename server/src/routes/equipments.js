const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function scopedWhere(req, siteId) {
  const where = {};
  if (siteId) {
    where.siteId = siteId;
  } else if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    where.siteId = req.user.siteId || '__none__';
  } else {
    where.site = { organizationId: req.user.organizationId };
  }
  return where;
}

router.get('/', async (req, res) => {
  const { siteId } = req.query;
  if (siteId && !canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
  const equipments = await prisma.equipment.findMany({
    where: scopedWhere(req, siteId),
    include: { readings: { orderBy: { recordedAt: 'desc' }, take: 5 } },
    orderBy: { name: 'asc' },
  });
  res.json(equipments);
});

router.post('/', async (req, res) => {
  const { siteId, name, type, targetMin, targetMax } = req.body;
  if (!siteId || !name || targetMin === undefined || targetMax === undefined) {
    return res.status(400).json({ error: 'Etablissement, nom et seuils min/max requis' });
  }
  if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
  const equipment = await prisma.equipment.create({
    data: { siteId, name, type: type || 'FRIGO', targetMin: Number(targetMin), targetMax: Number(targetMax) },
  });
  res.status(201).json(equipment);
});

router.delete('/:id', async (req, res) => {
  const equipment = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!equipment) return res.status(404).json({ error: 'Equipement introuvable' });
  if (!canAccessSite(req, equipment.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  await prisma.equipment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Relevés de température
router.post('/:id/readings', async (req, res) => {
  const equipment = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!equipment) return res.status(404).json({ error: 'Equipement introuvable' });
  if (!canAccessSite(req, equipment.siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const { value, recordedBy, notes } = req.body;
  if (value === undefined || value === '') return res.status(400).json({ error: 'Valeur de temperature requise' });
  const numValue = Number(value);
  const alert = numValue < equipment.targetMin || numValue > equipment.targetMax;

  const reading = await prisma.temperatureReading.create({
    data: { equipmentId: equipment.id, value: numValue, recordedBy, notes, alert },
  });
  res.status(201).json(reading);
});

router.get('/:id/readings', async (req, res) => {
  const equipment = await prisma.equipment.findUnique({ where: { id: req.params.id } });
  if (!equipment) return res.status(404).json({ error: 'Equipement introuvable' });
  if (!canAccessSite(req, equipment.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  const readings = await prisma.temperatureReading.findMany({
    where: { equipmentId: equipment.id },
    orderBy: { recordedAt: 'desc' },
    take: 200,
  });
  res.json(readings);
});

module.exports = router;
