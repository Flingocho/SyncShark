Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Obtener la carpeta donde esta este script
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Cambiar al directorio src y ejecutar npm start invisiblemente
WshShell.CurrentDirectory = scriptPath & "\src"
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command ""npm start""", 0, False

Set fso = Nothing
Set WshShell = Nothing
