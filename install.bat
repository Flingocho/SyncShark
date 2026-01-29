@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM SyncShark - Instalador Automatico
REM ============================================================================

title SyncShark - Instalador

color 0B
echo.
echo ========================================
echo    SYNCSHARK - INSTALACION
echo ========================================
echo.
echo Instalando SyncShark...
echo.

REM Verificar si Git esta instalado
echo [1/7] Verificando Git...

REM Intentar obtener version de git
git --version > "%TEMP%\git_check.tmp" 2>nul

REM Verificar si el archivo tiene contenido
if exist "%TEMP%\git_check.tmp" (
    for %%A in ("%TEMP%\git_check.tmp") do set SIZE=%%~zA
    if !SIZE! gtr 0 (
        REM Git esta instalado
        type "%TEMP%\git_check.tmp"
        del "%TEMP%\git_check.tmp" >nul 2>nul
        goto :git_ok
    )
    del "%TEMP%\git_check.tmp" >nul 2>nul
)

REM Git NO esta instalado
echo Git NO detectado
echo.
echo ADVERTENCIA: Git no esta instalado
echo Git es necesario para recibir actualizaciones automaticas
echo.
echo Deseas continuar sin Git? (Las actualizaciones automaticas no funcionaran)
echo S = Continuar sin Git
echo N = Cancelar instalacion
echo.
set /p CONTINUE_NO_GIT=Opcion (S/N): 
if /i not "!CONTINUE_NO_GIT!"=="S" (
    echo.
    echo Instalacion cancelada
    echo Descarga Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo Continuando sin Git...

:git_ok
echo.

REM Verificar si Node.js esta instalado
echo [2/7] Verificando Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo ERROR: Node.js no esta instalado
    echo.
    echo Por favor, instala Node.js desde: https://nodejs.org/
    echo Descarga la version LTS recomendada
    echo.
    echo Presiona cualquier tecla para abrir la pagina de descarga...
    pause > nul
    start https://nodejs.org/
    exit /b 1
)

node --version
echo Node.js detectado correctamente
echo.

REM Verificar si Python esta instalado (necesario para pywinauto)
echo [3/7] Verificando Python...
where python >nul 2>nul
if errorlevel 1 (
    echo.
    echo ERROR: Python no esta instalado
    echo.
    echo Por favor, instala Python desde: https://www.python.org/downloads/
    echo IMPORTANTE: Durante la instalacion marca "Add Python to PATH"
    echo.
    echo Presiona cualquier tecla para abrir la pagina de descarga...
    pause > nul
    start https://www.python.org/downloads/
    exit /b 1
)

python --version
echo Python detectado correctamente
echo.

REM Instalar dependencias de Node.js con bypass de politicas
echo [4/7] Instalando dependencias de Node.js...
cd src

REM Bypass de politica de ejecucion para npm
powershell -ExecutionPolicy Bypass -Command "npm install"
if errorlevel 1 (
    echo.
    echo ERROR: No se pudieron instalar las dependencias de Node.js
    echo Intentando metodo alternativo...
    
    REM Metodo alternativo: usar node directamente
    node "%APPDATA%\npm\node_modules\npm\bin\npm-cli.js" install
    
    if errorlevel 1 (
        echo ERROR: Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
)
echo Dependencias de Node.js instaladas
cd ..
echo.

REM Instalar pywinauto para automatizacion de Windows
echo [5/7] Instalando pywinauto (automatizacion de Windows)...
python -m pip install --upgrade pip --quiet
python -m pip install pywinauto --quiet
if errorlevel 1 (
    echo Advertencia: No se pudo instalar pywinauto
    echo La funcionalidad de subida automatica puede no funcionar
) else (
    echo pywinauto instalado correctamente
)
echo.

REM Crear archivo .env si no existe
echo [6/7] Configurando variables de entorno...
if not exist src\.env (
    echo Creando archivo .env...
    (
        echo # Configuracion de SyncShark
        echo # Edita este archivo con tus credenciales
        echo.
        echo # Salesforce
        echo SALESFORCE_USERNAME=tu_usuario@empresa.com
        echo SALESFORCE_PASSWORD=tu_password
        echo.
        echo # SharePoint
        echo SHAREPOINT_URL=https://tuempresa.sharepoint.com
        echo SHAREPOINT_SITE=tu_sitio
        echo.
        echo # Otros
        echo DEBUG=false
    ) > src\.env
    echo Archivo .env creado. IMPORTANTE: Edita src\.env con tus credenciales
) else (
    echo Archivo .env ya existe
)
echo.

REM Crear acceso directo en el escritorio
echo [7/7] Creando acceso directo...
set "SCRIPT_DIR=%~dp0"

REM Eliminar barra final si existe
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Intentar varias ubicaciones para el acceso directo
set "SHORTCUT_CREATED=0"

REM Opcion 1: Desktop normal
set "DESKTOP=%USERPROFILE%\Desktop"
if exist "%DESKTOP%\" (
    call :CreateShortcut "%DESKTOP%\SyncShark.lnk"
    if exist "%DESKTOP%\SyncShark.lnk" set "SHORTCUT_CREATED=1"
)

