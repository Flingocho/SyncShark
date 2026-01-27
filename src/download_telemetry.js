/**
 * download_telemetry.js
 * 
 * Script principal para descargar telemetría desde Salesforce Analytics.
 * Automatiza el proceso de login, navegación y descarga de tablas.
 * 
 * Uso:
 *   node download_telemetry.js                    (modo normal con sesión guardada)
 *   node download_telemetry.js --manual-login    (forzar login manual, limpia sesión)
 *   node download_telemetry.js --manual-download-login (login manual al descargar)
 */

const puppeteer = require('puppeteer');
const path = require('path');
require('dotenv').config();

// Importar módulos
const { USER_DATA_DIR, DOWNLOADS_DIR, DELAYS, validateEnvVars } = require('./lib/constants');
const { clearSessionData, saveSessionData, loadSessionData, applyStorageToPage } = require('./lib/session-manager');
const { getLatestDownloadedFile, renameDownloadedFile, saveFilePathToTracking } = require('./lib/file-utils');
const { needsLogin, attemptAutoLogin } = require('./lib/salesforce-login');
const { 
  waitForAnalyticsReady, 
  clickButtonByText, 
  clickMenuOption,
  scrollAnalyticsPanelToBottom 
} = require('./lib/salesforce-navigation');
const { downloadCurrentTable } = require('./lib/salesforce-downloader');

// Parsear argumentos de línea de comandos
const MANUAL_LOGIN = process.argv.includes('--manual-login');
const MANUAL_DOWNLOAD_LOGIN = process.argv.includes('--manual-download-login');
const SUPERVISED = process.argv.includes('--supervised');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Validar variables de entorno requeridas
const missingVars = validateEnvVars(['SALESFORCE_URL', 'SF_USER']);
if (missingVars.length > 0) {
  console.error('Error: Variables de entorno requeridas no configuradas:');
  missingVars.forEach(v => console.error(`  - ${v}`));
  console.error('\nConfigúralas en el archivo .env');
  process.exit(1);
}


(async () => {
  console.log('='.repeat(60));
  console.log('  DOWNLOAD - Salesforce Analytics');
  console.log('='.repeat(60));
  
  // Configuración inicial según flags
  if (MANUAL_LOGIN) {
    console.log('\nModo MANUAL LOGIN activado');
    console.log('   Tendrás tiempo para login manual.');
    console.log('   Las credenciales se actualizarán automáticamente.\n');
  }

  if (MANUAL_DOWNLOAD_LOGIN) {
    console.log('\n🔐 Modo MANUAL DOWNLOAD LOGIN activado');
    console.log('   Tendrás 60 segundos para login al descargar Excel.\n');
  }

  let browser;
  try {
    // Iniciar navegador
    console.log('Iniciando navegador...');
    const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    
    // Configurar ventana según modo
    if (!MANUAL_LOGIN && !MANUAL_DOWNLOAD_LOGIN && !SUPERVISED) {
      // Modo automático: ocultar fuera de pantalla
      launchArgs.push('--window-position=-2400,-2400');
    } else if (SUPERVISED) {
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

  // Navegar a Salesforce (el navegador usará automáticamente el userDataDir)
  console.log('Navegando a Salesforce Analytics...');
  await page.goto(process.env.SALESFORCE_URL, { waitUntil: 'networkidle2' });
  await delay(DELAYS.MEDIUM);

  // Proceso de login si es necesario
  if (await needsLogin(page)) {
    await attemptAutoLogin(page, process.env.SF_USER);
  } else {
    console.log('Ya autenticado, accediendo directamente al dashboard.');
  }

  // Tiempo para autenticación (todos los modos usan el mismo tiempo)
  if (MANUAL_LOGIN) {
    console.log('\n' + '='.repeat(60));
    console.log('  🔐 MODO MANUAL LOGIN - Tienes 5 segundos');
    console.log('='.repeat(60));
    console.log('  El navegador cargará las credenciales automáticamente.');
    console.log('  Completa el authenticator si aparece.\n');
  } else {
    console.log('\n=== COMPLETA MANUALMENTE EL AUTHENTICATOR DE WINDOWS SI APARECE ===');
    console.log('Esperando 5 segundos para asegurar carga inicial...\n');
  }
  
  await delay(DELAYS.LONG);

  // Navegación y descarga
  await waitForAnalyticsReady(page);
  
  if (await clickButtonByText(page, 'Mis vistas')) {
    await clickMenuOption(page, 'Paneles');
    await scrollAnalyticsPanelToBottom(page);
    
    console.log('Esperando 30 segundos para que cargue la vista "Paneles"...');
    await delay(DELAYS.TABLE_LOAD);
    
    // Si está en modo manual login o manual download login, dar tiempo para login manual
    const needsDownloadLoginTime = MANUAL_LOGIN || MANUAL_DOWNLOAD_LOGIN;
    const downloaded = await downloadCurrentTable(page, needsDownloadLoginTime);
    if (downloaded) {
      await saveSessionData(page, 'después de descargar');
    }
  }

  // Esperar a que se complete la descarga
  console.log('\n⏳ Esperando 15 segundos para que se complete la descarga...');
  await delay(DELAYS.DOWNLOAD_COMPLETE);

  // Procesar archivo descargado
  console.log('\n📁 Buscando archivo descargado en:', DOWNLOADS_DIR);
  const latestFile = getLatestDownloadedFile();
  
  let renamedFilePath = null;
  if (latestFile) {
    console.log(`   Encontrado: ${latestFile.name}`);
    renamedFilePath = renameDownloadedFile(latestFile.path);
    saveFilePathToTracking(renamedFilePath);
  } else {
    console.log('   ⚠️ No se encontró ningún archivo Copy_of_TECH*.xlsx reciente');
  }

  // Guardar sesión y cerrar
  await saveSessionData(page, 'al cerrar');

  try {
    await browser.close();
    console.log('✓ Navegador cerrado.');
  } catch (error) {
    console.log('El navegador ya estaba cerrado.');
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('  DESCARGA COMPLETADA');
  if (renamedFilePath) {
    console.log(`  Archivo: ${path.basename(renamedFilePath)}`);
  }
  console.log('='.repeat(60));
  console.log('\nPróximos pasos:');
  console.log('  1. node validate_excel.js       (valida el archivo para Power BI)');
  console.log('  2. node upload_sp_telemetry.js  (sube a SharePoint)');
  console.log('\nO ejecuta todo el pipeline:');
  console.log('  node run_full_pipeline.js');
  console.log('\nOpciones disponibles:');
  
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR EN DOWNLOAD');
    console.error('='.repeat(60));
    console.error(error.message);
    console.error(error.stack);
    
    // Intentar cerrar el navegador
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
    
    process.exit(1);
  }
  console.log('  --manual-login          Login inicial manual (60s)');
  console.log('  --manual-download-login Login al descargar Excel (60s)\n');
})();