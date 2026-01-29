# 🎯 Guía Rápida - Publicar Actualización

## Para el Administrador del Proyecto

### 1️⃣ Configuración Inicial (Solo una vez)

Edita [src/package.json](src/package.json) y reemplaza:
```json
"repository": "OWNER/REPO"
```

Por tu repositorio real, ejemplo:
```json
"repository": "jaime-vidal/syncshark"
```

### 2️⃣ Publicar Nueva Versión

Cuando tengas cambios listos para publicar:

1. **Ejecuta el script**:
   ```bash
   publish-release.bat
   ```

2. **Ingresa la versión** (ejemplo: `2.2.0`)

3. **Describe los cambios** (ejemplo: "Agregado sistema de actualizaciones")

4. **El script hace todo automáticamente**:
   - ✅ Actualiza la versión
   - ✅ Crea el commit
   - ✅ Crea el tag
   - ✅ Sube todo a GitHub
   - ✅ Abre la página para completar el release

5. **En GitHub** (se abre automáticamente):
   - Escribe las notas del release
   - Haz clic en "Publish release"

### 3️⃣ ¡Listo!

Tus compañeros recibirán la notificación automáticamente la próxima vez que inicien SyncShark.

---

## Para los Usuarios

No necesitas hacer nada. Al abrir SyncShark:
- Si hay actualización → Aparece una notificación
- Haz clic en "Actualizar Ahora"
- La app se actualiza sola
- Se reinicia automáticamente

---

## Ejemplo de Release Notes

```markdown
## 🎉 Novedades
- Sistema de auto-actualización automático
- Notificaciones cuando hay nuevas versiones

## 🐛 Correcciones
- Corregido error con múltiples ventanas de diálogo

## 🔧 Mejoras
- Interfaz más limpia y profesional
```

---

📖 **Documentación completa**: Ver [RELEASES.md](RELEASES.md)
