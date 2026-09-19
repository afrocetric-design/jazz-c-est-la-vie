const express = require('express');
const prisma = require('../db');
const { authenticate, canAccessSite } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { siteId } = req.query;
  let siteWhere = {};
  let equipmentSiteWhere = {};
  let zoneSiteWhere = {};
  if (siteId) {
    if (!canAccessSite(req, siteId)) return res.status(403).json({ error: 'Acces refuse' });
    siteWhere = { siteId };
    equipmentSiteWhere = { siteId };
    zoneSiteWhere = { siteId };
  } else if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) {
    siteWhere = { siteId: req.user.siteId || '__none__' };
    equipmentSiteWhere = { siteId: req.user.siteId || '__none__' };
    zoneSiteWhere = { siteId: req.user.siteId || '__none__' };
  } else {
    siteWhere = { site: { organizationId: req.user.organizationId } };
    equipmentSiteWhere = { site: { organizationId: req.user.organizationId } };
    zoneSiteWhere = { site: { organizationId: req.user.organizationId } };
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    openNonConformities,
    criticalNonConformities,
    tempAlerts24h,
    pendingActions,
    sitesCount,
    recentAudits,
    equipments,
    dailyCleaningTasks,
  ] = await Promise.all([
    prisma.nonConformity.count({ where: { ...siteWhere, status: { not: 'RESOLUE' } } }),
    prisma.nonConformity.count({ where: { ...siteWhere, status: { not: 'RESOLUE' }, severity: 'CRITIQUE' } }),
    prisma.temperatureReading.count({
      where: { alert: true, recordedAt: { gte: since24h }, equipment: equipmentSiteWhere },
    }),
    prisma.correctiveAction.count({
      where: { status: { not: 'TERMINEE' }, nonConformity: siteWhere },
    }),
    prisma.site.count({ where: { organizationId: req.user.organizationId } }),
    prisma.audit.findMany({ where: siteWhere, orderBy: { performedAt: 'desc' }, take: 5 }),
    prisma.equipment.findMany({
      where: equipmentSiteWhere,
      select: { id: true, name: true, readings: { where: { recordedAt: { gte: startOfDay } }, take: 1 } },
    }),
    prisma.cleaningTask.findMany({
      where: { frequency: 'QUOTIDIEN', zone: zoneSiteWhere },
      select: {
        id: true,
        name: true,
        zone: { select: { name: true } },
        logs: { where: { doneAt: { gte: startOfDay } }, take: 1 },
      },
    }),
  ]);

  const avgScore =
    recentAudits.length > 0
      ? Math.round(recentAudits.reduce((sum, a) => sum + a.score, 0) / recentAudits.length)
      : null;

  const equipmentsWithoutReadingToday = equipments
    .filter((e) => e.readings.length === 0)
    .map((e) => ({ id: e.id, name: e.name }));

  const pendingDailyCleaningTasks = dailyCleaningTasks
    .filter((t) => t.logs.length === 0)
    .map((t) => ({ id: t.id, name: t.name, zoneName: t.zone.name }));

  res.json({
    openNonConformities,
    criticalNonConformities,
    tempAlerts24h,
    pendingActions,
    sitesCount,
    avgAuditScore: avgScore,
    equipmentsWithoutReadingToday,
    pendingDailyCleaningTasks,
  });
});

module.exports = router;
