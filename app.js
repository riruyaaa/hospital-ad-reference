const refs = SITE_DATA["영상 레퍼런스"];
const packages = SITE_DATA["패키지별 단가표"];

// ── 견적 패키지 → 제작 유형 매핑 ─────────────────────────────
const PKG_TYPE_MAP = {
  'AI 자산활용 롱폼':       'AI 활용 광고',
  'AI 자산활용 숏폼':       'AI 활용 광고',
  '원장/모델 출연 롱폼':    '원장님 출연 광고',
  '원장/모델 출연 숏폼':    '원장님 출연 광고',
  '일반 롱폼 광고':         '일반 광고',
  '일반 숏폼 광고':         '일반 광고',
  '타이포/모션 숏폼':       '타이포·모션',
  '무빙포스터 숏폼':        '타이포·모션',
  '정보전달/시술소개 숏폼': '시술소개 영상',
  '참여유도형 광고':        '참여유도형',
  '브랜딩/병원소개 롱폼':   '브랜딩 영상',
  '티저/개원 전 광고':      '개원·티저 광고',
  '극장/지하철/옥외 광고':  '옥외·극장 광고',
  '음악/댄스 광고':         '음악·댄스 광고',
};

// ── 탭 전환 ──────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
    b.setAttribute('aria-selected', b.dataset.tab === tabName ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === tabName);
  });
  document.getElementById('topbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// 히어로 / 기타 CTA 버튼
document.getElementById('heroGalleryBtn').addEventListener('click', () => switchTab('gallery'));
document.getElementById('heroRequestBtn').addEventListener('click', () => switchTab('request'));
document.getElementById('goRequestBtn').addEventListener('click', () => switchTab('request'));
document.querySelectorAll('.tce-cta, [data-tab-target]').forEach(btn => {
  const target = btn.dataset.tabTarget;
  if (target) btn.addEventListener('click', () => switchTab(target));
});
const mobileFabBtn = document.getElementById('mobileFabBtn');
if (mobileFabBtn) mobileFabBtn.addEventListener('click', () => switchTab('request'));

// ── 갤러리 ───────────────────────────────────────────────────
const longformGrid  = document.getElementById('longformGrid');
const shortsGrid    = document.getElementById('shortsGrid');
const searchInput   = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const typeFilter    = document.getElementById('typeFilter');
const formatFilter  = document.getElementById('formatFilter');
const budgetFilter  = document.getElementById('budgetFilter');
const shootFilter   = document.getElementById('shootFilter');
const resultCount   = document.getElementById('resultCount');
const activeFilters = document.getElementById('activeFilters');
const filterBadge   = document.getElementById('filterBadge');

// 진료과목 옵션 동적 생성
const cats = [...new Set(refs.map(r => r['분류']).filter(Boolean))].sort();
cats.forEach(cat => {
  const opt = document.createElement('option');
  opt.value = cat;
  opt.textContent = cat;
  categoryFilter.appendChild(opt);
});

// 필터 패널 토글
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filterPanel     = document.getElementById('filterPanel');
filterToggleBtn.addEventListener('click', () => {
  const open = !filterPanel.hidden;
  filterPanel.hidden = open;
  filterToggleBtn.setAttribute('aria-expanded', !open);
});

// 필터 초기화
document.getElementById('filterResetBtn').addEventListener('click', () => {
  [categoryFilter, typeFilter, formatFilter, budgetFilter, shootFilter].forEach(s => s.value = '');
  searchInput.value = '';
  renderCards();
});

const LOCAL_VIDEOS = new Set([
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,
  22,23,24,25,26,27,28,29,30,
  36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,
  51,52,53,54,55,56,57,58,59,60
]);

function thumbUrl(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function fmtPriceSimple(r) {
  const min = r['최소 견적(만원)'];
  const max = r['최대 견적(만원)'];
  if (min == null) return '견적 문의';
  return `${min.toLocaleString()}~${max ? max.toLocaleString() : '?'}만원`;
}

// ── 호버: 뷰포트 중앙으로 이동 + 확대 ─────────────────────────
function applyHover(card) {
  card.style.animationPlayState = 'paused';
  card.classList.add('hovered');

  const rect = card.getBoundingClientRect();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = cx - (rect.left + rect.width / 2);
  const dy = cy - (rect.top + rect.height / 2);
  const scale = card.classList.contains('is-shorts') ? 2.0 : 1.75;

  card.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
  card.style.zIndex = '500';

  const track = card.closest('.covers-track');
  if (track) {
    track.querySelectorAll('.gallery-cover').forEach(s => {
      if (s !== card) { s.style.opacity = '0.28'; s.style.filter = 'blur(1.5px)'; }
    });
  }
}

function resetHover(card) {
  card.classList.remove('hovered');
  card.style.transform = '';
  card.style.zIndex = '';
  card.style.animationPlayState = '';

  const track = card.closest('.covers-track');
  if (track) {
    track.querySelectorAll('.gallery-cover').forEach(s => {
      s.style.opacity = ''; s.style.filter = '';
    });
  }
}

// ── 영상 라이트박스 ───────────────────────────────────────────
let _lbRef = null;

function openLightbox(r) {
  _lbRef = r;
  const lb      = document.getElementById('videoLightbox');
  const vid     = document.getElementById('vlbVideo');
  const content = document.getElementById('vlbContent');
  const isShorts = r['형식'] === 'Shorts';

  vid.src    = `videos/${r['No']}.mp4`;
  vid.poster = thumbUrl(r['YouTube ID']);
  document.getElementById('vlbCat').textContent   = r['분류'] || '';
  document.getElementById('vlbTitle').textContent = r['영상/레퍼런스명'] || '';
  document.getElementById('vlbPrice').textContent = fmtPriceSimple(r);
  content.classList.toggle('is-shorts', isShorts);

  lb.hidden = false;
  document.body.style.overflow = 'hidden';
  vid.play().catch(() => {});
}

function closeLightbox() {
  const lb  = document.getElementById('videoLightbox');
  const vid = document.getElementById('vlbVideo');
  vid.pause();
  vid.src = '';
  lb.hidden = true;
  _lbRef = null;
  if (document.getElementById('fullviewOverlay').hidden) document.body.style.overflow = '';
}

document.getElementById('vlbBackdrop').addEventListener('click', closeLightbox);
document.getElementById('vlbClose').addEventListener('click', closeLightbox);
document.getElementById('vlbQuote').addEventListener('click', () => {
  if (_lbRef) {
    const fi = document.getElementById('f-reference');
    if (fi) fi.value = `No.${_lbRef['No']} - ${_lbRef['영상/레퍼런스명'] || ''}`;
  }
  closeLightbox();
  closeFullView();
  switchTab('request');
});

// ── 전체보기 오버레이 ─────────────────────────────────────────
function openFullView(format) {
  const overlay = document.getElementById('fullviewOverlay');
  const grid    = document.getElementById('fullviewGrid');
  const isShorts = format === 'shorts';

  document.getElementById('fullviewTitle').textContent = isShorts ? 'Shorts 전체보기' : 'Long-form 전체보기';

  const items = refs.filter(r =>
    LOCAL_VIDEOS.has(r['No']) &&
    (isShorts ? r['형식'] === 'Shorts' : r['형식'] !== 'Shorts')
  );
  document.getElementById('fullviewCnt').textContent = `${items.length}개`;

  grid.className = `fullview-grid${isShorts ? ' shorts-grid' : ''}`;
  grid.innerHTML = '';
  items.forEach(r => grid.appendChild(makeFullViewCard(r)));

  overlay.hidden = false;
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeFullView() {
  const overlay = document.getElementById('fullviewOverlay');
  overlay.hidden = true;
  if (document.getElementById('videoLightbox').hidden) document.body.style.overflow = '';
}

function makeFullViewCard(r) {
  const isShorts = r['형식'] === 'Shorts';
  const card = document.createElement('div');
  card.className = `fvc${isShorts ? ' fvc-shorts' : ''}`;
  card.innerHTML = `
    <div class="fvc-media">
      <img src="${thumbUrl(r['YouTube ID'])}" alt="${r['영상/레퍼런스명'] || ''}">
      <div class="fvc-hover-overlay">
        <button class="fvc-play-btn">▶ 재생</button>
        <button class="fvc-qbtn">견적받기</button>
      </div>
    </div>
    <div class="fvc-info">
      <span class="fvc-cat">${r['분류'] || ''}</span>
      <div class="fvc-title">${r['영상/레퍼런스명'] || ''}</div>
      <div class="fvc-price">${fmtPriceSimple(r)}</div>
    </div>
  `;
  card.querySelector('.fvc-play-btn').addEventListener('click', e => {
    e.stopPropagation();
    openLightbox(r);
  });
  card.querySelector('.fvc-qbtn').addEventListener('click', e => {
    e.stopPropagation();
    const fi = document.getElementById('f-reference');
    if (fi) fi.value = `No.${r['No']} - ${r['영상/레퍼런스명'] || ''}`;
    closeFullView();
    switchTab('request');
  });
  card.addEventListener('click', () => openLightbox(r));
  return card;
}

document.getElementById('fullviewBack').addEventListener('click', closeFullView);
document.getElementById('longformViewAll').addEventListener('click', () => openFullView('longform'));
document.getElementById('shortsViewAll').addEventListener('click', () => openFullView('shorts'));

// ESC 키 전역 처리
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!document.getElementById('videoLightbox').hidden) closeLightbox();
  else if (!document.getElementById('fullviewOverlay').hidden) closeFullView();
});

