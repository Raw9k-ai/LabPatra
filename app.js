// Page logic: form, design picker, live preview, index rows, image upload,
// saving in the browser, PNG and PDF download.

const preview = document.getElementById('preview');
const previewCtx = preview.getContext('2d');
const grid = document.getElementById('grid');
const message = document.getElementById('message');
const sizeSelect = document.getElementById('size');

const textFields = ['title', 'subject', 'college', 'address', 'dept', 'toBody', 'byBody', 'toHeading', 'byHeading', 'ackHeading', 'ackText'];

// everything the browser remembers
const savedValues = textFields.concat(['batchList', 'batchTemplate', 'linedStyle', 'linedCount']);
const savedChecks = ['includeAck', 'includeIndex', 'linedHeader', 'linedNumbers'];
const BATCH_MAX = 100;
const LINED_MAX = 30;

const STORAGE_KEY = 'labpatra:v1';
const STORAGE_LOGO_KEY = 'labpatra:logo';

let currentDesign = 0;
let currentPage = 'cover';   // page being previewed: 'cover', 'index' or 'lined'
let logoImage = null;
let logoState = 'default';   // 'default', 'custom' or 'none'
let rows = [
    { title: 'Introduction to C programming', date: '', page: '', remark: '' },
    { title: 'Conditional statements', date: '', page: '', remark: '' },
    { title: 'Loops and iteration', date: '', page: '', remark: '' }
];
let photoImage = null;
let heightRatio = 1.5;     // page height / page width
let exportWidth = 1024;    // pixels in the downloaded PNG

const thumbnails = [];


function checked(id) {
    return document.getElementById(id).checked;
}

function valueOf(id) {
    return document.getElementById(id).value.trim();
}

// one non-empty line per row of a textarea
function linesOf(id) {
    return document.getElementById(id).value
        .split('\n')
        .map(function (line) { return line.trim(); })
        .filter(Boolean);
}

function readForm() {
    return {
        title: valueOf('title'),
        subject: valueOf('subject'),
        college: valueOf('college'),
        address: valueOf('address'),
        dept: valueOf('dept'),
        toHeading: valueOf('toHeading'),
        byHeading: valueOf('byHeading'),
        to: linesOf('toBody'),
        by: linesOf('byBody'),
        ackHeading: valueOf('ackHeading'),
        ackText: document.getElementById('ackText').value,
        rows: rows,
        lined: {
            style: valueOf('linedStyle'),
            header: checked('linedHeader'),
            numbers: checked('linedNumbers')
        },
        logo: logoImage,
        photo: photoImage
    };
}

function pageHeight() {
    return Math.round(PAGE_WIDTH * heightRatio);
}

function renderPage(ctx, page, design, data, height, number) {
    if (page === 'index') renderIndex(ctx, design, data, height);
    else if (page === 'ack') renderAck(ctx, design, data, height);
    else if (page === 'lined') renderLined(ctx, design, data, height, number || 1);
    else renderCover(ctx, design, data, height);
}


/* ---------- drawing ---------- */

let frameRequest = 0;
let thumbTimer = 0;

function drawPreview() {
    cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(function () {
        const height = pageHeight();
        if (preview.width !== PAGE_WIDTH || preview.height !== height) {
            preview.width = PAGE_WIDTH;
            preview.height = height;
        }
        renderPage(previewCtx, currentPage, DESIGNS[currentDesign], readForm(), height);
    });
}

function drawThumbnails() {
    const data = readForm();
    const height = pageHeight();

    thumbnails.forEach(function (thumb, i) {
        const scale = thumb.canvas.width / PAGE_WIDTH;
        const thumbHeight = Math.round(height * scale);
        if (thumb.canvas.height !== thumbHeight) {
            thumb.canvas.height = thumbHeight;
        }
        thumb.canvas.style.setProperty('--ratio', PAGE_WIDTH + '/' + height);

        const ctx = thumb.canvas.getContext('2d');
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        renderCover(ctx, DESIGNS[i], data, height);
    });
}

