# 📦 Instalación - SyncShark

## 🎯 Instalación Rápida

### Para Usuarios Finales

1. **Descarga el proyecto**:
   - Ve a: https://github.com/Flingocho/SyncShark
   - Haz clic en **"Code"** → **"Download ZIP"**
   - Extrae en una carpeta (ej: `C:\SyncShark`)

2. **Ejecuta el instalador**:
   ```
   Doble clic en: install.bat
   ```
   El instalador:
   - ✅ Verifica Git, Node.js y Python
   - ✅ Instala todas las dependencias
   - ✅ Configura el entorno
   - ✅ Crea acceso directo en el escritorio

3. **Configura credenciales**:
   - Edita el archivo `src\.env` con tus datos de Salesforce/SharePoint
   - Guarda el archivo

4. **¡Listo!**:
   - Doble clic en el acceso directo "SyncShark" en tu escritorio
   - O doble clic en `launch.vbs` en la carpeta del proyecto

---

## 📋 Requisitos Previos

El instalador verificará automáticamente si tienes:

### Node.js (Requerido)
- Descargar: https://nodejs.org/
- Versión: LTS (18.x o superior)

### Python (Requerido)
- Descargar: https://www.python.org/downloads/
- Versión: 3.8 o superior
- ⚠️ **IMPORTANTE**: Marcar "Add Python to PATH" durante instalación

### Git (Opcional pero recomendado)
- Descargar: https://git-scm.com/download/win
- Necesario para recibir actualizaciones automáticas

---

## 🚀 Uso

### Iniciar SyncShark

**Opción 1**: Acceso directo en el escritorio
**Opción 2**: Doble clic en `launch.vbs` en la carpeta del proyecto

### Recibir Actualizaciones

Cuando se publique una nueva versión:
- SyncShark te notificará automáticamente al iniciar
- Haz clic en "Actualizar Ahora"
- La aplicación se actualizará sola

---

## 🐛 Solución de Problemas

### "La ejecución de scripts está deshabilitada"
No debería ocurrir (el instalador hace bypass automático), pero si pasa:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js o Python no detectado
1. Instala desde los enlaces de arriba
2. **Reinicia la terminal/PC**
3. Ejecuta `install.bat` de nuevo

### No se creó el acceso directo
No hay problema, usa `launch.vbs` directamente desde la carpeta del proyecto

---

## 📁 Archivos Importantes

```
SyncShark/
├── install.bat          ← Ejecuta esto primero
├── launch.vbs           ← Inicia la aplicación
├── publish-release.bat  ← Solo para admin
└── src/
    └── .env            ← Tus credenciales
```

---

## 👨‍💻 Para Desarrolladores/Administradores

### Publicar Nueva Versión

```bash
# 1. Commitear cambios
git add .
git commit -m "feat: Nueva funcionalidad"
git push

# 2. Publicar release
.\publish-release.bat
```

Ver [RELEASES.md](RELEASES.md) para más detalles.

---

¡Listo! 🎉

