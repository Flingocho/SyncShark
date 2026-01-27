/**
 * refresh_workspace.js
 * 
 * Accede al workspace de Power BI y actualiza los datos
 * Soporta diferentes workspaces: KPIS, Defensa, Sectores
 * 
 * Uso:
 *   node refresh_workspace.js --workspace kpis
 *   node refresh_workspace.js --workspace defensa
 *   node refresh_workspace.js --workspace sectores
 */

const puppeteer = require('puppeteer');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

// Importar módulos
const { DELAYS } = require('./lib/constants');
const { saveSessionData, loadSessionData } = require('./lib/session-manager');

// Parsear argumentos
const args = process.argv.slice(2);
const workspaceIndex = args.indexOf('--workspace');
const workspace = workspaceIndex !== -1 ? args[workspaceIndex + 1] : null;
const clearCredentials = args.includes('--clear-credentials');
const supervised = args.includes('--supervised');

// Archivos de sesión específicos para workspace
const COOKIES_FILE = path.join(__dirname, 'session-data', 'workspace', 'cookies_workspace.json');
const STORAGE_FILE = path.join(__dirname, 'session-data', 'workspace', 'storage_workspace.json');
const USER_DATA_DIR = path.join(__dirname, 'user-data-workspace');

/**
 * Limpia las credenciales guardadas del workspace
 */
function clearWorkspaceCredentials() {
  const fs = require('fs');
  
  try {
    if (fs.existsSync(COOKIES_FILE)) {
      fs.unlinkSync(COOKIES_FILE);
      console.log(`✓ Eliminado: ${COOKIES_FILE}`);
    }
    
    if (fs.existsSync(STORAGE_FILE)) {
      fs.unlinkSync(STORAGE_FILE);
      console.log(`✓ Eliminado: ${STORAGE_FILE}`);
    }
    
    if (fs.existsSync(USER_DATA_DIR)) {
      fs.rmSync(USER_DATA_DIR, { recursive: true, force: true });
      console.log(`✓ Eliminado: ${USER_DATA_DIR}`);
    }
    
    console.log('✓ Credenciales de workspace limpiadas correctamente\n');
  } catch (error) {
    console.log('⚠ Error al limpiar credenciales:', error.message);
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Espera a que el usuario presione Enter
 */
function waitForEnter(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

/**
 * Verifica si la página requiere login
 */
async function needsLogin(page) {
  return await page.evaluate(() => {
    return !!document.querySelector('input[type="email"], input[type="password"], input[name="loginfmt"]');
  });
}

/**
 * Intenta completar el formulario de login
 */
async function attemptLogin(page) {
  console.log('Detectado formulario de login. Iniciando autenticación...');
  
  try {
    // Esperar campo de email
    const emailField = await page.waitForSelector('input[type="email"], input[name="loginfmt"]', { timeout: 5000 });
    
    if (emailField) {
      await page.type('input[type="email"], input[name="loginfmt"]', process.env.WORKSPACE_USER || process.env.SF_USER);
      console.log('Email introducido');
      
      // Buscar botón "Next" o "Siguiente"
      await delay(1000);
      const nextButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
        return buttons.find(b => {
          const text = (b.textContent || b.value || '').trim().toLowerCase();
          return text.includes('next') || text.includes('siguiente') || text === 'sign in';
        });
      });
      
      if (nextButton) {
        await nextButton.click();
        console.log('Botón siguiente clickeado');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      }
    }
    
    // Esperar campo de password
    await delay(2000);
    const passwordField = await page.$('input[type="password"]');
    
    if (passwordField) {
      const password = process.env.WORKSPACE_PASSWORD || process.env.SF_PASSWORD;
      if (password) {
        await page.type('input[type="password"]', password);
        console.log('Password introducido');
        
        await delay(1000);
        const signInButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
          return buttons.find(b => {
            const text = (b.textContent || b.value || '').trim().toLowerCase();
            return text.includes('sign in') || text.includes('iniciar') || text.includes('entrar');
          });
        });
        
        if (signInButton) {
          await signInButton.click();
          console.log('Botón sign in clickeado');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        }
      }
    }
    
  } catch (error) {
    console.log('Error en proceso de login:', error.message);
  }
}

