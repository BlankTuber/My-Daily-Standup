(function () {
    "use strict";

    /* ============================================================
       UTILITIES
       ============================================================ */
    const $ = id => document.getElementById(id);

    const esc = str => String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

    const setLoading = (btn, loading) => {
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<span class="spinner" aria-hidden="true"></span> Please wait…'
            : btn.dataset.label;
    };

    /* ============================================================
       CREATE PLAN STATE
       ============================================================ */
    const addTaskBtn = $("add-task-btn");
    const createPlanBtn = $("create-plan-btn");
    const taskListEl = $("task-list");
    const taskBuilderEl = $("task-builder");

    if (addTaskBtn) {
        const tasks = [];
        let editingIndex = null;

        const TYPE_META = {
            checkbox: { emoji: "☑️", label: "Checkbox", hint: "Done / not done" },
            timer: { emoji: "⏱️", label: "Timer", hint: "Track time spent" },
            counter: { emoji: "🔢", label: "Counter", hint: "Track a count" },
            timed_counter: { emoji: "⏱️🔢", label: "Timed counter", hint: "Time + count" },
            note: { emoji: "📝", label: "Note", hint: "Write something" },
            rating: { emoji: "⭐", label: "Rating", hint: "Rate 1–N" },
        };

        const configFieldsFor = type => {
            if (type === "timer") return `
            <div class="field">
                <label for="cfg-minutes">Target minutes</label>
                <input id="cfg-minutes" type="number" class="input" name="targetMinutes" min="1" placeholder="30">
            </div>`;
            if (type === "counter") return `
            <div class="field">
                <label for="cfg-count">Target count</label>
                <input id="cfg-count" type="number" class="input" name="targetCount" min="1" placeholder="10">
            </div>`;
            if (type === "timed_counter") return `
            <div class="field-row">
                <div class="field">
                    <label for="cfg-minutes">Target minutes</label>
                    <input id="cfg-minutes" type="number" class="input" name="targetMinutes" min="1" placeholder="30">
                </div>
                <div class="field">
                    <label for="cfg-count">Target count</label>
                    <input id="cfg-count" type="number" class="input" name="targetCount" min="1" placeholder="10">
                </div>
            </div>`;
            if (type === "rating") return `
            <div class="field">
                <label for="cfg-max">Max rating</label>
                <input id="cfg-max" type="number" class="input" name="maxRating" min="2" max="10" value="5">
            </div>`;
            return "";
        };

        const renderList = () => {
            taskListEl.innerHTML = "";
            createPlanBtn.disabled = tasks.length === 0;

            tasks.forEach((task, i) => {
                const meta = TYPE_META[task.type] || { emoji: "•", label: task.type };
                const parts = [];
                if (task.config.targetMinutes) parts.push(`${task.config.targetMinutes} min`);
                if (task.config.targetCount) parts.push(`×${task.config.targetCount}`);
                if (task.config.maxRating) parts.push(`/${task.config.maxRating}`);

                const div = document.createElement("div");
                div.role = "listitem";
                div.className = "task-card card card-sm";
                div.innerHTML = `
                <div class="task-card__header">
                    <div class="task-card__title-row">
                        <span class="task-type-pip task-type-pip--${esc(task.type)}" aria-hidden="true"></span>
                        <span class="task-card__title">${esc(task.title)}</span>
                    </div>
                    <div class="task-card__actions">
                        <button class="btn btn-ghost btn-sm" data-edit="${i}"
                                aria-label="Edit ${esc(task.title)}" type="button">Edit</button>
                        <button class="btn btn-ghost btn-sm task-card__remove" data-remove="${i}"
                                aria-label="Remove ${esc(task.title)}" type="button">✕</button>
                    </div>
                </div>
                <div class="task-card__type-label">
                    ${esc(meta.emoji)}&nbsp; ${esc(meta.label)}${parts.length ? " · " + esc(parts.join(" · ")) : ""}
                </div>
            `;
                taskListEl.appendChild(div);
            });

            taskListEl.querySelectorAll("[data-remove]").forEach(btn => {
                btn.addEventListener("click", () => {
                    tasks.splice(parseInt(btn.dataset.remove), 1);
                    if (editingIndex !== null) { hideBuilder(); }
                    renderList();
                });
            });

            taskListEl.querySelectorAll("[data-edit]").forEach(btn => {
                btn.addEventListener("click", () => {
                    showBuilder(parseInt(btn.dataset.edit));
                });
            });
        };

        const showBuilder = (editIdx = null) => {
            editingIndex = editIdx;
            const existing = editIdx !== null ? tasks[editIdx] : null;

            taskBuilderEl.innerHTML = `
            <div class="task-builder-form card card-sm stack">
                <p class="text-sm text-soft" style="font-weight:600">
                    ${existing ? "Edit task" : "New task"}
                </p>
                <div class="field">
                    <label for="task-title">Task title</label>
                    <input id="task-title" type="text" class="input"
                           placeholder="e.g. Morning run" autocomplete="off" required
                           value="${existing ? esc(existing.title) : ""}">
                </div>
                <div class="field">
                    <label for="task-type">Type</label>
                    <select id="task-type" class="input">
                        ${Object.entries(TYPE_META).map(([value, { emoji, label, hint }]) =>
                `<option value="${value}"${existing && existing.type === value ? " selected" : ""}>
                                ${emoji} ${label} — ${hint}
                            </option>`
            ).join("")}
                    </select>
                </div>
                <div id="cfg-wrap"></div>
                <div class="field-row">
                    <button id="confirm-add" class="btn btn-primary" type="button">
                        ${existing ? "Save changes" : "Add task"}
                    </button>
                    <button id="cancel-add" class="btn btn-ghost" type="button">Cancel</button>
                </div>
            </div>
        `;

            const typeSelect = taskBuilderEl.querySelector("#task-type");
            const cfgWrap = taskBuilderEl.querySelector("#cfg-wrap");

            const refreshConfig = () => {
                cfgWrap.innerHTML = configFieldsFor(typeSelect.value);
                // Restore existing config values if editing
                if (existing && existing.type === typeSelect.value) {
                    const c = existing.config || {};
                    if (c.targetMinutes) { const el = cfgWrap.querySelector("[name=targetMinutes]"); if (el) el.value = c.targetMinutes; }
                    if (c.targetCount) { const el = cfgWrap.querySelector("[name=targetCount]"); if (el) el.value = c.targetCount; }
                    if (c.maxRating) { const el = cfgWrap.querySelector("[name=maxRating]"); if (el) el.value = c.maxRating; }
                }
            };
            refreshConfig();
            typeSelect.addEventListener("change", refreshConfig);

            taskBuilderEl.querySelector("#confirm-add").addEventListener("click", () => {
                const titleInput = taskBuilderEl.querySelector("#task-title");
                const title = titleInput.value.trim();
                if (!title) { titleInput.focus(); return; }

                const config = {};
                const num = name => {
                    const el = taskBuilderEl.querySelector(`[name="${name}"]`);
                    return el && el.value ? parseInt(el.value, 10) : undefined;
                };
                const mins = num("targetMinutes");
                const count = num("targetCount");
                const max = num("maxRating");
                if (mins !== undefined) config.targetMinutes = mins;
                if (count !== undefined) config.targetCount = count;
                if (max !== undefined) config.maxRating = max;

                const updated = { title, type: typeSelect.value, config };

                if (editingIndex !== null) {
                    tasks[editingIndex] = updated;
                } else {
                    tasks.push(updated);
                }

                hideBuilder();
                renderList();
            });

            taskBuilderEl.querySelector("#cancel-add").addEventListener("click", hideBuilder);
            taskBuilderEl.querySelector("#task-title").focus();
            addTaskBtn.disabled = true;

            // Scroll builder into view on mobile
            taskBuilderEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        };

        const hideBuilder = () => {
            editingIndex = null;
            taskBuilderEl.innerHTML = "";
            addTaskBtn.disabled = false;
        };

        addTaskBtn.addEventListener("click", () => showBuilder());

        createPlanBtn.addEventListener("click", async () => {
            if (!tasks.length) return;
            setLoading(createPlanBtn, true);
            try {
                const res = await fetch("/plans", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ tasks }),
                });
                if (res.ok) { window.location.reload(); return; }
                const data = await res.json();
                alert(data.error || "Failed to create plan.");
            } catch { alert("Could not connect. Please try again."); }
            setLoading(createPlanBtn, false);
        });

        renderList();
    }

    /* ============================================================
       DRAFT STATE — activate
       ============================================================ */
    const activateBtn = $("activate-btn");

    if (activateBtn) {
        activateBtn.addEventListener("click", async () => {
            setLoading(activateBtn, true);
            try {
                const res = await fetch(`/plans/${activateBtn.dataset.planId}/activate`, {
                    method: "PATCH",
                    credentials: "include",
                });
                if (res.ok) { window.location.reload(); return; }
                const data = await res.json();
                alert(data.error || "Failed to activate.");
            } catch { alert("Could not connect. Please try again."); }
            setLoading(activateBtn, false);
        });
    }

    /* ============================================================
       ACTIVE STATE — auto-save tasks + complete flow
       ============================================================ */
    const activeList = $("active-task-list");

    if (activeList) {
        const planDataEl = $("plan-data");
        if (!planDataEl) return;

        const plan = JSON.parse(planDataEl.textContent);
        const planId = plan._id;

        // Init range displays
        activeList.querySelectorAll("[data-field='rating']").forEach(input => {
            const display = input.closest(".field").querySelector("[data-rating-display]");
            if (display) {
                display.textContent = input.value;
                input.addEventListener("input", () => { display.textContent = input.value; });
            }
        });

        // Per-task save timers
        const timers = {};

        const setStatus = (card, state, msg) => {
            const el = card.querySelector(".task-save-status");
            if (!el) return;
            el.textContent = msg;
            el.className = `task-save-status${state ? " status-" + state : ""}`;
        };

        const collectResult = card => {
            const result = {};
            card.querySelectorAll(".task-input").forEach(input => {
                const f = input.dataset.field;
                if (input.type === "checkbox") result[f] = input.checked;
                else if (input.type === "number") result[f] = input.value !== "" ? parseFloat(input.value) : null;
                else if (input.type === "range") result[f] = parseFloat(input.value);
                else result[f] = input.value.trim() || null;
            });
            return result;
        };

        const saveTask = async (card, taskId) => {
            setStatus(card, "saving", "saving…");
            try {
                const res = await fetch(`/plans/${planId}/tasks/${taskId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ result: collectResult(card) }),
                });
                if (res.ok) {
                    setStatus(card, "saved", "saved ✓");
                    setTimeout(() => setStatus(card, "", ""), 2000);
                } else {
                    setStatus(card, "error", "error ✕");
                }
            } catch {
                setStatus(card, "error", "offline ✕");
            }
        };

        activeList.querySelectorAll(".task-card").forEach(card => {
            const taskId = card.dataset.taskId;

            card.querySelectorAll(".task-input").forEach(input => {
                const immediate = input.type === "checkbox";
                const eventType = immediate ? "change" : "input";

                input.addEventListener(eventType, () => {
                    setStatus(card, "pending", "unsaved…");
                    clearTimeout(timers[taskId]);
                    timers[taskId] = setTimeout(
                        () => saveTask(card, taskId),
                        immediate ? 0 : 700
                    );
                });

                // Flush on blur for text inputs
                if (input.tagName === "TEXTAREA" || input.type === "text") {
                    input.addEventListener("blur", () => {
                        clearTimeout(timers[taskId]);
                        saveTask(card, taskId);
                    });
                }
            });
        });

        // Complete-day flow
        const completeBtn = $("complete-btn");
        const reflectionArea = $("reflection-area");
        const confirmCompleteBtn = $("confirm-complete-btn");
        const cancelCompleteBtn = $("cancel-complete-btn");

        completeBtn?.addEventListener("click", () => {
            reflectionArea.hidden = false;
            completeBtn.hidden = true;
            reflectionArea.querySelector("textarea")?.focus();
        });

        cancelCompleteBtn?.addEventListener("click", () => {
            reflectionArea.hidden = true;
            completeBtn.hidden = false;
        });

        confirmCompleteBtn?.addEventListener("click", async () => {
            const reflection = ($("reflection-input")?.value?.trim()) || "";
            setLoading(confirmCompleteBtn, true);
            try {
                const res = await fetch(`/plans/${planId}/complete`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ reflection }),
                });
                if (res.ok) { window.location.reload(); return; }
                const data = await res.json();
                alert(data.error || "Failed to complete.");
            } catch { alert("Could not connect. Please try again."); }
            setLoading(confirmCompleteBtn, false);
        });
    }

})();
