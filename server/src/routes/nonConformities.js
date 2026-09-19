const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { siteId, status } = req.query;
  const where = {};
  if (siteId) {
    if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
    where.siteId = siteId;
  } else if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    where.siteId = req.user.siteId || '__none__';
  } else {
    where.site = { organizationId: req.user.organizationId };
  }
  if (status) where.status = status;

  const items = await prisma.nonConformity.findMany({
    where,
    include: { actions: true },
    orderBy: { declaredAt: 'desc' },
  });
  res.json(items);
});

router.post('/', async (req, res) => {
  const { siteId, title, description, category, severity, declaredBy } = req.body;
  if (!siteId || !title) return res.status(400).json({ error: 'Etablissement et titre requis' });
  if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const nc = await prisma.nonConformity.create({
    data: { siteId, title, description, category, severity: severity || 'MINEURE', declaredBy },
  });
  res.status(201).json(nc);
});

router.put('/:id', async (req, res) => {
  const nc = await prisma.nonConformity.findUnique({ where: { id: req.params.id } });
  if (!nc) return res.status(404).json({ error: 'Non-conformite introuvable' });
  if (!canAccessSite(req, nc.siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const { title, description, category, severity, status } = req.body;
  const data = { title, description, category, severity, status };
  if (status === 'RESOLUE' && nc.status !== 'RESOLUE') data.resolvedAt = new Date();
  const updated = await prisma.nonConformity.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const nc = await prisma.nonConformity.findUnique({ where: { id: req.params.id } });
  if (!nc) return res.status(404).json({ error: 'Non-conformite introuvable' });
  if (!canAccessSite(req, nc.siteId)) return res.status(403).json({ error: 'Acces refuse' });
  await prisma.nonConformity.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// --- Actions correctives ---
router.post('/:id/actions', async (req, res) => {
  const nc = await prisma.nonConformity.findUnique({ where: { id: req.params.id } });
  if (!nc) return res.status(404).json({ error: 'Non-conformite introuvable' });
  if (!canAccessSite(req, nc.siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const { description, assignedTo, dueDate } = req.body;
  if (!description) return res.status(400).json({ error: 'Description requise' });
  const action = await prisma.correctiveAction.create({
    data: {
      nonConformityId: nc.id,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  if (nc.status === 'OUVERTE') {
    await prisma.nonConformity.update({ where: { id: nc.id }, data: { status: 'EN_COURS' } });
  }
  res.status(201).json(action);
});

router.put('/actions/:actionId', async (req, res) => {
  const action = await prisma.correctiveAction.findUnique({
    where: { id: req.params.actionId },
    include: { nonConformity: true },
  });
  if (!action) return res.status(404).json({ error: 'Action introuvable' });
  if (!canAccessSite(req, action.nonConformity.siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const { description, assignedTo, dueDate, status } = req.body;
  const data = { description, assignedTo, dueDate: dueDate ? new Date(dueDate) : undefined, status };
  if (status === 'TERMINEE' && action.status !== 'TERMINEE') data.completedAt = new Date();
  const updated = await prisma.correctiveAction.update({ where: { id: req.params.actionId }, data });
  res.json(updated);
});

module.exports = router;