// ── Cover 카드 생성 ───────────────────────────────────────────
function makeCover(r, idx) {
  const isShorts = r['형식'] === 'Shorts';
  const cover = document.createElement('div');
  cover.className = `gallery-cover floating${isShorts ? ' is-shorts' : ''}`;
  cover.setAttribute('role', 'listitem');
  cover.setAttribute('aria-label', r['영상/레퍼런스명'] || `영상 ${r['No']}`);
  // 각 카드마다 다른 타이밍으로 둥둥 떠오름
  cover.style.animationDelay = `${(idx % 9) * 0.32}s`;

  // 미디어
  const media = document.createElement('div');
  media.className = 'cover-media';

  const video = document.createElement('video');
  video.src = `videos/${r['No']}.mp4`;
  video.poster = thumbUrl(r['YouTube ID']);
  video.preload = 'none';
  video.playsInline = true;
  video.muted = true;
  video.setAttribute('aria-label', r['영상/레퍼런스명'] || '');
  video.addEventListener('error', () => { media.style.background = '#1a1a2e'; });
  media.appendChild(video);

  // 오버레이 (호버 시 표시)
  const overlay = document.createElement('div');
  overlay.className = 'cover-overlay';
  overlay.innerHTML = `
    <div class="cover-overlay-cat">${r['분류'] || ''}</div>
    <div class="cover-overlay-title">${r['영상/레퍼런스명'] || ''}</div>
    <div class="cover-overlay-price">${fmtPriceSimple(r)}</div>
    <div class="cover-overlay-actions">
      <button class="cover-btn-play">보기</button>
      <button class="cover-btn-quote">견적받기</button>
    </div>
  `;

  cover.appendChild(media);
  cover.appendChild(overlay);

  // 재생 버튼 → 라이트박스 열기
  overlay.querySelector('.cover-btn-play').addEventListener('click', e => {
    e.stopPropagation();
    resetHover(cover);
    openLightbox(r);
  });

  // 견적받기 버튼
  overlay.querySelector('.cover-btn-quote').addEventListener('click', e => {
    e.stopPropagation();
    const refInput = document.getElementById('f-reference');
    if (refInput) refInput.value = `No.${r['No']} - ${r['영상/레퍼런스명'] || ''}`;
    resetHover(cover);
    switchTab('request');
  });

  // 카드 클릭 → 라이트박스 (견적 버튼 제외)
  cover.addEventListener('click', e => {
    if (e.target.closest('.cover-btn-quote')) return;
    resetHover(cover);
    openLightbox(r);
  });

  // 호버 이벤트
  cover.addEventListener('mouseenter', () => applyHover(cover));
  cover.addEventListener('mouseleave', () => resetHover(cover));

  return cover;
}

