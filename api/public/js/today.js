(function () {
    "use strict";

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
    const taskEmptyState = $("task-empty-state");
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

        const CONFIG_REQUIRED = {
            timer: ["targetMinutes"],
            counter: ["targetCount"],
            timed_counter: ["targetMinutes", "targetCount"],
            rating: ["maxRating"],
        };

        const CONFIG_LABELS = {
            targetMinutes: "target minutes",
            targetCount: "target count",
            maxRating: "max rating",
        };

        const configFieldsFor = type => {
            if (type === "timer") return `
            <div class="field">
                <label for="cfg-minutes">Target minutes <span class="field-error">*</span></label>
                <input id="cfg-minutes" type="number" class="input" name="targetMinutes" min="1" placeholder="e.g. 30" required>
            </div>`;
            if (type === "counter") return `
            <div class="field">
                <label for="cfg-count">Target count <span class="field-error">*</span></label>
                <input id="cfg-count" type="number" class="input" name="targetCount" min="1" placeholder="e.g. 10" required>
            </div>`;
            if (type === "timed_counter") return `
            <div class="field-row">
                <div class="field">
                    <label for="cfg-minutes">Target minutes <span class="field-error">*</span></label>
                    <input id="cfg-minutes" type="number" class="input" name="targetMinutes" min="1" placeholder="e.g. 30" required>
                </div>
                <div class="field">
                    <label for="cfg-count">Target count <span class="field-error">*</span></label>
                    <input id="cfg-count" type="number" class="input" name="targetCount" min="1" placeholder="e.g. 10" required>
                </div>
            </div>`;
            if (type === "rating") return `
            <div class="field">
                <label for="cfg-max">Max rating <span class="field-error">*</span></label>
                <input id="cfg-max" type="number" class="input" name="maxRating" min="2" max="10" value="5" required>
            </div>`;
            return "";
        };

        const collectConfig = (container) => {
            const config = {};
            const num = name => {
                const el = container.querySelector(`[name="${name}"]`);
                return el && el.value ? parseInt(el.value, 10) : undefined;
            };
            const mins = num("targetMinutes");
            const count = num("targetCount");
            const max = num("maxRating");
            if (mins !== undefined) config.targetMinutes = mins;
            if (count !== undefined) config.targetCount = count;
            if (max !== undefined) config.maxRating = max;
            return config;
        };

        const validateConfig = (type, container) => {
            const required = CONFIG_REQUIRED[type];
            if (!required) return null;
            for (const field of required) {
                const el = container.querySelector(`[name="${field}"]`);
                const val = el ? parseInt(el.value, 10) : NaN;
                if (!el || isNaN(val) || val < 1) {
                    el?.focus();
                    return `Please enter a valid ${CONFIG_LABELS[field]}`;
                }
            }
            return null;
        };

        const showFieldError = (container, msg) => {
            let errEl = container.querySelector(".builder-field-error");
            if (!errEl) {
                errEl = document.createElement("p");
                errEl.className = "builder-field-error field-error";
                const buttons = container.querySelector(".field-row:last-child");
                container.insertBefore(errEl, buttons);
            }
            errEl.textContent = msg;
        };

        const clearFieldError = (container) => {
            container.querySelector(".builder-field-error")?.remove();
        };

        const bindTypeSelect = (container, existing) => {
            const typeSelect = container.querySelector(".js-task-type");
            const cfgWrap = container.querySelector(".js-cfg-wrap");
            const refreshConfig = () => {
                cfgWrap.innerHTML = configFieldsFor(typeSelect.value);
                clearFieldError(container);
                if (existing && existing.type === typeSelect.value) {
                    const c = existing.config || {};
                    if (c.targetMinutes) { const el = cfgWrap.querySelector("[name=targetMinutes]"); if (el) el.value = c.targetMinutes; }
                    if (c.targetCount) { const el = cfgWrap.querySelector("[name=targetCount]"); if (el) el.value = c.targetCount; }
                    if (c.maxRating) { const el = cfgWrap.querySelector("[name=maxRating]"); if (el) el.value = c.maxRating; }
                }
            };
            refreshConfig();
            typeSelect.addEventListener("change", refreshConfig);
        };

        const typeOptionsHTML = (selectedType) =>
            Object.entries(TYPE_META).map(([value, { emoji, label, hint }]) =>
                `<option value="${value}"${selectedType === value ? " selected" : ""}>${emoji} ${label} — ${hint}</option>`
            ).join("");

        const updateEmptyState = () => {
            if (!taskEmptyState) return;
            taskEmptyState.hidden = tasks.length > 0;
        };

        const renderList = () => {
            taskListEl.innerHTML = "";
            createPlanBtn.disabled = tasks.length === 0;
            addTaskBtn.disabled = false;
            updateEmptyState();

            tasks.forEach((task, i) => {
                const meta = TYPE_META[task.type] || { emoji: "•", label: task.type };
                const parts = [];
                if (task.config?.targetMinutes) parts.push(`${task.config.targetMinutes} min`);
                if (task.config?.targetCount) parts.push(`×${task.config.targetCount}`);
                if (task.config?.maxRating) parts.push(`/${task.config.maxRating}`);

                const div = document.createElement("div");
                div.role = "listitem";
                div.className = "task-card card card-sm";
                div.dataset.taskIndex = i;
                div.innerHTML = `
                <div class="task-card__header">
                    <div class="task-card__title-row">
                        <span class="task-type-pip task-type-pip--${esc(task.type)}" aria-hidden="true"></span>
                        <span class="task-card__title">${esc(task.title)}</span>
                    </div>
                    <div class="task-card__actions">
                        <button class="btn btn-ghost btn-sm js-edit" data-index="${i}"
                                aria-label="Edit ${esc(task.title)}" type="button">Edit</button>
                        <button class="btn btn-ghost btn-sm task-card__remove js-remove" data-index="${i}"
                                aria-label="Remove ${esc(task.title)}" type="button">✕</button>
                    </div>
                </div>
                <div class="task-card__type-label">
                    ${esc(meta.emoji)}&nbsp; ${esc(meta.label)}${parts.length ? " · " + esc(parts.join(" · ")) : ""}
                </div>`;
                taskListEl.appendChild(div);
            });

            taskListEl.querySelectorAll(".js-remove").forEach(btn => {
                btn.addEventListener("click", () => {
                    const idx = parseInt(btn.dataset.index);
                    tasks.splice(idx, 1);
                    editingIndex = null;
                    hideBuilder();
                    renderList();
                });
            });

            taskListEl.querySelectorAll(".js-edit").forEach(btn => {
                btn.addEventListener("click", () => {
                    const idx = parseInt(btn.dataset.index);
                    const card = btn.closest("[role='listitem']");
                    showInlineEdit(idx, card);
                });
            });
        };

        const confirmTask = (container, onSuccess) => {
            const titleInput = container.querySelector(".js-task-title");
            const title = titleInput.value.trim();
            if (!title) { titleInput.focus(); return; }
            const typeSelect = container.querySelector(".js-task-type");
            const configError = validateConfig(typeSelect.value, container);
            if (configError) { showFieldError(container, configError); return; }
            clearFieldError(container);
            const config = collectConfig(container);
            onSuccess({ title, type: typeSelect.value, config });
        };

        const showInlineEdit = (editIdx, cardEl) => {
            if (taskBuilderEl.innerHTML) hideBuilder();
            editingIndex = editIdx;
            addTaskBtn.disabled = true;

            const existing = tasks[editIdx];
            cardEl.innerHTML = `
            <div class="stack-sm">
                <p class="text-sm text-soft" style="font-weight:600">Edit task</p>
                <div class="field">
                    <label for="edit-task-title">Task title</label>
                    <input id="edit-task-title" type="text" class="input js-task-title"
                           value="${esc(existing.title)}" autocomplete="off" required>
                </div>
                <div class="field">
                    <label for="edit-task-type">Type</label>
                    <select id="edit-task-type" class="input js-task-type">
                        ${typeOptionsHTML(existing.type)}
                    </select>
                </div>
                <div class="js-cfg-wrap"></div>
                <div class="field-row">
                    <button class="btn btn-primary btn-sm js-edit-confirm" type="button">Save changes</button>
                    <button class="btn btn-ghost btn-sm js-edit-cancel" type="button">Cancel</button>
                </div>
            </div>`;

            bindTypeSelect(cardEl, existing);
            cardEl.querySelector("#edit-task-title").focus();

            cardEl.querySelector(".js-edit-confirm").addEventListener("click", () => {
                confirmTask(cardEl, (updated) => {
                    tasks[editIdx] = updated;
                    editingIndex = null;
                    renderList();
                });
            });

            cardEl.querySelector(".js-edit-cancel").addEventListener("click", () => {
                editingIndex = null;
                renderList();
            });
        };

        const showBuilder = () => {
            if (editingIndex !== null) {
                editingIndex = null;
                renderList();
            }
            addTaskBtn.disabled = true;

            taskBuilderEl.innerHTML = `
            <div class="task-builder-form card card-sm stack">
                <p class="text-sm text-soft" style="font-weight:600">New task</p>
                <div class="field">
                    <label for="task-title">Task title</label>
                    <input id="task-title" type="text" class="input js-task-title"
                           placeholder="e.g. Morning run" autocomplete="off" required>
                </div>
                <div class="field">
                    <label for="task-type">Type</label>
                    <select id="task-type" class="input js-task-type">
                        ${typeOptionsHTML(null)}
                    </select>
                </div>
                <div class="js-cfg-wrap"></div>
                <div class="field-row">
                    <button id="confirm-add" class="btn btn-primary" type="button">Add task</button>
                    <button id="cancel-add" class="btn btn-ghost" type="button">Cancel</button>
                </div>
            </div>`;

            bindTypeSelect(taskBuilderEl, null);
            taskBuilderEl.querySelector("#task-title").focus();
            taskBuilderEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

            taskBuilderEl.querySelector("#confirm-add").addEventListener("click", () => {
                confirmTask(taskBuilderEl, (task) => {
                    tasks.push(task);
                    hideBuilder();
                    renderList();
                });
            });

            taskBuilderEl.querySelector("#cancel-add").addEventListener("click", hideBuilder);
        };

        const hideBuilder = () => {
            taskBuilderEl.innerHTML = "";
            addTaskBtn.disabled = false;
        };

        addTaskBtn.addEventListener("click", showBuilder);

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
       ACTIVE STATE
       ============================================================ */
    const activeList = $("active-task-list");

    if (activeList) {
        const planDataEl = $("plan-data");
        if (!planDataEl) return;

        const plan = JSON.parse(planDataEl.textContent);
        const planId = plan._id;

        const taskScore = (card) => {
            const type = card.dataset.type;
            const targetMinutes = parseFloat(card.dataset.targetMinutes) || 0;
            const targetCount = parseFloat(card.dataset.targetCount) || 0;

            const getNum = field => {
                const el = card.querySelector(`[data-field="${field}"]`);
                return el ? parseFloat(el.value) || 0 : 0;
            };
            const getBool = field => {
                const el = card.querySelector(`[data-field="${field}"]`);
                return el ? el.checked : false;
            };
            const getText = field => {
                const el = card.querySelector(`[data-field="${field}"]`);
                return el ? el.value.trim() : "";
            };
            const getTouched = field => {
                const el = card.querySelector(`[data-field="${field}"]`);
                return el ? el.dataset.touched === "true" : false;
            };

            switch (type) {
                case "checkbox":
                    return getBool("completed") ? 2 : 1;
                case "timer": {
                    const v = getNum("actualMinutes");
                    if (v === 0) return 1;
                    return v >= targetMinutes ? 2 : 0;
                }
                case "counter": {
                    const v = getNum("actualCount");
                    if (v === 0) return 1;
                    return v >= targetCount ? 2 : 0;
                }
                case "timed_counter": {
                    const m = getNum("actualMinutes");
                    const c = getNum("actualCount");
                    if (m === 0 && c === 0) return 1;
                    if (m >= targetMinutes && c >= targetCount) return 2;
                    return 0;
                }
                case "note":
                    return getText("note") ? 2 : 1;
                case "rating":
                    return getTouched("rating") ? 2 : 1;
                default:
                    return 1;
            }
        };

        const updateCardStyle = (card) => {
            const score = taskScore(card);
            card.classList.toggle("task-card--done", score === 2);
            card.classList.toggle("task-card--active-in-progress", score === 0);
            if (score === 2) card.classList.remove("task-card--active-in-progress");
            if (score === 0) card.classList.remove("task-card--done");
            if (score === 1) {
                card.classList.remove("task-card--done");
                card.classList.remove("task-card--active-in-progress");
            }
        };

        const sortTasks = () => {
            const cards = [...activeList.querySelectorAll(".task-card")];
            const beforeRects = new Map(cards.map(c => [c, c.getBoundingClientRect()]));

            cards.sort((a, b) => {
                const sa = taskScore(a);
                const sb = taskScore(b);
                if (sa !== sb) return sa - sb;
                return parseInt(a.dataset.originalIndex || 0) - parseInt(b.dataset.originalIndex || 0);
            });
            cards.forEach(card => activeList.appendChild(card));

            cards.forEach(card => {
                const before = beforeRects.get(card);
                const after = card.getBoundingClientRect();
                const dy = before.top - after.top;
                if (Math.abs(dy) < 1) return;
                card.style.transition = "none";
                card.style.transform = `translateY(${dy}px)`;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        card.style.transition = "transform 0.35s ease";
                        card.style.transform = "";
                    });
                });
            });
        };

        activeList.querySelectorAll("[data-field='rating']").forEach(input => {
            const display = input.closest(".field").querySelector("[data-rating-display]");
            if (display) {
                display.textContent = input.value;
                input.addEventListener("input", () => {
                    display.textContent = input.value;
                    input.dataset.touched = "true";
                });
            }
        });

        activeList.querySelectorAll(".task-card").forEach(card => updateCardStyle(card));
        sortTasks();

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
                else if (input.type === "range") result[f] = input.dataset.touched === "true" ? parseFloat(input.value) : null;
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
                    updateCardStyle(card);
                    sortTasks();
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
                    updateCardStyle(card);
                    clearTimeout(timers[taskId]);
                    timers[taskId] = setTimeout(
                        () => saveTask(card, taskId),
                        immediate ? 0 : 700
                    );
                    if (immediate) sortTasks();
                });

                if (input.tagName === "TEXTAREA" || input.type === "text") {
                    input.addEventListener("blur", () => {
                        clearTimeout(timers[taskId]);
                        saveTask(card, taskId);
                    });
                }
            });
        });

        const completeModal = $("complete-modal");
        const completeBtn = $("complete-btn");
        const confirmCompleteBtn = $("confirm-complete-btn");
        const cancelCompleteBtn = $("cancel-complete-btn");

        const closeCompleteModal = () => { completeModal.hidden = true; };

        completeBtn?.addEventListener("click", () => {
            completeModal.hidden = false;
            completeModal.querySelector("textarea")?.focus();
        });

        cancelCompleteBtn?.addEventListener("click", closeCompleteModal);

        completeModal?.addEventListener("click", e => {
            if (e.target === completeModal) closeCompleteModal();
        });

        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && completeModal && !completeModal.hidden) closeCompleteModal();
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
