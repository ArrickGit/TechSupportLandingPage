import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql(`CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);

    const [{ count: waitlist_count }] = await sql(`SELECT COUNT(*)::int AS count FROM submissions WHERE type = 'waitlist'`);
    const [{ count: preorder_count }] = await sql(`SELECT COUNT(*)::int AS count FROM submissions WHERE type = 'preorder'`);

    const interestRows = await sql(`
      SELECT
        COALESCE(payload->>'interest','unknown') AS interest,
        COUNT(*)::int AS count
      FROM submissions
      WHERE type = 'interest'
      GROUP BY 1
    `);

    const priceRows = await sql(`
      SELECT COALESCE(payload->>'price','unknown') AS price, COUNT(*)::int AS count
      FROM submissions
      WHERE type = 'interest'
      GROUP BY 1
    `);

    const surveyFeatureRows = await sql(`
      SELECT jsonb_array_elements_text(COALESCE(payload->'features','[]'::jsonb)) AS feature, COUNT(*)::int AS count
      FROM submissions
      WHERE type = 'survey'
      GROUP BY 1
    `);

    return res.status(200).json({
      ok: true,
      waitlist_count,
      preorder_count,
      interest_breakdown: interestRows,
      price_breakdown: priceRows,
      survey_features: surveyFeatureRows,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'db_error', detail: String(e) });
  }
}


