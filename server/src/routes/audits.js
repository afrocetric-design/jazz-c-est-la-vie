const express = require('express');
const prisma = require('../db');
const { authenticate, authorize, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// --- Modeles de grille d'audit (au niveau de l'organisation) ---
router.get('/templates', async (req, res) => {
  const templates = await prisma.auditTemplate.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { name: 'asc' },
  });
  res.json(templates.map((t) => ({ ...t, questions: JSON.parse(t.questions) })));
});

router.post('/templates', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  const { name, questions } = req.body;
  if (!name || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Nom et au moins une question requis' });
  }
  const template = await prisma.auditTemplate.create({
    data: { name, questions: JSON.stringify(questions), organizationId: req.user.organizationId },
  });
  res.status(201).json({ ...template, questions });
});

router.delete('/templates/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res) => {
  await prisma.auditTemplate.deleteMany({
    where: { id: req.params.id, organizationId: req.user.organizationId },
  });
  res.json({ ok: true });
});

// --- Audits realises ---
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
  const audits = await prisma.audit.findMany({
    where,
    include: { template: true },
    orderBy: { performedAt: 'desc' },
  });
  res.json(audits.map((a) => ({ ...a, answers: JSON.parse(a.answers), template: { ...a.template, questions: JSON.parse(a.template.questions) } })));
});

router.post('/', async (req, res) => {
  const { siteId, templateId, performedBy, answers } = req.body;
  if (!siteId || !templateId || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Etablissement, modele et reponses requis' });
  }
  if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });

  const okCount = answers.filter((a) => a.ok).length;
  const score = answers.length > 0 ? Math.round((okCount / answers.length) * 100) : 0;

  const audit = await prisma.audit.create({
    data: {
      siteId,
      templateId,
      performedBy,
      answers: JSON.stringify(answers),
      score,
    },
  });
  res.status(201).json({ ...audit, answers });
});

module.exports = router;
