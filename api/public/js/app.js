if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW unavailable in this environment — push notifications won't work
    });
}
