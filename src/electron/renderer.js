/**
 * renderer.js
 * Lógica de la interfaz de usuario
 */

const runAutoBtn = document.getElementById('runAutoBtn');
const runSupervisedBtn = document.getElementById('runSupervisedBtn');
const runManualBtn = document.getElementById('runManualBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const workspaceSelect = document.getElementById('workspaceSelect');
const refreshWorkspaceBtn = document.getElementById('refreshWorkspaceBtn');
const updateCredentialsBtn = document.getElementById('updateCredentialsBtn');
const clearCredentialsBtn = document.getElementById('clearCredentialsBtn');
const logsElement = document.getElementById('logs');
const logsContainer = document.getElementById('logsContainer');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Elementos de actualización
const updateNotification = document.getElementById('updateNotification');
const updateVersion = document.getElementById('updateVersion');
const updateNotes = document.getElementById('updateNotes');
const updateNowBtn = document.getElementById('updateNowBtn');
const viewChangesBtn = document.getElementById('viewChangesBtn');
const updateLaterBtn = document.getElementById('updateLaterBtn');

let isRunning = false;
let updateInfo = null;

// Función para agregar logs
function addLog(text, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = text;
  logsElement.appendChild(entry);
  
  // Auto-scroll al final
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

// Función para parsear y colorear logs
function parseAndAddLog(text) {
  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (!line.trim()) return;
    
    let type = 'info';
    
    // Detectar tipo de log por contenido
    if (line.includes('COMPLETAD') || line.includes('éxito') || line.includes('exitosamente') || line.includes('correctamente')) {
      type = 'success';
    } else if (line.includes('ERROR') || line.includes('error') || line.includes('falló') || line.includes('Error')) {
      type = 'error';
    } else if (line.includes('WARN') || line.includes('advertencia') || line.includes('warning')) {
      type = 'warning';
    } else if (line.includes('═') || line.includes('─') || line.includes('===')) {
      type = 'separator';
    }
    
    addLog(line, type);
  });
}

// Actualizar estado visual
function updateStatus(status, text) {
  statusIndicator.className = `status-indicator ${status}`;
  statusText.textContent = text.toUpperCase();
}

// Habilitar/deshabilitar botones
function setButtonsEnabled(enabled) {
  runAutoBtn.disabled = !enabled;
  runSupervisedBtn.disabled = !enabled;
  runManualBtn.disabled = !enabled;
  workspaceSelect.disabled = !enabled;
  updateCredentialsBtn.disabled = !enabled;
  clearCredentialsBtn.disabled = !enabled;
  
  // El botón de refresh workspace se habilita solo si hay workspace seleccionado y no está corriendo
  if (enabled) {
    refreshWorkspaceBtn.disabled = workspaceSelect.value === 'nada';
  } else {
    refreshWorkspaceBtn.disabled = true;
  }
  
  isRunning = !enabled;
}

// Actualizar estado del botón de refresh workspace cuando cambia la selección
workspaceSelect.addEventListener('change', () => {
  if (!isRunning) {
    refreshWorkspaceBtn.disabled = workspaceSelect.value === 'nada';
  }
});

// Ejecutar pipeline
async function runPipeline(manualLogin = false, supervised = false) {
  if (isRunning) return;
  
  // Limpiar logs anteriores
  logsElement.innerHTML = '';
  
  // Obtener workspace seleccionado
  const workspace = workspaceSelect.value;
  
  // Configurar UI
  setButtonsEnabled(false);
  updateStatus('running', 'Pipeline en ejecución');
  
  const mode = manualLogin ? 'LOGIN MANUAL' : supervised ? 'AUTOMÁTICO SUPERVISADO' : 'AUTOMÁTICO';
  const workspaceText = workspace !== 'nada' ? ` + WORKSPACE ${workspace.toUpperCase()}` : '';
  addLog(`================================================================`, 'separator');
  addLog(`  INICIANDO PIPELINE - MODO ${mode}${workspaceText}`, 'info');
  addLog(`================================================================`, 'separator');
  addLog('');
  
  try {
    await window.electronAPI.runPipeline({ manualLogin, workspace, supervised });
  } catch (error) {
    addLog(`Error al iniciar pipeline: ${error.message}`, 'error');
    updateStatus('error', 'Error al ejecutar');
    setButtonsEnabled(true);
  }
}

// Ejecutar solo refresh workspace
async function runRefreshWorkspace() {
  if (isRunning) return;
  
  const workspace = workspaceSelect.value;
  if (workspace === 'nada') {
    addLog('⚠ Debe seleccionar un workspace', 'warning');
    return;
  }
  
  // Limpiar logs anteriores
  logsElement.innerHTML = '';
  
  // Configurar UI
  setButtonsEnabled(false);
  updateStatus('running', 'Actualizando workspace');
  
  addLog(`================================================================`, 'separator');
  addLog(`  ACTUALIZACIÓN DE WORKSPACE - ${workspace.toUpperCase()}`, 'info');
  addLog(`================================================================`, 'separator');
  addLog('');
  
  try {
    await window.electronAPI.runRefreshWorkspace({ workspace });
  } catch (error) {
    addLog(`Error al iniciar actualización: ${error.message}`, 'error');
    updateStatus('error', 'Error al ejecutar');
    setButtonsEnabled(true);
  }
}

