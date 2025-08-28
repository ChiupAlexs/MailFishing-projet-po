'use strict';

const mailOuvertEl = document.getElementById('mail-ouvert')
const listMailEl = document.querySelector('.containerMails')

let listFauxMail = []
let listVraiMail = []

let listMails = []

async function loadMails() {
    let response = await fetch("../json/mail.json");
    let response2 = await fetch("../json/vraimail.json");
    let data = await response.json();
    listFauxMail = data.mails

    data = await response2.json();
    listVraiMail = data.mails

    listMails.push(...listFauxMail)
    listMails.push(...listVraiMail)
    for (let index in listMails) {
        listMailEl.innerHTML += `
        <div class="mails1" onclick="ouvrirMail(${index})">
            <img class="mail-picture" src="../images/mail1.png" alt="mailPP">
            <div class="info-apercu">
                <p class="apercu-sender">${listMails.at(index).sender}</p>
                <p class="apercu-object">${listMails.at(index).object}</p>
            </div>
            <p class="mailHeure">${listMails.at(index).time}
        </div>`
    }
}
addEventListener('load', loadMails)

async function ouvrirMail(id) {

    mailOuvertEl.style.display = 'block'

    const mail = listMails[id]
    let message = mail.body.replace(/\n/g, "<br>");
    mailOuvertEl.querySelector('.sender').textContent = "Sender : " + mail.sender
    mailOuvertEl.querySelector('.objet').textContent = "Objet : " + mail.object
    mailOuvertEl.querySelector('.time').textContent = "Time : " + mail.time
    mailOuvertEl.querySelector('.message').innerHTML = "Message : " + message

    listMailEl.style.display = 'none'

    document.getElementById("supp").style.display = "block"  // affiche

    console.log("test")
}

function fermerMail() {
    const mailOuvertEl = document.getElementById('mail-ouvert')
    const listMailEl = document.querySelector('.containerMails')
    mailOuvertEl.style.display = 'none'
    listMailEl.style.display = 'block'
    document.getElementById("supp").style.display = "none"  // masque
}
