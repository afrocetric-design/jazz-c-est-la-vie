if (!process.env.DATABASE_URL) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}
const { PrismaClient } = require('../generated/client');

const prisma = new PrismaClient();

module.exports = prisma;
