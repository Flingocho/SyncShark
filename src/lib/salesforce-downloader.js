/**
 * salesforce-downloader.js
 * Funciones específicas para descargar tablas desde Salesforce Analytics
 */

const { ANALYTICS_CONTAINER_SELECTORS, DELAYS } = require('./constants');
const { clickMenuOption, scrollVisibleMenu } = require('./salesforce-navigation');
const { handlePopupLogin } = require('./auth-handler');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Espera a que aparezca una tabla de resultados
 * @param {Page} page - Instancia de la página de Puppeteer
 * @returns {boolean} true si se detectó la tabla
 */
async function waitForResultsTable(page) {
  console.log('Esperando a que aparezca la tabla de resultados...');
  try {
    await page.waitForSelector('table, .slds-table, .wave-table', { timeout: 60000 });
    await delay(DELAYS.SHORT);
    console.log('Tabla detectada.');
    return true;
  } catch (error) {
    console.log('No se detectó la tabla antes del timeout, continuamos igualmente.');
    return false;
  }
}

/**
 * Encuentra y hace clic en el botón de acciones de la tabla
 * @param {Page} page - Instancia de la página de Puppeteer
 * @returns {boolean} true si se encontró y clickeó el botón
 */
async function clickTableActionButton(page) {
  const handle = await page.evaluateHandle(selectors => {
    const findContainer = () => {
      const seen = new Set();
      const matches = [];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (!seen.has(el)) {
            matches.push(el);
            seen.add(el);
          }
        });
      });
      const firstMatch = matches.find(el => (el.scrollHeight - el.clientHeight) > 100);
      if (firstMatch) return firstMatch;
      return Array.from(document.querySelectorAll('div, section, article, main'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const diff = el.scrollHeight - el.clientHeight;
          return diff > 400 && (style.overflowY === 'auto' || style.overflowY === 'scroll' || diff > 1200);
        })
        .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0] || null;
    };

    const container = findContainer();
    const searchRoot = container || document;
    const tables = Array.from(searchRoot.querySelectorAll('table, .slds-table, .wave-table'))
      .map(el => ({ el, rect: el.getBoundingClientRect() }))
      .filter(item => item.rect.width > 0 && item.rect.height > 0);

    if (!tables.length) return null;

    tables.sort((a, b) => b.rect.top - a.rect.top);
    const target = tables[0].el;
    if (!target) return null;

    const isValid = (btn) => {
      const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
      const title = (btn.getAttribute('title') || btn.getAttribute('aria-label') || '').toLowerCase();
      const className = (btn.className || '').toLowerCase();
      const ariaHaspopup = btn.getAttribute('aria-haspopup');
      const hasDropdownClass = className.includes('slds-dropdown-trigger') || className.includes('slds-global-actions');
      
      // Filtrar alto contraste
      if (text.includes('alto contraste') || title.includes('alto contraste')) return false;
      
      // No buscar dentro de filas de tabla
      const inRow = btn.closest('tbody') || btn.closest('tr');
      if (inRow) return false;
      
      // Buscar botones con dropdown (flecha hacia abajo) cerca de tablas
      if (hasDropdownClass && ariaHaspopup === 'true') {
        const svg = btn.querySelector('svg');
        if (svg) return true;
      }
      
      // Búsqueda por texto/título
      return title.includes('descargar') || title.includes('acciones') || 
             text.includes('descargar') || text.includes('acciones');
    };

    let searchContainer = target.parentElement;
    const visited = new Set();
    while (searchContainer && !visited.has(searchContainer)) {
      visited.add(searchContainer);
      const buttons = Array.from(searchContainer.querySelectorAll('button, [role="button"], lightning-button-icon, .slds-dropdown-trigger'));
      const found = buttons.find(isValid);
      if (found) {
        found.scrollIntoView({ behavior: 'auto', block: 'center' });
        return found;
      }
      searchContainer = searchContainer.parentElement;
    }
    
    // Fallback global: buscar cualquier botón dropdown con SVG cerca de tablas
    const globalFallback = Array.from(document.querySelectorAll('button.slds-dropdown-trigger, button[aria-haspopup="true"]'))
      .filter(btn => {
        if (btn.closest('tbody') || btn.closest('tr')) return false;
        const svg = btn.querySelector('svg');
        return svg && isValid(btn);
      })[0];
      
    if (globalFallback) {
      globalFallback.scrollIntoView({ behavior: 'auto', block: 'center' });
      return globalFallback;
    }
    return null;
  }, ANALYTICS_CONTAINER_SELECTORS);

  const element = handle.asElement ? handle.asElement() : null;
  if (!element) {
    await handle.dispose();
    return false;
  }

  await element.click();
  await delay(DELAYS.LONG);
  await handle.dispose();
  return true;
}

/**
 * Ejecuta el proceso completo de descarga de una tabla
 * @param {Page} page - Instancia de la página de Puppeteer
 * @param {boolean} manualDownloadLogin - Si true, espera login manual de 60s
 * @returns {boolean} true si la descarga se completó exitosamente
 */
async function downloadCurrentTable(page, manualDownloadLogin = false) {
  await waitForResultsTable(page);
  
  console.log('Abriendo menú de descargas de la tabla...');
  if (!(await clickTableActionButton(page))) {
    console.log('No se pudo encontrar el botón de acciones de la tabla (flecha).');
    return false;
  }

  if (!(await clickMenuOption(page, ['descargar', 'download', 'exportar'], 'Descargar', 2000))) {
    console.log('No se pudo abrir el submenú de descarga.');
    return false;
  }

  await scrollVisibleMenu(page);

  if (!(await clickMenuOption(page, ['excel', '.xlsx', 'microsoft excel'], 'Excel', 2000))) {
    console.log('No se pudo seleccionar la opción Excel.');
    return false;
  }

  // Manejo de login en la descarga
  if (manualDownloadLogin) {
    console.log('\n' + '='.repeat(60));
    console.log('  🔐 MANUAL DOWNLOAD LOGIN - Tienes 60 segundos');
    console.log('='.repeat(60));
    console.log('  Introduce tus credenciales en la ventana emergente.');
    console.log('  La descarga continuará automáticamente después.\n');
    await delay(DELAYS.MANUAL_LOGIN);
  } else {
    // En modo automático, simplemente esperar un poco para que se procese
    // Las cookies/tokens ya cargados deberían manejar la autenticación
    console.log('Esperando a que se procese la descarga...');
    await delay(5000);
  }

  console.log('Descarga de la tabla en Excel solicitada.');
  await delay(DELAYS.MEDIUM);
  return true;
}

module.exports = {
  waitForResultsTable,
  clickTableActionButton,
  downloadCurrentTable
};
