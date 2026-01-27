/**
 * file-utils.js
 * Utilidades para manejo de archivos descargados
 */

const fs = require('fs');
const path = require('path');
const { DOWNLOADS_DIR } = require('./constants');

/**
 * Obtiene el último archivo descargado que empiece con "Copy_of_TECH"
 * @returns {Object|null} Objeto con name, path y time del archivo, o null si no se encuentra
 */
function getLatestDownloadedFile() {
  const files = fs.readdirSync(DOWNLOADS_DIR)
    .filter(f => f.startsWith('Copy_of_TECH') && f.endsWith('.xlsx'))
    .map(f => ({
      name: f,
      path: path.join(DOWNLOADS_DIR, f),
      time: fs.statSync(path.join(DOWNLOADS_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  return files.length > 0 ? files[0] : null;
}

/**
 * Renombra el archivo descargado añadiendo la fecha actual
 * @param {string} filePath - Ruta completa del archivo a renombrar
 * @returns {string} Nueva ruta del archivo renombrado
 */
function renameDownloadedFile(filePath) {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  
  // Quitar fecha anterior si existe (formato _YYYYMMDD)
  const cleanBaseName = baseName.replace(/_\d{8}$/, '');
  const newName = `${cleanBaseName}_${dateStr}${ext}`;
  const newPath = path.join(dir, newName);
  
  fs.renameSync(filePath, newPath);
  console.log(`✓ Archivo renombrado: ${newName}`);
  return newPath;
}

/**
 * Guarda la ruta del archivo en el archivo de tracking
 * @param {string} filePath - Ruta del archivo a guardar
 */
function saveFilePathToTracking(filePath) {
  const { LAST_FILE_PATH } = require('./constants');
  const fs = require('fs');
  fs.writeFileSync(LAST_FILE_PATH, filePath);
  console.log(`   Ruta guardada en ${path.basename(LAST_FILE_PATH)}`);
}

module.exports = {
  getLatestDownloadedFile,
  renameDownloadedFile,
  saveFilePathToTracking
};
