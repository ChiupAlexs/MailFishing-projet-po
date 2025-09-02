'use strict'

const { app, BrowserWindow } = require('electron')
const test = require("node:test");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('src/html/menuDemarrage.html')
}

app.whenReady().then(() => {
    createWindow()
})
