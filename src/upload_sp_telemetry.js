const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

// Parsear argumentos de línea de comandos
const MANUAL_LOGIN = process.argv.includes('--manual-login');
const SUPERVISED = process.argv.includes('--supervised');

// Constantes de rutas
const COOKIES_FILE = path.join(__dirname, 'session-data', 'sharepoint', 'cookies_sharepoint.json');
const STORAGE_FILE = path.join(__dirname, 'session-data', 'sharepoint', 'storage_sharepoint.json');
const USER_DATA_DIR = path.join(__dirname, 'user-data-sharepoint');
const LAST_FILE_PATH = path.join(__dirname, 'last_downloaded_file.txt');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Limpia datos de sesión guardados (modo --manual-login)
 */
function clearSessionData() {
  console.log('Limpiando datos de sesión anteriores...');
  try {
    if (fs.existsSync(COOKIES_FILE)) {
      fs.unlinkSync(COOKIES_FILE);
      console.log(`   Eliminado: ${path.basename(COOKIES_FILE)}`);
    }
    if (fs.existsSync(STORAGE_FILE)) {
      fs.unlinkSync(STORAGE_FILE);
      console.log(`   Eliminado: ${path.basename(STORAGE_FILE)}`);
    }
    if (fs.existsSync(USER_DATA_DIR)) {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      console.log(`   Eliminado: ${path.basename(USER_DATA_DIR)}`);
    }
  } catch (error) {
    console.log('Error al limpiar sesión:', error.message);
  }
}

// Función para guardar datos de sesión
async function saveSessionData(page) {
  console.log('Guardando datos de sesión...');
  
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  console.log(`✓ Cookies guardadas en ${COOKIES_FILE}`);

  try {
    const storageData = await page.evaluate(() => {
      const data = { localStorage: {}, sessionStorage: {} };
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
    console.log(`✓ Storage guardado en ${STORAGE_FILE}`);
  } catch (error) {
    console.log('⚠ No se pudo guardar storage:', error.message);
  }
}

// Obtener la ruta del archivo a subir
function getFileToUpload() {
  // Prioridad 1: Archivo especificado en last_downloaded_file.txt (desde download_telemetry.js)
  if (fs.existsSync(LAST_FILE_PATH)) {
    const filePath = fs.readFileSync(LAST_FILE_PATH, 'utf-8').trim();
    if (fs.existsSync(filePath)) {
      console.log(`📁 Usando archivo de última descarga: ${path.basename(filePath)}`);
      return filePath;
    }
  }
  
  // Prioridad 2: Variable de entorno FILE_PATH
  if (process.env.FILE_PATH) {
    const envPath = process.env.FILE_PATH.replace('%USERPROFILE%', process.env.USERPROFILE || '');
    if (fs.existsSync(envPath)) {
      console.log(`📁 Usando archivo de .env: ${path.basename(envPath)}`);
      return envPath;
    }
  }
  
  return null;
}

(async () => {
  console.log('='.repeat(60));
  console.log('  UPLOAD - SharePoint Upload');
  console.log('='.repeat(60));

  // Validar variable de entorno requerida
  if (!process.env.SHAREPOINT_URL) {
    console.error('Error: SHAREPOINT_URL no configurada en .env');
    process.exit(1);
  }

  if (MANUAL_LOGIN) {
    console.log('\nModo MANUAL LOGIN activado');
    console.log('   Tendrás tiempo para login manual.');
    console.log('   Las credenciales se actualizarán automáticamente.\n');
  }

  // Verificar archivo a subir
  const fileToUpload = getFileToUpload();
  if (!fileToUpload) {
    console.error('❌ Error: No se encontró ningún archivo para subir.');
    console.error('   Ejecuta primero download_telemetry.js o configura FILE_PATH en .env');
    process.exit(1);
  }

  console.log(`\n📄 Archivo a subir: ${fileToUpload}\n`);

  let browser;
  try {
    const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    
    // Configurar ventana según modo
    if (!MANUAL_LOGIN && !SUPERVISED) {
      // Modo automático: ocultar fuera de pantalla
      launchArgs.push('--window-position=-2400,-2400');
    } else if (SUPERVISED) {
      // Modo supervisado: centrar en pantalla
      launchArgs.push('--window-position=250,50');
    }
    
    browser = await puppeteer.launch({ 
      headless: false, 
      userDataDir: USER_DATA_DIR,
      args: launchArgs,
      defaultViewport: null
    });
    const page = await browser.newPage();

    // Navegar a SharePoint (el navegador usará automáticamente el userDataDir)
    await page.goto(process.env.SHAREPOINT_URL);
    console.log('Página abierta: SharePoint Telefónica');

    // Tiempo de espera (todos los modos usan el mismo tiempo)
    if (MANUAL_LOGIN) {
      console.log('\n' + '='.repeat(60));
      console.log('  🔐 MODO MANUAL LOGIN - Esperando 10 segundos');
      console.log('='.repeat(60));
      console.log('  El navegador cargará las credenciales automáticamente.');
      console.log('  Completa el authenticator si aparece.\n');
    } else {
      console.log('Esperando 10 segundos para carga inicial...');
    }
    
    await delay(10000);

    // Guardar sesión inicial
    await saveSessionData(page);

    // Subir archivo
    console.log('\n📤 Iniciando proceso de subida...');
    console.log('Iniciando script de Python para manejar el dialog...');
    
    const pythonProcess = spawn('py', ['upload.pyw', fileToUpload], { 
      stdio: 'pipe', 
      detached: true 
    });
    pythonProcess.stdout.on('data', (data) => console.log('Python:', data.toString().trim()));
    pythonProcess.stderr.on('data', (data) => console.log('Python error:', data.toString().trim()));
    pythonProcess.on('close', (code) => console.log('Python process cerrado con código:', code));
    pythonProcess.unref();
    console.log('Python script lanzado');

    console.log('Haciendo click en "Cargar"...');
    await page.click('button[data-automationid="uploadCommand"]');
    
    console.log('Esperando el menú desplegable...');
    await page.waitForSelector('button[data-automationid="uploadFileCommand"]', { visible: true, timeout: 10000 });
    
    console.log('Seleccionando "Archivos"...');
    await page.$eval('button[data-automationid="uploadFileCommand"]', el => el.click());
    
    console.log('Dialog abierto, Python debería manejar la selección...');
    
    // Esperar a que se complete la subida
    console.log('Esperando 15 segundos para completar la subida...');
    await delay(15000);
    
    console.log('✓ Archivo subido exitosamente');

    // Guardar sesión final
    await saveSessionData(page);

    console.log('\n' + '='.repeat(60));
    console.log('  SUBIDA COMPLETADA');
    console.log(`  Archivo: ${path.basename(fileToUpload)}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error durante la ejecución:', error.message);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador cerrado');
    }
  }
})();
