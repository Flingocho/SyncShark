/**
 * salesforce-login.js
 * Manejo del proceso de login en Salesforce
 */

const { DELAYS } = require('./constants');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Verifica si la página actual requiere login
 * @param {Page} page - Instancia de la página de Puppeteer
 * @returns {boolean} true si se detecta la página de login
 */
async function needsLogin(page) {
  return await page.evaluate(() => {
    return !!document.querySelector('input[name="username"]');
  });
}

/**
 * Intenta completar automáticamente el formulario de login
 * @param {Page} page - Instancia de la página de Puppeteer
 * @param {string} username - Email/username para el login
 */
async function attemptAutoLogin(page, username) {
  console.log('Se requiere login. Completando formulario...');
  
  try {
    // Llenar email
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    await page.type('input[name="username"]', username);
    console.log('Email introducido:', username);

    // Buscar y hacer clic en botón de login
    await delay(DELAYS.SHORT);
    const loginButton = await page.evaluateHandle(() => {
      const elements = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      return elements.find(b => {
        const text = (b.textContent || b.value || '').trim().toLowerCase();
        return text.includes('iniciar') || text.includes('login') || text.includes('next');
      });
    });
    
    if (loginButton) {
      await loginButton.click();
      console.log('Clic en botón de login');
    }

    // Esperar navegación
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
      console.log('Timeout en navegación, continuando...');
    });

  } catch (error) {
    console.log('Error en login automático:', error.message);
  }
}

module.exports = {
  needsLogin,
  attemptAutoLogin
};
