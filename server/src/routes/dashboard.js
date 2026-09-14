const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { siteId } = req.query;
  let siteWhere = {};
  if (siteId) {
    if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
    siteWhere = { siteId };
  } else if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    siteWhere = { siteId: req.user.siteId || '__none__' };
  } else {
    siteWhere = { site: { organizationId: req.user.organizationId } };
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [openNonConformities, criticalNonConformities, tempAlerts24h, pendingActions, sitesCount, recentAudits] = await Promise.all([
    prisma.nonConformity.count({ where: { ...siteWhere, status: { not: 'RESOLUE' } } }),
    prisma.nonConformity.count({ where: { ...siteWhere, status: { not: 'RESOLUE' }, severity: 'CRITIQUE' } }),
    prisma.temperatureReading.count({
      where: {
        alert: true,
        recordedAt: { gte: since24h },
        equipment: siteId
          ? { siteId }
          : ['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)
            ? { site: { organizationId: req.user.organizationId } }
            : { siteId: req.user.siteId || '__none__' },
      },
    }),
    prisma.correctiveAction.count({
      where: {
        status: { not: 'TERMINEE' },
        nonConformity: siteWhere,
      },
    }),
    prisma.site.count({ where: { organizationId: req.user.organizationId } }),
    prisma.audit.findMany({ where: siteWhere, orderBy: { performedAt: 'desc' }, take: 5 }),
  ]);

  const avgScore =
    recentAudits.length > 0
      ? Math.round(recentAudits.reduce((sum, a) => sum + a.score, 0) / recentAudits.length)
      : null;

  res.json({
    openNonConformities,
    criticalNonConformities,
    tempAlerts24h,
    pendingActions,
    sitesCount,
    avgAuditScore: avgScore,
  });
});

module.exports = router;
