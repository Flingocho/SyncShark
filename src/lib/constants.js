/**
 * constants.js
 * Configuración y constantes globales del proyecto
 */

const path = require('path');
const os = require('os');

/**
 * Valida que las variables de entorno requeridas estén configuradas
 * @param {string[]} required - Lista de variables requeridas
 * @returns {string[]} Lista de variables faltantes
 */
function validateEnvVars(required) {
  return required.filter(varName => !process.env[varName]);
}

module.exports = {
  // Archivos de sesión
  COOKIES_FILE: path.join(__dirname, '..', 'session-data', 'salesforce', 'cookies_salesforce.json'),
  STORAGE_FILE: path.join(__dirname, '..', 'session-data', 'salesforce', 'storage_salesforce.json'),
  USER_DATA_DIR: path.join(__dirname, '..', 'user-data-salesforce'),
  
  // Directorio de descargas
  DOWNLOADS_DIR: process.env.DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads'),
  
  // Archivo de tracking (ruta absoluta)
  LAST_FILE_PATH: path.join(__dirname, '..', 'last_downloaded_file.txt'),
  
  // Selectores de Salesforce Analytics
  ANALYTICS_CONTAINER_SELECTORS: [
    'analytics-app',
    'analytics-dashboard-view',
    'wave-dashboard-view',
    '.waveDashboardView',
    '.analyticsDashboardView',
    '.dashboard-container',
    '.dashboard-root',
    '.waveApp',
    '.slds-card__body'
  ],
  
  // Tiempos de espera (en milisegundos)
  DELAYS: {
    SHORT: 1000,
    MEDIUM: 3000,
    LONG: 5000,
    TABLE_LOAD: 30000,
    DOWNLOAD_COMPLETE: 15000,
    MANUAL_LOGIN: 60000
  },
  
  // Función de validación
  validateEnvVars
};
