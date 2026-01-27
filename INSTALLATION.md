# Instalación de SyncShark

## Instalación Rápida (Recomendado)

**Doble clic en `setup.bat`** y ya está! 

El script verificará e instalará todo automáticamente.

---

## Requisitos Previos

Antes de ejecutar el script de instalación, asegúrate de tener instalado:

### 1. **Node.js** (versión 18 o superior)
- Descarga desde: https://nodejs.org/
- Incluye npm automáticamente

### 2. **Python 3** (versión 3.8 o superior)
- Descarga desde: https://www.python.org/downloads/
- **IMPORTANTE**: Durante la instalación, marca la opción "Add Python to PATH"

---

## Instalación Automática

### Opción 1: Usar setup.bat (MÁS FÁCIL)

1. **Doble clic** en `setup.bat`
2. Espera a que termine
3. ¡Listo!

> **Nota:** El script `setup.bat` ejecuta automáticamente `src\setup.ps1` con los permisos adecuados.

---

## Solución de Problemas

### Error: "La ejecución de scripts está deshabilitada"

**Solución:**
Usa `setup.bat` (recomendado) - ejecuta automáticamente con los permisos correctos

---

## ¿Qué hace el script de instalación?

El script realiza las siguientes verificaciones e instalaciones:

1. Verifica que Node.js esté instalado
2. Verifica que npm esté disponible
3. Verifica que Python 3 esté instalado
4. Instala `pywinauto` (si no está instalado)
5. Ejecuta `npm install` para instalar todas las dependencias:
   - puppeteer
   - dotenv
   - electron
   - n8n
6. Crea un acceso directo en el escritorio llamado "SyncShark"

---

## Configuración Post-Instalación

### 1. Configurar variables de entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# Credenciales de Salesforce
SF_USER=tu.email@telefonica.com
SALESFORCE_URL=https://tu-salesforce-url.com

# URL de SharePoint
SHAREPOINT_URL=https://tu-sharepoint-url.com

# URLs de Power BI Workspaces
WORKSPACE_URL=https://tu-workspace-url.com
KPIS_URL=https://tu-kpis-dataset-url.com
DEFENSA_URL=https://tu-defensa-dataset-url.com
SECTORES_URL=https://tu-sectores-dataset-url.com

# Credenciales de Workspace (opcional)
WORKSPACE_USER=tu.email@telefonica.com
WORKSPACE_PASSWORD=tu-password-si-necesario

# Directorio de descargas (opcional)
DOWNLOADS_DIR=C:\Users\TuUsuario\Downloads
```

### 2. Ejecutar la aplicación

- **Desde el escritorio**: Doble clic en "SyncShark"
- **Desde terminal**: `npm start`

---

## Instalación Manual (Si falla el script automático)

### Instalar dependencias de Node.js:
```powershell
npm install
```

### Instalar pywinauto para Python:
```powershell
pip install pywinauto
```

### Crear acceso directo manualmente:
1. Click derecho en el escritorio → Nuevo → Acceso directo
2. Ubicación: `wscript.exe "C:\ruta\al\proyecto\launch.vbs"`
3. Nombre: `SyncShark`

---

## Dependencias del Proyecto

### Node.js (package.json)
- `puppeteer` ^24.29.0 - Automatización del navegador
- `dotenv` ^17.2.3 - Variables de entorno
- `n8n` ^1.118.1 - Plataforma de automatización
- `electron` ^39.2.7 - Framework GUI
- `jest` ^29.7.0 - Testing (dev)

### Python (requirements.txt equivalente)
- `pywinauto` - Automatización de ventanas de Windows

---

## Solución de Problemas

### Error: "La ejecución de scripts está deshabilitada"

**Solución:**
Usa `setup.bat` (recomendado) - ejecuta automáticamente con los permisos correctos

### Error: "Node.js no está instalado"
- Instala Node.js desde https://nodejs.org/
- Reinicia PowerShell/terminal después de instalar

### Error: "Python 3 no está instalado"
- Instala Python 3 y asegúrate de marcar "Add to PATH"
- Reinicia PowerShell/terminal después de instalar

### Error: "npm install falla"
- Ejecuta como Administrador
- Limpia la caché: `npm cache clean --force`
- Borra `node_modules` y vuelve a instalar

---

## Soporte

Desarrollado por: **Jaime Vidal**

Para más información, consulta la documentación del proyecto.
