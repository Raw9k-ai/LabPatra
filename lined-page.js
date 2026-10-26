// Writing pages: ruled or graph paper with an optional experiment header.
// Dark palettes switch to white paper so the page prints well.

const LINED_GAP = 44;      // distance between ruled lines
const GRID_COLUMNS = 30;

function drawLinedPage(ctx, data, pal, height, pageNumber) {
    const opts = data.lined;
    const dark = luminance(pal.bg) < 0.35;
    const paper = dark ? '#FFFFFF' : pal.bg;
    const ink = dark ? pal.bg : pal.ink;
    const accent = dark ? mixColors(pal.accent, '#000000', 0.25) : pal.accent;
    const faint = withAlpha(ink, opts.style === 'grid' ? 0.2 : 0.3);

    const left = 40;
    const right = PAGE_WIDTH - 40;
    const margin = 112;           // the double margin line sits here
    const bottomLimit = height - 90;

    fillBackground(ctx, paper, height);

    let start = 70;
    if (opts.header) {
        const labelOpts = { style: 'bold', family: SERIF, size: 24, color: ink, align: 'left' };
        const underline = function (from, to, y) { drawRule(ctx, from, to, y, withAlpha(ink, 0.65), 2); };

        drawText(ctx, 'EXPERIMENT NO.:', 140, 100, labelOpts);
        const noEnd = 140 + ctx.measureText('EXPERIMENT NO.:').width + 12;
        underline(noEnd, 560, 112);

        drawText(ctx, 'DATE:', 600, 100, labelOpts);
        underline(600 + ctx.measureText('DATE:').width + 12, right, 112);

        drawText(ctx, 'AIM:', 140, 168, labelOpts);
        underline(140 + ctx.measureText('AIM:').width + 12, right, 180);
        underline(140, right, 236);

        drawRule(ctx, left, right, 284, accent, 5);
        start = 284;
    }

    if (opts.style === 'grid') {
        const step = (right - left) / GRID_COLUMNS;
        const rowCount = Math.floor((bottomLimit - start) / step);
        const end = start + rowCount * step;
        for (let c = 0; c <= GRID_COLUMNS; c++) {
            ctx.fillStyle = faint;
            ctx.fillRect(left + c * step - 1, start, 2, end - start);
        }
        for (let r = 0; r <= rowCount; r++) {
            ctx.fillStyle = faint;
            ctx.fillRect(left, start + r * step - 1, right - left, 2);
        }
    } else {
        for (let y = start + LINED_GAP; y <= bottomLimit; y += LINED_GAP) {
            drawRule(ctx, left, right, y, faint, 2);
        }
    }

    // double margin line, full height like a record sheet
    ctx.fillStyle = accent;
    ctx.fillRect(margin - 4, 40, 2.5, height - 80);
    ctx.fillRect(margin + 3, 40, 2.5, height - 80);

    if (pageNumber && opts.numbers) {
        drawText(ctx, '\u2013 ' + pageNumber + ' \u2013', PAGE_WIDTH / 2, height - 48, {
            family: SERIF, size: 24, color: ink, align: 'center'
        });
    }
}

function renderLined(ctx, design, data, height, pageNumber) {
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    drawLinedPage(ctx, data, design.palette, height, pageNumber);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
}
