require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const usersRoutes = require('./routes/users');
const suppliersRoutes = require('./routes/suppliers');
const productsRoutes = require('./routes/products');
const receptionsRoutes = require('./routes/receptions');
const equipmentsRoutes = require('./routes/equipments');
const serviceChecksRoutes = require('./routes/serviceChecks');
const cleaningRoutes = require('./routes/cleaning');
const nonConformitiesRoutes = require('./routes/nonConformities');
const auditsRoutes = require('./routes/audits');
const documentsRoutes = require('./routes/documents');
const dashboardRoutes = require('./routes/dashboard');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api/auth', authRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/receptions', receptionsRoutes);
  app.use('/api/equipments', equipmentsRoutes);
  app.use('/api/service-checks', serviceChecksRoutes);
  app.use('/api/cleaning', cleaningRoutes);
  app.use('/api/non-conformities', nonConformitiesRoutes);
  app.use('/api/audits', auditsRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Sert le frontend build (React) pour toutes les routes non-API
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  // Gestion d'erreurs centralisee
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur interne' });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`HACCP API demarree sur http://localhost:${port}`));
}

module.exports = { createApp };
