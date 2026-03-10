const computeSummary = (tasks) => {
    const total = tasks.length;
    let completed = 0, partial = 0, missed = 0;

    for (const task of tasks) {
        const r = task.result || {};
        const c = task.config || {};

        switch (task.type) {
            case "checkbox":
                r.completed ? completed++ : missed++;
                break;
            case "timer":
                if (!r.actualMinutes) { missed++; break; }
                r.actualMinutes >= c.targetMinutes ? completed++ : partial++;
                break;
            case "counter":
                if (!r.actualCount) { missed++; break; }
                r.actualCount >= c.targetCount ? completed++ : partial++;
                break;
            case "timed_counter": {
                const timeOk = r.actualMinutes >= c.targetMinutes;
                const countOk = r.actualCount >= c.targetCount;
                if (timeOk && countOk) { completed++; break; }
                if (!r.actualMinutes && !r.actualCount) { missed++; break; }
                partial++;
                break;
            }
            case "note":
                r.note ? completed++ : missed++;
                break;
            case "rating":
                r.rating != null ? completed++ : missed++;
                break;
            default:
                missed++;
        }
    }

    const parts = [`${completed}/${total} tasks completed.`];
    if (partial > 0) parts.push(`${partial} partial.`);
    if (missed > 0) parts.push(`${missed} missed.`);
    return parts.join(" ");
};

module.exports = computeSummary;
