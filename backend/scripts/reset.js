/**
 * Restaura data/db.json con los datos iniciales de data/seed.json.
 * Uso: npm run reset
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.copyFileSync(path.join(DATA_DIR, 'seed.json'), path.join(DATA_DIR, 'db.json'));
console.log('✔ data/db.json restaurado desde data/seed.json');
