/**
 * check-config.js
 * Verifica que la configuración del proyecto esté correcta
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('='.repeat(60));
console.log('  VERIFICACIÓN DE CONFIGURACIÓN');
console.log('='.repeat(60));

let hasErrors = false;

// Variables de entorno requeridas
const requiredEnvVars = {
  'SALESFORCE_URL': 'URL del dashboard de Salesforce',
  'SF_USER': 'Email de usuario de Salesforce',
  'SHAREPOINT_URL': 'URL de la carpeta de SharePoint'
};

const optionalEnvVars = {
  'WORKSPACE_URL': 'URL del workspace de Power BI',
  'KPIS_URL': 'URL del dataset KPIS',
  'DEFENSA_URL': 'URL del dataset Defensa',
  'SECTORES_URL': 'URL del dataset Sectores',
  'DOWNLOADS_DIR': 'Directorio de descargas personalizado'
};

console.log('\n[1/4] Variables de entorno requeridas:\n');

for (const [varName, description] of Object.entries(requiredEnvVars)) {
  if (process.env[varName]) {
    console.log(`  OK ${varName}`);
  } else {
    console.log(`  X  ${varName} - ${description}`);
    hasErrors = true;
  }
}

console.log('\n[2/4] Variables de entorno opcionales:\n');

for (const [varName, description] of Object.entries(optionalEnvVars)) {
  if (process.env[varName]) {
    console.log(`  OK ${varName}`);
  } else {
    console.log(`  -  ${varName} (no configurada)`);
  }
}

// Verificar directorios
console.log('\n[3/4] Directorios de datos:\n');

const directories = [
  'session-data/salesforce',
  'session-data/sharepoint',
  'session-data/workspace'
];

for (const dir of directories) {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`  OK ${dir}`);
  } else {
    console.log(`  -  ${dir} (se creará automáticamente)`);
  }
}

// Verificar archivo .env
console.log('\n[4/4] Archivos de configuración:\n');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('  OK .env existe');
} else {
  console.log('  X  .env no existe - copia .env.example y configúralo');
  hasErrors = true;
}

const envExamplePath = path.join(__dirname, '.env.example');
if (fs.existsSync(envExamplePath)) {
  console.log('  OK .env.example existe');
} else {
  console.log('  -  .env.example no existe');
}

// Resumen
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('  CONFIGURACIÓN INCOMPLETA');
  console.log('  Revisa los elementos marcados con X');
} else {
  console.log('  CONFIGURACIÓN CORRECTA');
  console.log('  El proyecto está listo para ejecutarse');
}
console.log('='.repeat(60) + '\n');

process.exit(hasErrors ? 1 : 0);
