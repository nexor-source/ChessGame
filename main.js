const { app, BrowserWindow, ipcMain } = require('electron');

let deckData = null;
ipcMain.on('send-deck-data', (event, data) => {
  deckData = data;
});

ipcMain.on('switch-scene', (event, newScene) => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.loadFile(newScene);
    currentWindow.webContents.on('did-finish-load', () => {
      if (deckData){
        currentWindow.webContents.send('receive-deck-data', deckData);
        deckData = null;
      }
    });
  }
});

function createWindow(scene) {
  const win = new BrowserWindow({
    width: 1300,
    height: 1050,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    }
  });
  // 根据传入的场景参数加载不同的HTML文件
  if (scene === 'ScenePrepare') {
    win.loadFile('scene1.html');
  } else if (scene === 'SceneBattle') {
    win.loadFile('scene2.html');
  }
}

app.whenReady().then(() => createWindow('ScenePrepare'));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow('ScenePrepare');
  }
});

