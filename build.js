const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_KEY || '';

if (!url || !key) {
  console.warn('AVISO: SUPABASE_URL ou SUPABASE_KEY não definidos.');
}

const content = `window.APP_CONFIG = {
  supabase_url: '${url}',
  supabase_key: '${key}'
};`;

fs.writeFileSync('config.js', content);
console.log('config.js gerado com sucesso!');