// Actualizar credenciales de workspace
async function updateWorkspaceCredentials() {
  if (isRunning) return;
  
  // Limpiar logs anteriores
  logsElement.innerHTML = '';
  
  // Configurar UI
  setButtonsEnabled(false);
  updateStatus('running', 'Actualizando credenciales');
  
  addLog(`================================================================`, 'separator');
  addLog(`  ACTUALIZAR CREDENCIALES DE WORKSPACE`, 'info');
  addLog(`================================================================`, 'separator');
  addLog('Se limpiarán las credenciales existentes');
  addLog('Tienes 60 segundos para completar el login');
  addLog('');
  
  try {
    await window.electronAPI.updateWorkspaceCredentials();
  } catch (error) {
    addLog(`Error al actualizar credenciales: ${error.message}`, 'error');
    updateStatus('error', 'Error al ejecutar');
    setButtonsEnabled(true);
  }
}

// Borrar todas las credenciales
async function clearAllCredentials() {
  if (isRunning) return;
  
  // Diálogo de confirmación
  const confirmed = confirm(
    '⚠️ ADVERTENCIA ⚠️\n\n' +
    'Esto borrará TODAS las credenciales guardadas:\n\n' +
    '• Salesforce\n' +
    '• SharePoint\n' +
    '• Power BI Workspace\n\n' +
    'Necesitarás volver a iniciar sesión en todos los servicios.\n\n' +
    '¿Estás seguro de que deseas continuar?'
  );
  
  if (!confirmed) {
    addLog('⚠ Borrado de credenciales cancelado por el usuario', 'warning');
    return;
  }
  
  // Limpiar logs anteriores
  logsElement.innerHTML = '';
  
  // Configurar UI
  setButtonsEnabled(false);
  updateStatus('running', 'Borrando credenciales');
  
  addLog(`================================================================`, 'separator');
  addLog(`  ⚠️ BORRAR TODAS LAS CREDENCIALES`, 'warning');
  addLog(`================================================================`, 'separator');
  addLog('');
  
  try {
    await window.electronAPI.clearAllCredentials();
  } catch (error) {
    addLog(`Error al borrar credenciales: ${error.message}`, 'error');
    updateStatus('error', 'Error al ejecutar');
    setButtonsEnabled(true);
  }
}

// Event listeners
runAutoBtn.addEventListener('click', () => runPipeline(false, false));
runSupervisedBtn.addEventListener('click', () => runPipeline(false, true));
runManualBtn.addEventListener('click', () => runPipeline(true, false));
refreshWorkspaceBtn.addEventListener('click', () => runRefreshWorkspace());
updateCredentialsBtn.addEventListener('click', () => updateWorkspaceCredentials());
clearCredentialsBtn.addEventListener('click', () => clearAllCredentials());

clearLogsBtn.addEventListener('click', () => {
  logsElement.innerHTML = '';
  addLog(`Logs limpiados - ${new Date().toLocaleString('es-ES')}`, 'info');
  updateStatus('', 'Sistema en espera');
});

// Listeners de eventos de Electron
window.electronAPI.onPipelineOutput((data) => {
  parseAndAddLog(data.data);
});

window.electronAPI.onPipelineComplete((result) => {
  addLog('');
  addLog(`================================================================`, 'separator');
  
  if (result.success) {
    addLog(`  PIPELINE COMPLETADO EXITOSAMENTE`, 'success');
    updateStatus('success', 'Proceso completado');
  } else {
    addLog(`  ERROR EN PIPELINE - CÓDIGO ${result.code}`, 'error');
    updateStatus('error', `Error - código ${result.code}`);
  }
  
  addLog(`================================================================`, 'separator');
  addLog('');
  
  setButtonsEnabled(true);
});

window.electronAPI.onPipelineError((error) => {
  addLog('');
  addLog(`ERROR CRÍTICO: ${error.message}`, 'error');
  updateStatus('error', 'Error crítico del sistema');
  setButtonsEnabled(true);
});

/**
 * Sistema de Actualizaciones
 */

// Recibir notificación de actualización disponible
window.electronAPI.onUpdateAvailable((info) => {
  updateInfo = info;
  showUpdateNotification(info);
});

// Mostrar notificación de actualización
function showUpdateNotification(info) {
  updateVersion.textContent = `Versión ${info.latestVersion} disponible (Actual: ${info.currentVersion})`;
  
  // Mostrar las primeras líneas del changelog
  const notes = info.releaseNotes || 'Sin notas de versión disponibles';
  const shortNotes = notes.split('\n').slice(0, 5).join('\n');
  updateNotes.textContent = shortNotes + (notes.split('\n').length > 5 ? '\n...' : '');
  
  updateNotification.style.display = 'block';
  
  // Log en consola también
  addLog('🔄 Nueva actualización disponible: v' + info.latestVersion, 'info');
}

// Botón "Actualizar Ahora"
updateNowBtn.addEventListener('click', async () => {
  if (!updateInfo) return;
  
  updateNotification.style.display = 'none';
  addLog('⬇️  Descargando e instalando actualización...', 'info');
  updateStatus('running', 'Actualizando...');
  
  try {
    const result = await window.electronAPI.installUpdate(updateInfo);
    if (result.success) {
      addLog('✅ Actualización instalada. La aplicación se reiniciará...', 'success');
    } else {
      addLog('❌ Error instalando actualización: ' + result.error, 'error');
      updateStatus('error', 'Error en actualización');
    }
  } catch (error) {
    addLog('❌ Error: ' + error.message, 'error');
    updateStatus('error', 'Error en actualización');
  }
});

// Botón "Ver Cambios"
viewChangesBtn.addEventListener('click', () => {
  if (updateInfo && updateInfo.releaseUrl) {
    window.electronAPI.openExternal(updateInfo.releaseUrl);
  }
});

// Botón "Más Tarde"
updateLaterBtn.addEventListener('click', () => {
  updateNotification.style.display = 'none';
  addLog('ℹ️  Actualización pospuesta. Se verificará nuevamente más tarde.', 'info');
});
