const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// --- Zones ---
router.get('/zones', async (req, res) => {
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
  const zones = await prisma.cleaningZone.findMany({
    where,
    include: { tasks: { include: { logs: { orderBy: { doneAt: 'desc' }, take: 3 } } } },
    orderBy: { name: 'asc' },
  });
  res.json(zones);
});

router.post('/zones', async (req, res) => {
  const { siteId, name } = req.body;
  if (!siteId || !name) return res.status(400).json({ error: 'Etablissement et nom requis' });
  if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
  const zone = await prisma.cleaningZone.create({ data: { siteId, name } });
  res.status(201).json(zone);
});

router.delete('/zones/:id', async (req, res) => {
  const zone = await prisma.cleaningZone.findUnique({ where: { id: req.params.id } });
  if (!zone) return res.status(404).json({ error: 'Zone introuvable' });
  if (!canAccessSite(req, zone.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  await prisma.cleaningZone.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// --- Tasks ---
router.post('/zones/:zoneId/tasks', async (req, res) => {
  const zone = await prisma.cleaningZone.findUnique({ where: { id: req.params.zoneId } });
  if (!zone) return res.status(404).json({ error: 'Zone introuvable' });
  if (!canAccessSite(req, zone.siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const { name, frequency, product } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom de la tache requis' });
  const task = await prisma.cleaningTask.create({
    data: { zoneId: zone.id, name, frequency: frequency || 'QUOTIDIEN', product },
  });
  res.status(201).json(task);
});

router.delete('/tasks/:id', async (req, res) => {
  const task = await prisma.cleaningTask.findUnique({ where: { id: req.params.id }, include: { zone: true } });
  if (!task) return res.status(404).json({ error: 'Tache introuvable' });
  if (!canAccessSite(req, task.zone.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  await prisma.cleaningTask.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// --- Logs (validation d'execution) ---
router.post('/tasks/:taskId/logs', async (req, res) => {
  const task = await prisma.cleaningTask.findUnique({ where: { id: req.params.taskId }, include: { zone: true } });
  if (!task) return res.status(404).json({ error: 'Tache introuvable' });
  if (!canAccessSite(req, task.zone.siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const { doneBy, conform, notes } = req.body;
  const log = await prisma.cleaningLog.create({
    data: { taskId: task.id, doneBy, conform: conform !== undefined ? Boolean(conform) : true, notes },
  });
  res.status(201).json(log);
});

module.exports = router;
