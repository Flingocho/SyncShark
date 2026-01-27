/**
 * preload.js
 * Puente seguro entre el proceso principal y el renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runPipeline: (options) => ipcRenderer.invoke('run-pipeline', options),
  runRefreshWorkspace: (options) => ipcRenderer.invoke('run-refresh-workspace', options),
  updateWorkspaceCredentials: () => ipcRenderer.invoke('update-workspace-credentials'),
  clearAllCredentials: () => ipcRenderer.invoke('clear-all-credentials'),
  
  onPipelineOutput: (callback) => {
    ipcRenderer.on('pipeline-output', (event, data) => callback(data));
  },
  
  onPipelineComplete: (callback) => {
    ipcRenderer.on('pipeline-complete', (event, data) => callback(data));
  },
  
  onPipelineError: (callback) => {
    ipcRenderer.on('pipeline-error', (event, data) => callback(data));
  }
});
