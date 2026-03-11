(function () {
    "use strict";

    const listEl = document.getElementById("history-list");
    const pagination = document.getElementById("pagination");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    const pageInfo = document.getElementById("page-info");

    let currentPage = 1;
    let totalPages = 1;

    const esc = str => String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

    const fmtDate = dateStr =>
        new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
        });

    const taskResult = task => {
        const r = task.result || {};
        const c = task.config || {};
        let label = "—", cls = "badge-neutral";

        switch (task.type) {
            case "checkbox":
                label = r.completed ? "Done" : "Missed";
                cls = r.completed ? "badge-success" : "badge-danger";
                break;
            case "timer":
                if (!r.actualMinutes) { label = "Missed"; cls = "badge-danger"; }
                else if (r.actualMinutes >= c.targetMinutes) { label = r.actualMinutes + " min"; cls = "badge-success"; }
                else { label = r.actualMinutes + "/" + c.targetMinutes + " min"; cls = "badge-warn"; }
                break;
            case "counter":
                if (!r.actualCount) { label = "Missed"; cls = "badge-danger"; }
                else if (r.actualCount >= c.targetCount) { label = "× " + r.actualCount; cls = "badge-success"; }
                else { label = r.actualCount + "/" + c.targetCount; cls = "badge-warn"; }
                break;
            case "timed_counter": {
                const tOk = r.actualMinutes >= c.targetMinutes;
                const cOk = r.actualCount >= c.targetCount;
                if (!r.actualMinutes && !r.actualCount) { label = "Missed"; cls = "badge-danger"; }
                else if (tOk && cOk) { label = r.actualMinutes + "min × " + r.actualCount; cls = "badge-success"; }
                else { label = (r.actualMinutes || 0) + "/" + c.targetMinutes + "min · " + (r.actualCount || 0) + "/" + c.targetCount; cls = "badge-warn"; }
                break;
            }
            case "note":
                label = r.note ? "Written" : "Missed";
                cls = r.note ? "badge-success" : "badge-danger";
                break;
            case "rating":
                label = r.rating != null ? r.rating + "/" + c.maxRating : "Missed";
                cls = r.rating != null ? "badge-success" : "badge-danger";
                break;
        }

        return { label, cls };
    };

    const renderPlan = plan => {
        const taskCount = plan.tasks?.length || 0;
        const tasksHtml = (plan.tasks || []).map(task => {
            const { label, cls } = taskResult(task);
            return `
            <li class="history-task">
                <span class="history-task__title">${esc(task.title)}</span>
                <span class="badge ${cls}">${esc(label)}</span>
            </li>`;
        }).join("");

        return `
        <article class="history-card card">
            <header class="history-card__header">
                <div>
                    <h2 class="history-card__date">${esc(fmtDate(plan.date))}</h2>
                    <p class="history-card__summary">${esc(plan.summary || "No summary")}</p>
                </div>
                <button class="btn btn-ghost btn-sm toggle-tasks"
                        type="button"
                        aria-expanded="false"
                        aria-controls="tasks-${esc(plan._id)}">
                    ${taskCount} task${taskCount !== 1 ? "s" : ""} ↓
                </button>
            </header>

            ${plan.reflection ? `
            <blockquote class="history-card__reflection">
                <p>${esc(plan.reflection)}</p>
            </blockquote>` : ""}

            <ul id="tasks-${esc(plan._id)}" class="history-task-list" hidden>
                ${tasksHtml}
            </ul>
        </article>`;
    };

    const loadPage = async page => {
        listEl.innerHTML = `
            <div class="loading-state">
                <span class="spinner" aria-hidden="true"></span>
                <span>Loading…</span>
            </div>`;
        pagination.hidden = true;

        try {
            const res = await fetch(`/plans/history?page=${page}`, { credentials: "include" });
            const data = await res.json();

            if (!res.ok || !data.plans) {
                listEl.innerHTML = `<p class="empty-state">Failed to load history.</p>`;
                return;
            }

            if (data.plans.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <p>No completed days yet.</p>
                        <p>Complete your first day to see it here.</p>
                    </div>`;
                return;
            }

            listEl.innerHTML = data.plans.map(renderPlan).join("");

            // Expand/collapse task lists
            listEl.querySelectorAll(".toggle-tasks").forEach(btn => {
                btn.addEventListener("click", () => {
                    const expanded = btn.getAttribute("aria-expanded") === "true";
                    const target = document.getElementById(btn.getAttribute("aria-controls"));
                    btn.setAttribute("aria-expanded", String(!expanded));
                    target.hidden = expanded;
                    // Swap the chevron
                    btn.textContent = btn.textContent.replace(expanded ? "↑" : "↓", expanded ? "↓" : "↑");
                });
            });

            totalPages = data.totalPages;
            currentPage = data.page;

            if (totalPages > 1) {
                prevBtn.disabled = currentPage <= 1;
                nextBtn.disabled = currentPage >= totalPages;
                pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                pagination.hidden = false;
            }
        } catch {
            listEl.innerHTML = `<p class="empty-state">Could not load history. Check your connection.</p>`;
        }
    };

    prevBtn?.addEventListener("click", () => { if (currentPage > 1) loadPage(currentPage - 1); });
    nextBtn?.addEventListener("click", () => { if (currentPage < totalPages) loadPage(currentPage + 1); });

    loadPage(1);

})();
