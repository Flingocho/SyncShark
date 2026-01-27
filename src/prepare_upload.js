/**
 * prepare_upload.js
 * 
 * Script intermedio que:
 * 1. Busca el último archivo Copy_of_TECH*.xlsx en la carpeta de descargas
 * 2. Lo renombra añadiendo la fecha actual (_YYYYMMDD)
 * 3. Guarda la ruta en last_downloaded_file.txt para upload_sp_telemetry.js
 * 
 * Uso: node prepare_upload.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
const OUTPUT_FILE = path.join(__dirname, 'last_downloaded_file.txt');

console.log('='.repeat(60));
console.log('  PREPARE UPLOAD - Renombrar archivo descargado');
console.log('='.repeat(60));

// Buscar archivos Copy_of_TECH*.xlsx
console.log(`\n📁 Buscando archivos en: ${DOWNLOADS_DIR}`);

const files = fs.readdirSync(DOWNLOADS_DIR)
  .filter(f => f.startsWith('Copy_of_TECH') && f.endsWith('.xlsx'))
  .map(f => ({
    name: f,
    path: path.join(DOWNLOADS_DIR, f),
    time: fs.statSync(path.join(DOWNLOADS_DIR, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time);

if (files.length === 0) {
  console.error('\n❌ No se encontró ningún archivo Copy_of_TECH*.xlsx');
  console.error('   Ejecuta primero download_telemetry.js para descargar el archivo.');
  process.exit(1);
}

console.log(`\n📋 Archivos encontrados (${files.length}):`);
files.slice(0, 5).forEach((f, i) => {
  const date = new Date(f.time);
  const dateStr = date.toLocaleString('es-ES');
  console.log(`   ${i + 1}. ${f.name}`);
  console.log(`      Modificado: ${dateStr}`);
});

// Tomar el más reciente
const latestFile = files[0];
console.log(`\n✓ Seleccionado: ${latestFile.name}`);

// Generar nuevo nombre con fecha
const today = new Date();
const dateStr = today.getFullYear().toString() +
  (today.getMonth() + 1).toString().padStart(2, '0') +
  today.getDate().toString().padStart(2, '0');

const ext = path.extname(latestFile.name);
const baseName = path.basename(latestFile.name, ext);

// Verificar si ya tiene una fecha al final (formato _YYYYMMDD)
const hasDate = /_\d{8}$/.test(baseName);

let newPath;
if (hasDate) {
  // Ya tiene fecha, solo actualizarla
  const cleanBaseName = baseName.replace(/_\d{8}$/, '');
  const newName = `${cleanBaseName}_${dateStr}${ext}`;
  newPath = path.join(DOWNLOADS_DIR, newName);
  
  if (latestFile.path !== newPath) {
    fs.renameSync(latestFile.path, newPath);
    console.log(`\n📝 Fecha actualizada:`);
    console.log(`   Antes: ${latestFile.name}`);
    console.log(`   Ahora: ${path.basename(newPath)}`);
  } else {
    console.log(`\n✓ El archivo ya tiene la fecha de hoy.`);
  }
} else {
  // No tiene fecha, añadirla
  const newName = `${baseName}_${dateStr}${ext}`;
  newPath = path.join(DOWNLOADS_DIR, newName);
  fs.renameSync(latestFile.path, newPath);
  console.log(`\n📝 Archivo renombrado:`);
  console.log(`   Antes: ${latestFile.name}`);
  console.log(`   Ahora: ${path.basename(newPath)}`);
}

// Guardar la ruta para upload_sp_telemetry.js
fs.writeFileSync(OUTPUT_FILE, newPath);
console.log(`\n✓ Ruta guardada en: ${OUTPUT_FILE}`);

console.log('\n' + '='.repeat(60));
console.log('  PREPARACIÓN COMPLETADA');
console.log(`  Archivo: ${path.basename(newPath)}`);
console.log('='.repeat(60));
console.log('\nPróximo paso: node upload_sp_telemetry.js\n');
