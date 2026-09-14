const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'SITE_MANAGER'), async (req, res) => {
  const where = { organizationId: req.user.organizationId };
  if (req.user.role === 'SITE_MANAGER') {
    where.siteId = req.user.siteId;
  }
  const users = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, siteId: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
});

router.post('/', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  const { email, password, name, role, siteId } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Cet email est deja utilise' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role || 'EMPLOYEE',
      siteId: siteId || null,
      organizationId: req.user.organizationId,
    },
  });
  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

router.put('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  const { name, role, siteId, active, password } = req.body;
  const data = { name, role, siteId: siteId || null, active };
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  const result = await prisma.user.updateMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
    data,
  });
  if (result.count === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ ok: true });
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  await prisma.user.deleteMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  res.json({ ok: true });
});

// Formations / habilitations du personnel
router.get('/:id/trainings', async (req, res) => {
  const trainings = await prisma.staffTraining.findMany({
    where: { userId: req.params.id },
    orderBy: { obtainedAt: 'desc' },
  });
  res.json(trainings);
});

router.post('/:id/trainings', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'SITE_MANAGER'), async (req, res) => {
  const { title, obtainedAt, expiresAt, notes } = req.body;
  const training = await prisma.staffTraining.create({
    data: {
      userId: req.params.id,
      title,
      obtainedAt: obtainedAt ? new Date(obtainedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
    },
  });
  res.status(201).json(training);
});

router.delete('/trainings/:trainingId', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'SITE_MANAGER'), async (req, res) => {
  await prisma.staffTraining.delete({ where: { id: req.params.trainingId } });
  res.json({ ok: true });
});

module.exports = router;
