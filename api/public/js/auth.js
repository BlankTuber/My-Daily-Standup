(function () {
    "use strict";

    const form = document.querySelector("[data-auth-form]");
    const errorEl = document.querySelector("[data-auth-error]");
    const submitBtn = form?.querySelector("[data-submit]");

    if (!form) return;

    const showError = (msg) => {
        if (!errorEl) return;
        errorEl.textContent = msg;
    };

    const clearError = () => {
        if (!errorEl) return;
        errorEl.textContent = "";
    };

    const setLoading = (loading) => {
        if (!submitBtn) return;
        submitBtn.disabled = loading;
        submitBtn.innerHTML = loading
            ? '<span class="spinner" aria-hidden="true"></span> Please wait…'
            : submitBtn.dataset.label;
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearError();

        const action = form.dataset.authForm; // "login" | "register"
        const username = form.username.value.trim();
        const password = form.password.value;

        if (!username || !password) {
            showError("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/auth/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.error || "Something went wrong. Please try again.");
                return;
            }

            window.location.href = "/today";
        } catch {
            showError("Could not connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    });
})();
