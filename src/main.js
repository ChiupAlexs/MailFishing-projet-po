'use strict';

const mailOuvertEl = document.getElementById('mail-ouvert')
const listMailEl = document.querySelector('.containerMails')

let listFauxMail = []
let listVraiMail = []

async function loadMails() {
    let response = await fetch("../json/mail.json");
    let response2 = await fetch("../json/vraimail.json");
    let data = await response.json();
    listFauxMail = data.mails

    data = await response2.json();
    listVraiMail = data.mails

    for (let index in listFauxMail) {
        listMailEl.innerHTML += `
        <div class="mails1" onclick="ouvrirMail(${index})">
            <img class="mail" src="../images/mail1.png" alt="mailPP">
            <p class="mailHeure">${listFauxMail.at(index).time}
            <p class="apercu-sender">${listFauxMail.at(index).sender}</p>
            <p class="apercu-objet">${listFauxMail.at(index).object}</p>
        </div>`
    }
}
addEventListener('load', loadMails)

async function ouvrirMail(id) {

    mailOuvertEl.style.display = 'block'

    const mail = listFauxMail[id]
    mailOuvertEl.querySelector('.sender').textContent = "Sender : " + mail.sender
    mailOuvertEl.querySelector('.objet').textContent = "Objet : " + mail.object
    mailOuvertEl.querySelector('.time').textContent = "Time : " + mail.time
    mailOuvertEl.querySelector('.message').textContent = "Message : " + mail.body

    listMailEl.style.display = 'none'

    console.log("test")
}

function fermerMail() {
    const mailOuvertEl = document.getElementById('mail-ouvert')
    const listMailEl = document.querySelector('.containerMails')
    mailOuvertEl.style.display = 'none'
    listMailEl.style.display = 'block'
}
