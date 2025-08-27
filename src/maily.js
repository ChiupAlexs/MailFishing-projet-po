'use strict'

const { app, BrowserWindow } = require('electron')
const test = require("node:test");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
})

function ouvrirMail(id) {
const mailOuvertEl = document.getElementById('mail-ouvert')
const listMailEl = document.querySelector('.containerMails')

    const listMail = [
        {
            "sender": "boss@gngngn.ch",
            "object": "Demande de modification des comptes de l'entreprise",
            "time": "9:30",
            "body": "Salut,\n\ntu peux modifier ce fichier excel et y intégrer les nouvelles données s'il-te-plait.\n\nVoici le lien du fichier excel : https://gngngn.ch/lebonfichier.xlsx\n\nil y a ci-joint le fichier avec les nouvelles données.\n\nMerci gars t'es un bon."
        }]

    mailOuvertEl.style.display = 'block'
    const mail = listMail[id]
    mailOuvertEl.querySelector('.sender').textContent += mail.sender
    mailOuvertEl.querySelector('.objet').textContent += mail.object
    mailOuvertEl.querySelector('.time').textContent += mail.time
    mailOuvertEl.querySelector('.message').textContent += mail.body

    listMailEl.style.display = 'none'

    console.log("test")
}

function fermerMail() {
    const mailOuvertEl = document.getElementById('mail-ouvert')
    const listMailEl = document.querySelector('.containerMails')
    mailOuvertEl.style.display = 'none'
    listMailEl.style.display = 'block'
}