# 🚀 Sistema de Actualizaciones - SyncShark

## Descripción General

SyncShark incluye un sistema profesional de auto-actualización basado en **GitHub Releases**. Los usuarios recibirán notificaciones automáticas cuando haya nuevas versiones disponibles y podrán actualizar con un solo clic.

---

## 📋 Para Usuarios

### Cómo Actualizar

1. **Notificación Automática**: Al iniciar SyncShark, si hay una actualización disponible, verás una notificación en la esquina superior derecha.

2. **Opciones**:
   - **Actualizar Ahora**: Descarga e instala la actualización automáticamente
   - **Ver Cambios**: Abre GitHub para ver las notas del release
   - **Más Tarde**: Cierra la notificación (se volverá a verificar en 6 horas)

3. **Proceso de Actualización**:
   - La aplicación descarga la nueva versión
   - Crea un backup automático de la versión actual
   - Instala la actualización
   - Reinicia automáticamente

4. **En Caso de Error**: Si algo falla, el sistema restaura automáticamente el backup.

### Verificación Manual

Puedes verificar manualmente si hay actualizaciones en cualquier momento (próximamente se agregará un botón en la UI).

---

## 🔧 Para Desarrolladores/Administradores

### Configuración Inicial

1. **Configurar el Repositorio en package.json**:
   ```json
   {
     "repository": "tu-usuario/tu-repo"
   }
   ```

2. **Subir el Proyecto a GitHub**:
   ```bash
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

### Publicar un Nuevo Release

#### Opción 1: Script Automático (Recomendado)

1. Asegúrate de estar en la rama `main`
2. Commitea todos los cambios pendientes
3. Ejecuta el script:
   ```bash
   publish-release.bat
   ```
4. Sigue las instrucciones:
   - Ingresa el número de versión (ej: `2.2.0`)
   - Ingresa una descripción breve
   - El script:
     - ✅ Actualiza package.json
     - ✅ Crea el commit
     - ✅ Crea el tag
     - ✅ Hace push a GitHub
     - ✅ Abre GitHub para completar el release

5. En GitHub:
   - Se abrirá automáticamente la página de nuevo release
   - Agrega notas detalladas del changelog
   - Haz clic en "Publish release"

#### Opción 2: Manual

1. **Actualizar Versión**:
   ```bash
   cd src
   npm version 2.2.0 --no-git-tag-version
   cd ..
   ```

2. **Commit y Tag**:
   ```bash
   git add src/package.json
   git commit -m "Release v2.2.0: Descripción de cambios"
   git tag -a v2.2.0 -m "Descripción de cambios"
   ```

3. **Push**:
   ```bash
   git push origin main
   git push origin v2.2.0
   ```

4. **Crear Release en GitHub**:
   - Ve a `https://github.com/tu-usuario/tu-repo/releases`
   - Haz clic en "Create a new release"
   - Selecciona el tag `v2.2.0`
   - Añade título y descripción
   - Haz clic en "Publish release"

### Formato de Versiones (Semantic Versioning)

- **MAJOR.MINOR.PATCH** (ej: `2.1.0`)
- **MAJOR** (2): Cambios incompatibles con versiones anteriores
- **MINOR** (1): Nueva funcionalidad compatible
- **PATCH** (0): Correcciones de bugs

Ejemplos:
- `2.1.0` → `2.1.1`: Corrección de bug
- `2.1.0` → `2.2.0`: Nueva funcionalidad
- `2.1.0` → `3.0.0`: Cambios importantes (breaking changes)

### Escribir Buenas Release Notes

Formato recomendado:

```markdown
## 🎉 Novedades

- Nueva funcionalidad X que permite Y
- Mejora en el rendimiento de Z

## 🐛 Correcciones

- Corregido error al cargar archivos grandes
- Solucionado problema de conexión con SharePoint

## 🔧 Mejoras Técnicas

- Actualizado Puppeteer a v24.29
- Optimización del proceso de descarga

## ⚠️ Cambios Importantes

- Ahora se requiere Node.js 18+
- Cambio en el formato de configuración (.env)
```

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────┐
│  1. Desarrollador Publica Release en GitHub │
│     (usando publish-release.bat)             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  2. Usuario Inicia SyncShark                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  3. Auto-Updater Verifica GitHub API         │
│     Compara: versión local vs última release │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  4. Si hay Actualización: Muestra Notif.    │
│     - Versión nueva                          │
│     - Changelog                              │
│     - Botones de acción                      │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  5. Usuario Hace Clic en "Actualizar Ahora" │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  6. Descarga Automática desde GitHub        │
│     - Crea backup                            │
│     - Descarga ZIP                           │
│     - Extrae archivos                        │
│     - Instala dependencias                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  7. Aplicación se Reinicia Automáticamente  │
│     Ya está actualizada ✅                   │
└─────────────────────────────────────────────┘
```

---

## 🛡️ Seguridad y Rollback

- **Backup Automático**: Antes de actualizar, se crea una copia de seguridad completa
- **Verificación de Integridad**: Si la descarga falla, no se aplica ningún cambio
- **Restauración Automática**: En caso de error, se restaura el backup
- **Carpeta de Backup**: `backup/` en la raíz del proyecto

---

## ⚙️ Configuración Avanzada

### Modificar Frecuencia de Verificación

En [src/electron/main.js](../src/electron/main.js#L163):

```javascript
autoUpdater = new AutoUpdater({
  checkInterval: 1000 * 60 * 60 * 6, // 6 horas (en milisegundos)
});
```

Ejemplos:
- 1 hora: `1000 * 60 * 60`
- 12 horas: `1000 * 60 * 60 * 12`
- 1 día: `1000 * 60 * 60 * 24`

### Desactivar Verificación Automática

Comentar en [src/electron/main.js](../src/electron/main.js):

```javascript
// setTimeout(() => {
//   checkForUpdatesAndNotify();
// }, 5000);
```

---

## 🐛 Solución de Problemas

### La Notificación No Aparece

1. Verifica que `package.json` tenga el campo `repository` configurado
2. Verifica que haya releases publicados en GitHub
3. Revisa la consola de Electron para errores (F12)

### Error al Descargar

- Verifica la conexión a internet
- Verifica que el repositorio sea público o tengas acceso
- Revisa los logs en la terminal

### La Actualización Falla

- El sistema restaurará automáticamente el backup
- Revisa los logs en `update-temp.bat` (si quedó)
- Verifica que tengas permisos de escritura en la carpeta

### Verificar Versión Actual

Mira en la esquina inferior de la app o en [src/package.json](../src/package.json):
```json
{
  "version": "2.1.0"
}
```

---

## 📚 Recursos Adicionales

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Semantic Versioning](https://semver.org/)
- [Electron Auto Updater Best Practices](https://www.electronjs.org/docs/latest/tutorial/updates)

---

## 📝 Checklist para Publicar Release

- [ ] Todos los cambios están commiteados
- [ ] Tests pasando (si los hay)
- [ ] Versión actualizada correctamente
- [ ] Release notes escritas
- [ ] Tag creado y pusheado
- [ ] Release publicado en GitHub
- [ ] Verificado que la notificación aparece
- [ ] Probado el proceso de actualización

---

**¡Listo!** Tu sistema de actualizaciones está completamente configurado. 🎉
