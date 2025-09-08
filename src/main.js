'use strict';

const mailOuvertEl = document.getElementById('mail-ouvert')
const listMailEl = document.querySelector('.containerMails')

let listFauxMail = []
let listVraiMail = []

let listMails = []
let currentMailIndex = null

let scroll = 0

/*************************** Menu de démarrage *******************************/

function quitter() {
    window.close();
}

/*************************** Maily *******************************/

// --- Helpers robustes ---
function getDateParts(str) {
    if (!str || typeof str !== "string") return null;
    const s = str.trim();
    let m;
    // jj/mm/aaaa
    if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
        return { d: +m[1], m: +m[2], y: +m[3] };
    }
    // aaaa-mm-jj
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
        return { d: +m[3], m: +m[2], y: +m[1] };
    }
    return null;
}

function getTimeParts(str) {
    if (!str || typeof str !== "string") return { h: 0, min: 0 };
    const m = str.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return { h: 0, min: 0 };
    return { h: +m[1], min: +m[2] };
}

// Normalise le champ mail.date en jj/mm/aaaa (si possible)
function normaliserDateFormat(mail) {
    const p = getDateParts(mail.date);
    if (!p) return mail;
    const dd = String(p.d).padStart(2, "0");
    const mm = String(p.m).padStart(2, "0");
    const yyyy = String(p.y);
    mail.date = `${dd}/${mm}/${yyyy}`;
    return mail;
}

function toTimestamp(mail) {
    const dp = getDateParts(mail.date);
    if (!dp) return -Infinity;
    const tp = getTimeParts(mail.time);
    return new Date(dp.y, dp.m - 1, dp.d, tp.h, tp.min).getTime();
}

// --- Tri principal ---
function trierMailsParDateHeure() {
    // normaliser les dates (utile si sessionStorage contient encore des dates ISO)
    listMails = listMails.map(normaliserDateFormat);

    // trier du plus récent au plus ancien
    listMails.sort((a, b) => toTimestamp(b) - toTimestamp(a));

    sauvegarderMail();
}


async function loadMails() {

    if (sessionStorage.getItem('mails') === null) {

        let response = await fetch("../json/mail.json");
        let response2 = await fetch("../json/vraimail.json");
        let dataFaux = await response.json();
        let dataVrai = await response2.json();
        listFauxMail = dataFaux.mails
        listVraiMail = dataVrai.mails

        // Tirage aléatoire de 9 mails de mail.json
        let mailsFauxChoisis = []
        while (mailsFauxChoisis.length < 9 && listFauxMail.length > 0) {
            let index = Math.floor(Math.random() * listFauxMail.length)
            mailsFauxChoisis.push(listFauxMail.splice(index, 1)[0])
        }

        // Tirage aléatoire de 1 mail de vraimail.json
        let mailVraiChoisi = null
        if (listVraiMail.length > 0) {
            let indexVrai = Math.floor(Math.random() * listVraiMail.length)
            mailVraiChoisi = listVraiMail[indexVrai]
        }

        listMails = [...mailsFauxChoisis]
        if (mailVraiChoisi) listMails.push(mailVraiChoisi)

        // Ajouter la propriété "lu = false" à chaque mail
        listMails = listMails.map(mail => ({...mail, lu: false}))

        listMails.sort(() => Math.random() - 0.5)

        // Sauvegarder
        sauvegarderMail()
    } else {
        listMails = JSON.parse(sessionStorage.getItem('mails'));
    }
    trierMailsParDateHeure()
    afficherListeMails()
}

addEventListener('load', loadMails)

function afficherListeMails() {
    listMailEl.innerHTML = ""
    for (let index in listMails) {
        const mail = listMails[index]

        listMailEl.innerHTML += `
    <div class="${mail.lu ? 'mails' : 'mails1'}" onclick="ouvrirMail(${index})">
        <img class="icon" src="../images/${mail.icon || 'default.png'}" alt="mailPP">
        <div class="info-apercu">
            <p class="apercu-realName">${mail.realName}</p>
            <p class="apercu-object">${mail.object}</p>
        </div>
        <p class="mailHeure">${mail.time}</p>
        <p class="mailDate">${mail.date}</p>
    </div>`
    }
}

async function ouvrirMail(id) {

    listMailEl.style.display = 'none'

    mailOuvertEl.style.display = 'block'

    const mail = listMails[id]
    let message = mail.body.replace(/\n/g, "<br>");
    mailOuvertEl.querySelector('.icon').src = `../images/${mail.icon}`
    mailOuvertEl.querySelector('.sender').innerHTML = "<span class='label'>De :</span> " + mail.sender
    mailOuvertEl.querySelector('.objet').innerHTML = "<span class='label'>Objet :</span> " + mail.object
    mailOuvertEl.querySelector('.time').innerHTML = `<strong>${mail.time}</strong>`
    mailOuvertEl.querySelector('.message').innerHTML = message
    mailOuvertEl.querySelector('.secret').innerHTML = `${mail.secret}`


    if (mail.backgroundImage) {
        mailOuvertEl.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('../images/${mail.backgroundImage}')`
        mailOuvertEl.style.backgroundSize = "cover"
        mailOuvertEl.style.backgroundPosition = "center"
    } else {
        mailOuvertEl.style.backgroundImage = "none"
    }

    currentMailIndex = id
    scroll = window.scrollY

    window.scrollTo(0, 0)

    mailOuvertEl.style.animationName = 'slideIn'
    mailOuvertEl.style.animationDuration = '0.2s'

    document.getElementById("supp").style.display = "block"

    // Marquer comme lu
    listMails[id].lu = true
    sauvegarderMail()
}

function fermerMail() {

    mailOuvertEl.style.display = 'none';

    listMailEl.style.display = 'block'

    document.getElementById("supp").style.display = "none"

    // Réaffiche la liste mise à jour
    afficherListeMails()

    window.scrollTo(0, scroll)
}

function sauvegarderMail() {
    sessionStorage.setItem('mails', JSON.stringify(listMails))
}

function effacerMail() {
    if (currentMailIndex !== null) {
        // Retirer le mail de la liste
        listMails.splice(currentMailIndex, 1)

        // Sauvegarder la nouvelle liste
        sauvegarderMail()

        // Fermer l'affichage du mail
        fermerMail()

        // Recharger l'affichage de la liste
        afficherListeMails()

        currentMailIndex = null

        // Affiche le feedback
        afficherfeedback("Le mail a bien été supprimé !");
    }
}

function afficherfeedback(message) {
    const popup = document.getElementById("feedback");
    popup.textContent = message;
    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
    }, 2000);
}
