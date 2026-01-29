/**
 * main.js
 * Proceso principal de Electron - Gestiona la ventana y la ejecución de scripts
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const AutoUpdater = require('../lib/auto-updater');
const packageJson = require('../package.json');

let mainWindow;
let autoUpdater;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 500,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    backgroundColor: '#667eea',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Descomentar para debug
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // Inicializar auto-actualizador
  initializeAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Helper para ejecutar scripts Node y enviar output a la ventana
 * @param {string} scriptName - Nombre del script a ejecutar
 * @param {string[]} args - Argumentos para el script
 * @param {string} errorMessage - Mensaje de error personalizado
 */
function runNodeScript(scriptName, args = [], errorMessage = 'Script falló') {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', scriptName);
    
    const child = spawn('node', [scriptPath, ...args], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      windowsHide: false
    });

    child.stdout.on('data', (data) => {
      mainWindow.webContents.send('pipeline-output', { 
        type: 'stdout', 
        data: data.toString() 
      });
    });

    child.stderr.on('data', (data) => {
      mainWindow.webContents.send('pipeline-output', { 
        type: 'stderr', 
        data: data.toString() 
      });
    });

    child.on('close', (code) => {
      mainWindow.webContents.send('pipeline-complete', { 
        code,
        success: code === 0
      });
      
      if (code === 0) {
        resolve({ success: true, code });
      } else {
        reject(new Error(`${errorMessage} con código ${code}`));
      }
    });

    child.on('error', (error) => {
      mainWindow.webContents.send('pipeline-error', { 
        message: error.message 
      });
      reject(error);
    });
  });
}

// Manejar ejecución del pipeline
ipcMain.handle('run-pipeline', async (event, options) => {
  const { manualLogin, workspace, supervised } = options;
  const args = [];
  
  if (manualLogin) {
    args.push('--manual-login');
  }
  
  if (supervised) {
    args.push('--supervised');
  }
  
  if (workspace && workspace !== 'nada') {
    args.push('--workspace', workspace);
  }
  
  return runNodeScript('run_full_pipeline.js', args, 'Pipeline falló');
});

// Manejar actualización de credenciales de workspace
ipcMain.handle('update-workspace-credentials', async () => {
  return runNodeScript(
    'refresh_workspace.js', 
    ['--workspace', 'setup', '--clear-credentials'],
    'Actualización de credenciales falló'
  );
});

// Manejar ejecución solo de refresh workspace
ipcMain.handle('run-refresh-workspace', async (event, options) => {
  const { workspace } = options;
  return runNodeScript(
    'refresh_workspace.js', 
    ['--workspace', workspace],
    'Refresh workspace falló'
  );
});

// Manejar borrado de todas las credenciales
ipcMain.handle('clear-all-credentials', async () => {
  return runNodeScript(
    'clear-credentials.js',
    [],
    'Borrado de credenciales falló'
  );
});

/**
 * Sistema de auto-actualización
 */
function initializeAutoUpdater() {
  // Configurar auto-updater con el repositorio de GitHub
  autoUpdater = new AutoUpdater({
    currentVersion: packageJson.version,
    repo: packageJson.repository || null, // Se configurará en package.json
    checkInterval: 1000 * 60 * 60 * 6, // Verificar cada 6 horas
    autoDownload: false
  });

  // Verificar actualizaciones 5 segundos después del inicio
  setTimeout(() => {
    checkForUpdatesAndNotify();
  }, 5000);

  // Verificar periódicamente cada 6 horas
  setInterval(() => {
    checkForUpdatesAndNotify();
  }, 1000 * 60 * 60 * 6);
}

async function checkForUpdatesAndNotify() {
  try {
    const updateInfo = await autoUpdater.checkForUpdates();
    
    if (updateInfo && updateInfo.available) {
      // Enviar notificación a la ventana
      mainWindow.webContents.send('update-available', updateInfo);
      
      // Mostrar diálogo nativo opcional
      const choice = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Actualización Disponible',
        message: `Nueva versión ${updateInfo.latestVersion} disponible`,
        detail: `Versión actual: ${updateInfo.currentVersion}\n\n¿Deseas actualizar ahora?`,
        buttons: ['Actualizar Ahora', 'Ver Cambios', 'Más Tarde'],
        defaultId: 0,
        cancelId: 2
      });

      if (choice.response === 0) {
        // Actualizar ahora
        await autoUpdater.downloadAndInstall(updateInfo);
        app.quit();
      } else if (choice.response === 1) {
        // Ver cambios en GitHub
        require('electron').shell.openExternal(updateInfo.releaseUrl);
      }
    }
  } catch (error) {
    console.error('Error verificando actualizaciones:', error);
  }
}

// Manejar verificación manual de actualizaciones
ipcMain.handle('check-for-updates', async () => {
  try {
    const updateInfo = await autoUpdater.checkForUpdates();
    return updateInfo;
  } catch (error) {
    return { error: error.message };
  }
});

// Manejar instalación de actualización
ipcMain.handle('install-update', async (event, updateInfo) => {
  try {
    await autoUpdater.downloadAndInstall(updateInfo);
    app.quit();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});