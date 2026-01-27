/**
 * session-manager.js
 * Gestión de sesiones, cookies y datos de almacenamiento
 */

const fs = require('fs');
const { COOKIES_FILE, STORAGE_FILE, USER_DATA_DIR } = require('./constants');

/**
 * Limpia todos los datos de sesión guardados (cookies, storage, user-data)
 * Se usa en modo --manual-login para forzar un login fresco
 */
function clearSessionData() {
  console.log('🗑️  Limpiando datos de sesión anteriores...');
  
  if (fs.existsSync(COOKIES_FILE)) {
    fs.unlinkSync(COOKIES_FILE);
    console.log(`   ✓ ${COOKIES_FILE} eliminado`);
  }
  
  if (fs.existsSync(STORAGE_FILE)) {
    fs.unlinkSync(STORAGE_FILE);
    console.log(`   ✓ ${STORAGE_FILE} eliminado`);
  }
  
  if (fs.existsSync(USER_DATA_DIR)) {
    fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
    console.log(`   ✓ ${USER_DATA_DIR} eliminado`);
  }
}

/**
 * Guarda cookies y datos de sessionStorage/localStorage
 * @param {Page} page - Instancia de la página de Puppeteer
 * @param {string} contextLabel - Etiqueta descriptiva para el log (opcional)
 */
async function saveSessionData(page, contextLabel = '') {
  const suffix = contextLabel ? ` (${contextLabel})` : '';
  console.log(`Guardando cookies y datos de sesión${suffix}...`);
  
  // Guardar cookies
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  console.log(`✓ Cookies guardadas en ${COOKIES_FILE}`);

  // Guardar localStorage y sessionStorage
  try {
    const storageData = await page.evaluate(() => {
      const data = {
        localStorage: {},
        sessionStorage: {}
      };
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data.localStorage[key] = localStorage.getItem(key);
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        data.sessionStorage[key] = sessionStorage.getItem(key);
      }
      
      return data;
    });
    
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storageData, null, 2));
    console.log(`✓ LocalStorage y SessionStorage guardados en ${STORAGE_FILE}`);
  } catch (error) {
    console.log('⚠ No se pudo guardar storage:', error.message);
  }
}

/**
 * Carga cookies y storage guardados en la página
 * @param {Page} page - Instancia de la página de Puppeteer
 * @returns {boolean} true si se cargaron cookies/storage, false si no existen
 */
async function loadSessionData(page) {
  let loaded = false;
  let storageData = null;
  
  // Primero cargar el storage data para usar con evaluateOnNewDocument
  if (fs.existsSync(STORAGE_FILE)) {
    console.log('Cargando storage guardado...');
    try {
      storageData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
      const localStorageCount = Object.keys(storageData.localStorage || {}).length;
      const sessionStorageCount = Object.keys(storageData.sessionStorage || {}).length;
      console.log(`   → localStorage: ${localStorageCount} items`);
      console.log(`   → sessionStorage: ${sessionStorageCount} items`);
      
      // Configurar para que se inyecte en cada nueva página/navegación
      await page.evaluateOnNewDocument((storageData) => {
        // Restaurar localStorage
        if (storageData.localStorage) {
          for (const [key, value] of Object.entries(storageData.localStorage)) {
            try {
              localStorage.setItem(key, value);
            } catch (e) {
              // Silencioso en el navegador
            }
          }
        }
        
        // Restaurar sessionStorage
        if (storageData.sessionStorage) {
          for (const [key, value] of Object.entries(storageData.sessionStorage)) {
            try {
              sessionStorage.setItem(key, value);
            } catch (e) {
              // Silencioso en el navegador
            }
          }
        }
      }, storageData);
      
      console.log('✓ Storage configurado para inyección automática.');
      loaded = true;
    } catch (error) {
      console.log('⚠ Error al cargar storage:', error.message);
    }
  }
  
  // Luego cargar cookies
  if (fs.existsSync(COOKIES_FILE)) {
    console.log('Cargando cookies guardadas...');
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
    console.log(`   → ${cookies.length} cookies`);
    await page.setCookie(...cookies);
    console.log('✓ Cookies cargadas correctamente.');
    loaded = true;
  }
  
  return loaded;
}

/**
 * Aplica el storage después de que la página ya haya cargado
 * Útil como refuerzo adicional
 * @param {Page} page - Instancia de la página de Puppeteer
 */
async function applyStorageToPage(page) {
  if (!fs.existsSync(STORAGE_FILE)) return false;
  
  try {
    const storageData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    
    await page.evaluate((storageData) => {
      // Aplicar localStorage
      if (storageData.localStorage) {
        for (const [key, value] of Object.entries(storageData.localStorage)) {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn('Error al aplicar localStorage key:', key);
          }
        }
      }
      
      // Aplicar sessionStorage
      if (storageData.sessionStorage) {
        for (const [key, value] of Object.entries(storageData.sessionStorage)) {
          try {
            sessionStorage.setItem(key, value);
          } catch (e) {
            console.warn('Error al aplicar sessionStorage key:', key);
          }
        }
      }
    }, storageData);
    
    console.log('✓ Storage aplicado a la página actual.');
    return true;
  } catch (error) {
    console.log('⚠ Error al aplicar storage:', error.message);
    return false;
  }
}

module.exports = {
  clearSessionData,
  saveSessionData,
  loadSessionData,
  applyStorageToPage
};
