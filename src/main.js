const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;
const fs = require('fs').promises;
const path = require('path');
const isDev = require('electron-is-dev');

// Disable GPU acceleration to fix GPU process errors
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  // Ensure preload path is absolute for both dev and production
  const preloadPath = isDev 
    ? path.resolve(__dirname, 'preload.js')
    : path.join(__dirname, 'preload.js');
  
  console.log('Preload path:', preloadPath);
  console.log('Is dev:', isDev);
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../public/icon.svg'),
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('get-images', async (event, folderPath) => {
  try {
    const files = await fs.readdir(folderPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    return images.map(img => ({
      name: img,
      path: path.join(folderPath, img),
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
});

ipcMain.handle('delete-images', async (event, filePaths) => {
  try {
    const { default: trash } = await import('trash');
    await trash(filePaths);
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    // Fallback: try using fs.unlink if trash is not available
    try {
      for (const file of filePaths) {
        await fs.unlink(file);
      }
      return { success: true };
    } catch (fallbackError) {
      return { success: false, error: fallbackError.message };
    }
  }
});

ipcMain.handle('get-image-data', async (event, imagePath) => {
  try {
    const data = await fs.readFile(imagePath);
    return Buffer.from(data).toString('base64');
  } catch (error) {
    console.error(error);
    return null;
  }
});
