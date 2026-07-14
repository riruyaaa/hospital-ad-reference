const refs = SITE_DATA["영상 레퍼런스"];
const memos = SITE_DATA["활용 메모"];
const packages = SITE_DATA["패키지별 단가표"];
const criteria = SITE_DATA["견적 산정 기준"];

// ---------- 탭 전환 ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ---------- 갤러리 ----------
const cardGrid = document.getElementById("cardGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const formatFilter = document.getElementById("formatFilter");
const resultCount = document.getElementById("resultCount");

const categories = [...new Set(refs.map(r => r["분류"]).filter(Boolean))].sort();
categories.forEach(cat => {
  const opt = document.createElement("option");
  opt.value = cat;
  opt.textContent = cat;
  categoryFilter.appendChild(opt);
});

const LOCAL_VIDEOS = new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]);

function thumbUrl(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function renderCards() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  const fmt = formatFilter.value;

  const filtered = refs.filter(r => {
    if (cat && r["분류"] !== cat) return false;
    if (fmt && r["형식"] !== fmt) return false;
    if (q) {
      const hay = `${r["영상/레퍼런스명"] || ""} ${r["메모/활용 포인트"] || ""} ${r["분류"] || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  resultCount.textContent = `${filtered.length}개 결과`;
  cardGrid.innerHTML = "";

  if (filtered.length === 0) {
    cardGrid.innerHTML = `<div class="no-result">조건에 맞는 레퍼런스가 없어요.</div>`;
    return;
  }

  filtered.forEach(r => {
    const hasLocal = LOCAL_VIDEOS.has(r["No"]);
    const card = document.createElement("div");
    card.className = "card";

    const thumbHtml = hasLocal
      ? `<video class="local-video" src="videos/${r["No"]}.mp4" poster="${thumbUrl(r["YouTube ID"])}" controls preload="none"></video>
         <span class="badge-format">${r["형식"] || ""}</span>`
      : `<img src="${thumbUrl(r["YouTube ID"])}" alt="${r["영상/레퍼런스명"] || ""}" loading="lazy">
         <span class="badge-format">${r["형식"] || ""}</span>
         <span class="play-icon">▶</span>`;

    card.innerHTML = `
      <div class="card-thumb${hasLocal ? " has-video" : ""}">
        ${thumbHtml}
      </div>
      <div class="card-body">
        <div class="card-cat">${r["분류"] || ""}</div>
        <p class="card-title">${r["영상/레퍼런스명"] || ""}</p>
        <p class="card-memo">${r["메모/활용 포인트"] || ""}</p>
        <div class="card-meta">
          <span class="tag">촬영 ${r["촬영 필요도"] || "-"}</span>
          <span class="tag">AI ${r["AI 활용도"] || "-"}</span>
          <span class="tag muted">${r["제작 기간"] || "-"}</span>
        </div>
        <div class="card-price">${fmtPrice(r)}</div>
      </div>
    `;

    if (!hasLocal) {
      card.querySelector(".card-thumb").addEventListener("click", () => window.open(r["링크"], "_blank"));
    }
    cardGrid.appendChild(card);
  });
}

function fmtPrice(r) {
  const min = r["최소 견적(만원)"];
  const max = r["최대 견적(만원)"];
  if (min == null || max == null) return "견적 문의";
  return `${min}~${max}만원`;
}

[searchInput, categoryFilter, formatFilter].forEach(el =>
  el.addEventListener("input", renderCards)
);

// ---------- 견적 통계 ----------
function renderStats() {
  const total = refs.length;
  const minAvg = Math.round(refs.reduce((s, r) => s + (r["최소 견적(만원)"] || 0), 0) / total);
  const maxAvg = Math.round(refs.reduce((s, r) => s + (r["최대 견적(만원)"] || 0), 0) / total);
  const longform = refs.filter(r => r["형식"] === "Long-form").length;
  const shorts = refs.filter(r => r["형식"] === "Shorts").length;

  const stats = [
    { label: "전체 레퍼런스", value: total },
    { label: "Long-form", value: longform },
    { label: "Shorts", value: shorts },
    { label: "평균 최소 견적", value: `${minAvg}만원` },
    { label: "평균 최대 견적", value: `${maxAvg}만원` },
  ];

  document.getElementById("statRow").innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="value">${s.value}</div>
      <div class="label">${s.label}</div>
    </div>
  `).join("");
}

// ---------- 활용 메모 ----------
function renderMemos() {
  document.getElementById("memoGrid").innerHTML = memos.map(m => `
    <div class="memo-card">
      <h4>${m["활용 구분"]}</h4>
      <p>${m["아이디어"]}</p>
    </div>
  `).join("");
}

// ---------- 패키지별 단가표 ----------
function renderPackages() {
  const grouped = {};
  packages.forEach(p => {
    const key = p["견적 패키지"] || "기타";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  const container = document.getElementById("packageAccordion");
  container.innerHTML = "";

  Object.entries(grouped).forEach(([pkgName, rows]) => {
    const min = rows.reduce((s, r) => s + (r["최소(만원)"] || 0), 0);
    const max = rows.reduce((s, r) => s + (r["최대(만원)"] || 0), 0);
    const comment = rows.find(r => r["견적 코멘트"])?.["견적 코멘트"] || `합계 ${min}~${max}만원`;

    const item = document.createElement("div");
    item.className = "package-item";
    item.innerHTML = `
      <div class="package-header">
        <span>${pkgName}</span>
        <span class="range">${comment}</span>
      </div>
      <div class="package-body">
        ${rows.map(r => `
          <div class="step-row">
            <span class="step-tag">${r["작업 단계"] || ""}</span>
            <span>${r["작업 항목"] || ""}<br><span class="note">${r["비고"] || ""}</span></span>
            <span class="price">${r["최소(만원)"] ?? "-"}~${r["최대(만원)"] ?? "-"}만원</span>
            <span class="note">${r["권장 활용"] || ""}</span>
          </div>
        `).join("")}
      </div>
    `;
    item.querySelector(".package-header").addEventListener("click", () => {
      item.classList.toggle("open");
    });
    container.appendChild(item);
  });
}

// ---------- 견적 산정 기준 ----------
function renderCriteria() {
  if (criteria.length === 0) return;
  const headers = Object.keys(criteria[0]);
  const table = document.getElementById("criteriaTable");
  table.querySelector("thead").innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  table.querySelector("tbody").innerHTML = criteria.map(row => `
    <tr>${headers.map(h => `<td>${row[h] ?? ""}</td>`).join("")}</tr>
  `).join("");
}

// ---------- init ----------
renderCards();
renderStats();
renderMemos();
renderPackages();
renderCriteria();
