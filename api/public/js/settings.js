(function () {
    "use strict";

    const setLoading = (btn, loading) => {
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<span class="spinner" aria-hidden="true"></span>'
            : btn.dataset.label;
    };

    /* ============================================================
       TIMEZONE
       ============================================================ */
    const tzSelect = document.getElementById("timezone-select");
    const saveTzBtn = document.getElementById("save-tz-btn");
    const tzStatus = document.getElementById("tz-status");

    const TIMEZONES = [
        { label: "UTC−12:00", offset: -12 },
        { label: "UTC−11:00", offset: -11 },
        { label: "UTC−10:00  Hawaii", offset: -10 },
        { label: "UTC−09:00  Alaska", offset: -9 },
        { label: "UTC−08:00  Pacific Time", offset: -8 },
        { label: "UTC−07:00  Mountain Time", offset: -7 },
        { label: "UTC−06:00  Central Time", offset: -6 },
        { label: "UTC−05:00  Eastern Time", offset: -5 },
        { label: "UTC−04:00  Atlantic Time", offset: -4 },
        { label: "UTC−03:00  Buenos Aires", offset: -3 },
        { label: "UTC−02:00", offset: -2 },
        { label: "UTC−01:00  Azores", offset: -1 },
        { label: "UTC+00:00  London, Dublin", offset: 0 },
        { label: "UTC+01:00  Paris, Berlin", offset: 1 },
        { label: "UTC+02:00  Helsinki, Cairo", offset: 2 },
        { label: "UTC+03:00  Moscow, Istanbul", offset: 3 },
        { label: "UTC+03:30  Tehran", offset: 3.5 },
        { label: "UTC+04:00  Dubai", offset: 4 },
        { label: "UTC+04:30  Kabul", offset: 4.5 },
        { label: "UTC+05:00  Karachi", offset: 5 },
        { label: "UTC+05:30  India", offset: 5.5 },
        { label: "UTC+05:45  Nepal", offset: 5.75 },
        { label: "UTC+06:00  Dhaka", offset: 6 },
        { label: "UTC+06:30  Yangon", offset: 6.5 },
        { label: "UTC+07:00  Bangkok, Jakarta", offset: 7 },
        { label: "UTC+08:00  Beijing, Singapore", offset: 8 },
        { label: "UTC+09:00  Tokyo, Seoul", offset: 9 },
        { label: "UTC+09:30  Adelaide", offset: 9.5 },
        { label: "UTC+10:00  Sydney", offset: 10 },
        { label: "UTC+11:00  Solomon Islands", offset: 11 },
        { label: "UTC+12:00  Auckland", offset: 12 },
        { label: "UTC+13:00  Samoa", offset: 13 },
        { label: "UTC+14:00  Line Islands", offset: 14 },
    ];

    if (tzSelect) {
        const currentOffset = parseFloat(tzSelect.dataset.current || "0");
        const browserOffset = -(new Date().getTimezoneOffset() / 60);

        TIMEZONES.forEach(tz => {
            const opt = document.createElement("option");
            opt.value = tz.offset;
            opt.textContent = tz.label + (tz.offset === browserOffset ? "  ← your browser" : "");
            opt.selected = tz.offset === currentOffset;
            tzSelect.appendChild(opt);
        });

        saveTzBtn?.addEventListener("click", async () => {
            setLoading(saveTzBtn, true);
            tzStatus.textContent = "";
            try {
                const res = await fetch("/auth/me", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ timezoneOffset: parseFloat(tzSelect.value) }),
                });
                tzStatus.textContent = res.ok ? "Saved ✓" : "Failed to save";
            } catch {
                tzStatus.textContent = "Connection error";
            }
            setLoading(saveTzBtn, false);
        });
    }

    /* ============================================================
       PUSH NOTIFICATIONS
       ============================================================ */
    const pushBtn = document.getElementById("push-toggle-btn");
    const pushDesc = document.getElementById("push-status-desc");

    const setPushUI = subscribed => {
        pushBtn.hidden = false;
        pushDesc.textContent = subscribed
            ? "You'll receive morning and evening reminders."
            : "Not subscribed.";
        pushBtn.textContent = subscribed ? "Unsubscribe" : "Enable notifications";
        pushBtn.className = subscribed
            ? "btn btn-sm btn-ghost"
            : "btn btn-sm btn-outline";
    };

    const urlBase64ToUint8Array = b64 => {
        const padding = "=".repeat((4 - b64.length % 4) % 4);
        const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
        const raw = atob(base64);
        return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
    };

    const initPush = async () => {
        if (!("Notification" in window)) { pushDesc.textContent = "No Notification API"; return; }
        if (!("serviceWorker" in navigator)) { pushDesc.textContent = "No serviceWorker API"; return; }
        if (!("PushManager" in window)) { pushDesc.textContent = "No PushManager API"; return; }

        let reg;
        try {
            reg = await navigator.serviceWorker.register("/sw.js");
            console.log("SW state:", reg.active?.state, "| installing:", !!reg.installing, "| waiting:", !!reg.waiting);
        } catch (err) {
            pushDesc.textContent = "SW register failed: " + err.message;
            return;
        }

        if (reg.installing || reg.waiting) {
            await new Promise(resolve => {
                const sw = reg.installing || reg.waiting;
                sw.addEventListener("statechange", function handler() {
                    console.log("SW statechange:", this.state);
                    if (this.state === "activated") {
                        sw.removeEventListener("statechange", handler);
                        resolve();
                    }
                });
                setTimeout(resolve, 4000);
            });
        }

        if (!reg.pushManager) {
            pushDesc.textContent = "pushManager not available on registration";
            return;
        }

        let existing;
        try {
            existing = await reg.pushManager.getSubscription();
        } catch (err) {
            pushDesc.textContent = "getSubscription failed: " + err.message;
            return;
        }

        setPushUI(!!existing);

        pushBtn.addEventListener("click", async () => {
            pushBtn.disabled = true;
            const current = await reg.pushManager.getSubscription();

            if (current) {
                await current.unsubscribe();
                await fetch("/push/unsubscribe", { method: "DELETE", credentials: "include" });
                setPushUI(false);
            } else {
                if (Notification.permission === "denied") {
                    pushDesc.textContent = "Notifications are blocked. Please enable them in your browser settings.";
                    pushBtn.disabled = false;
                    return;
                }
                try {
                    const keyRes = await fetch("/push/vapid-public-key", { credentials: "include" });
                    if (!keyRes.ok) throw new Error("No VAPID key");
                    const { publicKey } = await keyRes.json();

                    const sub = await reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicKey),
                    });

                    await fetch("/push/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ subscription: sub }),
                    });
                    setPushUI(true);
                } catch (err) {
                    console.error("Subscribe error:", err);
                    pushDesc.textContent = "Could not subscribe: " + err.message;
                }
            }
            pushBtn.disabled = false;
        });
    };

    initPush();

    /* ============================================================
       LOGOUT
       ============================================================ */
    document.getElementById("logout-btn")?.addEventListener("click", async function () {
        setLoading(this, true);
        try { await fetch("/auth/logout", { method: "DELETE", credentials: "include" }); } catch { /* ignore */ }
        window.location.href = "/login";
    });

    /* ============================================================
   DELETE ACCOUNT
   ============================================================ */
    const deleteAccountBtn = document.getElementById("delete-account-btn");
    const deleteConfirmArea = document.getElementById("delete-confirm-area");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    const deleteError = document.getElementById("delete-error");
    const deletePassword = document.getElementById("delete-password");

    deleteAccountBtn?.addEventListener("click", () => {
        deleteConfirmArea.hidden = false;
        deleteAccountBtn.hidden = true;
        deletePassword.focus();
    });

    cancelDeleteBtn?.addEventListener("click", () => {
        deleteConfirmArea.hidden = true;
        deleteAccountBtn.hidden = false;
        deletePassword.value = "";
        deleteError.textContent = "";
    });

    confirmDeleteBtn?.addEventListener("click", async () => {
        const password = deletePassword.value;
        if (!password) { deletePassword.focus(); return; }

        deleteError.textContent = "";
        setLoading(confirmDeleteBtn, true);

        try {
            const res = await fetch("/auth/me", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (!res.ok) {
                deleteError.textContent = data.error || "Failed to delete account.";
                setLoading(confirmDeleteBtn, false);
                return;
            }

            window.location.href = "/register";
        } catch {
            deleteError.textContent = "Could not connect. Please try again.";
            setLoading(confirmDeleteBtn, false);
        }
    });

})();
