/**
 * clear-credentials.js
 * Borra todas las credenciales guardadas del proyecto
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('  BORRAR CREDENCIALES');
console.log('='.repeat(60));
console.log('\nEsto eliminará todas las credenciales guardadas de:');
console.log('  - Salesforce');
console.log('  - SharePoint');
console.log('  - Power BI Workspace');
console.log('');

// Directorios y archivos a eliminar
const itemsToDelete = [
  // Session data
  path.join(__dirname, 'session-data', 'salesforce'),
  path.join(__dirname, 'session-data', 'sharepoint'),
  path.join(__dirname, 'session-data', 'workspace'),
  
  // User data dirs
  path.join(__dirname, 'user-data-salesforce'),
  path.join(__dirname, 'user-data-sharepoint'),
  path.join(__dirname, 'user-data-workspace')
];

let deletedCount = 0;

itemsToDelete.forEach(itemPath => {
  if (fs.existsSync(itemPath)) {
    try {
      if (fs.lstatSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`  Eliminado: ${path.basename(itemPath)}/`);
      } else {
        fs.unlinkSync(itemPath);
        console.log(`  Eliminado: ${path.basename(itemPath)}`);
      }
      deletedCount++;
    } catch (error) {
      console.log(`  Error al eliminar ${path.basename(itemPath)}: ${error.message}`);
    }
  }
});

console.log('');
console.log('='.repeat(60));
if (deletedCount > 0) {
  console.log(`  ${deletedCount} elementos eliminados correctamente`);
  console.log('  En el próximo login se guardarán nuevas credenciales');
} else {
  console.log('  No había credenciales guardadas');
}
console.log('='.repeat(60));
console.log('');
