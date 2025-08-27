'use strict';

let listFauxMail = []
let listVraiMail = []

async function loadMails() {
    let response = await fetch("../json/mail.json");
    let response2 = await fetch("../json/vraimail.json");
    let data = await response.json();
    listFauxMail = data.mails

    data = await response2.json();
    listVraiMail = data.mails
}
addEventListener('load', loadMails)

async function ouvrirMail(id) {

    const mailOuvertEl = document.getElementById('mail-ouvert')
    const listMailEl = document.querySelector('.containerMails')

    mailOuvertEl.style.display = 'block'

    const mail = listFauxMail[id]
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