// the thumbnails are 24 small drawings, so wait until typing pauses
function refresh() {
    drawPreview();
    scheduleSave();
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(drawThumbnails, 220);
}


/* ---------- design picker ---------- */

function buildGrid() {
    DESIGNS.forEach(function (design, i) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'design';
        button.setAttribute('aria-pressed', i === currentDesign);
        button.setAttribute('aria-label', 'Design ' + (i + 1) + ': ' + design.palette.name);

        const canvas = document.createElement('canvas');
        canvas.width = 170;
        canvas.height = 255;

        const label = document.createElement('span');
        label.textContent = design.palette.name;

        button.appendChild(canvas);
        button.appendChild(label);
        button.addEventListener('click', function () { selectDesign(i); });
        grid.appendChild(button);

        thumbnails.push({ canvas: canvas, button: button });
    });
}

function selectDesign(index) {
    currentDesign = index;
    thumbnails.forEach(function (thumb, i) {
        thumb.button.setAttribute('aria-pressed', i === index);
    });
    drawPreview();
    scheduleSave();
}


/* ---------- image upload ---------- */

// Load an image file and shrink it so redrawing stays fast.
function loadImage(file, maxSize) {
    return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = function () {
            const shrink = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.naturalWidth * shrink));
            canvas.height = Math.max(1, Math.round(img.naturalHeight * shrink));

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            URL.revokeObjectURL(url);
            resolve(canvas);
        };
        img.onerror = function () {
            URL.revokeObjectURL(url);
            reject();
        };
        img.src = url;
    });
}

function listenForImage(inputId, maxSize, onLoaded) {
    document.getElementById(inputId).addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;

        message.textContent = '';
        loadImage(file, maxSize)
            .then(function (canvas) {
                onLoaded(canvas);
                refresh();
            })
            .catch(function () {
                message.textContent = 'That image could not be read. Try a PNG or JPG file.';
            });

        // clear the input so choosing the same file again still fires
        event.target.value = '';
    });
}


/* ---------- download ---------- */

function slugOf(title) {
    const slug = title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    return slug || 'lab-manual';
}

// draw one page into a fresh canvas that is `width` pixels wide
function renderToCanvas(page, width, ratio, data, number) {
    const height = Math.round(PAGE_WIDTH * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round(height * width / PAGE_WIDTH);
    const ctx = canvas.getContext('2d');
    ctx.scale(width / PAGE_WIDTH, canvas.height / height);
    renderPage(ctx, page, DESIGNS[currentDesign], data, height, number);
    return canvas;
}

function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); });
}

function saveBlob(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 5000);
}

function downloadPng() {
    const data = readForm();
    const canvas = renderToCanvas(currentPage, exportWidth, heightRatio, data);

    canvasToBlob(canvas, 'image/png').then(function (blob) {
        canvas.width = canvas.height = 0;   // free the memory
        if (!blob) {
            message.textContent = 'Could not create the image. Try a smaller size.';
            return;
        }
        saveBlob(blob, slugOf(data.title) + '-' + currentPage + '-' + exportWidth + '.png');
    });
}

// one page as a JPEG at A4 size (about 200 dpi), ready for the PDF writer
function pageToJpeg(page, data, number) {
    const canvas = renderToCanvas(page, 1654, 1.41421, data, number);
    const size = { width: canvas.width, height: canvas.height };
    return canvasToBlob(canvas, 'image/jpeg', 0.94)
        .then(function (blob) { return blob.arrayBuffer(); })
        .then(function (buffer) {
            canvas.width = canvas.height = 0;
            return { bytes: new Uint8Array(buffer), width: size.width, height: size.height };
        });
}

function nextTurn() {
    return new Promise(function (resolve) { setTimeout(resolve, 0); });
}

