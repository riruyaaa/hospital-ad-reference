const RECEIVER = 'riruyaaa@gmail.com';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const b = req.body || {};

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">견적 요청이 들어왔습니다</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr style="background:#f1f5f9"><th style="text-align:left;padding:10px 14px;width:35%">병원명</th><td style="padding:10px 14px">${b['병원명'] || '-'}</td></tr>
          <tr><th style="text-align:left;padding:10px 14px">원장님 성함</th><td style="padding:10px 14px">${b['원장님_성함'] || '-'}</td></tr>
          <tr style="background:#f1f5f9"><th style="text-align:left;padding:10px 14px">연락처</th><td style="padding:10px 14px">${b['연락처'] || '-'}</td></tr>
          <tr><th style="text-align:left;padding:10px 14px">이메일</th><td style="padding:10px 14px">${b['이메일'] || '-'}</td></tr>
          <tr style="background:#f1f5f9"><th style="text-align:left;padding:10px 14px">진료과목</th><td style="padding:10px 14px">${b['진료과목'] || '-'}</td></tr>
          <tr><th style="text-align:left;padding:10px 14px">영상 형식</th><td style="padding:10px 14px">${b['영상_형식'] || '-'}</td></tr>
          <tr style="background:#f1f5f9"><th style="text-align:left;padding:10px 14px">예산 범위</th><td style="padding:10px 14px">${b['예산_범위'] || '-'}</td></tr>
          <tr><th style="text-align:left;padding:10px 14px">제작 희망 시기</th><td style="padding:10px 14px">${b['제작_희망_시기'] || '-'}</td></tr>
          <tr style="background:#f1f5f9"><th style="text-align:left;padding:10px 14px">참고 레퍼런스</th><td style="padding:10px 14px">${b['참고_레퍼런스'] || '-'}</td></tr>
          <tr><th style="text-align:left;padding:10px 14px;vertical-align:top">요청 내용</th><td style="padding:10px 14px;white-space:pre-wrap">${b['요청_내용'] || '-'}</td></tr>
        </table>
      </div>
    `;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: '견적요청 알림 <onboarding@resend.dev>',
        to: [RECEIVER],
        subject: `[견적요청] ${b['병원명'] || '병원'} ${b['원장님_성함'] || ''}원장님`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: '이메일 전송 실패' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류' });
  }
};
