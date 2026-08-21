function escapeHTML(value) {
    if (!value) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toDate(value) {
    if (value instanceof Date) return value;
    if (!value) return null;

    const text = String(value).trim();
    const ymdMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
        const year = Number(ymdMatch[1]);
        const monthIndex = Number(ymdMatch[2]) - 1;
        const day = Number(ymdMatch[3]);
        return new Date(year, monthIndex, day);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLocalDateSlug(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toTimeText(value) {
    if (!value) return "";
    if (value instanceof Date) {
        return value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }

    const text = String(value).trim();
    if (!text) return "";

    const dateCandidate = new Date(text);
    if (!Number.isNaN(dateCandidate.getTime()) && /\d{4}-\d{2}-\d{2}|T/i.test(text)) {
        return dateCandidate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }

    return text;
}

function formatTimeRange(startTime, endTime) {
    if (startTime && endTime) {
        if ((startTime.slice(-2) === "AM" || startTime.slice(-2) === "PM") && startTime.slice(-2) === endTime.slice(-2)) {
            return `${startTime.slice(0, -2).trim()}–${endTime}`;
        }

        return `${startTime}–${endTime}`;
    }

    return startTime || endTime || "";
}

function escapeHTMLPreserveLineBreaks(value) {
    return escapeHTML(value).replace(/\r\n|\r|\n/g, "<br>");
}

function linkifyText(value) {
    if (!value) return "";

    const text = String(value);
    const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;

    return text.replace(urlRegex, (url) => {
        const trimmed = url.replace(/[.,;:!?)]*$/, "");
        const trailing = url.slice(trimmed.length);
        const escapedUrl = escapeHTML(trimmed);

        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedUrl}</a>${escapeHTML(trailing)}`;
    });
}

function normalizeSeminar(item) {
    const date = toDate(item?.date);
    if (!date) return null;

    const speaker = item?.speaker ? String(item.speaker).trim() : "";
    const institution = item?.institution ? String(item.institution).trim() : "";
    const title = item?.title ? String(item.title).trim() : "";
    const location = item?.location ? String(item.location).trim() : "";
    const abstractText = item?.abstract ? String(item.abstract).trim() : "";
    const startTime = toTimeText(item?.startTime).trim().toUpperCase();
    const endTime = toTimeText(item?.endTime).trim().toUpperCase();

    return { date, speaker, institution, title, location, abstractText, startTime, endTime };
}

async function getSheetsAgendaHTML(endpointUrl) {
    const response = await fetch(endpointUrl);
    if (!response.ok) throw new Error(`Failed to fetch seminar data. HTTP status: ${response.status}`);

    const rawData = await response.json();
    if (!Array.isArray(rawData)) throw new Error("Seminar endpoint did not return a JSON array.");

    const events = rawData
        .map(normalizeSeminar)
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);

    const first_date = new Date(2026, 7, 18);
    first_date.setHours(0, 0, 0, 0);
    const last_date = new Date(2026, 11, 1);
    last_date.setHours(0, 0, 0, 0);

    // Build detailed entries and a compact table
    let detailsHtml = "";
    const rows = [];

    for (const event of events) {
        const eventDate = event.date;
        if (eventDate < first_date || eventDate > last_date) continue;

        const formattedDate = eventDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const speakerText = event.speaker;
        const institutionText = event.institution;
        const titleText = event.title;
        const abstractText = event.abstractText;
        const locationText = event.location;
        const locationHtml = linkifyText(escapeHTML(locationText));
        const timeText = formatTimeRange(event.startTime, event.endTime);

        // Anchor IDs are defined only by the date (YYYY-MM-DD)
        const dateSlug = getLocalDateSlug(eventDate);
        const eventId = `event-${dateSlug}`;

        const dateLine = [formattedDate, timeText].filter(Boolean).join(", ");
        // const titleLine = institutionText
        //    ? `${speakerText} &emdash; ${institutionText}`
        //    : speakerText;
        const titleLine = `${speakerText}, ${institutionText}`;
        if (speakerText) {
            const descriptionHTML = (titleText || abstractText)
                ? `
                    ${titleText ? `
                        <div class="agenda-description-title-row">
                            <strong class="agenda-description-label">Title:</strong>
                            <span class="agenda-description-title">${escapeHTML(titleText)}</span><br>
                        </div>
                    ` : ""}
                    ${abstractText ? `
                        <div class="agenda-description-abstract-desktop">
                            <strong class="agenda-description-label">Abstract:</strong>
                            <span class="agenda-description-abstract">${escapeHTMLPreserveLineBreaks(abstractText)}</span>
                        </div>
                        <details class="agenda-abstract-toggle">
                            <summary class="agenda-abstract-summary">
                                <span class="agenda-abstract-summary-label">Abstract:</span>
                                <span class="agenda-abstract-summary-icon" aria-hidden="true"></span>
                            </summary>
                            <div class="agenda-description-abstract-row">
                                <strong class="agenda-description-label agenda-description-abstract-label">Abstract:</strong>
                                <span class="agenda-description-abstract">${escapeHTMLPreserveLineBreaks(abstractText)}</span>
                            </div>
                        </details>
                    ` : ""}
                `
                : "";

            // Detailed entry with anchors for event and speaker
            detailsHtml += `
                <article class="agenda-event" id="${eventId}">
                    <div class="agenda-date">${dateLine}${locationText ? `, <span class="agenda-location-link">${locationHtml}</span>` : ""}</div>

                    <h3 class="agenda-title">${escapeHTML(titleLine)}</h3>

                    ${descriptionHTML ? `<div class="agenda-description">${descriptionHTML}</div>` : ""}
                </article>
            `;
        }

        rows.push({ date: formattedDate, speaker: speakerText, institution: institutionText, title: titleText, eventId });
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
                    <th>Institution</th>
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
                <td class="agenda-col-institution">${escapeHTML(r.institution)}</td>
                <td class="agenda-col-title">${escapeHTML(r.title)}</td>
            </tr>
        `;
    }

    tableHtml += `</tbody></table>`;

    return { tableHtml, detailsHtml };
}

async function loadSeminarCalendars() {
    const calendarContainers = document.querySelectorAll(".ics-calendar");

    for (const container of calendarContainers) {
        const endpointUrl = container.dataset.sheetUrl || container.dataset.feedUrl || container.dataset.icsUrl;

        if (!endpointUrl) {
            container.innerHTML = "<p>No seminar feed URL provided.</p>";
            continue;
        }

        try {
            const { tableHtml, detailsHtml } = await getSheetsAgendaHTML(endpointUrl);

            const tableContainer = document.getElementById("agenda-table");
            if (tableContainer) tableContainer.innerHTML = tableHtml;

            container.innerHTML = detailsHtml;
        } catch (error) {
            console.error("Seminar loading error:", error);
            container.innerHTML = `<p>Unable to load seminar events. Error: ${error.message || error}</p>`;
            const tableContainer = document.getElementById("agenda-table");
            if (tableContainer) tableContainer.innerHTML = `<p>Unable to load seminar summary. Error: ${error.message || error}</p>`;
        }
    }
}

loadSeminarCalendars();