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
