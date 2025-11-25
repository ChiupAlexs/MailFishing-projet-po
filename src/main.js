'use strict';
const {exec} = require("child_process");
const events = require("node:events");
const errorSound = new Audio('../sons/error.m4a');
const successSound = new Audio('../sons/success.m4a');
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
let rapports = []
let pagePrincipale = true;

let stressSound = new Audio('../sons/stress.wav');
let scroll = 0

// récupérer compteur existant (0 si absent)
let clicsSuspects = Number(sessionStorage.getItem("clicsSuspects") || 0);

// onglet quêtes
const toggleBtn = document.getElementById('toggleQuetesBtn');
const overlayQuetes = document.getElementById('overlayQuetes');

const soundOpen = new Audio("../sons/toggle-open.mp3");
const soundClose = new Audio("../sons/toggle-close.mp3");
soundOpen.volume = 0.5;
soundClose.volume = 0.5;

let isCollapsed = sessionStorage.getItem("overlayCollapsed") === null
    ? true
    : sessionStorage.getItem("overlayCollapsed") === "true";

let fullHeight

// handler par délégation (capture phase pour intercepter tôt)
function handleSuspectClick(e) {
    const suspectEl = e.target.closest('#popupOkFalse');
    if (!suspectEl) return;
    // incrémenter et sauvegarder
    clicsSuspects++;
    sessionStorage.setItem("clicsSuspects", String(clicsSuspects));
    console.log('[DEBUG] clicsSuspects =', clicsSuspects);

    // Met à jour l'affichage des croix
    const croixContainer = document.getElementById("croixContainer");
    if (croixContainer) {
        const croixList = croixContainer.querySelectorAll("span");
        for (let i = 0; i < 3; i++) {
            croixList[i].style.opacity = (i < clicsSuspects) ? "1" : "0.3";
        }
    }

    // action quand on atteint 3 clics
    if (clicsSuspects >= 3) {
        try {
            e.preventDefault();
        } catch (_) {
        }
        try {
            e.stopImmediatePropagation();
        } catch (_) {
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        try {
            stopStressSound();
        } catch (_) {
        }
        remainingTime = 0;
        sessionStorage.setItem("globalTimerFinished", "true");
        sessionStorage.removeItem("globalTimerRemaining");

        // Supprime les croix après 3 clics
        const croixContainer = document.getElementById("croixContainer");
        if (croixContainer) {
            croixContainer.style.transition = "opacity 0.3s ease";
            croixContainer.style.opacity = "0";
            setTimeout(() => croixContainer.remove(), 300);
        }

        const disp = document.getElementById("timerDisplay");
        if (disp) disp.remove();

        // Attendre un peu avant de changer de page
        setTimeout(() => {
            window.location.href = "../html/menuFinPerdu.html";
        }, 400);
    }

}

// écouter au niveau document (capture=true pour intercepter avant handlers ajoutés après)
document.addEventListener('click', handleSuspectClick, true);

let timerInterval = null;
let remainingTime = 0;
const displayId = "timerDisplay";
let display = document.getElementById(displayId);

function updateDisplay() {
    let minutes = Math.floor(remainingTime / 60);
    let seconds = remainingTime % 60;
    display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    display.style.background = remainingTime <= 30
        ? "rgba(255,0,0,0.8)"
        : "rgba(0,0,0,0.7)";
    if (remainingTime === 30 && !stressSound) {
        stressSound = new Audio('../sons/stress.wav');
        stressSound.volume = 0.6;
        stressSound.loop = true;
        stressSound.play();
    }
}

function stopStressSound() {
    if (stressSound) {
        stressSound.pause();
        stressSound.currentTime = 0;
        stressSound = null;
    }
}

function startGlobalTimer(durationInMinutes, callback) {
    // Si le timer est terminé ou si on est sur la page de fin on ne crée rien
    if (sessionStorage.getItem("globalTimerFinished") === "true" ||
        window.location.pathname.includes("menuFinPerdu.html") ||
        window.location.pathname.includes("menuFinGagne.html")) {
        const display = document.getElementById("timerDisplay");
        if (display) display.remove();
        const croixContainer = document.getElementById("croixContainer");
        if (croixContainer) croixContainer.remove();
        return;
    }

    let display = document.getElementById("timerDisplay");
    const displayId = "timerDisplay";

    // Crée l'affichage si inexistant
    if (!display) {
        display = document.createElement("div");
        display.id = displayId;
        display.style.cssText = `
            margin-top: -9px;
            display: none;
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            font-family:'Comic Sans MS', cursive;
            font-size: 30px;
            font-weight: light;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 11px 20px;
            border-radius: 8px;
            z-index: 1000;
            pointer-events: none;
            transition: background 0.3s;
        `;
        document.body.appendChild(display);

        // conteneur de croix et le texte
        const croixContainer = document.createElement("div");
        croixContainer.id = "croixContainer";
        croixContainer.style.cssText = `
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 24px;
            color: red;
            z-index: 1000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        document.body.appendChild(croixContainer);

        // Conteneur des croix
        const croixRow = document.createElement("div");
        croixRow.style.cssText = `
            display: flex;
            padding: 5px;
            gap: 5px;
        `;
        croixContainer.appendChild(croixRow);

        // Ajoute les trois croix
        for (let i = 0; i < 3; i++) {
            const croix = document.createElement("span");
            croix.textContent = "✖";
            croix.style.cssText = `
                font-size: 42px;
                color: red;
                opacity: ${i < clicsSuspects ? "1" : "0.3"};
                transition: opacity 0.3s;
            `;
            croixRow.appendChild(croix);
        }
    }

    // Vérifier si le timer est déjà terminé
    if (sessionStorage.getItem("globalTimerFinished") === "true") {
        const display = document.getElementById("timerDisplay");
        if (display) display.remove();
        return;
    }

    // Récupérer temps restant depuis sessionStorage si existant
    remainingTime = parseInt(sessionStorage.getItem("globalTimerRemaining"));
    if (isNaN(remainingTime)) remainingTime = durationInMinutes * 60;

    display.style.display = "block";
    let stressSoundPlayed = sessionStorage.getItem("stressSoundPlayed") === "true";

    // Fonction d’affichage du timer
    function updateDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        display.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    updateDisplay();

    // Nettoyer un ancien intervalle si existant
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        remainingTime--;
        sessionStorage.setItem("globalTimerRemaining", remainingTime);
        updateDisplay();


        if (remainingTime <= 0 || sessionStorage.getItem("globalTimerFinished") === "true") {
            clearInterval(timerInterval);
            if (localStorage.getItem("pagePrincipale") === "false") {
                exec('.\\resources\\app\\src\\virus\\closeFrontWindow.exe', (error, stdout, stderr) => {
                });
            }
            timerInterval = null;
            sessionStorage.setItem("globalTimerFinished", "true");
            console.log("true")
            display.style.display = "none";
            const finishSound = new Audio('../sons/finish.mp3');
            finishSound.volume = 1;
            finishSound.play();

            setTimeout(() => {
                stopStressSound()
                display.textContent = "";
                display.style.display = "none";
            }, 1000);

            if (typeof callback === "function") callback();
        }
    }, 1000);
}


// Soustrait un temps au timer global et met à jour sessionStorage
function retirerTemps(secondes) {
    if (remainingTime <= 0) return;

    remainingTime -= secondes;
    if (remainingTime < 0) remainingTime = 0;

    sessionStorage.setItem("globalTimerRemaining", remainingTime);

    const display = document.getElementById("timerDisplay");
    if (display) {
        let minutes = Math.floor(remainingTime / 60);
        let secs = remainingTime % 60;
        display.textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        display.style.background = remainingTime <= 30
            ? "rgba(255,0,0,0.8)"
            : "rgba(0,0,0,0.7)";
        if (remainingTime <= 30 && !stressSound) {
            stressSound = new Audio('../sons/stress.wav');
            stressSound.volume = 0.6;
            stressSound.loop = true;
            stressSound.play();
        }
    }

    // Animation visuelle du chiffre rouge
    const anim = document.createElement("div");
    anim.textContent = `-${secondes}s`;
    anim.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Luckiest Guy', cursive;
        font-size: 40px;
        font-weight: bold;
        text-shadow: 2px 0 #FFFAE3, -2px 0 #FFFAE3, 0 2px #FFFAE3, 0 -2px #FFFAE3,
             1px 1px #FFFAE3, -1px -1px #FFFAE3, 1px -1px #FFFAE3, -1px 1px #FFFAE3;
        color: red;
        opacity: 1;
        pointer-events: none;
        z-index: 2000;
        transition: transform 1s ease-out, opacity 1.2s ease-out;
    `;
    document.body.appendChild(anim);

    setTimeout(() => {
        anim.style.transform = "translate(-50%, 50px)";
        anim.style.opacity = "0";
    }, 50);

    setTimeout(() => anim.remove(), 1050);
    errorSound.volume = 0.5;
    errorSound.play();
}


// Ajoute un temps au timer global et met à jour sessionStorage
function ajouterTemps(secondes) {
    if (remainingTime <= 0) return;

    remainingTime += secondes;

    sessionStorage.setItem("globalTimerRemaining", remainingTime);

    const display = document.getElementById("timerDisplay");
    if (display) {
        let minutes = Math.floor(remainingTime / 60);
        let secs = remainingTime % 60;
        display.textContent = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
        display.style.background = remainingTime <= 30
            ? "rgba(255,0,0,0.8)"
            : "rgba(0,0,0,0.7)";
        if (remainingTime <= 30 && !stressSound) {
            stressSound = new Audio('../sons/stress.wav');
            stressSound.volume = 0.6;
            stressSound.loop = true;
            stressSound.play();
        }
    }

    // Animation visuelle du chiffre vert
    const anim = document.createElement("div");
    anim.textContent = `+${secondes}s`;
    anim.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Luckiest Guy', cursive;
        font-size: 40px;
        font-weight: bold;
        color: limegreen;
        opacity: 1;
        pointer-events: none;
        z-index: 2000;
        transition: transform 1s ease, opacity 1s ease;
        text-shadow: 2px 0 #FFFAE3, -2px 0 #FFFAE3, 0 2px #FFFAE3, 0 -2px #FFFAE3,
                     1px 1px #FFFAE3, -1px -1px #FFFAE3, 1px -1px #FFFAE3, -1px 1px #FFFAE3;
        transition: transform 1s ease-out, opacity 1.2s ease-out;
    `;
    document.body.appendChild(anim);

    setTimeout(() => {
        anim.style.transform = "translate(-50%, 50px)";
        anim.style.opacity = "0";
    }, 50);

    setTimeout(() => anim.remove(), 1050);
}

/******************************** Général ************************************/

window.addEventListener('DOMContentLoaded', () => {

    const btnQuitPart = document.getElementById('QuitPartie')
    const overlayQuit = document.getElementById('overlayQuit')
    const confirmBtn = document.getElementById('confirmBtn')
    const cancelBtn = document.getElementById('cancelBtn')
    const btnMenuPrincipal = document.getElementById('btnMenuPrincipal')
    const btnMenuPrincipalGagne = document.getElementById('btnMenuPrincipalGagne')

    if (btnMenuPrincipal) {
        btnMenuPrincipal.addEventListener("click", () => {
            exec('.\\resources\\app\\src\\virus\\closeGoose.exe', (error, stdout, stderr) => {
                console.log(stderr)
            });
            window.open("MenuDemarrage.html", '_self')
        })
    }
    if (btnMenuPrincipalGagne) {
        btnMenuPrincipalGagne.addEventListener("click", () => {
            exec('.\\resources\\app\\src\\virus\\closeGoose.exe', (error, stdout, stderr) => {
                console.log(stderr)
            });
            window.open("MenuDemarrage.html", '_self')
        })
    }

    if (btnQuitPart) {
        btnQuitPart.addEventListener('click', () => {
            overlayQuit.style.display = 'flex';
        });
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            sessionStorage.clear()
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            overlayQuit.style.display = 'none';
        });
    }

})

/*************************** Menu de démarrage *******************************/

function quitter() {
    window.close();
}

/*************************** Maily *******************************************/

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
    const queteOuvrirMailyElement = document.querySelector(".ouvrirMaily")

    console.log(32323)
    if (sessionStorage.getItem('quetes') === null) {

        quetes = [
            {id: 0, points: 0, but: 5, fini: false, label: "Supprimer 5 mails mauvais"},
            {id: 1, points: 0, but: 1, fini: false, label: "Effectuer la tâche du bon mail"}, // TODO : modifier le label
            {id: 2, points: 0, but: 1, fini: false, label: "Ouvrir Maily"},
        ]

        sessionStorage.setItem('quetes', JSON.stringify(quetes));
    } else {
        quetes = JSON.parse(sessionStorage.getItem('quetes'));
    }

    if (queteSuppMailElement) {

        if (quetes[0].fini) {
            queteSuppMailElement.querySelector("img").src = "../images/check-icon.png"
        }
        if (quetes[1].fini) {
            queteGarderMailElement.querySelector("img").src = "../images/check-icon.png"
        } else if (quetes[1].points < 0) {
            //ajout de croix rouge pour montrer le nombre de faute
            queteGarderMailElement.querySelector("img").src = "../images/cross.png"
            queteGarderMailElement.classList.add("perdu")
        }
        if (quetes[2].fini) {
            queteOuvrirMailyElement.querySelector("img").src = "../images/check-icon.png"
        }
        queteSuppMailElement.querySelector("p").innerText = `Supprimer 5 mauvais mails : ${quetes[0].points} / 5`
    }

    loadQuetesOverlay(null)
}

function sauvegarderEtatQuetes() {
    sessionStorage.setItem('quetes', JSON.stringify(quetes));

    // Vérifie si une quête est perdue
    const quetePerdue = quetes.some(q => q.points < 0);

    // Vérifie si toutes les quêtes sont finies
    const toutesFinies = quetes.every(q => q.fini || q.points < 0);

    if (toutesFinies) {
        if (quetePerdue) {
            console.log("Une quête est perdue => fin du jeu perdue");
            setTimeout(() => {
                window.location.href = "../html/menuFinPerdu.html";
            }, 1000);
        } else {
            console.log("Toutes les quêtes réussies => fin du jeu gagnée");
            setTimeout(() => {
                window.location.href = "../html/menuFinGagne.html";
            }, 1000);
        }
    }
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
    errorSound.volume = 0;
    errorSound.play();
    successSound.volume = 0;
    successSound.play();
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

            // Débloque la partie quêtes
            appLockQuetes?.classList.remove("lockedQuetes");
            lockerQuetes?.remove();

            // Débloque Maily
            appLock?.classList.remove("locked");
            locker?.remove();
            voile?.classList.remove("voile");
            fleche?.remove();
        });
        if (introFini) {
            if (appLockQuetes && lockerQuetes) {
                appLockQuetes.classList.remove("lockedQuetes");
                lockerQuetes.remove()
            }
        }
    }
    if (introFini) {
        fleche?.remove();
        voile?.classList.remove("voile");
        appLock?.classList.remove("locked");
        locker?.remove();

        // Lancer le timer
        startGlobalTimer(5, () => {
            console.log("vrai")
            window.location.href = "../html/menuFinPerdu.html";
        });
    }
    loadQuetes()

    if (sessionStorage.getItem("rapports") === null) {
        sessionStorage.setItem("rapports", JSON.stringify(rapports));
    } else {
        rapports = JSON.parse(sessionStorage.getItem("rapports"));
    }

    isCollapsed = !isCollapsed;
    toggleStateQuestOverlay()

    toggleBtn.addEventListener('click', () => {
        /*isCollapsed = !isCollapsed;
        applyState();
        sessionStorage.setItem("overlayCollapsed", isCollapsed);

        // ✅ jouer le son directement ici (interaction utilisateur garantie)
        if (isCollapsed) {
            soundClose.currentTime = 0;
            soundClose.play()
        } else {
            soundOpen.currentTime = 0;
            soundOpen.play()
        }*/
        toggleStateQuestOverlay()
    });

    fullHeight = overlayQuetes.scrollHeight;

    loadMails()
});

function addRapport() {
    if (listMails[currentMailIndex].lienConsulter !== true) {
        let rapportFinal = {...listMails[currentMailIndex].rapport, bonMail: listMails[currentMailIndex].bonMail}
        rapports.push(rapportFinal);
        sessionStorage.setItem("rapports", JSON.stringify(rapports))
    }
}

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
    if (!quetes[2].fini) {
        quetes[2].fini = true
        quetes[2].points = 1
        sauvegarderEtatQuetes()
        afficherReussiteQuete(2)
    }
}

function createPopUpOkElement() {
    const overlay = document.getElementById("popupOverlayFalse");
    const popupOk = document.getElementById("popupOkFalse");
    const popupContent = document.getElementById("popupContentFalse");
    const popupTitle = document.getElementById("popupTitleFalse");

    const message = "Vous vous êtes fait avoir 🥸 (-10 secondes)";
    popupTitle.innerHTML = "Dommage !";
    popupContent.innerHTML = "";
    popupOk.style.display = "none";

    // Faire apparaître après un certain temps
    setTimeout(() => {
        overlay.classList.remove("hiddenFalse");
        let i = 0;
        const interval = setInterval(() => {
            popupContent.innerHTML += message[i];
            i++;
            if (i >= message.length) {
                clearInterval(interval);
                popupOk.style.display = "inline-block"; // afficher le bouton ok
            }
        }, 100); // vitesse d'affichage (ms par caractère)
    }, 400)

    // Désactiver le bouton pendant 2 secondes
    popupOk.disabled = true;
    popupOk.style.opacity = 0.5;

    setTimeout(() => {
        popupOk.disabled = false;
        popupOk.style.opacity = 1;
    }, 2000);

    // Bouton Confirmer
    popupOk.addEventListener("click", () => {
        overlay.classList.add("hiddenFalse");
        retirerTemps(10);

    }, {once: true});
}

async function ouvrirMail(id) {

    currentMailIndex = id

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

    const aElement = document.querySelector('.lienDraw, .lienBeep, .lienScreen, .bon-lien, .lien, .lienProgress, .lienCompliments, .lienGoose')
    const lienPopUpElement = document.querySelector('.lien-pop-up')
    lienPopUpElement.innerText = listMails[currentMailIndex].lienPopUp
    aElement.addEventListener('mouseenter', () => {
        lienPopUpElement.classList.add('actif')
    })

    aElement.addEventListener('mouseleave', () => {
        lienPopUpElement.classList.remove('actif')
    })

    const linkDraw = document.querySelector('.lienDraw');
    if (linkDraw) {
        linkDraw.addEventListener('click', () => {

            addRapport()

            listMails[currentMailIndex].lienConsulter = true;

            exec('.\\resources\\app\\src\\virus\\dessinVirus', (error, stdout, stderr) => {
                console.log(stderr)
            });

            createPopUpOkElement()
        })
    }
    const linkBeep = document.querySelector('.lienBeep');
    if (linkBeep) {
        linkBeep.addEventListener('click', () => {

            addRapport()

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\beep', (error, stdout, stderr) => {
                console.log(stderr)
            });

            createPopUpOkElement()
        })
    }
    const linkScreen = document.querySelector('.lienScreen');
    if (linkScreen) {
        linkScreen.addEventListener('click', () => {
            addRapport()

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\hackScreen', (error, stdout, stderr) => {
                console.log(stderr)
            });

            createPopUpOkElement()
        })
    }

    const realLink = document.querySelector('.bon-lien');
    if (realLink) {
        realLink.addEventListener('click', () => {
            pagePrincipale = false;
            localStorage.setItem("pagePrincipale", "false");
            if (listMails[currentMailIndex].lienConsulter === true) {
                realLink.href = "javascript:void(0)"
                realLink.target = "_self"
            }

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            if (quetes[1].fini === false) {
                const overlay = document.getElementById("popupOverlayTrue");
                const popupOk = document.getElementById("popupOkTrue");
                const popupContent = document.getElementById("popupContentTrue");
                const popupTitle = document.getElementById("popupTitleTrue");

                // Ajoute l'événement sur tous les liens avec la classe .bon-lien
                popupTitle.innerHTML = "Bravo !"
                popupContent.innerHTML = "Vous avez trouvé le bon mail ☝️🤓<br><strong>(+15sec)</strong>";
                // Faire apparaître après un certain temps
                setTimeout(() => {
                    overlay.classList.remove("hiddenTrue");
                }, 400)

                // Bouton Confirmer
                popupOk.addEventListener("click", () => {
                    overlay.classList.add("hiddenTrue");
                    ajouterTemps(15)


                    // Permet d'indiquer que la quête d'ouverture du bon mail soit complété
                    quetes[1].points = 1
                    quetes[1].fini = true
                    afficherReussiteQuete(1);
                    sauvegarderEtatQuetes();
                }, {once: true})

            }
        })
    }

    const link = document.querySelector('.lien');
    if (link) {
        link.addEventListener('click', () => {
            addRapport()

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()
            pagePrincipale = false;
            localStorage.setItem("pagePrincipale", "false");

            exec('.\\resources\\app\\src\\virus\\Client-built', (error, stdout, stderr) => {
                console.log(stderr)
            });
            createPopUpOkElement()
        })
    }

    const linkDLProgress = document.querySelector('.lienProgress');
    if (linkDLProgress) {
        linkDLProgress.addEventListener('click', () => {
            addRapport()

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\DLProgress', (error, stdout, stderr) => {
                console.log(stderr)
            });

            createPopUpOkElement()
        })
    }

    const linkCompliments = document.querySelector('.lienCompliments');
    if (linkCompliments) {
        linkCompliments.addEventListener('click', () => {
            addRapport()

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\compliments', (error, stdout, stderr) => {
                console.log(stderr)
            });

            createPopUpOkElement()
        })
    }
    const linkGoose = document.querySelector('.lienGoose');
    if (linkGoose) {
        linkGoose.addEventListener('click', () => {
            addRapport()

            listMails[currentMailIndex].lienConsulter = true;
            sauvegarderMail()

            exec('.\\resources\\app\\src\\virus\\DesktopGoose_0.31\\DesktopGooseV0.31\\DesktopGooseV0.31\\GooseDesktop', (error, stdout, stderr) => {
                console.log(stderr)
            });

            createPopUpOkElement()
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
            if (quetes[0].points <= NBRE_DE_MAUVAIS_MAILS_A_SUPP) {
                afficherReussiteQuete(0)
            }

            console.log(quetes)

        } else if (quetes[1].points === 0 && listMails[currentMailIndex].bonMail) {

            quetes[1].points = -1
            afficherReussiteQuete(1)

            addRapport()
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

        // Après avoir mis à jour les points et quêtes
        sauvegarderEtatQuetes();
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

function toggleStateQuestOverlay() {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
        overlayQuetes.classList.add('collapsed');
        toggleBtn.classList.add('rotate');
        overlayQuetes.style.height = "47px";
    } else {
        overlayQuetes.classList.remove('collapsed');
        toggleBtn.classList.remove('rotate');
        overlayQuetes.style.height = fullHeight + "px";
    }

    sessionStorage.setItem("overlayCollapsed", isCollapsed);

    // ✅ jouer le son directement ici (interaction utilisateur garantie)
    if (isCollapsed) {
        soundClose.currentTime = 0;
        soundClose.play()
    } else {
        soundOpen.currentTime = 0;
        soundOpen.play()
    }
}

function loadQuetesOverlay(idWin) {
    const bodyPElement = document.querySelector(".liste-quetes")

    if (bodyPElement) {
        bodyPElement.innerHTML = ""

        for (let quete of quetes) {

            const checkboxDivElement = document.createElement("div")

            const imgElement = document.createElement("img")
            const quetePElement = document.createElement("p")

            checkboxDivElement.classList.add("check-box")
            checkboxDivElement.appendChild(imgElement)


            let queteDiv = document.createElement("div")

            if (quete.points >= quete.but) {
                imgElement.src = "../images/check-icon.png"
            } else if (quete.points < 0) {
                imgElement.src = "../images/croix-rouge.png"
                imgElement.classList.add("lost")
            }

            if (quete.id === idWin) {
                imgElement.style.animationName = "quete-logo-appear"
                imgElement.style.animationDuration = '1s'

                //queteDiv.classList.add("win")
                queteDiv.style.animationName = "quete-light-up"
                queteDiv.style.animationDuration = "4s"
            }

            quetePElement.innerText = quete.label + " : " + quete.points + " / " + quete.but

            if (quete.points < 0) {
                quetePElement.innerText = quete.label
            }
            queteDiv.appendChild(checkboxDivElement)
            queteDiv.appendChild(quetePElement)

            bodyPElement.appendChild(queteDiv)
        }
    }
}

function afficherReussiteQuete(id) {

    loadQuetesOverlay(id)

    if (quetes[id].points >= quetes[id].but) {
        successSound.volume = 0.7;
        successSound.play();
    }

    if (isCollapsed) {
        toggleStateQuestOverlay()
    }

    verifierFinGagner();
    //setTimeout(() => {
    //  document.querySelector("div.win").classList.remove("win")}, 4000)
}

/*************************** page Fin Perdu *************************************/
const video = document.querySelector('.video-bg');
const gameOverScreen = document.getElementById('game-over-screen');
const btnMenuPrincipal = document.getElementById("btnMenuPrincipal");

if(btnMenuPrincipal) {
    btnMenuPrincipal.addEventListener("click", () => {
        exec('.\\resources\\app\\src\\virus\\closeGoose.exe', (error, stdout, stderr) => {
            console.log(stderr)
        });
    })
}

video.addEventListener('ended', () => {

    video.style.opacity = 0;

    // Après le fondu, cacher la vidéo et afficher l'écran Game Over
    setTimeout(() => {
        video.style.display = 'none';
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('visible');

        let persoVideoElement = document.getElementById("perso-video")

        persoVideoElement.addEventListener("ended", () => {

            let gameOverElement = document.querySelector('.game-over')
            gameOverElement.style.animationName = "move-left"
            gameOverElement.style.animationDuration = "2s"
            gameOverElement.style.transform = "translateX(-30vw)"

            let elementRapport = document.querySelector(".rapports")

            elementRapport.style.animationName = "rapport-appear"
            elementRapport.style.animationDuration = "2s"
            elementRapport.style.display = "block"

        })
    }, 2000);
});


/*************************** page Fin Gagner *************************************/

/*************************** Fin Gagner *************************************/

function verifierFinGagner() {
    // Vérifie si toutes les quêtes sont terminées
    const toutesQuetesFinies = quetes.every(q => q.fini === true);
    const btnMenuPrincipalGagne = document.getElementById("btnMenuPrincipalGagne");

    if(btnMenuPrincipalGagne) {
        btnMenuPrincipalGagne.addEventListener("click", () => {
            exec('.\\resources\\app\\src\\virus\\closeGoose.exe', (error, stdout, stderr) => {
                console.log(stderr)
            });
        })
    }


    if (!toutesQuetesFinies) return; // Si toutes les quêtes ne sont pas finies, on ne fait rien

    // Sélectionne la vidéo et l'écran de victoire
    const videoGagner = document.querySelector('.video-bg-win');
    const gameWinScreen = document.getElementById('game-win-screen');

    if (!videoGagner) {
        // Si pas de vidéo, redirection immédiate
        window.location.href = "../html/menuFinGagner.html";
        return;
    }

    // Affiche la vidéo et joue-la
    videoGagner.style.display = 'block';
    videoGagner.style.opacity = 1;
    videoGagner.play();

    // Quand la vidéo se termine
    videoGagner.addEventListener('ended', () => {
        // Fondu de la vidéo
        videoGagner.style.transition = "opacity 2s";
        videoGagner.style.opacity = 0;

        setTimeout(() => {
            videoGagner.style.display = 'none';

            // Affiche éventuellement un écran de victoire si tu veux un overlay
            if (gameWinScreen) {
                gameWinScreen.classList.remove('hidden');
                gameWinScreen.classList.add('visible');
            }

            // Redirection finale
            window.location.href = "../html/menuFinGagner.html";
        }, 2000); // correspond à la durée du fondu
    });
}
