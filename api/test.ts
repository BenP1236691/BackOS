export default async function handler(req: any, res: any) {
  try {
    const crypto = await import('node:crypto');
    const rand = crypto.randomBytes(4).toString('hex');
    return res.status(200).json({ ok: true, rand });
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err.message, stack: err.stack });
  }
}
