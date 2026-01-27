# ===============================================================
#  SYNCSHARK - Script de Instalacion
#  Verifica dependencias e instala todo lo necesario
# ===============================================================

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  SYNCSHARK - Setup & Installation" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$hasErrors = $false

# ===============================================================
# 1. VERIFICAR NODE.JS
# ===============================================================
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  OK Node.js instalado: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js no encontrado"
    }
} catch {
    Write-Host "  X Node.js NO esta instalado" -ForegroundColor Red
    Write-Host "    Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    $hasErrors = $true
}

# ===============================================================
# 2. VERIFICAR NPM
# ===============================================================
Write-Host ""
Write-Host "[2/5] Verificando npm..." -ForegroundColor Yellow

try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  OK npm instalado: v$npmVersion" -ForegroundColor Green
    } else {
        throw "npm no encontrado"
    }
} catch {
    Write-Host "  X npm NO esta instalado" -ForegroundColor Red
    Write-Host "    npm viene con Node.js, reinstala Node.js" -ForegroundColor Yellow
    $hasErrors = $true
}

# ===============================================================
# 3. VERIFICAR PYTHON 3
# ===============================================================
Write-Host ""
Write-Host "[3/5] Verificando Python 3..." -ForegroundColor Yellow

try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion -match "Python 3") {
        Write-Host "  OK Python instalado: $pythonVersion" -ForegroundColor Green
        
        # Verificar pywinauto
        Write-Host "  -> Verificando pywinauto..." -ForegroundColor Gray
        $pywinautoCheck = python -c "import pywinauto; print('OK')" 2>$null
        if ($pywinautoCheck -eq "OK") {
            Write-Host "  OK pywinauto ya esta instalado" -ForegroundColor Green
        } else {
            Write-Host "  ! pywinauto no encontrado, instalando..." -ForegroundColor Yellow
            pip install pywinauto
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  OK pywinauto instalado correctamente" -ForegroundColor Green
            } else {
                Write-Host "  X Error al instalar pywinauto" -ForegroundColor Red
                $hasErrors = $true
            }
        }
    } else {
        throw "Python 3 no encontrado"
    }
} catch {
    Write-Host "  X Python 3 NO esta instalado" -ForegroundColor Red
    Write-Host "    Descarga Python 3 desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    $hasErrors = $true
}

# ===============================================================
# 4. INSTALAR DEPENDENCIAS DE NODE.JS
# ===============================================================
Write-Host ""
Write-Host "[4/5] Instalando dependencias de Node.js..." -ForegroundColor Yellow

if ($hasErrors) {
    Write-Host "  ! Saltando instalacion debido a errores previos" -ForegroundColor Yellow
} else {
    # Verificar si package.json existe
    if (Test-Path "src\package.json") {
        Write-Host "  -> Ejecutando npm install en src/..." -ForegroundColor Gray
        Write-Host "     (Esto puede tardar 3-5 minutos, por favor espera...)" -ForegroundColor Gray
        Write-Host "     Los warnings sobre 'deprecated' son normales y no afectan" -ForegroundColor Gray
        Write-Host ""
        Push-Location src
        npm install --loglevel=error
        Pop-Location
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK Dependencias instaladas correctamente" -ForegroundColor Green
            
            # Verificar dependencias criticas
            Write-Host ""
            Write-Host "  Verificando dependencias criticas:" -ForegroundColor Gray
            
            $dependencies = @("puppeteer", "dotenv", "electron")
            foreach ($dep in $dependencies) {
                if (Test-Path "src\node_modules\$dep") {
                    Write-Host "    OK $dep" -ForegroundColor Green
                } else {
                    Write-Host "    X $dep (no encontrado)" -ForegroundColor Red
                    $hasErrors = $true
                }
            }
        } else {
            Write-Host "  X Error al instalar dependencias" -ForegroundColor Red
            $hasErrors = $true
        }
    } else {
        Write-Host "  X package.json no encontrado en el directorio actual" -ForegroundColor Red
        $hasErrors = $true
    }
}

# ===============================================================
# 5. CREAR ACCESO DIRECTO EN ESCRITORIO
# ===============================================================
Write-Host ""
Write-Host "[5/5] Creando acceso directo en el escritorio..." -ForegroundColor Yellow

if ($hasErrors) {
    Write-Host "  ! Saltando creacion de acceso directo debido a errores" -ForegroundColor Yellow
} else {
    try {
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = Join-Path $desktopPath "SyncShark.lnk"
        $vbsPath = Join-Path $PSScriptRoot "launch.vbs"
        
        # Verificar que launch.vbs existe
        if (-not (Test-Path $vbsPath)) {
            Write-Host "  X launch.vbs no encontrado en: $vbsPath" -ForegroundColor Red
            $hasErrors = $true
        } else {
            # Crear acceso directo usando WScript.Shell
            $WshShell = New-Object -ComObject WScript.Shell
            $Shortcut = $WshShell.CreateShortcut($shortcutPath)
            $Shortcut.TargetPath = "wscript.exe"
            $Shortcut.Arguments = "`"$vbsPath`""
            $Shortcut.WorkingDirectory = $PSScriptRoot
            $Shortcut.WindowStyle = 1
            $Shortcut.Description = "SyncShark - Telefonica Tech"
            
            # Establecer icono
            $iconPath = Join-Path $PSScriptRoot "assets\icon.ico"
            if (Test-Path $iconPath) {
                $Shortcut.IconLocation = $iconPath
            } else {
                # Usar icono profesional del sistema Windows si no hay icono personalizado
                $Shortcut.IconLocation = "%SystemRoot%\System32\shell32.dll,266"
            }
            
            $Shortcut.Save()
            
            Write-Host "  OK Acceso directo creado en: $shortcutPath" -ForegroundColor Green
        }
    } catch {
        Write-Host "  X Error al crear acceso directo: $_" -ForegroundColor Red
        $hasErrors = $true
    }
}

# ===============================================================
# RESUMEN FINAL
# ===============================================================
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan

if ($hasErrors) {
    Write-Host "  ! INSTALACION COMPLETADA CON ERRORES" -ForegroundColor Yellow
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Por favor, revisa los errores anteriores y:" -ForegroundColor Yellow
    Write-Host "  1. Instala las dependencias faltantes" -ForegroundColor White
    Write-Host "  2. Vuelve a ejecutar este script" -ForegroundColor White
    Write-Host ""
    exit 1
} else {
    Write-Host "  OK INSTALACION COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Todo listo para usar SyncShark:" -ForegroundColor Green
    Write-Host "  - Acceso directo creado en el escritorio" -ForegroundColor White
    Write-Host "  - Dependencias instaladas correctamente" -ForegroundColor White
    Write-Host "  - Entorno configurado" -ForegroundColor White
    Write-Host ""
    Write-Host "Siguiente paso:" -ForegroundColor Yellow
    Write-Host "  -> Configura el archivo .env con tus credenciales" -ForegroundColor White
    Write-Host "  -> Haz doble clic en SyncShark del escritorio" -ForegroundColor White
    Write-Host ""
    exit 0
}