REM Opcion 2: OneDrive Desktop
if !SHORTCUT_CREATED! equ 0 (
    set "DESKTOP=%USERPROFILE%\OneDrive\Desktop"
    if exist "!DESKTOP!\" (
        call :CreateShortcut "!DESKTOP!\SyncShark.lnk"
        if exist "!DESKTOP!\SyncShark.lnk" set "SHORTCUT_CREATED=1"
    )
)

REM Opcion 3: OneDrive Desktop con nombre de empresa (ej: OneDrive - Telefonica)
if !SHORTCUT_CREATED! equ 0 (
    for /d %%D in ("%USERPROFILE%\OneDrive*") do (
        if exist "%%D\Escritorio\" (
            call :CreateShortcut "%%D\Escritorio\SyncShark.lnk"
            if exist "%%D\Escritorio\SyncShark.lnk" set "SHORTCUT_CREATED=1"
        )
        if exist "%%D\Desktop\" (
            call :CreateShortcut "%%D\Desktop\SyncShark.lnk"
            if exist "%%D\Desktop\SyncShark.lnk" set "SHORTCUT_CREATED=1"
        )
    )
)

REM Opcion 4: Crear en la carpeta del proyecto
if !SHORTCUT_CREATED! equ 0 (
    call :CreateShortcut "%SCRIPT_DIR%\SyncShark.lnk"
    if exist "%SCRIPT_DIR%\SyncShark.lnk" (
        echo Acceso directo creado en la carpeta del proyecto: SyncShark.lnk
        echo ^(Muevelo manualmente al escritorio si lo deseas^)
        set "SHORTCUT_CREATED=1"
    )
)

if !SHORTCUT_CREATED! equ 0 (
    echo NOTA: No se pudo crear el acceso directo automaticamente
    echo Puedes crearlo manualmente: Click derecho en start.bat ^> Enviar a ^> Escritorio
)
echo.
goto :continue_install

:CreateShortcut
set "SHORTCUT_PATH=%~1"
(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo Set oLink = oWS.CreateShortcut^("%SHORTCUT_PATH%"^)
echo oLink.TargetPath = "%SCRIPT_DIR%\launch.vbs"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
echo oLink.IconLocation = "%SCRIPT_DIR%\src\assets\icon.ico"
echo oLink.Description = "SyncShark - Automated Pipeline"
echo oLink.Save
) > "%TEMP%\CreateShortcut.vbs"
cscript //nologo "%TEMP%\CreateShortcut.vbs" >nul 2>&1
del "%TEMP%\CreateShortcut.vbs" >nul 2>&1
goto :eof

:continue_install

REM Mostrar resumen
echo ========================================
echo   INSTALACION COMPLETADA
echo ========================================
echo.
echo SyncShark ha sido instalado exitosamente!
echo.
echo PROXIMOS PASOS:
echo.
echo 1. Edita el archivo: src\.env
echo    Agrega tus credenciales de Salesforce y SharePoint
echo.
echo 2. Ejecuta SyncShark usando:
echo    - Doble clic en el acceso directo del escritorio
echo    - O ejecuta: start.bat
echo.
echo ========================================
echo.
echo Presiona cualquier tecla para abrir la carpeta de configuracion...
pause > nul

REM Abrir la carpeta src donde esta el .env
if exist "%SCRIPT_DIR%\src" (
    explorer "%SCRIPT_DIR%\src"
) else (
    explorer "%SCRIPT_DIR%"
)

echo.
echo Deseas iniciar SyncShark ahora? (S/N)
set /p LAUNCH=
if /i "%LAUNCH%"=="S" (
    echo.
    echo Iniciando SyncShark...
    call start.bat
) else (
    echo.
    echo Puedes iniciar SyncShark mas tarde usando start.bat
)

echo.
pause
