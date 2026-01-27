/**
 * salesforce-navigation.js
 * Funciones de navegación y UI dentro de Salesforce Analytics
 */

const { ANALYTICS_CONTAINER_SELECTORS, DELAYS } = require('./constants');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Espera a que el panel de Analytics termine de cargar
 * @param {Page} page - Instancia de la página de Puppeteer
 * @returns {boolean} true si se detectó que cargó correctamente
 */
async function waitForAnalyticsReady(page) {
  console.log('Esperando a que el panel de Analytics termine de cargar...');
  try {
    await page.waitForFunction(() => {
      const spinner = document.querySelector('lightning-spinner, .slds-spinner');
      const hasLabel = Array.from(document.querySelectorAll('*')).some(el => {
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        return text.includes('mis vistas');
      });
      return hasLabel && !spinner;
    }, { timeout: 60000, polling: 1000 });
    console.log('Panel cargado correctamente.');
    return true;
  } catch (error) {
    console.log('No se detectó el estado listo antes del timeout, continuamos igualmente.');
    return false;
  }
}

/**
 * Busca y hace clic en un botón por su texto
 * @param {Page} page - Instancia de la página de Puppeteer
 * @param {string} targetText - Texto del botón a buscar
 * @returns {boolean} true si se encontró y clickeó el botón
 */
async function clickButtonByText(page, targetText) {
  console.log(`Buscando botón "${targetText}"...`);
  const handle = await page.evaluateHandle(label => {
    const lower = label.toLowerCase();
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], .slds-button, lightning-button, a'));
    return candidates.find(el => {
      const content = (el.innerText || el.textContent || '').trim().toLowerCase();
      return content.includes(lower);
    }) || null;
  }, targetText);

  const element = handle.asElement ? handle.asElement() : null;
  if (!element) {
    await handle.dispose();
    console.log(`No se encontró el botón "${targetText}".`);
    return false;
  }

  await element.click();
  await handle.dispose();
  console.log(`Clic realizado en "${targetText}".`);
  await delay(DELAYS.SHORT);
  return true;
}

/**
 * Hace clic en una opción de menú desplegable
 * @param {Page} page - Instancia de la página de Puppeteer
 * @param {string|string[]} labels - Etiqueta(s) a buscar en el menú
 * @param {string} logName - Nombre descriptivo para el log (opcional)
 * @param {number} waitMs - Tiempo de espera después del clic
 * @returns {boolean} true si se encontró y clickeó la opción
 */
async function clickMenuOption(page, labels, logName, waitMs = 1000) {
  const options = Array.isArray(labels) ? labels : [labels];
  const labelList = options.map(l => l.toLowerCase());
  const readable = logName || options[0];
  console.log(`Seleccionando opción "${readable}"...`);

  // Esperar a que el menú sea visible
  await page.waitForFunction(() => {
    const menus = Array.from(document.querySelectorAll('[role="menu"], .slds-dropdown, .slds-listbox, .slds-dropdown-trigger'));
    return menus.some(menu => {
      const style = window.getComputedStyle(menu);
      const visible = style.visibility !== 'hidden' && style.display !== 'none';
      return visible;
    });
  }, { timeout: 5000 }).catch(() => {});

  const handle = await page.evaluateHandle(targets => {
    const candidates = Array.from(document.querySelectorAll('[role="menuitem"], .slds-dropdown__item, .slds-listbox__item, .slds-button, button, a'));
    return candidates.find(el => {
      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      const title = (el.getAttribute('title') || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      const style = window.getComputedStyle(el);
      const visible = (el.offsetParent !== null) || style.position === 'fixed';
      if (!visible || style.visibility === 'hidden' || style.display === 'none') return false;
      return targets.some(label => text.includes(label) || title.includes(label) || aria.includes(label));
    }) || null;
  }, labelList);

  const element = handle.asElement ? handle.asElement() : null;
  if (!element) {
    await handle.dispose();
    const visibleOptions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="menuitem"], .slds-dropdown__item, .slds-listbox__item'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return (el.offsetParent !== null || style.position === 'fixed') && style.visibility !== 'hidden' && style.display !== 'none';
        })
        .map(el => (el.innerText || el.textContent || '').trim())
        .filter(Boolean);
    });
    console.log(`No se encontró la opción "${readable}". Opciones visibles: ${visibleOptions.join(' | ') || 'ninguna'}`);
    return false;
  }

  await element.click();
  await handle.dispose();
  console.log(`Opción "${readable}" seleccionada.`);
  await delay(waitMs);
  return true;
}

/**
 * Desplaza un menú emergente hasta el final para mostrar todas las opciones
 * @param {Page} page - Instancia de la página de Puppeteer
 * @returns {boolean} true si se encontró y desplazó el menú
 */
async function scrollVisibleMenu(page) {
  console.log('Desplazando menú emergente para mostrar más opciones...');
  const scrolled = await page.evaluate(() => {
    const menus = Array.from(document.querySelectorAll('[role="menu"], .slds-dropdown, .slds-listbox, .slds-dropdown-trigger'));
    const target = menus.find(menu => {
      const style = window.getComputedStyle(menu);
      const visible = style.visibility !== 'hidden' && style.display !== 'none';
      const hasScroll = menu.scrollHeight - menu.clientHeight > 20;
      return visible && hasScroll;
    });
    if (!target) return false;
    target.scrollTop = 0;
    target.scrollTop = target.scrollHeight;
    return true;
  }).catch(() => false);

  if (!scrolled) {
    console.log('No se encontró un menú desplazable.');
  }

  await delay(2000);
  return scrolled;
}

/**
 * Desplaza el panel de Analytics hasta el final
 * @param {Page} page - Instancia de la página de Puppeteer
 * @param {number} offsetFromBottom - Píxeles desde el final donde detener el scroll
 * @returns {boolean} true si se encontró y desplazó el contenedor
 */
async function scrollAnalyticsPanelToBottom(page, offsetFromBottom = 400) {
  console.log('Desplazando dentro del panel de Analytics hasta el final...');
  const success = await page.evaluate(async (selectors, offset) => {
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
      const firstMatch = matches.find(el => (el.scrollHeight - el.clientHeight) > 200);
      if (firstMatch) return firstMatch;

      const fallback = Array.from(document.querySelectorAll('div, section, article, main'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const diff = el.scrollHeight - el.clientHeight;
          return diff > 400 && (style.overflowY === 'auto' || style.overflowY === 'scroll' || diff > 1200);
        })
        .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));

      return fallback[0] || null;
    };

    const container = findContainer();
    if (!container) return false;

    await new Promise(resolve => {
      const distance = 400;
      const timer = setInterval(() => {
        container.scrollTop += distance;
        if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
          clearInterval(timer);
          container.scrollTop = Math.max(container.scrollHeight - container.clientHeight - offset, 0);
          resolve();
        }
      }, 200);
    });

    return true;
  }, ANALYTICS_CONTAINER_SELECTORS, offsetFromBottom).catch(() => false);

  if (!success) {
    console.log('No se encontró un contenedor desplazable dentro del panel.');
  }

  await delay(DELAYS.LONG);
  return success;
}

module.exports = {
  waitForAnalyticsReady,
  clickButtonByText,
  clickMenuOption,
  scrollVisibleMenu,
  scrollAnalyticsPanelToBottom
};
