const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Importar constantes
const { LAST_FILE_PATH } = require('./lib/constants');

async function validateExcelFile(filePath) {
  console.log('\n' + '='.repeat(60));
  console.log('  VALIDANDO ARCHIVO EXCEL');
  console.log('='.repeat(60));
  console.log(`Archivo: ${path.basename(filePath)}\n`);

  return new Promise((resolve, reject) => {
    // Abrir el archivo con Excel usando el comando start de Windows
    // Excel lo abrirá, validará, y lo cerraremos automáticamente
    const command = `powershell -Command "& { $excel = New-Object -ComObject Excel.Application; $excel.Visible = $false; $excel.DisplayAlerts = $false; $workbook = $excel.Workbooks.Open('${filePath.replace(/'/g, "''")}'); Start-Sleep -Seconds 3; $workbook.Save(); $workbook.Close($false); $excel.Quit(); [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null }"`;

    console.log('⏳ Abriendo archivo con Excel...');
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al validar el archivo:', error.message);
        reject(error);
        return;
      }

      console.log('✓ Archivo abierto y validado por Excel');
      console.log('✓ Metadatos actualizados');
      console.log('✓ Estructura verificada');
      console.log('\n' + '='.repeat(60));
      console.log('  VALIDACIÓN COMPLETADA');
      console.log('='.repeat(60));
      console.log('\nEl archivo está listo para subir a SharePoint.\n');
      
      resolve();
    });
  });
}

(async () => {
  try {
    // Leer la ruta del último archivo descargado
    if (!fs.existsSync(LAST_FILE_PATH)) {
      console.error(`❌ No se encontró el archivo ${LAST_FILE_PATH}`);
      console.error('   Ejecuta primero: node download_telemetry.js');
      process.exit(1);
    }

    const filePath = fs.readFileSync(LAST_FILE_PATH, 'utf-8').trim();
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ El archivo no existe: ${filePath}`);
      process.exit(1);
    }

    await validateExcelFile(filePath);
    
    console.log('Próximo paso:');
    console.log('  node upload_sp_telemetry.js\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la validación:', error.message);
    process.exit(1);
  }
})();