function getActiveFilterCount() {
  return [categoryFilter, typeFilter, formatFilter, budgetFilter, shootFilter]
    .filter(s => s.value !== '').length + (searchInput.value.trim() ? 1 : 0);
}

function updateActiveFilterTags() {
  const tags = [];
  if (searchInput.value.trim())   tags.push({ label: `"${searchInput.value.trim()}"`, clear: () => { searchInput.value = ''; renderCards(); } });
  if (categoryFilter.value)       tags.push({ label: `진료: ${categoryFilter.value}`,   clear: () => { categoryFilter.value = ''; renderCards(); } });
  if (typeFilter.value)           tags.push({ label: `유형: ${typeFilter.value}`,       clear: () => { typeFilter.value = '';   renderCards(); } });
  if (formatFilter.value)         tags.push({ label: `형식: ${formatFilter.value}`,     clear: () => { formatFilter.value = ''; renderCards(); } });
  if (budgetFilter.value) {
    const lbl = { under300:'300만원 미만', '300to600':'300~600만원', '600to1000':'600~1,000만원', over1000:'1,000만원 이상' };
    tags.push({ label: `예산: ${lbl[budgetFilter.value]}`, clear: () => { budgetFilter.value = ''; renderCards(); } });
  }
  if (shootFilter.value)          tags.push({ label: `촬영: ${shootFilter.value}`,     clear: () => { shootFilter.value = '';  renderCards(); } });

  if (tags.length === 0) {
    activeFilters.style.display = 'none';
  } else {
    activeFilters.style.display = 'flex';
    activeFilters.innerHTML = tags.map((t, i) => `
      <span class="active-filter-tag" data-idx="${i}">
        ${t.label}
        <button aria-label="${t.label} 필터 제거">×</button>
      </span>
    `).join('');
    activeFilters.querySelectorAll('.active-filter-tag').forEach((el, i) => {
      el.querySelector('button').addEventListener('click', tags[i].clear);
    });
  }

  const cnt = getActiveFilterCount();
  filterBadge.textContent = cnt;
  filterBadge.style.display = cnt > 0 ? '' : 'none';
}