// PDF is always A4: cover, acknowledgement and index (if ticked), then the writing pages
async function downloadPdf() {
    const data = readForm();
    const button = document.getElementById('downloadPdf');
    const count = Math.max(0, Math.min(LINED_MAX, parseInt(document.getElementById('linedCount').value, 10) || 0));

    message.textContent = '';
    button.disabled = true;
    try {
        const pages = [await pageToJpeg('cover', data)];
        if (checked('includeAck')) pages.push(await pageToJpeg('ack', data));
        if (checked('includeIndex')) pages.push(await pageToJpeg('index', data));

        let shared = null;   // without page numbers every writing page is identical
        for (let n = 1; n <= count; n++) {
            await nextTurn();
            if (data.lined.numbers) {
                pages.push(await pageToJpeg('lined', data, n));
            } else {
                shared = shared || await pageToJpeg('lined', data, 0);
                pages.push(shared);
            }
        }
        saveBlob(buildPdf(pages), slugOf(data.title) + '.pdf');
    } catch (e) {
        message.textContent = 'Could not create the PDF. Try again, or download PNGs instead.';
    }
    button.disabled = false;
}


/* ---------- batch: one cover per student ---------- */

const batchStatus = document.getElementById('batchStatus');

function parseStudents() {
    return document.getElementById('batchList').value
        .split('\n')
        .map(function (line) {
            return line.split(/\t|\||,/).map(function (part) {
                return part.trim().replace(/^"|"$/g, '').trim();
            });
        })
        .filter(function (parts) { return parts.some(Boolean); });
}

// fill {1}, {2}... in the template; a line with an empty column is dropped
function linesFor(parts) {
    const out = [];
    document.getElementById('batchTemplate').value.split('\n').forEach(function (line) {
        if (!line.trim()) return;
        let missing = false;
        const filled = line.replace(/\{(\d+)\}/g, function (_, n) {
            const value = parts[Number(n) - 1] || '';
            if (!value) missing = true;
            return value;
        });
        if (!missing && filled.trim()) out.push(filled.trim());
    });
    return out;
}

function updateBatchSummary() {
    const students = parseStudents();
    if (!students.length) {
        batchStatus.textContent = '';
        return;
    }
    const first = linesFor(students[0]).join(' \u00B7 ');
    const extra = students.length > BATCH_MAX ? ' Only the first ' + BATCH_MAX + ' will be used.' : '';
    batchStatus.textContent = students.length + (students.length === 1 ? ' student. ' : ' students. ') +
        'First cover: ' + first + '.' + extra;
}

async function downloadBatch() {
    const students = parseStudents().slice(0, BATCH_MAX);
    if (!students.length) {
        batchStatus.textContent = 'Add at least one student first.';
        return;
    }

    const base = readForm();
    const withIndex = checked('includeIndex');
    const withAck = checked('includeAck');
    const button = document.getElementById('downloadBatch');
    const pages = [];
    let indexPage = null;

    button.disabled = true;
    try {
        for (let i = 0; i < students.length; i++) {
            batchStatus.textContent = 'Building cover ' + (i + 1) + ' of ' + students.length + '\u2026';
            await nextTurn();

            const data = Object.assign({}, base, { by: linesFor(students[i]) });
            pages.push(await pageToJpeg('cover', data));
            if (withAck) pages.push(await pageToJpeg('ack', data));   // carries each student's name

            if (withIndex) {
                indexPage = indexPage || await pageToJpeg('index', base);
                pages.push(indexPage);
            }
        }
        saveBlob(buildPdf(pages), slugOf(base.title) + '-batch.pdf');
        const extras = (withAck ? 'acknowledgement' : '') + (withAck && withIndex ? ' and ' : '') + (withIndex ? 'index page' : '');
        batchStatus.textContent = 'Done: ' + students.length + (students.length === 1 ? ' cover' : ' covers') +
            (extras ? ', each followed by the ' + extras + '.' : '.');
    } catch (e) {
        batchStatus.textContent = 'Could not create the PDF. Try fewer students at a time.';
    }
    button.disabled = false;
}


