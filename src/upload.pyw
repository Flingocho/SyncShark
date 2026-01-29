from pywinauto import Application
from pywinauto.findwindows import find_elements
import time
import sys
 
file_path = sys.argv[1]
print("Script Python iniciado con pywinauto")
print(f"Path del archivo: {file_path}")
 
# Esperar a que aparezca la ventana "Abrir" (en español) o "Open" (en inglés)
print("Esperando ventana de dialog de archivos...")

# Find all matching windows and select the file dialog specifically
time.sleep(1)
elements = find_elements(title_re=".*Abrir.*|.*Open.*", class_name="#32770")
if not elements:
    print("No se encontró ninguna ventana de diálogo")
    sys.exit(1)

print(f"Se encontraron {len(elements)} ventanas. Usando la más reciente...")
# Get the most recent dialog (last in the list)
target_element = elements[-1]

app = Application().connect(handle=target_element.handle)
dialog = app.window(handle=target_element.handle)
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