document.getElementById("loginBtn").addEventListener("click", function() {
    const password = document.getElementById("password").value;

    // le mdp
    if (password === "AlFloLuLe4") {
        const container = document.getElementById("login-container");
        container.classList.add("fade-out");

        setTimeout(() => {
            window.location.href = "bureau.html";
        }, 1000);
    } else {
        alert("Mot de passe incorrect !");
    }
});
