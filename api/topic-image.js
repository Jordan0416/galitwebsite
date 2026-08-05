// Serves images that were pasted directly into the "Talking Topics" tab of the
// Google Sheet. Google's CSV export can't see pasted images, but the xlsx
// export embeds them with the cell they're anchored to — so this function
// downloads the xlsx, finds the image anchored to the requested row, and
// streams it back. Cached at the CDN for 5 minutes.
//
// GET /api/topic-image?row=<0-based sheet row index>

const zlib = require('zlib');

const SHEET_ID = '1mFQzN_YO7R8no0IDtPvohxOKMBSjvaX2_TLQVXtcOpY';
const SHEET_TAB = 'Talking Topics';
const XLSX_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=xlsx';

let xlsxCache = { at: 0, promise: null };

function getXlsx() {
  const now = Date.now();
  if (!xlsxCache.promise || now - xlsxCache.at > 5 * 60 * 1000) {
    xlsxCache = {
      at: now,
      promise: fetch(XLSX_URL).then(r => {
        if (!r.ok) throw new Error('xlsx fetch failed: ' + r.status);
        return r.arrayBuffer();
      }).then(ab => Buffer.from(ab))
    };
  }
  return xlsxCache.promise;
}

// Minimal zip reader: returns a map of entry name -> { extract() -> Buffer }
function zipEntries(buf) {
  // Find end-of-central-directory record (scan back through the trailing 64KB)
  let eocd = -1;
  const scanStart = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= scanStart; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    entries[name] = {
      extract() {
        const lNameLen = buf.readUInt16LE(localOff + 26);
        const lExtraLen = buf.readUInt16LE(localOff + 28);
        const dataStart = localOff + 30 + lNameLen + lExtraLen;
        const data = buf.subarray(dataStart, dataStart + compSize);
        return method === 8 ? zlib.inflateRawSync(data) : Buffer.from(data);
      }
    };
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readXml(entries, name) {
  const e = entries[name];
  return e ? e.extract().toString('utf8') : '';
}

module.exports = async (req, res) => {
  try {
    const row = parseInt(req.query.row, 10);
    if (isNaN(row) || row < 0 || row > 1000) {
      res.status(400).send('bad row');
      return;
    }

    const entries = zipEntries(await getXlsx());

    // Which worksheet file is the Talking Topics tab?
    const wb = readXml(entries, 'xl/workbook.xml');
    const sheetTag = wb.match(new RegExp('<sheet[^>]*name="' + SHEET_TAB + '"[^>]*r:id="(rId\\d+)"'));
    if (!sheetTag) { res.status(404).send('tab not found'); return; }
    const wbRels = readXml(entries, 'xl/_rels/workbook.xml.rels');
    const relTag = wbRels.match(new RegExp('Id="' + sheetTag[1] + '"[^>]*Target="([^"]+)"'));
    if (!relTag) { res.status(404).send('sheet rel not found'); return; }
    const sheetPath = 'xl/' + relTag[1].replace(/^\//, '');
    const sheetFile = sheetPath.split('/').pop();

    // The sheet's drawing part holds the pasted images
    const sheetRels = readXml(entries, 'xl/worksheets/_rels/' + sheetFile + '.rels');
    const drawingRel = sheetRels.match(/Target="([^"]*drawings[^"]+)"/);
    if (!drawingRel) { res.status(404).send('no images on tab'); return; }
    const drawingPath = 'xl/' + drawingRel[1].replace(/^\.\.\//, '');
    const drawingFile = drawingPath.split('/').pop();
    const drawing = readXml(entries, drawingPath);
    const drawingRels = readXml(entries, 'xl/drawings/_rels/' + drawingFile + '.rels');

    // Find the image anchored to the requested row
    const anchors = drawing.match(/<xdr:(?:two|one)CellAnchor[^>]*>[\s\S]*?<\/xdr:(?:two|one)CellAnchor>/g) || [];
    let embedId = null;
    for (const a of anchors) {
      const rowMatch = a.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
      const embed = a.match(/r:embed="(rId\d+)"/);
      if (rowMatch && embed && parseInt(rowMatch[1], 10) === row) {
        embedId = embed[1];
        break;
      }
    }
    if (!embedId) { res.status(404).send('no image for row'); return; }

    const mediaRel = drawingRels.match(new RegExp('Id="' + embedId + '"[^>]*Target="([^"]+)"'));
    if (!mediaRel) { res.status(404).send('media rel not found'); return; }
    const mediaPath = 'xl/' + mediaRel[1].replace(/^\.\.\//, '');
    const media = entries[mediaPath];
    if (!media) { res.status(404).send('media not found'); return; }

    const ext = mediaPath.split('.').pop().toLowerCase();
    const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600, max-age=60');
    res.status(200).send(media.extract());
  } catch (err) {
    res.status(500).send('error: ' + err.message);
  }
};
