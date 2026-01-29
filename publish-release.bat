@echo off
REM ============================================================================
REM Script para publicar un nuevo Release en GitHub
REM ============================================================================

echo.
echo ========================================
echo   SyncShark - Publicar Release
echo ========================================
echo.

REM Verificar que estamos en la rama main
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a

if not "%CURRENT_BRANCH%"=="main" (
    echo ERROR: Debes estar en la rama main para publicar un release
    echo Rama actual: %CURRENT_BRANCH%
    pause
    exit /b 1
)

REM Verificar que no hay cambios sin commit
for /f %%a in ('git status --porcelain') do set HAS_CHANGES=1
if defined HAS_CHANGES (
    echo ERROR: Hay cambios sin commitear
    echo Por favor, commitea todos los cambios antes de publicar
    git status
    pause
    exit /b 1
)

REM Pedir versión
echo.
echo Ingresa el numero de version (ej: 2.2.0):
set /p VERSION=

if "%VERSION%"=="" (
    echo ERROR: Debe especificar una version
    pause
    exit /b 1
)

REM Pedir descripción del release
echo.
echo Ingresa una breve descripcion de esta version:
set /p DESCRIPTION=

if "%DESCRIPTION%"=="" (
    set DESCRIPTION=Release version %VERSION%
)

echo.
echo ----------------------------------------
echo Resumen del Release:
echo ----------------------------------------
echo Version: v%VERSION%
echo Descripcion: %DESCRIPTION%
echo Rama: %CURRENT_BRANCH%
echo ----------------------------------------
echo.
echo Presiona ENTER para continuar o CTRL+C para cancelar...
pause > nul

echo.
echo [1/5] Actualizando version en package.json...
cd src
call npm version %VERSION% --no-git-tag-version
if errorlevel 1 (
    echo ERROR: No se pudo actualizar package.json
    cd ..
    pause
    exit /b 1
)
cd ..

echo [2/5] Commiteando cambios de version...
git add src/package.json
git commit -m "Release v%VERSION%: %DESCRIPTION%"
if errorlevel 1 (
    echo ERROR: No se pudo hacer commit
    pause
    exit /b 1
)

echo [3/5] Creando tag v%VERSION%...
git tag -a v%VERSION% -m "%DESCRIPTION%"
if errorlevel 1 (
    echo ERROR: No se pudo crear el tag
    pause
    exit /b 1
)

echo [4/5] Haciendo push del commit...
git push origin main
if errorlevel 1 (
    echo ERROR: No se pudo hacer push del commit
    pause
    exit /b 1
)

echo [5/5] Haciendo push del tag...
git push origin v%VERSION%
if errorlevel 1 (
    echo ERROR: No se pudo hacer push del tag
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Release Publicado Exitosamente!
echo ========================================
echo.
echo Tag: v%VERSION%
echo.
echo Ahora debes:
echo 1. Ir a GitHub.com/tu-usuario/tu-repo/releases
echo 2. Encontrar el tag v%VERSION%
echo 3. Hacer clic en "Create release from tag"
echo 4. Agregar notas detalladas del release
echo 5. Publicar el release
echo.
echo Los usuarios seran notificados automaticamente
echo de la nueva version al iniciar la aplicacion.
echo.
echo Presiona cualquier tecla para abrir GitHub...
pause > nul
start https://github.com/OWNER/REPO/releases/new?tag=v%VERSION%

echo.
echo Listo!
pause