/* ---------- index rows ---------- */

const rowsBox = document.getElementById('rows');

function buildRows() {
    rowsBox.textContent = '';
    rows.forEach(function (row, i) {
        const wrap = document.createElement('div');
        wrap.className = 'exp-row';

        const number = document.createElement('span');
        number.className = 'exp-no';
        number.textContent = i + 1;
        wrap.appendChild(number);

        [['title', 'Experiment title'], ['date', 'Date'], ['page', 'Page'], ['remark', 'Remark']].forEach(function (f) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'exp-' + f[0];
            input.placeholder = f[1];
            input.setAttribute('aria-label', f[1] + ', row ' + (i + 1));
            input.autocomplete = 'off';
            input.value = row[f[0]];
            input.addEventListener('input', function () {
                row[f[0]] = input.value.trim();
                refresh();
            });
            wrap.appendChild(input);
        });

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-button exp-remove';
        remove.textContent = '\u2715';
        remove.setAttribute('aria-label', 'Remove row ' + (i + 1));
        remove.addEventListener('click', function () {
            rows.splice(i, 1);
            buildRows();
            refresh();
        });
        wrap.appendChild(remove);

        rowsBox.appendChild(wrap);
    });
}

// which page each menu item previews
const VIEW_PAGE = { cover: 'cover', ack: 'ack', index: 'index', writing: 'lined', batch: 'cover' };

function showView(name, scrollToTop) {
    if (!VIEW_PAGE[name]) name = 'cover';
    currentPage = VIEW_PAGE[name];
    document.body.dataset.view = name;

    document.querySelectorAll('.view').forEach(function (view) {
        view.classList.toggle('active', view.dataset.view === name);
    });
    document.querySelectorAll('.site-nav a').forEach(function (link) {
        if (link.dataset.view === name) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });

    drawPreview();
    if (scrollToTop) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', function () {
    showView(location.hash.slice(1), true);
});


/* ---------- saving on this device ---------- */

let saveTimer = 0;

function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 400);
}

function saveState() {
    try {
        const fields = {};
        savedValues.forEach(function (id) { fields[id] = document.getElementById(id).value; });
        const checks = {};
        savedChecks.forEach(function (id) { checks[id] = checked(id); });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            fields: fields,
            checks: checks,
            rows: rows,
            design: currentDesign,
            size: sizeSelect.value
        }));

        // the logo is stored separately because it can be large
        let logoValue = logoState;
        if (logoState === 'custom' && logoImage) logoValue = logoImage.toDataURL('image/png');
        // while a saved logo is still loading, keep what is already stored
        if (logoState !== 'custom' || logoImage) localStorage.setItem(STORAGE_LOGO_KEY, logoValue);
    } catch (e) {
        // storage full or blocked (private mode): the app still works, it just won't remember
    }
}

// returns true if a saved logo is being loaded
function restoreState() {
    let saved = null;
    try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) { /* ignore */ }
    if (!saved) return false;

    savedValues.forEach(function (id) {
        if (saved.fields && typeof saved.fields[id] === 'string') {
            const control = document.getElementById(id);
            const before = control.value;
            control.value = saved.fields[id];
            // a select ignores values it does not have
            if (control.tagName === 'SELECT' && control.value !== saved.fields[id]) control.value = before;
        }
    });
    savedChecks.forEach(function (id) {
        const value = saved.checks ? saved.checks[id] : (id === 'includeIndex' ? saved.includeIndex : undefined);
        if (typeof value === 'boolean') document.getElementById(id).checked = value;
    });
    if (Array.isArray(saved.rows)) {
        rows = saved.rows.map(function (r) {
            return { title: r.title || '', date: r.date || '', page: r.page || '', remark: r.remark || '' };
        });
    }
    if (Number.isInteger(saved.design) && saved.design >= 0 && saved.design < DESIGNS.length) {
        currentDesign = saved.design;
    }
    if (saved.size) {
        sizeSelect.value = saved.size;
        if (sizeSelect.value === saved.size) applySize();
    }
    return true;
}

