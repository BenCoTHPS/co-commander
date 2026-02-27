const { app, BrowserWindow } = require('electron');
const next = require('next');
const path = require('path');
const { createServer } = require('http');

const dotenv = require('dotenv');
dotenv.config({ path: path.join(app.getAppPath(), '.env') });

// Define if we are in dev or production mode
const dev = true; 
process.env.NODE_ENV = 'development';
const hostname = 'localhost';
const port = 3000;

// Initialize the Next.js application
const nextApp = next({ dev, hostname, port, dir: app.getAppPath() });
const handle = nextApp.getRequestHandler();

let mainWindow;

app.whenReady().then(() => {
  nextApp.prepare().then(() => {
    // Start the hidden Node.js server to run Next.js & Prisma
    createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error('Error handling request', err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // Once the server is running, open the visual app window
      mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true, // Makes it look like an app, not a browser
        webPreferences: {
          nodeIntegration: true,
        },
      });
      // This grabs errors from the hidden Node backend and prints them in your browser DevTools
      const originalConsoleError = console.error;
      console.error = (...args) => {
        originalConsoleError(...args);
        if (mainWindow && mainWindow.webContents) {
          // Sanitize the string slightly to prevent injection breaks
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ').replace(/`/g, "'");
          mainWindow.webContents.executeJavaScript(`console.error("SERVER CRASH:", \`${msg}\`)`).catch(() => {});
        }
      };

      mainWindow.loadURL(`http://${hostname}:${port}`);
      mainWindow.webContents.openDevTools();
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});