(async () => {
  console.log('='.repeat(60));
  console.log('  REFRESH WORKSPACE - Power BI');
  console.log('='.repeat(60));
  
  if (!workspace) {
    console.error('❌ Error: Debe especificar un workspace con --workspace');
    process.exit(1);
  }
  
  // Limpiar credenciales si se solicita
  if (clearCredentials) {
    console.log('\n🧹 Limpiando credenciales existentes...\n');
    clearWorkspaceCredentials();
  }
  
  // Determinar URL a usar según el workspace
  let targetUrl;
  if (workspace === 'setup') {
    console.log('\n📋 Modo de configuración de credenciales\n');
    targetUrl = process.env.WORKSPACE_URL;
  } else if (workspace === 'kpis') {
    console.log(`\n📊 Workspace seleccionado: ${workspace.toUpperCase()}`);
    targetUrl = process.env.KPIS_URL;
  } else if (workspace === 'defensa') {
    console.log(`\n📊 Workspace seleccionado: ${workspace.toUpperCase()}`);
    targetUrl = process.env.DEFENSA_URL;
  } else if (workspace === 'sectores') {
    console.log(`\n📊 Workspace seleccionado: ${workspace.toUpperCase()}`);
    targetUrl = process.env.SECTORES_URL;
  } else {
    console.log(`\n📊 Workspace seleccionado: ${workspace.toUpperCase()}`);
    targetUrl = process.env.WORKSPACE_URL; // Fallback por si acaso
  }
  
  if (!targetUrl) {
    console.error(`❌ Error: URL no configurada para workspace '${workspace}' en .env`);
    process.exit(1);
  }
  
  console.log(`URL objetivo: ${targetUrl}\n`);
  console.log('Iniciando navegador...');
  
  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
  
  // Configurar ventana según modo
  if (workspace !== 'setup' && !clearCredentials && !supervised) {
    // Modo automático: ocultar fuera de pantalla
    launchArgs.push('--window-position=-2400,-2400');
  } else if (supervised) {
    // Modo supervisado: centrar en pantalla
    launchArgs.push('--window-position=250,50');
  }
  
  const browser = await puppeteer.launch({ 
    headless: false,
    userDataDir: USER_DATA_DIR,
    args: launchArgs,
    defaultViewport: null
  });
  
  const page = await browser.newPage();
  
  // Intentar cargar sesión guardada
  try {
    const fs = require('fs');
    if (fs.existsSync(COOKIES_FILE)) {
      console.log('Cargando cookies guardadas...');
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'));
      await page.setCookie(...cookies);
      console.log('Cookies cargadas correctamente.');
    }
  } catch (error) {
    console.log('No se pudieron cargar cookies previas:', error.message);
  }
  
  console.log('Navegando a workspace...');
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  
  await delay(DELAYS.MEDIUM);
  
  // Verificar si necesita login
  if (await needsLogin(page)) {
    console.log('\n' + '='.repeat(60));
    console.log('  AUTENTICACIÓN REQUERIDA');
    console.log('='.repeat(60));
    console.log('  Por favor, completa el login manualmente en el navegador.');
    console.log('  1. Introduce tu email y contraseña');
    console.log('  2. Completa la autenticación de 2 factores si aparece');
    console.log('  3. Espera a que cargue el workspace');
    console.log('\n  Tiempo de espera: 60 segundos');
    console.log('='.repeat(60) + '\n');
    
    await delay(60000); // 60 segundos para login manual
    
    console.log('Continuando con el proceso...');
  } else {
    console.log('✓ Ya autenticado, accediendo al workspace...');
  }
  
  // Esperar a que cargue el workspace
  console.log('Esperando a que cargue el workspace...');
  await delay(DELAYS.LONG);
  
  // Verificar que estamos en el workspace
  const currentUrl = page.url();
  console.log(`URL actual: ${currentUrl}`);
  
  if (currentUrl.includes('powerbi.com') || currentUrl.includes('app.powerbi')) {
    console.log('✓ Acceso al workspace exitoso');
    
    // Si no es modo setup, intentar actualizar el dataset
    if (workspace !== 'setup') {
      console.log('\n' + '='.repeat(60));
      console.log('  ACTUALIZANDO DATASET');
      console.log('='.repeat(60) + '\n');
      
      try {
        // Esperar a que la página esté completamente cargada
        await delay(3000);
        
        // Buscar y clickear el botón del menú desplegable
        console.log('Buscando botón de menú...');
        const menuButton = await page.waitForSelector('[data-testid="refresh-button"], button[aria-label*="Actualizar"], button[title*="Actualizar"]', { 
          timeout: 10000 
        }).catch(() => null);
        
        if (menuButton) {
          await menuButton.click();
          console.log('✓ Menú desplegable abierto');
          await delay(2000);
          
          // Buscar y clickear "Actualizar ahora"
          console.log('Buscando botón "Actualizar ahora"...');
          const refreshNowButton = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span.dropDown-displayName, span[class*="dropDown"]'));
            const button = spans.find(span => {
              const text = span.textContent.trim().toLowerCase();
              return text.includes('actualizar ahora') || text.includes('refresh now');
            });
            
            if (button) {
              button.click();
              return true;
            }
            return false;
          });
          
          if (refreshNowButton) {
            console.log('✓ Botón "Actualizar ahora" clickeado exitosamente');
            await delay(2000);
          } else {
            console.log('⚠ No se encontró el botón "Actualizar ahora"');
          }
        } else {
          console.log('⚠ No se encontró el botón de menú desplegable');
        }
      } catch (error) {
        console.log('⚠ Error al intentar actualizar dataset:', error.message);
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('  ACTUALIZACIÓN COMPLETADA');
      console.log('='.repeat(60) + '\n');
    }
    
    // Guardar datos de sesión
    const fs = require('fs');
    console.log('Guardando datos de sesión para futuros accesos...');
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
    console.log(`✓ Cookies guardadas en ${COOKIES_FILE}`);
    
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
      console.log(`✓ Storage guardado en ${STORAGE_FILE}`);
    } catch (error) {
      console.log('⚠ No se pudo guardar storage:', error.message);
    }
    
  } else {
    console.log('⚠ No se pudo verificar el acceso al workspace');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('  ACCESO AL WORKSPACE COMPLETADO');
  console.log('='.repeat(60));
  console.log(`\nWorkspace: ${workspace.toUpperCase()}`);
  console.log('Sesión guardada para futuros accesos.');
  
  // Si es modo setup, no cerramos automáticamente
  if (workspace === 'setup') {
    console.log('\n⚠ MODO CONFIGURACIÓN: El navegador permanecerá abierto');
    console.log('Cierra el navegador manualmente cuando termines.');
    console.log('Las credenciales se guardarán automáticamente al cerrar.');
    console.log('='.repeat(60) + '\n');
    
    // Esperar a que el usuario cierre el navegador
    await new Promise((resolve) => {
      browser.on('disconnected', () => {
        console.log('✓ Navegador cerrado manualmente.');
        resolve();
      });
    });
  } else {
    console.log('\nCerrando navegador en 5 segundos...');
    console.log('='.repeat(60) + '\n');
    
    await delay(5000);
    
    try {
      await browser.close();
      console.log('✓ Navegador cerrado.');
    } catch (error) {
      console.log('El navegador ya estaba cerrado.');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('  PROCESO FINALIZADO');
  console.log('='.repeat(60));
})();
