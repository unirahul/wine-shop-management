const { cleanAndSeedDatabase } = require('./seeder');

console.log('🚀 Starting clean database reset for Indian Wine & Spirits ERP...');
const stats = cleanAndSeedDatabase();
console.log('✨ Database clean & seed completed successfully:', stats);
process.exit(0);
