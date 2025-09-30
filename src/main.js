'use strict';

const {exec} = require("child_process");
const events = require("node:events");

const mailOuvertEl = document.getElementById('mail-ouvert')
const boutonRetourEl = document.querySelector('.bouton-retour')
const listMailEl = document.querySelector('.containerMails')

const NBRE_DE_MAUVAIS_MAILS_A_SUPP = 5;


let listFauxMail = []
let listVraiMail = []
let listMails = []
let currentMailIndex = null
let quetes = []
let introFini;

let scroll = 0

/******************************** Général ************************************/

window.addEventListener('DOMContentLoaded', () => {
    const btnQuitPart = document.getElementById('QuitPartie')
    const overlayQuit = document.getElementById('overlayQuit')
    const confirmBtn = document.getElementById('confirmBtn')
    const cancelBtn = document.getElementById('cancelBtn')

    const btnQuitPartMaily = document.getElementById('QuitPartieMaily')
    const overlayQuitMaily = document.getElementById('overlayQuitMaily')
    const confirmBtnMaily = document.getElementById('confirmBtnMaily')
    const cancelBtnMaily = document.getElementById('cancelBtnMaily')

    const btnQuitPartQuetes = document.getElementById('QuitPartieQuetes')
    const overlayQuitQuetes = document.getElementById('overlayQuitQuetes')
    const confirmBtnQuetes = document.getElementById('confirmBtnQuetes')
    const cancelBtnQuetes = document.getElementById('cancelBtnQuetes')

    if (btnQuitPart) {
        btnQuitPart.addEventListener('click', (e) => {
            overlayQuit.style.display = 'flex';
        });
    } if (btnQuitPartMaily) {
        btnQuitPartMaily.addEventListener('click', (e) => {
            overlayQuitMaily.style.display = 'flex';
        });
    } if (btnQuitPartQuetes) {
        btnQuitPartQuetes.addEventListener('click', (e) => {
            overlayQuitQuetes.style.display = 'flex';
        });
    } if (confirmBtn) {
        confirmBtn.addEventListener('click', (e) => {
            sessionStorage.clear()
        });
    } if (confirmBtnMaily) {
        confirmBtnMaily.addEventListener('click', (e) => {
            sessionStorage.clear()
        });
    } if (confirmBtnQuetes) {
        confirmBtnQuetes.addEventListener('click', (e) => {
            sessionStorage.clear()
        });
    } if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            overlayQuit.style.display = 'none';
        });
    } if (cancelBtnMaily) {
        cancelBtnMaily.addEventListener('click', (e) => {
            overlayQuitMaily.style.display = 'none';
        });
    } if (cancelBtnQuetes) {
        cancelBtnQuetes.addEventListener('click', (e) => {
            overlayQuitQuetes.style.display = 'none';
        });
    }
})

/*************************** Menu de démarrage *******************************/

function quitter() {
    window.close();
}

/*************************** Bureau *******************************/


/*************************** Maily *******************************/

// génère une date aléatoire entre 2 bornes
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// --- Helpers robustes ---
function getDateParts(str) {
    if (!str || typeof str !== "string") return null;
    const s = str.trim();
    let m;
    // jj/mm/aaaa
    if ((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
        return {d: +m[1], m: +m[2], y: +m[3]};
    }
    // aaaa-mm-jj
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
        return {d: +m[3], m: +m[2], y: +m[1]};
    }
    return null;
}

function getTimeParts(str) {
    if (!str || typeof str !== "string") return {h: 0, min: 0};
    const m = str.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return {h: 0, min: 0};
    return {h: +m[1], min: +m[2]};
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

function loadQuetes() {
    const queteGarderMailElement = document.querySelector('.garderMail')
    const queteSuppMailElement = document.querySelector(".suppMail")
    console.log(32323)
    if (sessionStorage.getItem('quetes') === null) {

        quetes = [
            {id: 1, points: 0, but: 5, fini: false, label: "Supprimer 5 mails mauvais"},
            {id: 2, points: 0, but: 1, fini: false, label: "Consulter un bon mail."}, // TODO : modifier le label
        ]

        sessionStorage.setItem('quetes', JSON.stringify(quetes));
    } else {
        quetes = JSON.parse(sessionStorage.getItem('quetes'));
    }

    if (quetes[0].fini) {
        queteSuppMailElement.querySelector("img").src = "../images/check-icon.png"
    }
    if (quetes[1].fini) {
        queteGarderMailElement.querySelector("img").src = "../images/check-icon.png"
    } else if (quetes[1].points < 0) {
        queteGarderMailElement.querySelector("img").src = "../images/croix-rouge.png"
        queteGarderMailElement.classList.add("perdu")
    }
    queteSuppMailElement.querySelector("p").innerText = `Supprimer 5 mauvais mails : ${quetes[0].points} / 5`
}

function sauvegarderEtatQuetes() {
    sessionStorage.setItem('quetes', JSON.stringify(quetes));
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
        listMails = listMails.map(mail => ({...mail, lu: false, lienConsulter: false}))
        listMails.sort(() => Math.random() - 0.5)

        // génère des dates
        for (let index in listMails) {
            let date = randomDate(new Date(2025, 8, 1), new Date())

            listMails[index].date = `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1}/${date.getFullYear()}`;
            listMails[index].time = `${Math.floor(Math.random() * 9 + 8)}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}`;
        }

        // Sauvegarder
        sauvegarderMail()
    } else {
        listMails = JSON.parse(sessionStorage.getItem('mails'));
    }


    trierMailsParDateHeure()
    afficherListeMails()
}

