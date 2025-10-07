import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const { features, feedback } = req.body || {};
  const safeFeatures = Array.isArray(features) ? features.slice(0, 10).map(String) : [];
  const safeFeedback = typeof feedback === 'string' ? feedback.slice(0, 2000) : '';

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql(`CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await sql(`INSERT INTO submissions (type, payload) VALUES ('survey', $1)`, [JSON.stringify({ features: safeFeatures, feedback: safeFeedback })]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'db_error', detail: String(e) });
  }
}