function matchesBudget(r, budgetVal) {
  const min = r['최소 견적(만원)'];
  if (!budgetVal || min == null) return true;
  if (budgetVal === 'under300')   return min < 300;
  if (budgetVal === '300to600')   return min >= 300 && min < 600;
  if (budgetVal === '600to1000')  return min >= 600 && min < 1000;
  if (budgetVal === 'over1000')   return min >= 1000;
  return true;
}

function matchesShoot(r, shootVal) {
  if (!shootVal) return true;
  const val = r['촬영 필요도'] || '';
  if (shootVal === '촬영 없음') return val.includes('없음');
  if (shootVal === '촬영 있음') return val.includes('있음');
  return true;
}

function renderCards() {
  const q   = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const typ = typeFilter.value;
  const fmt = formatFilter.value;
  const bgt = budgetFilter.value;
  const sht = shootFilter.value;

  const filtered = refs.filter(r => {
    if (!LOCAL_VIDEOS.has(r['No'])) return false;
    if (cat && r['분류'] !== cat) return false;
    if (fmt && r['형식'] !== fmt) return false;
    if (typ && PKG_TYPE_MAP[r['견적 패키지']] !== typ) return false;
    if (!matchesBudget(r, bgt)) return false;
    if (!matchesShoot(r, sht)) return false;
    if (q) {
      const hay = `${r['영상/레퍼런스명'] || ''} ${r['메모/활용 포인트'] || ''} ${r['분류'] || ''} ${r['견적 패키지'] || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const longforms = filtered.filter(r => r['형식'] !== 'Shorts');
  const shorts    = filtered.filter(r => r['형식'] === 'Shorts');

  resultCount.textContent = `${filtered.length}개 결과`;

  // Long-form 선반
  longformGrid.innerHTML = '';
  if (longforms.length === 0) {
    longformGrid.innerHTML = '<div class="shelf-empty">🎬 해당하는 Long-form 영상이 없어요.</div>';
  } else {
    longforms.forEach((r, i) => longformGrid.appendChild(makeCover(r, i)));
  }

  // Shorts 선반
  shortsGrid.innerHTML = '';
  if (shorts.length === 0) {
    shortsGrid.innerHTML = '<div class="shelf-empty">📱 해당하는 Shorts 영상이 없어요.</div>';
  } else {
    shorts.forEach((r, i) => shortsGrid.appendChild(makeCover(r, i)));
  }

  document.getElementById('longformCount').textContent = `${longforms.length}개`;
  document.getElementById('shortsCount').textContent   = `${shorts.length}개`;

  updateActiveFilterTags();
}

[searchInput, categoryFilter, typeFilter, formatFilter, budgetFilter, shootFilter].forEach(el =>
  el.addEventListener('input', renderCards)
);

// ── 패키지 아코디언 ──────────────────────────────────────────
function renderPackages() {
  const grouped = {};
  packages.forEach(p => {
    const key = p['견적 패키지'] || '기타';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  const container = document.getElementById('packageAccordion');
  container.innerHTML = '';

  Object.entries(grouped).forEach(([pkgName, rows]) => {
    const min = rows.reduce((s, r) => s + (r['최소(만원)'] || 0), 0);
    const max = rows.reduce((s, r) => s + (r['최대(만원)'] || 0), 0);
    const comment = rows.find(r => r['견적 코멘트'])?.['견적 코멘트'] || `합계 ${min}~${max}만원`;

    const item = document.createElement('div');
    item.className = 'package-item';
    item.innerHTML = `
      <div class="package-header" role="button" tabindex="0" aria-expanded="false">
        <span>${pkgName}</span>
        <span class="range">${comment}</span>
      </div>
      <div class="package-body">
        ${rows.map(r => `
          <div class="step-row">
            <span class="step-tag">${r['작업 단계'] || ''}</span>
            <span>${r['작업 항목'] || ''}<br><span class="note">${r['비고'] || ''}</span></span>
            <span class="price">${r['최소(만원)'] ?? '-'}~${r['최대(만원)'] ?? '-'}만원</span>
            <span class="note">${r['권장 활용'] || ''}</span>
          </div>
        `).join('')}
      </div>
    `;
    const header = item.querySelector('.package-header');
    const toggle = () => {
      const open = item.classList.toggle('open');
      header.setAttribute('aria-expanded', open);
    };
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    container.appendChild(item);
  });
}

document.getElementById('pkgDetailBtn').addEventListener('click', function () {
  const wrap = document.getElementById('packageDetailWrap');
  const open = wrap.style.display === 'none';
  wrap.style.display = open ? 'block' : 'none';
  this.textContent = open ? '전체 제작 유형별 상세 견적 닫기 −' : '전체 제작 유형별 상세 견적 보기 +';
});

// ── FAQ ──────────────────────────────────────────────────────
const FAQ_DATA = [
  { q: '제작 기간은 얼마나 걸리나요?', a: '제작 유형에 따라 다릅니다. 숏폼·타이포 영상은 2~4주, 일반 광고 영상은 4~6주, 원장님 출연 광고나 브랜딩 영상은 6~10주 정도 소요됩니다. 기획 확정 후 정확한 일정을 안내드립니다.' },
  { q: '수정은 몇 회 가능한가요?', a: '기본 2~3회 수정이 포함됩니다 (패키지별 상이). 추가 수정은 별도 협의이며, 수정 범위와 횟수는 계약서에 명시합니다.' },
  { q: '촬영은 몇 시간 진행되나요?', a: '영상 규모에 따라 반일(4시간)~1일(8시간) 내외입니다. 원장님 출연 광고나 대규모 촬영은 1~2일이 소요될 수 있습니다. 상담 후 촬영 계획을 안내드립니다.' },
  { q: '지방 촬영도 가능한가요?', a: '네, 가능합니다. 지방 촬영 시 이동비·숙박비 등 출장비가 별도로 발생할 수 있습니다. 상담 시 촬영 장소를 알려주시면 출장비 포함 견적을 안내드립니다.' },
  { q: '모델 섭외가 가능한가요?', a: '네, 모델 섭외 대행이 가능합니다. 모델료는 제작비와 별도이며, 모델 사용 범위(SNS·광고 등)에 따라 금액이 달라질 수 있습니다.' },
  { q: '의료광고 심의도 진행하나요?', a: '심의가 필요한 매체(TV, 인터넷 배너, 옥외광고 등)의 경우 심의 기준에 맞게 문구와 영상을 구성해 드립니다. 심의 접수·대행 가능 범위와 비용은 별도로 안내드립니다. 다만, 심의 통과를 보장하지는 않습니다.' },
  { q: '원본 파일도 받을 수 있나요?', a: '원본 파일(프리미어 프로젝트, 소스 파일 등) 제공 여부는 계약 시 협의합니다. 기본적으로 최종 납품 파일을 제공하며, 원본 파일 제공 시 추가 비용이 발생할 수 있습니다.' },
  { q: '가로형과 세로형을 함께 제작할 수 있나요?', a: '네, 메인 영상 제작 후 세로형(9:16) 파생본을 추가 제작할 수 있습니다. 파생본은 패키지에 따라 포함되거나 별도 협의합니다.' },
  { q: '광고 집행도 맡길 수 있나요?', a: '영상 제작이 주 서비스이며, 광고 집행(미디어 바잉)은 직접 진행하지 않습니다. 단, 신뢰할 수 있는 광고 대행사를 연결해 드리는 것은 가능합니다. 매체 집행비는 별도입니다.' },
  { q: 'AI 제작물의 사용 범위는 어떻게 되나요?', a: 'AI 생성 이미지·영상은 상업적 이용이 가능한 라이선스를 사용합니다. 단, 특정 AI 도구에 따라 사용 범위 제한이 있을 수 있으며, 이 경우 계약 전에 안내드립니다.' },
];

function renderFAQ() {
  const list = document.getElementById('faqList');
  list.innerHTML = '';
  FAQ_DATA.forEach((faq, i) => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <div class="faq-q" role="button" tabindex="0" aria-expanded="false" aria-controls="faq-a-${i}">
        <span>${faq.q}</span>
        <span class="faq-arrow" aria-hidden="true">▾</span>
      </div>
      <div class="faq-a" id="faq-a-${i}" role="region">${faq.a}</div>
    `;
    const q = item.querySelector('.faq-q');
    const toggle = () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open);
    };
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    list.appendChild(item);
  });
}

