// Experiment index page: the second page of a lab record.
// Drawn with the same palette as the chosen cover so the two match.

const INDEX_COLUMNS = [
    { key: 'no',     label: 'NO.',         width: 100, align: 'center' },
    { key: 'title',  label: 'EXPERIMENT TITLE', width: 396, align: 'left' },
    { key: 'date',   label: 'DATE',             width: 130, align: 'center' },
    { key: 'page',   label: 'PAGE',             width: 100, align: 'center' },
    { key: 'remark', label: 'REMARK',           width: 158, align: 'center' }
];
const INDEX_MIN_ROWS = 15;    // blank numbered rows are added up to this many
const INDEX_MAX_ROWS = 28;

function drawIndexPage(ctx, data, pal, height) {
    const scale = height / 1536;
    const sy = function (v) { return v * scale; };
    const centerX = PAGE_WIDTH / 2;

    fillBackground(ctx, pal.bg, height);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, PAGE_WIDTH - 56, height - 56);

    // college line with the logo on the left
    drawLogo(ctx, data, pal, 130, sy(120), 100, 100);
    drawParagraph(ctx, data.college, 210, sy(120), {
        anchor: 'center', style: 'bold', family: SERIF, size: 40, maxWidth: 740,
        maxLines: 2, lineHeight: 1.12, color: pal.ink, align: 'left'
    });

    drawText(ctx, 'INDEX', centerX, sy(270), {
        style: 'bold', family: SERIF, size: 110, spacing: 8, maxWidth: 800,
        color: pal.ink, align: 'center'
    });
    drawRule(ctx, 330, 694, sy(335), pal.accent, 4);
    drawText(ctx, data.subject.toUpperCase(), centerX, sy(380), {
        style: 'bold', family: SANS, size: 30, maxWidth: 820,
        color: pal.ink, align: 'center'
    });

    // table geometry
    const x0 = 70;
    const tableWidth = INDEX_COLUMNS.reduce(function (sum, c) { return sum + c.width; }, 0);
    const top = sy(430);
    const bottom = height - 120;
    const headerHeight = 56;
    const rowCount = Math.min(INDEX_MAX_ROWS, Math.max(INDEX_MIN_ROWS, data.rows.length));
    const rowHeight = Math.min(72, (bottom - top - headerHeight) / rowCount);
    const tableBottom = top + headerHeight + rowCount * rowHeight;

    // header row
    ctx.fillStyle = pal.accent;
    ctx.fillRect(x0, top, tableWidth, headerHeight);

    // stripes
    const stripe = mixColors(pal.bg, pal.panel, 0.18);
    for (let i = 0; i + 1 < rowCount; i += 2) {
        ctx.fillStyle = stripe;
        ctx.fillRect(x0, top + headerHeight + (i + 1) * rowHeight, tableWidth, rowHeight);
    }

    // grid lines
    const lineColor = withAlpha(pal.ink, 0.35);
    for (let i = 1; i < rowCount; i++) {
        drawRule(ctx, x0, x0 + tableWidth, top + headerHeight + i * rowHeight, lineColor, 2);
    }
    let edge = x0;
    INDEX_COLUMNS.forEach(function (col, c) {
        if (c > 0) ctx.fillStyle = lineColor, ctx.fillRect(edge - 1, top + headerHeight, 2, tableBottom - top - headerHeight);
        edge += col.width;
    });
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, top, tableWidth, tableBottom - top);

    // text
    const fontSize = Math.min(26, rowHeight * 0.5);
    edge = x0;
    INDEX_COLUMNS.forEach(function (col) {
        const center = edge + col.width / 2;
        drawText(ctx, col.label, center, top + headerHeight / 2, {
            style: 'bold', family: SANS, size: 20, spacing: 1, maxWidth: col.width - 14,
            color: pal.onAccent, align: 'center'
        });

        for (let i = 0; i < rowCount; i++) {
            const row = data.rows[i] || {};
            const text = col.key === 'no' ? String(i + 1) : (row[col.key] || '');
            if (!text) continue;
            const y = top + headerHeight + i * rowHeight + rowHeight / 2;
            const isLeft = col.align === 'left';
            drawText(ctx, text, isLeft ? edge + 14 : center, y, {
                style: col.key === 'no' ? 'bold' : 'normal',
                family: col.key === 'title' ? SERIF : SANS,
                size: fontSize, maxWidth: col.width - (isLeft ? 24 : 14), minSize: 11,
                color: pal.ink, align: isLeft ? 'left' : 'center'
            });
        }
        edge += col.width;
    });

    // footer: department
    drawOrnament(ctx, centerX, height - 82, 90, pal);
    drawText(ctx, data.dept.toUpperCase(), centerX, height - 52, {
        family: SERIF, size: 22, maxWidth: 800, color: pal.ink, align: 'center'
    });
}

function renderIndex(ctx, design, data, height) {
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    drawIndexPage(ctx, data, design.palette, height);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
}
