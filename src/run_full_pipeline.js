/**
 * run_full_pipeline.js
 * 
 * Ejecuta el pipeline completo:
 * 1. Descarga telemetría desde Salesforce
 * 2. Valida el archivo Excel (para Power BI)
 * 3. Sube el archivo a SharePoint
 * 4. (Opcional) Actualiza workspace de Power BI
 * 
 * Uso: 
 *   node run_full_pipeline.js                                (modo normal)
 *   node run_full_pipeline.js --manual-login                 (login manual)
 *   node run_full_pipeline.js --workspace kpis               (con actualización de workspace)
 *   node run_full_pipeline.js --manual-login --workspace kpis
 */

const { spawn } = require('child_process');
const path = require('path');

// Parsear argumentos
const args = process.argv.slice(2);
const manualLogin = args.includes('--manual-login');
const supervised = args.includes('--supervised');

// Obtener workspace si se especificó
let workspace = null;
const workspaceIndex = args.indexOf('--workspace');
if (workspaceIndex !== -1 && args[workspaceIndex + 1]) {
  workspace = args[workspaceIndex + 1].toLowerCase();
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function runScript(scriptName, scriptArgs = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶ Ejecutando: node ${scriptName} ${scriptArgs.join(' ')}`);
    console.log('─'.repeat(60));
    
    const child = spawn('node', [scriptName, ...scriptArgs], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`${scriptName} terminó con código ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + '  SYNCSHARK - Pipeline Completo'.padEnd(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  
  if (workspace) {
    console.log(`\n📊 Workspace seleccionado: ${workspace.toUpperCase()}`);
  }
  
  const startTime = Date.now();

  try {
    // Paso 1: Descargar desde Salesforce
    console.log('\n📥 PASO 1/4: Descargando telemetría desde Salesforce...');
    const downloadArgs = [];
    if (manualLogin) downloadArgs.push('--manual-login');
    if (supervised) downloadArgs.push('--supervised');
    await runScript('download_telemetry.js', downloadArgs);

    // Paso 2: Validar archivo con Excel
    console.log('\n🔍 PASO 2/4: Validando archivo Excel para Power BI...');
    await runScript('validate_excel.js');

    // Paso 3: Subir a SharePoint
    console.log('\n📤 PASO 3/4: Subiendo a SharePoint...');
    const uploadArgs = [];
    if (manualLogin) uploadArgs.push('--manual-login');
    if (supervised) uploadArgs.push('--supervised');
    await runScript('upload_sp_telemetry.js', uploadArgs);

    // Paso 4: Actualizar workspace (opcional)
    if (workspace && workspace !== 'nada') {
      console.log(`\n🔄 PASO 4/4: Actualizando workspace ${workspace.toUpperCase()}...`);
      const workspaceArgs = ['--workspace', workspace];
      if (supervised) workspaceArgs.push('--supervised');
      await runScript('refresh_workspace.js', workspaceArgs);
    } else {
      console.log('\n⏭️  PASO 4/4: Omitido (no se seleccionó workspace)');
    }

    // Éxito
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log('\n' + '╔' + '═'.repeat(58) + '╗');
    console.log('║' + '  ✅ PIPELINE COMPLETADO EXITOSAMENTE'.padEnd(57) + '║');
    console.log('║' + `  Tiempo total: ${elapsed} segundos`.padEnd(58) + '║');
    console.log('╚' + '═'.repeat(58) + '╝\n');

  } catch (error) {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.error('\n' + '╔' + '═'.repeat(58) + '╗');
    console.error('║' + '  ❌ ERROR EN EL PIPELINE'.padEnd(58) + '║');
    console.error('║' + `  ${error.message}`.padEnd(58) + '║');
    console.error('║' + `  Tiempo transcurrido: ${elapsed} segundos`.padEnd(58) + '║');
    console.error('╚' + '═'.repeat(58) + '╝\n');
    process.exit(1);
  }
}

main();
