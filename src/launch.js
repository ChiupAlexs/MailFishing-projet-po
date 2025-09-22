'use strict'

const { app, BrowserWindow } = require('electron')
const test = require("node:test");

const createWindow = () => {
    const win = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    win.loadFile('src/html/menuDemarrage.html')
}

app.whenReady().then(() => {
    createWindow()
})
