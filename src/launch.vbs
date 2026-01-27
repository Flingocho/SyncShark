Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command ""cd 'c:\node-project\src'; npm start""", 0, False
