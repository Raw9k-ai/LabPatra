// Tiny PDF writer: one full-bleed A4 JPEG image per page. No libraries.

const PDF_PAGE_W = 595.28;   // A4 in points
const PDF_PAGE_H = 841.89;

// pages: [{ bytes: Uint8Array (JPEG), width, height }]  ->  Blob
function buildPdf(pages) {
    const encoder = new TextEncoder();
    const chunks = [];
    const offsets = [];
    let offset = 0;

    function push(part) {
        const bytes = typeof part === 'string' ? encoder.encode(part) : part;
        chunks.push(bytes);
        offset += bytes.length;
    }
    function begin(id) {
        offsets[id] = offset;
        push(id + ' 0 obj\n');
    }

    push('%PDF-1.4\n');
    begin(1);
    push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    const kids = pages.map(function (_, i) { return (3 + 3 * i) + ' 0 R'; }).join(' ');
    begin(2);
    push('<< /Type /Pages /Kids [' + kids + '] /Count ' + pages.length + ' >>\nendobj\n');

    pages.forEach(function (page, i) {
        const pageId = 3 + 3 * i;
        const contentId = 4 + 3 * i;
        const imageId = 5 + 3 * i;

        begin(pageId);
        push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PDF_PAGE_W + ' ' + PDF_PAGE_H + '] ' +
            '/Resources << /XObject << /Im0 ' + imageId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>\nendobj\n');

        const content = 'q ' + PDF_PAGE_W + ' 0 0 ' + PDF_PAGE_H + ' 0 0 cm /Im0 Do Q';
        begin(contentId);
        push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\nendobj\n');

        begin(imageId);
        push('<< /Type /XObject /Subtype /Image /Width ' + page.width + ' /Height ' + page.height +
            ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + page.bytes.length + ' >>\nstream\n');
        push(page.bytes);
        push('\nendstream\nendobj\n');
    });

    const total = 3 + 3 * pages.length;
    const xrefAt = offset;
    push('xref\n0 ' + total + '\n0000000000 65535 f \n');
    for (let id = 1; id < total; id++) {
        push(String(offsets[id]).padStart(10, '0') + ' 00000 n \n');
    }
    push('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xrefAt + '\n%%EOF');

    return new Blob(chunks, { type: 'application/pdf' });
}