// ── 견적 요청 폼 ──────────────────────────────────────────────
const SMS_API_URL = 'https://homepage-mu-ebon.vercel.app/api/contact';

function validatePhone(val) {
  return /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(val.replace(/\s/g, ''));
}

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function setError(fieldId, errId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.toggle('error', !!msg);
  if (err)   err.textContent = msg || '';
}

function clearErrors() {
  ['f-hospital', 'f-manager', 'f-phone', 'f-email', 'f-content'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
  });
  ['err-hospital', 'err-manager', 'err-phone', 'err-email', 'err-content', 'err-privacy'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

const requestForm = document.getElementById('requestForm');
if (requestForm) {
  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const data = Object.fromEntries(new FormData(requestForm).entries());
    let valid = true;

    if (!data['병원명']?.trim()) { setError('f-hospital', 'err-hospital', '병원명을 입력해주세요.'); valid = false; }
    if (!data['담당자명']?.trim()) { setError('f-manager', 'err-manager', '담당자명을 입력해주세요.'); valid = false; }
    if (!data['연락처']?.trim()) {
      setError('f-phone', 'err-phone', '연락처를 입력해주세요.'); valid = false;
    } else if (!validatePhone(data['연락처'])) {
      setError('f-phone', 'err-phone', '올바른 전화번호 형식으로 입력해주세요. (예: 010-0000-0000)'); valid = false;
    }
    if (!data['이메일']?.trim()) {
      setError('f-email', 'err-email', '이메일을 입력해주세요.'); valid = false;
    } else if (!validateEmail(data['이메일'])) {
      setError('f-email', 'err-email', '올바른 이메일 주소를 입력해주세요.'); valid = false;
    }
    if (!data['요청_내용']?.trim()) { setError('f-content', 'err-content', '요청 내용을 입력해주세요.'); valid = false; }
    if (!data['개인정보_동의']) {
      document.getElementById('err-privacy').textContent = '개인정보 수집 및 이용에 동의해 주세요.'; valid = false;
    }

    if (!valid) {
      const firstErr = requestForm.querySelector('.error');
      if (firstErr) firstErr.focus();
      return;
    }

    const btn = document.getElementById('submitBtn');
    btn.textContent = '전송 중...';
    btn.disabled = true;

    try {
      const res = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        requestForm.style.display = 'none';
        const successEl = document.getElementById('formSuccess');
        const summaryEl = document.getElementById('successSummary');
        const rows = [
          ['병원명', data['병원명']],
          ['담당자', data['담당자명']],
          ['연락처', data['연락처']],
          ['이메일', data['이메일']],
          data['예산_범위'] ? ['예산', data['예산_범위']] : null,
          data['제작_희망_시기'] ? ['희망 시기', data['제작_희망_시기']] : null,
        ].filter(Boolean);
        summaryEl.innerHTML = `<strong>접수 내용 요약</strong><br><br>` +
          rows.map(([k, v]) => `<span style="color:var(--muted)">${k}:</span> ${v}`).join('<br>') +
          `<br><br><span style="color:var(--muted);font-size:12px">통화 가능 시간: ${data['통화_가능_시간'] || '미입력'}</span>`;
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error('서버 오류');
      }
    } catch {
      btn.textContent = '오류가 발생했어요. 다시 시도해주세요.';
      btn.disabled = false;
    }
  });
}

// ── 개인정보 토글 ────────────────────────────────────────────
const privacyToggleBtn = document.getElementById('privacyToggleBtn');
const privacyDetail    = document.getElementById('privacyDetail');
if (privacyToggleBtn && privacyDetail) {
  privacyToggleBtn.addEventListener('click', () => {
    const open = !privacyDetail.hidden;
    privacyDetail.hidden = open;
    privacyToggleBtn.setAttribute('aria-expanded', !open);
    privacyToggleBtn.textContent = open ? '상세 보기 ▾' : '닫기 ▴';
  });
}

// ── 스크롤 시 탭바 sticky ────────────────────────────────────
const topbar = document.getElementById('topbar');
const hero   = document.querySelector('.hero-section');
if (topbar && hero) {
  const observer = new IntersectionObserver(
    ([entry]) => topbar.classList.toggle('sticky-shadow', !entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(hero);
}

// ── init ─────────────────────────────────────────────────────
renderCards();
renderPackages();
renderFAQ();
