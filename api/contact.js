const crypto = require('crypto');

const RECEIVER = '01093551910';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const b = req.body || {};

    const lines = [
      '[견적요청 알림]',
      `병원명: ${b['병원명'] || '-'}`,
      `원장님: ${b['원장님_성함'] || '-'}`,
      `연락처: ${b['연락처'] || '-'}`,
      `진료과목: ${b['진료과목'] || '-'}`,
      `영상형식: ${b['영상_형식'] || '-'}`,
      `예산: ${b['예산_범위'] || '-'}`,
      `희망시기: ${b['제작_희망_시기'] || '-'}`,
      `요청내용: ${(b['요청_내용'] || '-').slice(0, 40)}`,
    ];
    const text = lines.join('\n');

    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', process.env.SOLAPI_API_SECRET)
      .update(date + salt)
      .digest('hex');

    const smsRes = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `HMAC-SHA256 ApiKey=${process.env.SOLAPI_API_KEY}, Date=${date}, Salt=${salt}, Signature=${signature}`,
      },
      body: JSON.stringify({
        message: {
          to: RECEIVER,
          from: process.env.SOLAPI_SENDER,
          text,
        },
      }),
    });

    if (!smsRes.ok) {
      const err = await smsRes.json();
      console.error('Solapi error:', err);
      return res.status(500).json({ error: 'SMS 전송 실패' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류' });
  }
};
