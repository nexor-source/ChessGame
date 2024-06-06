// npx electron-packager . MyApp --platform=win32 --arch=x64 --icon=1.ico --overwrite
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let deckData = null;
let tutorialFinished = false;

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

ipcMain.on('tutorial-finished', (event, arg) => {
  tutorialFinished = true;
});

ipcMain.on('check-tutorial-finished', (event, arg) => {
  event.reply('tutorial-finished-status', tutorialFinished);
});

function createWindow(scene) {

  const win = new BrowserWindow({
    width: Math.round(1300 ),
    height: Math.round(1050 ),
    resizable: false,
    icon: path.join(__dirname, '1.ico'),
    autoHideMenuBar: true,
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

  // win.on('resize', () => {
  //   const [newWidth, newHeight] = win.getSize();
  //   const newScale = Math.min(newWidth / 1300, newHeight / 1050);
  //   win.webContents.executeJavaScript(`
  //     document.getElementById('app').style.transform = 'scale(${newScale})';
  //     document.getElementById('app').style.transformOrigin = 'top left';
  //   `);
  // });
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

