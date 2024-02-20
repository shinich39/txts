import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import utils from "./libs/utils.js";

const CONFIG_PATH = path.join(process.cwd(), "config.json");
const DEFAULT_CONFIG = {
  header: "# Index: {index}\n# Name: {filename}\n# Type: {type}\n# Size: {size}\n# Words: {words}\n# Characters: {characters}\n",
  footer: null,
  seperator: null,
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(process.cwd(), "resources/icons/512x512.png"),
    webPreferences: {
      preload: path.join(process.cwd(), 'preload.js'),
      worldSafeExecuteJavaScript: true,
      contextIsolation: true, // https://www.electronjs.org/docs/latest/tutorial/security
      nodeIntegration: false,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Set event listeners.
  mainWindow.webContents.on("did-finish-load", function() {
    console.log("Electron window loaded");

    // send message to window
    const config = loadConfig();
    mainWindow.webContents.send("config", config);
  });

  mainWindow.webContents.on("close", function() {
    console.log("Electron window closed");
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }

  app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("config", function(event, config) {
  saveConfig(config);
});

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {encoding: "utf-8"});
    return config;
  } else {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, {encoding: "utf-8"}));
    return config;
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), {encoding: "utf-8"});
}