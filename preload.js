const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopPet', {
  onStatusText(callback) {
    ipcRenderer.on('status-text', (_event, text) => callback(text));
  },
  onPetState(callback) {
    ipcRenderer.on('pet-state', (_event, state) => callback(state));
  },
  quit() {
    ipcRenderer.send('quit-app');
  }
});
