// Acknowledgement page: heading, a few paragraphs, date and signature block.
// The text may contain {teacher}, {college}, {dept} and {subject}.

function ackBody(data) {
    const values = {
        teacher: data.to[0] || 'my teacher',
        college: data.college,
        dept: data.dept,
        subject: data.subject
    };
    return data.ackText.replace(/\{(teacher|college|dept|subject)\}/g, function (_, key) {
        return values[key] || '';
    });
}

function drawAckPage(ctx, data, pal, height) {
    const scale = height / 1536;
    const sy = function (v) { return v * scale; };
    const centerX = PAGE_WIDTH / 2;
    const left = 112;
    const textWidth = 800;

    fillBackground(ctx, pal.bg, height);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, PAGE_WIDTH - 56, height - 56);

    // same header as the index page: logo and college name
    drawLogo(ctx, data, pal, 130, sy(120), 100, 100);
    drawParagraph(ctx, data.college, 210, sy(120), {
        anchor: 'center', style: 'bold', family: SERIF, size: 40, maxWidth: 740,
        maxLines: 2, lineHeight: 1.12, color: pal.ink, align: 'left'
    });

    drawText(ctx, (data.ackHeading || 'Acknowledgement').toUpperCase(), centerX, sy(270), {
        style: 'bold', family: SERIF, size: 80, spacing: 4, maxWidth: 860,
        color: pal.ink, align: 'center'
    });
    drawRule(ctx, 330, 694, sy(335), pal.accent, 4);

    // body: blank lines separate paragraphs; shrink the type until it fits
    const paragraphs = ackBody(data).split(/\n\s*\n/)
        .map(function (p) { return p.replace(/\s*\n\s*/g, ' ').trim(); })
        .filter(Boolean);

    const top = sy(400);
    const available = sy(1150) - top;
    let size = 36;
    let wrapped;
    while (true) {
        setFont(ctx, 'normal', size, SERIF, 0);
        wrapped = paragraphs.map(function (p) { return splitIntoLines(ctx, p, textWidth); });
        const lineCount = wrapped.reduce(function (sum, lines) { return sum + lines.length; }, 0);
        const total = lineCount * size * 1.65 + Math.max(0, paragraphs.length - 1) * size * 0.8;
        if (total <= available || size <= 20) break;
        size -= 2;
    }

    const lineHeight = size * 1.65;
    let y = top;
    wrapped.forEach(function (lines) {
        lines.forEach(function (line) {
            drawText(ctx, line, left, y + lineHeight / 2, {
                family: SERIF, size: size, color: pal.ink, align: 'left'
            });
            y += lineHeight;
        });
        y += size * 0.8;
    });

    // date on the left, signature on the right
    const lineY = sy(1290);
    drawText(ctx, 'Date:', left, lineY - 12, {
        style: 'bold', family: SERIF, size: 26, color: pal.ink, align: 'left'
    });
    drawRule(ctx, left + ctx.measureText('Date:').width + 12, 430, lineY, withAlpha(pal.ink, 0.65), 2);

    drawRule(ctx, 640, 912, lineY, pal.ink, 2);
    if (data.by[0]) {
        drawText(ctx, data.by[0], 912, lineY + 36, {
            style: 'bold', family: SERIF, size: 30, maxWidth: 290, color: pal.ink, align: 'right'
        });
    }
    if (data.by[1]) {
        drawText(ctx, data.by[1], 912, lineY + 74, {
            family: SERIF, size: 24, maxWidth: 290, color: pal.soft, align: 'right'
        });
    }

    drawOrnament(ctx, centerX, height - 82, 90, pal);
    drawText(ctx, data.dept.toUpperCase(), centerX, height - 52, {
        family: SERIF, size: 22, maxWidth: 800, color: pal.ink, align: 'center'
    });
}

function renderAck(ctx, design, data, height) {
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    drawAckPage(ctx, data, design.palette, height);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
}
