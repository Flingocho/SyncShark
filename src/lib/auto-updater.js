/**
 * auto-updater.js
 * Sistema profesional de auto-actualización basado en GitHub Releases
 */

const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutoUpdater {
  constructor(options = {}) {
    this.currentVersion = options.currentVersion || require('../package.json').version;
    this.repo = options.repo; // Formato: "owner/repo"
    this.checkInterval = options.checkInterval || 1000 * 60 * 60; // 1 hora por defecto
    this.autoDownload = options.autoDownload || false;
    this.latestRelease = null;
  }

  /**
   * Verifica si hay una nueva versión disponible
   */
  async checkForUpdates() {
    if (!this.repo) {
      console.warn('⚠️  Repositorio no configurado para auto-actualización');
      return null;
    }

    try {
      console.log(`🔍 Verificando actualizaciones para ${this.repo}...`);
      const release = await this.fetchLatestRelease();
      
      if (!release) {
        console.log('ℹ️  No se encontraron releases');
        return null;
      }

      this.latestRelease = release;
      const latestVersion = this.cleanVersion(release.tag_name);
      const currentVersion = this.cleanVersion(this.currentVersion);

      console.log(`📦 Versión actual: ${currentVersion}`);
      console.log(`🆕 Última versión: ${latestVersion}`);

      if (this.isNewerVersion(latestVersion, currentVersion)) {
        console.log('✅ Nueva versión disponible');
        return {
          available: true,
          currentVersion: currentVersion,
          latestVersion: latestVersion,
          releaseNotes: release.body || 'Sin notas de versión',
          downloadUrl: release.zipball_url,
          releaseUrl: release.html_url,
          publishedAt: release.published_at
        };
      } else {
        console.log('✅ Ya estás en la última versión');
        return {
          available: false,
          currentVersion: currentVersion,
          latestVersion: latestVersion
        };
      }
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error.message);
      return null;
    }
  }

  /**
   * Obtiene el último release de GitHub
   */
  fetchLatestRelease() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repo}/releases/latest`,
        method: 'GET',
        headers: {
          'User-Agent': 'SyncShark-AutoUpdater',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const release = JSON.parse(data);
              resolve(release);
            } catch (error) {
              reject(new Error('Error parseando respuesta de GitHub'));
            }
          } else if (res.statusCode === 404) {
            resolve(null); // No hay releases
          } else {
            reject(new Error(`GitHub API respondió con código ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout verificando actualizaciones'));
      });

      req.end();
    });
  }

  /**
   * Limpia la versión removiendo prefijos como "v"
   */
  cleanVersion(version) {
    return version.replace(/^v/, '');
  }

  /**
   * Compara versiones usando versionado semántico
   */
  isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);

    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }

  /**
   * Descarga e instala la actualización
   */
  async downloadAndInstall(updateInfo) {
    try {
      console.log('⬇️  Descargando actualización...');
      
      // Crear script de actualización
      const updateScript = this.createUpdateScript(updateInfo);
      const scriptPath = path.join(__dirname, '..', 'update-temp.bat');
      
      fs.writeFileSync(scriptPath, updateScript, 'utf8');
      console.log('📝 Script de actualización creado');

      // Ejecutar el script y cerrar la aplicación
      console.log('🔄 Ejecutando actualización...');
      
      if (process.platform === 'win32') {
        spawn('cmd.exe', ['/c', scriptPath], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      } else {
        spawn('sh', [scriptPath], {
          detached: true,
          stdio: 'ignore'
        }).unref();
      }

      return true;
    } catch (error) {
      console.error('❌ Error descargando actualización:', error.message);
      return false;
    }
  }

  /**
   * Crea el script de actualización para Windows
   */
  createUpdateScript(updateInfo) {
    const projectRoot = path.resolve(__dirname, '..');
    
    return `@echo off
echo ========================================
echo SyncShark - Actualizacion Automatica
echo ========================================
echo.
echo Cerrando aplicacion...
timeout /t 2 /nobreak > nul

echo.
echo Descargando version ${updateInfo.latestVersion}...
cd /d "${projectRoot}"

REM Hacer backup
if exist backup rmdir /s /q backup
mkdir backup
xcopy /E /I /Y src backup\\src > nul 2>&1

echo.
echo Descargando desde GitHub...
powershell -Command "& {Invoke-WebRequest -Uri '${updateInfo.downloadUrl}' -OutFile 'update.zip'}"

if exist update.zip (
    echo.
    echo Extrayendo archivos...
    powershell -Command "& {Expand-Archive -Path 'update.zip' -DestinationPath 'update-temp' -Force}"
    
    echo.
    echo Instalando actualizacion...
    xcopy /E /I /Y update-temp\\*\\src src
    
    REM Instalar dependencias si es necesario
    cd src
    call npm install --silent
    
    REM Limpiar
    cd ..
    del update.zip
    rmdir /s /q update-temp
    
    echo.
    echo ========================================
    echo Actualizacion completada exitosamente!
    echo Version: ${updateInfo.latestVersion}
    echo ========================================
    echo.
    echo Presiona cualquier tecla para reiniciar...
    pause > nul
    
    cd src
    start "" npm start
) else (
    echo.
    echo ERROR: No se pudo descargar la actualizacion
    echo Restaurando backup...
    xcopy /E /I /Y backup\\src src
    echo.
    echo Presiona cualquier tecla para continuar...
    pause > nul
)

REM Auto-eliminar este script
del "%~f0"
`;
  }

  /**
   * Inicia verificación periódica de actualizaciones
   */
  startPeriodicCheck(callback) {
    // Verificar inmediatamente
    this.checkForUpdates().then(callback);

    // Verificar periódicamente
    setInterval(() => {
      this.checkForUpdates().then(callback);
    }, this.checkInterval);
  }
}

module.exports = AutoUpdater;
