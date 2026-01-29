/**
 * preload.js
 * Puente seguro entre el proceso principal y el renderer
 */

const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runPipeline: (options) => ipcRenderer.invoke('run-pipeline', options),
  runRefreshWorkspace: (options) => ipcRenderer.invoke('run-refresh-workspace', options),
  updateWorkspaceCredentials: () => ipcRenderer.invoke('update-workspace-credentials'),
  clearAllCredentials: () => ipcRenderer.invoke('clear-all-credentials'),
  
  // Sistema de actualizaciones
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: (updateInfo) => ipcRenderer.invoke('install-update', updateInfo),
  openExternal: (url) => require('electron').shell.openExternal(url),
  
  onPipelineOutput: (callback) => {
    ipcRenderer.on('pipeline-output', (event, data) => callback(data));
  },
  
  onPipelineComplete: (callback) => {
    ipcRenderer.on('pipeline-complete', (event, data) => callback(data));
  },
  
  onPipelineError: (callback) => {
    ipcRenderer.on('pipeline-error', (event, data) => callback(data));
  },
  
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, data) => callback(data));
  }
});
