document.getElementById("loginBtn").addEventListener("click", function() {
    const password = document.getElementById("password").value;

    // le mdp
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
});

cacheOeuil = true
function changer() {
    if (cacheOeuil) {
        document.getElementById("password").setAttribute("type", "text");
        document.getElementById("eye").src = "../images/eyeOpen.png";
        cacheOeuil = false
    } else {
        document.getElementById("password").setAttribute("type", "password");
        document.getElementById("eye").src = "../images/eyeClosed.png";
        cacheOeuil = true
    }
}
