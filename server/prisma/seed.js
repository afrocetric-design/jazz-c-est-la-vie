require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('../generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Nettoyage de la base...');
  await prisma.correctiveAction.deleteMany();
  await prisma.nonConformity.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.auditTemplate.deleteMany();
  await prisma.cleaningLog.deleteMany();
  await prisma.cleaningTask.deleteMany();
  await prisma.cleaningZone.deleteMany();
  await prisma.serviceTemperatureCheck.deleteMany();
  await prisma.temperatureReading.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.reception.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.staffTraining.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Creation de la chaine de demonstration...');
  const org = await prisma.organization.create({ data: { name: 'Jazz Bistrot - Chaine' } });

  const siteParis = await prisma.site.create({
    data: { name: 'Jazz Bistrot - Saint-Germain', address: '12 rue de Buci, 75006 Paris', organizationId: org.id },
  });
  const siteLyon = await prisma.site.create({
    data: { name: 'Jazz Bistrot - Presqu\'ile', address: '5 rue Merciere, 69002 Lyon', organizationId: org.id },
  });

  const passwordHash = await bcrypt.hash('haccp2024', 10);

  await prisma.user.create({
    data: { email: 'admin@jazzbistrot.fr', passwordHash, name: 'Alex Moreau', role: 'SUPER_ADMIN', organizationId: org.id },
  });
  const managerParis = await prisma.user.create({
    data: { email: 'paris@jazzbistrot.fr', passwordHash, name: 'Camille Dubois', role: 'SITE_MANAGER', organizationId: org.id, siteId: siteParis.id },
  });
  await prisma.user.create({
    data: { email: 'lyon@jazzbistrot.fr', passwordHash, name: 'Julien Petit', role: 'SITE_MANAGER', organizationId: org.id, siteId: siteLyon.id },
  });
  await prisma.user.create({
    data: { email: 'employe@jazzbistrot.fr', passwordHash, name: 'Sarah Nguyen', role: 'EMPLOYEE', organizationId: org.id, siteId: siteParis.id },
  });

  await prisma.staffTraining.create({
    data: { userId: managerParis.id, title: 'Formation HACCP obligatoire (arrete du 5 octobre 2011)', obtainedAt: new Date('2023-03-15'), expiresAt: new Date('2028-03-15') },
  });

  console.log('Fournisseurs et produits...');
  const supplierViande = await prisma.supplier.create({ data: { name: 'Boucherie Lambert', contact: 'M. Lambert', phone: '01 23 45 67 89', organizationId: org.id } });
  const supplierPoisson = await prisma.supplier.create({ data: { name: 'Maree Fraiche SARL', contact: 'Mme Rousseau', phone: '01 98 76 54 32', organizationId: org.id } });
  const supplierLegumes = await prisma.supplier.create({ data: { name: 'Primeurs du Marche', contact: 'M. Girard', phone: '06 11 22 33 44', organizationId: org.id } });

  const productBoeuf = await prisma.product.create({ data: { name: 'Entrecote de boeuf', category: 'Viande', storageType: 'FROID_POSITIF', defaultShelfLifeDays: 5, organizationId: org.id, supplierId: supplierViande.id } });
  const productSaumon = await prisma.product.create({ data: { name: 'Filet de saumon', category: 'Poisson', storageType: 'FROID_POSITIF', defaultShelfLifeDays: 2, organizationId: org.id, supplierId: supplierPoisson.id } });
  await prisma.product.create({ data: { name: 'Salade verte', category: 'Legume', storageType: 'FROID_POSITIF', defaultShelfLifeDays: 4, organizationId: org.id, supplierId: supplierLegumes.id } });

  console.log('Receptions...');
  await prisma.reception.create({
    data: { siteId: siteParis.id, supplierId: supplierViande.id, productId: productBoeuf.id, lotNumber: 'LOT-BF-2024-118', dlc: new Date(Date.now() + 4 * 86400000), quantity: 12, unit: 'kg', temperatureAtReception: 2.8, conform: true, receivedBy: 'Sarah Nguyen' },
  });
  await prisma.reception.create({
    data: { siteId: siteParis.id, supplierId: supplierPoisson.id, productId: productSaumon.id, lotNumber: 'LOT-SM-2024-045', dlc: new Date(Date.now() + 1 * 86400000), quantity: 8, unit: 'kg', temperatureAtReception: 5.4, conform: false, nonConformityNote: 'Temperature superieure au seuil (4C max)', receivedBy: 'Sarah Nguyen' },
  });

  console.log('Equipements et relevés de temperature...');
  const frigoParis = await prisma.equipment.create({ data: { siteId: siteParis.id, name: 'Frigo cuisine chaude', type: 'FRIGO', targetMin: 0, targetMax: 4 } });
  const congeloParis = await prisma.equipment.create({ data: { siteId: siteParis.id, name: 'Congelateur reserve', type: 'CONGELATEUR', targetMin: -22, targetMax: -18 } });
  const frigoLyon = await prisma.equipment.create({ data: { siteId: siteLyon.id, name: 'Chambre froide positive', type: 'CHAMBRE_FROIDE', targetMin: 0, targetMax: 4 } });

  for (let i = 0; i < 6; i++) {
    await prisma.temperatureReading.create({
      data: { equipmentId: frigoParis.id, value: 2 + Math.random() * 1.5, recordedAt: new Date(Date.now() - i * 4 * 3600000), recordedBy: 'Sarah Nguyen', alert: false },
    });
  }
  await prisma.temperatureReading.create({ data: { equipmentId: congeloParis.id, value: -19.5, recordedBy: 'Sarah Nguyen', alert: false } });
  await prisma.temperatureReading.create({ data: { equipmentId: frigoLyon.id, value: 6.2, recordedBy: 'Julien Petit', alert: true, notes: 'Porte mal fermee, a verifier' } });

  console.log('Controles de temperature en service...');
  await prisma.serviceTemperatureCheck.create({ data: { siteId: siteParis.id, dishName: 'Blanquette de veau', value: 68, mealService: 'DEJEUNER', minRequired: 63, checkedBy: 'Sarah Nguyen', conform: true } });
  await prisma.serviceTemperatureCheck.create({ data: { siteId: siteParis.id, dishName: 'Tartare de saumon', value: 6, mealService: 'DEJEUNER', maxRequired: 4, checkedBy: 'Sarah Nguyen', conform: false, notes: 'Sorti trop tot de la chambre froide' } });

  console.log('Plan de nettoyage...');
  const zoneCuisine = await prisma.cleaningZone.create({ data: { siteId: siteParis.id, name: 'Cuisine - plan de travail' } });
  const zoneSalle = await prisma.cleaningZone.create({ data: { siteId: siteParis.id, name: 'Salle - tables et chaises' } });
  const tacheDesinfection = await prisma.cleaningTask.create({ data: { zoneId: zoneCuisine.id, name: 'Desinfection plans de travail', frequency: 'QUOTIDIEN', product: 'Desinfectant alimentaire agree' } });
  await prisma.cleaningTask.create({ data: { zoneId: zoneCuisine.id, name: 'Nettoyage hotte aspirante', frequency: 'MENSUEL', product: 'Degraissant professionnel' } });
  await prisma.cleaningTask.create({ data: { zoneId: zoneSalle.id, name: 'Nettoyage tables apres chaque service', frequency: 'QUOTIDIEN', product: 'Nettoyant multi-surfaces' } });
  await prisma.cleaningLog.create({ data: { taskId: tacheDesinfection.id, doneBy: 'Sarah Nguyen', conform: true } });

  console.log('Non-conformites et actions correctives...');
  const nc1 = await prisma.nonConformity.create({
    data: { siteId: siteParis.id, title: 'Reception saumon hors temperature', description: 'Livraison recue a 5.4C au lieu de 4C max', category: 'Reception', severity: 'MAJEURE', status: 'EN_COURS', declaredBy: 'Sarah Nguyen' },
  });
  await prisma.correctiveAction.create({
    data: { nonConformityId: nc1.id, description: 'Contacter le fournisseur et renforcer le controle a reception', assignedTo: 'Camille Dubois', dueDate: new Date(Date.now() + 3 * 86400000) },
  });
  await prisma.nonConformity.create({
    data: { siteId: siteLyon.id, title: 'Chambre froide en depassement de seuil', description: 'Releve a 6.2C, porte mal fermee', category: 'Temperature', severity: 'CRITIQUE', status: 'OUVERTE', declaredBy: 'Julien Petit' },
  });

  console.log('Grilles d\'autocontrole / audits...');
  const template = await prisma.auditTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Autocontrole hygiene hebdomadaire',
      questions: JSON.stringify([
        { id: 'q1', label: 'Les plans de travail sont propres et desinfectes', category: 'Hygiene' },
        { id: 'q2', label: 'Les temperatures des enceintes froides sont conformes', category: 'Temperature' },
        { id: 'q3', label: 'Le personnel porte une tenue et des EPI adaptes', category: 'Personnel' },
        { id: 'q4', label: 'Les etiquettes DLC/DLUO sont a jour sur les produits ouverts', category: 'Tracabilite' },
        { id: 'q5', label: 'Les poubelles sont videes et les zones dechets propres', category: 'Hygiene' },
      ]),
    },
  });
  await prisma.audit.create({
    data: {
      siteId: siteParis.id,
      templateId: template.id,
      performedBy: 'Camille Dubois',
      answers: JSON.stringify([
        { questionId: 'q1', ok: true },
        { questionId: 'q2', ok: true },
        { questionId: 'q3', ok: true },
        { questionId: 'q4', ok: false, comment: 'Une barquette de sauce sans etiquette' },
        { questionId: 'q5', ok: true },
      ]),
      score: 80,
    },
  });

  console.log('Documentation...');
  await prisma.document.create({
    data: { organizationId: org.id, title: 'Plan de Maitrise Sanitaire - version generale', category: 'PMS', content: 'Document cadre decrivant les bonnes pratiques d\'hygiene (BPH), l\'analyse HACCP et les procedures de tracabilite applicables a tous les etablissements.', version: '2.1' },
  });
  await prisma.document.create({
    data: { organizationId: org.id, title: 'Procedure de reception des marchandises', category: 'Procedure', content: 'Controle visuel, controle de temperature a reception, verification des DLC et numeros de lot, enregistrement systematique dans l\'application.', version: '1.3' },
  });

  console.log('Seed termine.');
  console.log('');
  console.log('Comptes de demonstration (mot de passe: haccp2024) :');
  console.log('  admin@jazzbistrot.fr    (SUPER_ADMIN, toute la chaine)');
  console.log('  paris@jazzbistrot.fr    (SITE_MANAGER, Saint-Germain)');
  console.log('  lyon@jazzbistrot.fr     (SITE_MANAGER, Presqu\'ile)');
  console.log('  employe@jazzbistrot.fr  (EMPLOYEE, Saint-Germain)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