window.addEventListener('load', () => {
    const btnOk = document.getElementById("btn-ok");
    const voile = document.getElementById("voile");
    const appLock = document.getElementById("appContainer");
    const appLockQuetes = document.getElementById("appContainerQuetes");
    const locker = document.getElementById("locker");
    const lockerQuetes = document.getElementById("lockerQuetes");
    const fleche = document.getElementById("fleche");
    if (sessionStorage.getItem("introFini") == null) {
        sessionStorage.setItem("introFini", JSON.stringify(false));
    } else {
        introFini = JSON.parse(sessionStorage.getItem("introFini"))
    }

    if (btnOk) {
        btnOk.addEventListener("click", () => {
            introFini = true;
            sessionStorage.setItem('introFini', JSON.stringify(true));
            appLockQuetes.classList.remove("lockedQuetes");
            lockerQuetes.remove()
        });
        if (introFini) {
            if (appLockQuetes && lockerQuetes) {
                appLockQuetes.classList.remove("lockedQuetes");
                lockerQuetes.remove()
            }
        }
    }
    if (introFini === true) {
        if (fleche && voile && appLock && locker) {
            fleche.style.display = "none";
            voile.classList.remove("voile");
            appLock.classList.remove("locked");
            locker.remove()
        }
    }
    loadQuetes()
}, loadMails())

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

    scroll = window.scrollY

    window.scrollTo(0, 0)
    listMailEl.style.display = 'none'

    mailOuvertEl.style.display = 'block'
    boutonRetourEl.style.display = 'block'


    const mail = listMails[id]
    let message = mail.body.replace(/\n/g, "<br>");
    mailOuvertEl.querySelector('.icon').src = `../images/${mail.icon}`
    mailOuvertEl.querySelector('.sender').innerHTML = "<span class='label'>De :</span> " + mail.sender
    mailOuvertEl.querySelector('.objet').innerHTML = "<span class='label'>Objet :</span> " + mail.object
    mailOuvertEl.querySelector('.time').innerHTML = `<strong>${mail.date} ${mail.time}</strong>`
    mailOuvertEl.querySelector('.message').innerHTML = message
    mailOuvertEl.querySelector('.secret').innerHTML = `${mail.secret}`

    const linkDraw = document.querySelector('.lienDraw');
    if (linkDraw) {
        linkDraw.addEventListener('click', e => {
            exec('.\\resources\\app\\src\\virus\\dessinVirus', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }
    const linkBeep = document.querySelector('.lienBeep');
    if (linkBeep) {
        linkBeep.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\beep', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }
    const linkScreen = document.querySelector('.lienScreen');
    if (linkScreen) {
        linkScreen.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\hackScreen', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }

    const realLink = document.querySelector('.bon-lien');
    if (realLink) {
        realLink.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            const overlay = document.getElementById("popupOverlayTrue");
            const popupOk = document.getElementById("popupOkTrue");
            const popupContent = document.getElementById("popupContentTrue");
            const popupTitle = document.getElementById("popupTitleTrue");

            // Ajoute l'événement sur tous les liens avec la classe .lien
            popupTitle.innerHTML = "Bravo !"
            popupContent.innerHTML = "Vous avez trouvé le bon mail ☝️🤓";
            // Faire apparaître après un certain temps
            setTimeout(() => {
                overlay.classList.remove("hiddenTrue");
            }, 400)

            // Bouton Confirmer
            popupOk.addEventListener("click", () => {
                overlay.classList.add("hiddenTrue");

                // Permet d'indiquer que la quête d'ouverture du bon mail soit complété
                quetes[1].points = 1
                quetes[1].fini = true
                afficherReussiteQuete(1)

            })
        })
    }

    const link = document.querySelector('.lien');
    if (link) {
        link.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\Client-built', (error, stdout, stderr) => {
                console.log(stderr)
            });
            const overlay = document.getElementById("popupOverlayFalse");
            const popupOk = document.getElementById("popupOkFalse");
            const popupContent = document.getElementById("popupContentFalse");
            const popupTitle = document.getElementById("popupTitleFalse");

            // Ajoute l'événement sur tous les liens avec la classe .lien
            popupTitle.innerHTML = "Dommage !"
            popupContent.innerHTML = "Vous vous êtes fait avoir 🥸";
            // Faire apparaître après un certain temps
            setTimeout(() => {
                overlay.classList.remove("hiddenFalse");
            }, 400)

            // Bouton Confirmer
            popupOk.addEventListener("click", () => {
                overlay.classList.add("hiddenFalse");
            })

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

        })
    }

    const linkDLProgress = document.querySelector('.lienProgress');
    if (linkDLProgress) {
        linkDLProgress.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\DLProgress', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }

    const linkCompliments = document.querySelector('.lienCompliments');
    if (linkCompliments) {
        linkCompliments.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\compliments', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }
    const linkGoose = document.querySelector('.lienGoose');
    if (linkGoose) {
        linkGoose.addEventListener('click', e => {
            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\DesktopGoose_0.31\\DesktopGooseV0.31\\DesktopGooseV0.31\\GooseDesktop', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }
    if (mail.backgroundImage) {
        mailOuvertEl.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url('../images/${mail.backgroundImage}')`
        mailOuvertEl.style.backgroundSize = "cover"
        mailOuvertEl.style.backgroundPosition = "center"
    } else {
        mailOuvertEl.style.backgroundImage = "none"
    }

    currentMailIndex = id

    boutonRetourEl.style.animationName = "slideIn"
    boutonRetourEl.style.animationDuration = '0.2s'

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

    boutonRetourEl.style.display = 'none'

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

        if (!listMails[currentMailIndex].bonMail && !listMails[currentMailIndex].lienConsulter) {
            quetes[0].points += 1

            if (quetes[0].points === NBRE_DE_MAUVAIS_MAILS_A_SUPP) {
                quetes[0].fini = true
            }

            afficherReussiteQuete(0)

            console.log(quetes)
        } else if (quetes[1].points === 0 && listMails[currentMailIndex].bonMail){
            quetes[1].points = -1

            afficherReussiteQuete(1)
        }

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

function afficherReussiteQuete(id) {

    fermerNotification()

    // création de tous les éléments
    const notificationDivElement = document.createElement("div")
    const headPElement = document.createElement("p")
    const bodyPElement = document.createElement("p")
    const fermerAElement = document.createElement("a")
    const checkboxDivElement = document.createElement("div")
    const imgElement = document.createElement("img")

    // élément <a> pour la fermeture de la notif
    const imgCroixFermetureElement = document.createElement("img")
    imgCroixFermetureElement.src = "../images/bouton-quitter-fichier.png"

    // head
    headPElement.innerText = "Quêtes"
    headPElement.classList.add("head-notification")

    // body
    if (quetes[id].points < 0) {
        bodyPElement.innerText = quetes[id].label
    } else {
        bodyPElement.innerText = quetes[id].label + " : " + quetes[id].points + "/" + quetes[id].but
    }

    bodyPElement.classList.add("body-notification")

    // changer la couleur d'arrière plan suivant la réussite de la quête ou pas
    if (quetes[id].points >= quetes[id].but) {
        imgCroixFermetureElement.src = "../images/bouton-quitter-fichier.png"
        imgElement.src = "../images/check-icon.png"
        notificationDivElement.classList.add("notif-complete")
        notificationDivElement.classList.remove("notif-non-complete")
        notificationDivElement.classList.remove("notif-lost")
    } else if (quetes[id].points < 0) {
        imgCroixFermetureElement.src = "../images/bouton-quitter-fichier.png"
        imgElement.src = "../images/croix-rouge.png"
        notificationDivElement.classList.add("notif-lost")
        notificationDivElement.classList.remove("notif-non-complete")
        notificationDivElement.classList.remove("notif-complete")
    } else {
        imgCroixFermetureElement.src = "../images/bouton-quitter-noir.png"
        notificationDivElement.classList.add("notif-non-complete")
        notificationDivElement.classList.remove("notif-complete")
        notificationDivElement.classList.remove("notif-lost")

    }

    fermerAElement.appendChild(imgCroixFermetureElement)
    fermerAElement.href = "javascript:void(0)"
    fermerAElement.onclick = fermerNotification

    // check box
    checkboxDivElement.appendChild(imgElement)
    checkboxDivElement.classList.add("check-box")
    notificationDivElement.classList.add("notification");

    // ajout de tous les éléments dans la notificationDivElement
    notificationDivElement.appendChild(fermerAElement)
    notificationDivElement.appendChild(headPElement)
    notificationDivElement.appendChild(checkboxDivElement)
    notificationDivElement.appendChild(bodyPElement)

    notificationDivElement.style.animationName = "appear"
    notificationDivElement.style.animationDuration = '5s'

    document.body.appendChild(notificationDivElement)

    sauvegarderEtatQuetes()

    setTimeout(() => {
        notificationDivElement.style.display = "none"
    }, 4900);
}

function fermerNotification() {
    const notification = document.querySelectorAll('.notification')
    if (notification) {
        notification.forEach(el => {
            el.parentNode.removeChild(el)
        })
    }
}
