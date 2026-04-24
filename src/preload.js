const { contextBridge, ipcRenderer } = require('electron');


try {
  console.log('[Preload] Starting preload script...');

  const apis = {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getImages: (folderPath) => ipcRenderer.invoke('get-images', folderPath),
    deleteImages: (filePaths) => ipcRenderer.invoke('delete-images', filePaths),
    getImageData: (imagePath) => ipcRenderer.invoke('get-image-data', imagePath),
  };

  contextBridge.exposeInMainWorld('electronAPI', apis);
  console.log('[Preload] electronAPI exposed successfully');
} catch (error) {
  console.error('[Preload] Error:', error);
}
