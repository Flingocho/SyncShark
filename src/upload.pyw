from pywinauto import Application
import time
import sys
 
file_path = sys.argv[1]
print("Script Python iniciado con pywinauto")
print(f"Path del archivo: {file_path}")
 
# Esperar a que aparezca la ventana "Abrir" (en español) o "Open" (en inglés)
print("Esperando ventana de dialog de archivos...")
app = Application().connect(title_re=".*Abrir.*|.*Open.*", timeout=30)
dialog = app.window(title_re=".*Abrir.*|.*Open.*")
print("Ventana encontrada")
 
# Encontrar el control de edición (el campo de texto)
edit_control = dialog.child_window(class_name="Edit")
print("Escribiendo path...")
edit_control.set_text(file_path)
 
# Encontrar y clickear el botón "Abrir" o "Open"
button = dialog.child_window(title_re=".*Abrir.*|.*Open.*")
print("Clickeando botón...")
button.click()
 
print("Archivo seleccionado, dialog cerrado")