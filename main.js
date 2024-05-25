const { app, BrowserWindow, ipcMain } = require('electron');

ipcMain.on('switch-scene', (event, newScene) => {
  const currentWindow = BrowserWindow.getFocusedWindow();
  if (currentWindow) {
    currentWindow.loadFile(newScene);
  }
});

function createWindow(scene) {
  const win = new BrowserWindow({
    width: 1200,
    height: 1200,
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