function restoreLogo() {
    let value = null;
    try { value = localStorage.getItem(STORAGE_LOGO_KEY); } catch (e) { /* ignore */ }

    if (value === 'none') {
        logoState = 'none';
        logoImage = null;
        return true;
    }
    if (value && value.indexOf('data:image/') === 0) {
        logoState = 'custom';
        const img = new Image();
        img.onload = function () {
            // keep it as a canvas so it can be saved again
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            logoImage = canvas;
            refresh();
            drawThumbnails();
        };
        img.onerror = function () { logoState = 'default'; };
        img.src = value;
        return true;
    }
    return false;
}


/* ---------- wiring ---------- */

textFields.forEach(function (id) {
    document.getElementById(id).addEventListener('input', refresh);
});

document.getElementById('shuffle').addEventListener('click', function () {
    let next;
    do {
        next = Math.floor(Math.random() * DESIGNS.length);
    } while (next === currentDesign);
    selectDesign(next);
});

function applySize() {
    const parts = sizeSelect.value.split('|');
    exportWidth = Number(parts[0]);
    heightRatio = Number(parts[1]);
}

sizeSelect.addEventListener('change', function () {
    applySize();
    drawPreview();
    drawThumbnails();
    scheduleSave();
});

listenForImage('logoFile', 700, function (canvas) { logoImage = canvas; logoState = 'custom'; });
listenForImage('photoFile', 1600, function (canvas) { photoImage = canvas; });

document.getElementById('logoClear').addEventListener('click', function () {
    logoImage = null;
    logoState = 'none';
    refresh();
});
document.getElementById('photoClear').addEventListener('click', function () {
    photoImage = null;
    refresh();
});

document.getElementById('download').addEventListener('click', downloadPng);
document.getElementById('downloadPdf').addEventListener('click', downloadPdf);
document.getElementById('includeIndex').addEventListener('change', scheduleSave);
document.getElementById('includeAck').addEventListener('change', scheduleSave);
document.getElementById('linedCount').addEventListener('input', scheduleSave);

// redraw the preview when a writing-page option changes
['linedStyle', 'linedHeader', 'linedNumbers'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', refresh);
});

['batchList', 'batchTemplate'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
        updateBatchSummary();
        scheduleSave();
    });
});
document.getElementById('batchFile').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
        let text = String(reader.result).replace(/\r/g, '').trim();

        // spreadsheets usually start with a heading row ("Name, Roll"): skip it
        const rowsOfText = text.split('\n');
        if (rowsOfText.length > 1 && !/\d/.test(rowsOfText[0]) && /\d/.test(rowsOfText[1])) {
            rowsOfText.shift();
            text = rowsOfText.join('\n');
        }
        document.getElementById('batchList').value = text;
        updateBatchSummary();
        scheduleSave();
    };
    reader.readAsText(file);
    event.target.value = '';
});
document.getElementById('downloadBatch').addEventListener('click', downloadBatch);

document.getElementById('addRow').addEventListener('click', function () {
    rows.push({ title: '', date: '', page: '', remark: '' });
    buildRows();
    refresh();
    const inputs = rowsBox.querySelectorAll('.exp-title');
    inputs[inputs.length - 1].focus();
});

document.getElementById('resetSaved').addEventListener('click', function () {
    if (!confirm('Clear your saved details and start over?')) return;
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_LOGO_KEY);
    } catch (e) { /* ignore */ }
    location.reload();
});


/* ---------- start ---------- */

restoreState();
buildGrid();
buildRows();
updateBatchSummary();
showView(location.hash.slice(1), false);

if (!restoreLogo()) {
    const startLogo = new Image();
    startLogo.onload = function () {
        if (logoState !== 'default') return;
        logoImage = startLogo;
        refresh();
        drawThumbnails();
    };
    startLogo.src = DEFAULT_LOGO;
}

refresh();
drawThumbnails();
