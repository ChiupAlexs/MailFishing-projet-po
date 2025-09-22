// validation du mdp
function validerMotDePasse() {
    const password = document.getElementById("password").value;

    if (password === "1234") {
        const container = document.getElementById("login-container");
        container.classList.add("fade-out");

        setTimeout(() => {
            window.location.href = "bureau.html";
        }, 1000);
    } else {
        const input = document.getElementById("password");
        input.classList.add("error");

        setTimeout(() => {
            input.classList.remove("error");
        }, 300);
    }
}

// Click btn connexion
document.getElementById("loginBtn").addEventListener("click", validerMotDePasse);

// Touche Enter
document.getElementById("password").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        validerMotDePasse();
    }
});

// mdp caché et affiché
let cacheOeuil = true;
function changer() {
    if (cacheOeuil) {
        document.getElementById("password").setAttribute("type", "text");
        document.getElementById("eye").src = "../images/eyeOpen.png";
        cacheOeuil = false;
    } else {
        document.getElementById("password").setAttribute("type", "password");
        document.getElementById("eye").src = "../images/eyeClosed.png";
        cacheOeuil = true;
    }
}