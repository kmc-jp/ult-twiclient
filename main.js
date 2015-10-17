var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var Oauth = require('twitter-oauth')({
    consumerKey: "STEtjjUGjw5bhdCjE1bdRxMh3", /* per appication - create a comsumer key here: https://dev.twitter.com/apps */
    // domain: 'YOUR DOMAIN HERE',
    consumerSecret: "B3mvDiqXsCp8xkoi4Fa8WlIKqzNA2mePSic5BSP0kBGW3SdmLj",
    // loginCallback: "http://yourdomain.com/twitter/sessions/callback",  /* internal */
    // completeCallback:  "http://yourdomain.com/search/beagles"  /* When oauth has finished - where should we take the user too */
});

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

  // Open the DevTools.
  mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
