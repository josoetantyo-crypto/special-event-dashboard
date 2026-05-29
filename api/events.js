const REPO      = 'josoetantyo-crypto/special-event-dashboard';
const FILE_PATH = 'data/events.json';
const API_URL   = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.GITHUB_TOKEN;

  // ── GET: baca events (public) ──
  if (req.method === 'GET') {
    try {
      const r = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github.raw+json' }
      });
      if (!r.ok) return res.status(500).json({ error: 'Gagal membaca data' });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── PUT: update events (admin only) ──
  if (req.method === 'PUT') {
    const pass = req.headers['x-admin-password'];
    if (!pass || pass !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Password salah' });
    }

    try {
      // Ambil SHA file saat ini
      const metaRes = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github.v3+json' }
      });
      if (!metaRes.ok) return res.status(500).json({ error: 'Gagal ambil SHA' });
      const meta = await metaRes.json();

      // Update file
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const content = Buffer.from(JSON.stringify(body, null, 2)).toString('base64');

      const updateRes = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: `Update events ${new Date().toISOString()}`,
          content,
          sha: meta.sha
        })
      });

      if (!updateRes.ok) {
        const err = await updateRes.json();
        return res.status(500).json({ error: err.message });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
