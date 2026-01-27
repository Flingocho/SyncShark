/**
 * main.js
 * Proceso principal de Electron - Gestiona la ventana y la ejecución de scripts
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;

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