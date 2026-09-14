const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');

const isDev = !app.isPackaged;

// En production, la base de donnees vit dans le dossier utilisateur (userData)
// et non dans le paquet de l'application (qui peut etre en lecture seule).
const userDataDb = path.join(app.getPath('userData'), 'haccp.db');

function ensureDatabase() {
  if (isDev) return; // en dev on utilise server/prisma/dev.db directement (npm run dev:server)
  if (!fs.existsSync(userDataDb)) {
    const template = path.join(process.resourcesPath, 'server', 'prisma', 'seed-template.db');
    const fallbackTemplate = path.join(__dirname, '..', 'server', 'prisma', 'seed-template.db');
    const source = fs.existsSync(template) ? template : fallbackTemplate;
    fs.copyFileSync(source, userDataDb);
  }
}

function startServer() {
  ensureDatabase();
  process.env.DATABASE_URL = isDev
    ? `file:${path.join(__dirname, '..', 'server', 'prisma', 'dev.db')}`
    : `file:${userDataDb}`;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'haccp-manager-local-secret-change-me';
  process.env.PORT = process.env.PORT || '4177';

  // Charge le serveur Express directement dans le process principal Electron
  // (evite d'avoir a gerer un processus enfant separe).
  const { createApp } = require('../server/src/index.js');
  const serverApp = createApp();
  return new Promise((resolve) => {
    const server = serverApp.listen(process.env.PORT, () => resolve(server));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadURL(`http://localhost:${process.env.PORT}`);
  }
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
