const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');

const PET_CONFIG = {
  compactWidth: 160,
  compactHeight: 160,
  expandedWidth: 380,
  expandedHeight: 260,
  floorOffset: 36,
  startRightOffset: 40,
  statusPollMs: 800,
  statusRotateMs: 8000,
  moveIdleDelayMs: 180,
  maxStatusLength: 120
};

let mainWindow;
let statusTimer;
let moveIdleTimer;
let petState = 'idle';
let lastStatusText = null;

const statusPath = path.join(__dirname, 'status.txt');
const statusQueuePath = path.join(__dirname, 'status-queue.json');
const hasSingleInstanceLock = app.requestSingleInstanceLock();

function getPetY() {
  const { y, height } = screen.getPrimaryDisplay().workArea;
  return y + height - PET_CONFIG.compactHeight - PET_CONFIG.floorOffset;
}

function getPetStartX() {
  const { x, width } = screen.getPrimaryDisplay().workArea;
  return x + width - PET_CONFIG.compactWidth - PET_CONFIG.startRightOffset;
}

function ensureStatusFile() {
  if (!fs.existsSync(statusPath)) {
    fs.writeFileSync(statusPath, '', 'utf8');
  }

  if (!fs.existsSync(statusQueuePath)) {
    fs.writeFileSync(statusQueuePath, '[]\n', 'utf8');
  }
}

function readStatusText() {
  try {
    return fs.readFileSync(statusPath, 'utf8').trim().slice(0, PET_CONFIG.maxStatusLength);
  } catch {
    return '';
  }
}

function readStatusQueue() {
  try {
    const value = JSON.parse(fs.readFileSync(statusQueuePath, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStatusQueue(queue) {
  const json = JSON.stringify(queue, null, 2).replace(/[^\x00-\x7F]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  });
  fs.writeFileSync(statusQueuePath, `${json}\n`, 'utf8');
}

function writeStatusText(message) {
  const fileContent = message ? `\uFEFF${message}` : '';
  fs.writeFileSync(statusPath, fileContent, 'utf8');
}

function shouldRotateStatus(item) {
  return ['approval', 'error', 'waiting'].includes(item.kind);
}

function readQueuedStatusText() {
  const now = Date.now();
  let queue = readStatusQueue();
  let changed = false;

  while (queue.length > 0) {
    const current = queue[0];
    const text = String(current.text || '').trim().slice(0, PET_CONFIG.maxStatusLength);

    if (!text) {
      queue.shift();
      changed = true;
      continue;
    }

    if (!current.startedAt) {
      current.startedAt = now;
      changed = true;
    }

    if (current.durationMs && now - current.startedAt >= current.durationMs) {
      queue.shift();
      changed = true;
      continue;
    }

    if (queue.length > 1 && shouldRotateStatus(current) && now - current.startedAt >= PET_CONFIG.statusRotateMs) {
      current.startedAt = 0;
      queue.push(queue.shift());
      changed = true;
      continue;
    }

    if (changed) {
      writeStatusQueue(queue);
      writeStatusText(text);
    }

    return text;
  }

  if (changed) {
    writeStatusQueue(queue);
    writeStatusText('');
  }

  return readStatusText();
}

function resizeForStatus(hasStatus) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const { x: screenX, width: screenWidth } = screen.getPrimaryDisplay().workArea;
  const bounds = mainWindow.getBounds();
  const nextWidth = hasStatus ? PET_CONFIG.expandedWidth : PET_CONFIG.compactWidth;
  const nextHeight = hasStatus ? PET_CONFIG.expandedHeight : PET_CONFIG.compactHeight;
  const centerX = bounds.x + bounds.width / 2;
  const bottomY = bounds.y + bounds.height;
  const nextX = Math.round(centerX - nextWidth / 2);
  const minX = screenX;
  const maxX = screenX + screenWidth - nextWidth;

  mainWindow.setBounds({
    x: Math.min(Math.max(nextX, minX), maxX),
    y: Math.round(bottomY - nextHeight),
    width: nextWidth,
    height: nextHeight
  });
}

function publishStatusText(force = false) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const statusText = readQueuedStatusText();
  if (!force && statusText === lastStatusText) {
    return;
  }

  lastStatusText = statusText;
  resizeForStatus(statusText.length > 0);
  mainWindow.webContents.send('status-text', statusText);
}

function startStatusPolling() {
  publishStatusText(true);
  statusTimer = setInterval(publishStatusText, PET_CONFIG.statusPollMs);
}

function sendPetState(nextState) {
  if (!mainWindow || mainWindow.isDestroyed() || petState === nextState) {
    return;
  }

  petState = nextState;
  mainWindow.webContents.send('pet-state', nextState);
}

function markPetMoving() {
  sendPetState('grab');

  if (moveIdleTimer) {
    clearTimeout(moveIdleTimer);
  }

  moveIdleTimer = setTimeout(() => {
    sendPetState('idle');
  }, PET_CONFIG.moveIdleDelayMs);
}

function createWindow() {
  ensureStatusFile();

  mainWindow = new BrowserWindow({
    width: PET_CONFIG.compactWidth,
    height: PET_CONFIG.compactHeight,
    x: Math.round(getPetStartX()),
    y: Math.round(getPetY()),
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Quit Desktop Pet',
      click: () => app.quit()
    }
  ]);

  mainWindow.webContents.on('context-menu', () => {
    contextMenu.popup({ window: mainWindow });
  });

  mainWindow.on('move', () => {
    markPetMoving();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('pet-state', petState);
    startStatusPolling();
  });
}

ipcMain.on('quit-app', () => {
  app.quit();
});

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  });
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) {
    return;
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (statusTimer) {
    clearInterval(statusTimer);
  }

  if (moveIdleTimer) {
    clearTimeout(moveIdleTimer);
  }
});
