function escapeHTML(value) {
    if (!value) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDescription(description) {
    if (!description) {
        return "";
    }

    const text = String(description).trim();

    const match = text.match(/Title:\s*([\s\S]*?)\s*Abstract:\s*([\s\S]*)/i);

    if (match) {
        const title = escapeHTML(match[1].trim());
        const abstract = escapeHTML(match[2].trim()).replace(/\r\n|\r|\n/g, "<br>");

        return `
            <strong>Title:</strong> ${title}
            <br>
            <strong>Abstract:</strong> ${abstract}
        `;
    }

    return escapeHTML(text).replace(/\r\n|\r|\n/g, "<br>");
}

async function getICSAgendaHTML(icsUrl) {
    if (typeof ICAL === "undefined") {
        throw new Error("ICAL.js is not loaded.");
    }

    const response = await fetch(icsUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch calendar. HTTP status: ${response.status}`);
    }

    const icsText = await response.text();

    const jcalData = ICAL.parse(icsText);
    const calendarComponent = new ICAL.Component(jcalData);

    const events = calendarComponent
        .getAllSubcomponents("vevent")
        .map(component => new ICAL.Event(component))
        .sort((a, b) => {
            return a.startDate.toJSDate() - b.startDate.toJSDate();
        });

    const first_date = new Date("2026-08-18");
    first_date.setHours(0, 0, 0, 0);
    const last_date = new Date("2026-12-01");
    last_date.setHours(0, 0, 0, 0);

    let html = "";

    for (const event of events) {
        const eventDate = event.startDate.toJSDate();

        if (eventDate < first_date || eventDate > last_date) {
            continue;
        }

        const formattedDate = eventDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const title = escapeHTML(event.summary || "Untitled event");
        const description = formatDescription(event.description || "");

        html += `
            <article class="agenda-event">
                <time class="agenda-date" datetime="${eventDate.toISOString()}">
                    ${formattedDate}
                </time>

                <h3 class="agenda-title">
                    ${title}
                </h3>

                ${
                    description
                        ? `<div class="agenda-description">${description}</div>`
                        : ""
                }
            </article>
        `;
    }

    return html || "<p>No upcoming events.</p>";
}

async function loadICSCalendars() {
    const calendarContainers = document.querySelectorAll(".ics-calendar");

    for (const container of calendarContainers) {
        const icsUrl = container.dataset.icsUrl;

        if (!icsUrl) {
            container.innerHTML = "<p>No calendar URL provided.</p>";
            continue;
        }

        try {
            container.innerHTML = await getICSAgendaHTML(icsUrl);
        } catch (error) {
            console.error("Calendar loading error:", error);
            container.innerHTML = `<p>Unable to load calendar events. Error: ${error.message || error}</p>`;
        }
    }
}

loadICSCalendars();