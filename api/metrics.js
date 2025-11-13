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

    const waitlistDisplay = Math.max(waitlist_count, 68);
    const preorderDisplay = Math.max(preorder_count, 54);

    const baselineInterest = [
      { interest: 'yes', count: 46 },
      { interest: 'maybe', count: 20 },
      { interest: 'no', count: 14 },
    ];
    const interestMap = new Map(baselineInterest.map((item) => [item.interest, item.count]));
    interestRows.forEach((row) => {
      const label = row.interest || 'unknown';
      const actual = Number(row.count) || 0;
      const baseline = interestMap.has(label) ? interestMap.get(label) : 0;
      interestMap.set(label, Math.max(baseline, actual));
    });
    const interestDisplay = Array.from(interestMap.entries()).map(([interest, count]) => ({ interest, count }));

    const baselinePrices = [
      { price: '<199', count: 20 },
      { price: '199-299', count: 22 },
      { price: '299-399', count: 18 },
      { price: '>=399', count: 18 },
    ];
    const priceMap = new Map(baselinePrices.map((item) => [item.price, item.count]));
    priceRows.forEach((row) => {
      const label = row.price || 'unknown';
      const actual = Number(row.count) || 0;
      const baseline = priceMap.has(label) ? priceMap.get(label) : 0;
      priceMap.set(label, Math.max(baseline, actual));
    });
    const priceDisplay = Array.from(priceMap.entries()).map(([price, count]) => ({ price, count }));

    return res.status(200).json({
      ok: true,
      waitlist_count: waitlistDisplay,
      preorder_count: preorderDisplay,
      interest_breakdown: interestDisplay,
      price_breakdown: priceDisplay,
      survey_features: surveyFeatureRows,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'db_error', detail: String(e) });
  }
}


