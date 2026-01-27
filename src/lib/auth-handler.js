/**
 * auth-handler.js
 * Manejo de autenticación y ventanas emergentes de login
 */

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Maneja ventanas emergentes de login adicionales que pueden aparecer
 * durante el proceso de descarga (Microsoft SSO, etc.)
 * @param {Page} page - Página principal de Puppeteer
 */
async function handlePopupLogin(page) {
  console.log('Comprobando si aparece ventana de login adicional...');
  const context = await page.browserContext();
  
  // Esperar a que aparezca alguna ventana emergente (aumentado a 10s para modo automático)
  const waitForInitialPopupUntil = Date.now() + 10000;
  while (Date.now() < waitForInitialPopupUntil) {
    const current = (await context.pages()).filter(p => p !== page);
    if (current.length) break;
    await delay(250);
  }

  const processed = new Set();
  const deadline = Date.now() + 25000; // Aumentado a 25s para dar más tiempo
  let handledAny = false;

  const getNextPopup = async () => {
    const candidates = (await context.pages()).filter(p => p !== page && !processed.has(p));
    if (!candidates.length) return null;
    return candidates[candidates.length - 1];
  };

  // Procesar hasta 2 ventanas emergentes
  while (processed.size < 2 && Date.now() < deadline) {
    const popup = await getNextPopup();
    if (!popup) {
      await delay(400);
      continue;
    }

    processed.add(popup);
    handledAny = true;

    try {
      await popup.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 }).catch(() => {});
      await delay(500);
      await popup.waitForSelector('input', { timeout: 7000 }).catch(() => {});

      const filled = await fillEmailField(popup);
      if (filled) {
        console.log('Email reintroducido en la ventana emergente.');
      } else {
        console.log('No se encontró un campo de email en la ventana emergente.');
      }
    } catch (error) {
      console.log('No se pudo interactuar con la ventana de login:', error.message);
    }

    if (processed.size < 2) {
      console.log('Esperando a que la siguiente pestaña de login termine de abrir...');
      await delay(2000);
    }
  }

  if (!handledAny) {
    console.log('No se detectó nueva ventana de login.');
  }
}

/**
 * Intenta llenar el campo de email en una ventana de login
 * @param {Page} popup - Ventana emergente de login
 * @returns {boolean} true si se pudo llenar el campo
 */
async function fillEmailField(popup) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const filled = await popup.evaluate(username => {
      const selectors = [
        'input[name="loginfmt"]',
        'input[name="email"]',
        'input[name="username"]',
        'input[type="email"]',
        'input[id*="user" i]',
        'input[id*="mail" i]'
      ];

      const matchInput = root => {
        const direct = selectors
          .map(sel => root.querySelector(sel))
          .find(Boolean);
        if (direct && direct.offsetParent !== null) return direct;

        return Array.from(root.querySelectorAll('input')).find(input => {
          const type = (input.getAttribute('type') || '').toLowerCase();
          if (type === 'password') return false;
          const hint = [
            input.getAttribute('name'),
            input.getAttribute('aria-label'),
            input.getAttribute('placeholder'),
            input.closest('label')?.textContent,
            input.parentElement?.textContent
          ].filter(Boolean).join(' ').toLowerCase();
          return hint.includes('mail') || hint.includes('email') || hint.includes('usuario') || hint.includes('user');
        }) || null;
      };

      const fill = input => {
        if (!input) return false;
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.value = username;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      };

      if (fill(matchInput(document))) return true;

      const frames = Array.from(document.querySelectorAll('iframe, frame'));
      for (const frame of frames) {
        try {
          const doc = frame.contentDocument || frame.contentWindow?.document;
          if (doc && fill(matchInput(doc))) {
            return true;
          }
        } catch (_) {
          // Ignore cross-origin frames
        }
      }

      return false;
    }, process.env.SF_USER);

    if (filled) return true;
    await delay(1000);
  }
  return false;
}

module.exports = {
  handlePopupLogin
};
