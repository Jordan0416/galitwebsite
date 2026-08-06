// Translates sheet-driven content for the Hebrew view of the site.
// POST { q: ["text", ...], target: "he" } → { translations: ["...", ...] }
// Uses Google's public translate endpoint server-side with an in-memory
// cache; on any failure the client just keeps the original text.

const cache = new Map();

function readBody(req) {
  if (req.body) return Promise.resolve(req.body);
  return new Promise(function (resolve) {
    let data = '';
    req.on('data', c => { data += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
    });
  });
}

async function translateOne(text, target) {
  const key = target + '|' + text;
  if (cache.has(key)) return cache.get(key);
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
    encodeURIComponent(target) + '&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error('translate failed: ' + res.status);
  const data = await res.json();
  const out = (data[0] || []).map(seg => seg[0]).join('');
  if (!out) throw new Error('empty translation');
  if (cache.size > 5000) cache.clear();
  cache.set(key, out);
  return out;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') { res.status(405).send('POST only'); return; }
    const body = await readBody(req);
    const q = body && body.q;
    const target = body && body.target;
    if (!Array.isArray(q) || q.length === 0 || q.length > 200 ||
        (target !== 'he' && target !== 'en')) {
      res.status(400).json({ error: 'bad request' });
      return;
    }
    const total = q.reduce((n, s) => n + String(s).length, 0);
    if (total > 30000) { res.status(400).json({ error: 'too large' }); return; }

    const translations = await Promise.all(
      q.map(s => {
        s = String(s);
        if (!s.trim()) return Promise.resolve(s);
        return translateOne(s, target).catch(() => s);
      })
    );
    res.status(200).json({ translations });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
};
