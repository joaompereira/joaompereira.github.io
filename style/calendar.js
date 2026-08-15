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
    if (!description) return "";

    const parsed = parseDescription(String(description));

    if (parsed.title || parsed.abstract) {
        const titleHTML = parsed.title ? `<strong>Title:</strong> ${escapeHTML(parsed.title)}<br>` : "";
        const abstractHTML = parsed.abstract ? `<strong>Abstract:</strong> ${escapeHTML(parsed.abstract).replace(/\r\n|\r|\n/g, "<br>")}` : "";

        return `${titleHTML}${abstractHTML}`;
    }

    return escapeHTML(String(description)).replace(/\r\n|\r|\n/g, "<br>");
}

function parseDescription(text) {
    // Try to extract Title, Abstract, Speaker fields from the description blob
    const result = { title: "", abstract: "", speaker: "" };

    const titleAbstractMatch = text.match(/Title:\s*([\s\S]*?)\s*Abstract:\s*([\s\S]*)/i);
    if (titleAbstractMatch) {
        result.title = titleAbstractMatch[1].trim();
        result.abstract = titleAbstractMatch[2].trim();
    }

    const speakerMatch = text.match(/Speaker:\s*([^\r\n]*)/i) || text.match(/By:\s*([^\r\n]*)/i);
    if (speakerMatch) {
        result.speaker = speakerMatch[1].trim();
    }

    // If no title found but description starts with something like "Title - ..." or the summary might be the title
    return result;
}

function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

async function getICSAgendaHTML(icsUrl) {
    if (typeof ICAL === "undefined") throw new Error("ICAL.js is not loaded.");

    const response = await fetch(icsUrl);
    if (!response.ok) throw new Error(`Failed to fetch calendar. HTTP status: ${response.status}`);

    const icsText = await response.text();
    const jcalData = ICAL.parse(icsText);
    const calendarComponent = new ICAL.Component(jcalData);

    const events = calendarComponent
        .getAllSubcomponents("vevent")
        .map(component => new ICAL.Event(component))
        .sort((a, b) => a.startDate.toJSDate() - b.startDate.toJSDate());

    const first_date = new Date("2026-08-18");
    first_date.setHours(0, 0, 0, 0);
    const last_date = new Date("2026-12-01");
    last_date.setHours(0, 0, 0, 0);

    // Build detailed entries and a compact table
    let detailsHtml = "";
    const rows = [];

    for (const event of events) {
        const eventDate = event.startDate.toJSDate();
        if (eventDate < first_date || eventDate > last_date) continue;

        const formattedDate = eventDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const rawDescription = event.description || "";
        const parsed = parseDescription(String(rawDescription));

        // Speaker should come from the event SUMMARY (empty if absent)
        const speakerText = event.summary || "";
        // Title and abstract are extracted from the DESCRIPTION using the regex
        const titleText = parsed.title || "";

        // Anchor IDs are defined only by the date (YYYY-MM-DD)
        const dateSlug = eventDate.toISOString().slice(0, 10);
        const eventId = `event-${dateSlug}`;

        const title = escapeHTML(titleText);
        const descriptionHTML = formatDescription(rawDescription);

        // Detailed entry with anchors for event and speaker
        detailsHtml += `
            <article class="agenda-event" id="${eventId}">
                <time class="agenda-date" datetime="${eventDate.toISOString()}">
                    ${formattedDate}
                </time>

                ${title ? `<h3 class="agenda-title">${title}</h3>` : ""}

                ${speakerText ? `<p class="agenda-speaker">${escapeHTML(speakerText)}</p>` : ""}

                ${descriptionHTML ? `<div class="agenda-description">${descriptionHTML}</div>` : ""}
            </article>
        `;

        rows.push({ date: formattedDate, speaker: speakerText, title: titleText, eventId });
    }

    // Build the compact table
    if (rows.length === 0) {
        return { tableHtml: "<p>No upcoming events.</p>", detailsHtml: "<p>No upcoming events.</p>" };
    }

    let tableHtml = `
        <table class="agenda-summary" aria-describedby="Upcoming seminar schedule">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Speaker</th>
                    <th>Title</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const r of rows) {
        const dateLink = `#${r.eventId}`;
        tableHtml += `
            <tr>
                <td class="agenda-col-date"><a href="${dateLink}">${escapeHTML(r.date)}</a></td>
                <td class="agenda-col-speaker">${escapeHTML(r.speaker)}</td>
                <td class="agenda-col-title">${escapeHTML(r.title)}</td>
            </tr>
        `;
    }

    tableHtml += `</tbody></table>`;

    return { tableHtml, detailsHtml };
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
            const { tableHtml, detailsHtml } = await getICSAgendaHTML(icsUrl);

            // Populate the summary table if present in the page
            const tableContainer = document.getElementById("agenda-table");
            if (tableContainer) tableContainer.innerHTML = tableHtml;

            // Populate the detailed listing (the existing container)
            container.innerHTML = detailsHtml;
        } catch (error) {
            console.error("Calendar loading error:", error);
            container.innerHTML = `<p>Unable to load calendar events. Error: ${error.message || error}</p>`;
            const tableContainer = document.getElementById("agenda-table");
            if (tableContainer) tableContainer.innerHTML = `<p>Unable to load calendar summary. Error: ${error.message || error}</p>`;
        }
    }
}

loadICSCalendars();