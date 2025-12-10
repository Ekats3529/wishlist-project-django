document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("theme-toggle");
    const darkTheme = document.getElementById("dark-theme");

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        darkTheme.disabled = false;
        toggleButton.textContent = "Светлая тема";
    }

    toggleButton.addEventListener("click", function () {
        if (darkTheme.disabled) {
            darkTheme.disabled = false;
            localStorage.setItem("theme", "dark");
            toggleButton.textContent = "Светлая тема";
        } else {
            darkTheme.disabled = true;
            localStorage.setItem("theme", "light");
            toggleButton.textContent = "Темная тема";
        }
    });
});
