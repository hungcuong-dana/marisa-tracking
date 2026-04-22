// Marisa OJ Tracker — frontend (API-driven).
// Mỗi trang gọi API tương ứng; không dùng localStorage/mock.

const API = "/api";
const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

/* ============================================================
 * Helpers
 * ============================================================ */
function toISOLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const TODAY = toISOLocal(new Date());

function initials(name) {
  return name.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
}
function formatDateVN(isoStr) {
  if (!isoStr) return "—";
  const [y, m, d] = isoStr.split("-").map(Number);
  return `${d}/${m}/${y}`;
}
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ============================================================
 * API client
 * ============================================================ */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const err = await res.json(); msg = err.message || msg; } catch {}
    throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
  }
  if (res.status === 204) return null;
  return res.json();
}
const api = {
  curriculum: () => apiFetch("/curriculum"),
  listStudents: () => apiFetch("/students"),
  getStudent: (id) => apiFetch(`/students/${id}`),
  createStudent: (body) => apiFetch("/students", { method: "POST", body: JSON.stringify(body) }),
  deleteStudent: (id) => apiFetch(`/students/${id}`, { method: "DELETE" }),
  upsertProgress: (id, key, body) =>
    apiFetch(`/students/${id}/progress/${encodeURIComponent(key)}`, {
      method: "PUT", body: JSON.stringify(body),
    }),
  addScreenshot: (id, key, data) =>
    apiFetch(`/students/${id}/progress/${encodeURIComponent(key)}/screenshots`, {
      method: "POST", body: JSON.stringify({ data }),
    }),
  removeScreenshot: (id, key, shotId) =>
    apiFetch(`/students/${id}/progress/${encodeURIComponent(key)}/screenshots/${shotId}`, {
      method: "DELETE",
    }),
};

// Đọc file ảnh → data URL (client-side resize để tiết kiệm dung lượng)
function readImageAsDataUrl(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("Ảnh không hợp lệ"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================================
 * Curriculum helpers
 * ============================================================ */
function allCategories(curriculum, levelKey) {
  const lv = curriculum.find(l => l.key === levelKey);
  if (!lv) return [];
  return lv.groups.flatMap(g => g.categories.map(c => ({ ...c, group: g.name })));
}
function findCategory(curriculum, levelKey, catKey) {
  return allCategories(curriculum, levelKey).find(c => c.key === catKey) || null;
}
function findProblemInfo(curriculum, problemKey) {
  for (const lv of curriculum) {
    for (const g of lv.groups) {
      for (const c of g.categories) {
        const p = c.problems.find(x => x.key === problemKey);
        if (p) return { level: lv, category: c, problem: p };
      }
    }
  }
  return null;
}

// progressMap: Map<problemKey, {done, date, code}>
function countDoneInCategory(progressMap, category) {
  if (!category.problems.length) return 0;
  return category.problems.filter(p => progressMap.get(p.key)?.done).length;
}
function countDoneInLevel(progressMap, curriculum, levelKey) {
  let done = 0, total = 0;
  allCategories(curriculum, levelKey).forEach(c => {
    total += c.problems.length;
    done += countDoneInCategory(progressMap, c);
  });
  return { done, total };
}

/* ============================================================
 * Dashboard
 * ============================================================ */
async function renderDashboard() {
  try {
    const students = await api.listStudents();
    const totalStudents = students.length;
    const todayTotal = students.reduce((a, s) => a + s.todayCount, 0);
    const grandTotal = students.reduce((a, s) => a + s.totalDone, 0);
    const alertCount = students.filter(s => s.alert).length;

    document.getElementById("stat-students").textContent = totalStudents;
    document.getElementById("stat-today").textContent = todayTotal;
    document.getElementById("stat-total").textContent = grandTotal;
    document.getElementById("stat-alert").textContent = alertCount;
    const label = document.getElementById("today-label");
    if (label) label.textContent = `Hôm nay ${formatDateVN(TODAY)}`;

    const grid = document.getElementById("student-grid");
    if (!students.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Chưa có học viên nào.</p>
          <a href="create-user.html" class="btn btn-primary">+ Thêm học viên đầu tiên</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = students.map(s => {
      const badge = s.todayCount === 0
        ? `<span class="badge badge-warn">● Chưa làm hôm nay</span>`
        : s.alert
          ? `<span class="badge badge-warn">● Chưa đủ ${s.goal} bài</span>`
          : `<span class="badge badge-ok">● Đủ bài hôm nay</span>`;

      return `
        <a class="student-card" href="student.html?id=${s.id}">
          <div class="student-head">
            <div class="avatar">${initials(s.name)}</div>
            <div>
              <div class="student-name">${s.name}</div>
              <div class="student-username">@${s.username}</div>
            </div>
          </div>
          ${badge}
          <div class="student-stats">
            <span>Hôm nay: <strong>${s.todayCount}</strong> bài</span>
            <span>Tổng: <strong>${s.totalDone}</strong></span>
          </div>
          ${renderMiniCal(s)}
        </a>
      `;
    }).join("");
  } catch (e) {
    showError(e);
  }
}

function renderMiniCal(student) {
  if (!student.daily?.length) return "";
  const goal = student.goal || 5;
  const cells = student.daily.map(d => {
    const isToday = d.date === TODAY;
    let cls = "mini-cell";
    if (d.count === 0) cls += " mini-empty";
    else if (d.count >= goal) cls += " mini-ok";
    else cls += " mini-warn";
    if (isToday) cls += " mini-today";
    const [, m, day] = d.date.split("-");
    const tip = `${Number(day)}/${Number(m)} — ${d.count} bài${isToday ? " (hôm nay)" : ""}`;
    return `<span class="${cls}" title="${tip}"><span class="mini-count">${d.count || ""}</span></span>`;
  }).join("");

  return `
    <div class="mini-cal">
      <div class="mini-cal-head">
        <span>${student.daily.length} ngày gần nhất</span>
        <span class="muted">hôm nay →</span>
      </div>
      <div class="mini-cal-row">${cells}</div>
    </div>
  `;
}

/* ============================================================
 * Student detail
 * ============================================================ */
let _studentCtx = null; // { student, progressMap, curriculum, calMonth, selectedDate }

async function renderStudentPage() {
  const id = getParam("id");
  if (!id) return showError(new Error("Thiếu id học viên"));

  try {
    const [curriculum, student] = await Promise.all([api.curriculum(), api.getStudent(id)]);
    const progressMap = new Map(student.progress.map(p => [p.problemKey, p]));
    _studentCtx = { student, progressMap, curriculum, calMonth: null, selectedDate: null };

    document.getElementById("profile-avatar").textContent = initials(student.name);
    document.getElementById("profile-name").textContent = student.name;
    document.getElementById("profile-username").textContent = `@${student.username} · marisaoj.com`;

    const todayCount = [...progressMap.values()].filter(p => p.done && p.date === TODAY).length;
    const totalDone = [...progressMap.values()].filter(p => p.done).length;
    const alert = todayCount < student.goal;

    document.getElementById("profile-badges").innerHTML = `
      <span class="badge ${alert ? "badge-warn" : "badge-ok"}">
        ${alert ? `● Hôm nay chưa đủ ${student.goal} bài` : `● Đã đủ bài hôm nay`}
      </span>
      <span class="badge badge-muted">Tổng: ${totalDone} bài</span>
      <span class="badge badge-muted">Mục tiêu ${student.goal}/ngày</span>
    `;
    document.getElementById("profile-today").innerHTML = `
      <div class="today-label">Bài làm hôm nay</div>
      <div class="today-count" style="color:${alert ? "var(--danger)" : "var(--ok)"}">${todayCount}</div>
    `;

    // Curriculum tree
    document.getElementById("curriculum").innerHTML =
      curriculum.map(lv => renderLevelBlock(lv, progressMap, curriculum, student.id)).join("");

    // Calendar
    const now = new Date(TODAY);
    _studentCtx.calMonth = { year: now.getFullYear(), month: now.getMonth() };
    document.getElementById("prev-month").onclick = () => shiftMonth(-1);
    document.getElementById("next-month").onclick = () => shiftMonth(1);
    document.getElementById("close-day").onclick = () => {
      document.getElementById("day-detail-section").hidden = true;
      _studentCtx.selectedDate = null;
      renderCalendar();
    };
    wirePreviewModal();
    renderCalendar();
  } catch (e) {
    showError(e);
  }
}

function renderLevelBlock(lv, progressMap, curriculum, studentId) {
  const stat = countDoneInLevel(progressMap, curriculum, lv.key);
  const pct = stat.total ? (stat.done / stat.total) * 100 : 0;
  const groupsHtml = !lv.groups?.length
    ? `<div class="cat-pending">Chưa có dạng bài nào.</div>`
    : lv.groups.map(g => `
        <div class="cat-group">
          <div class="cat-group-head">${g.name}</div>
          <div class="cat-list">
            ${g.categories.map(c => renderCategoryRow(c, progressMap, lv.key, studentId)).join("")}
          </div>
        </div>
      `).join("");

  return `
    <div class="level-block">
      <div class="level-hero" style="background:${lv.bg};color:${lv.fg}">
        <div class="level-hero-head">
          <div class="level-hero-name">${lv.name}</div>
        </div>
        <div class="level-hero-tag">${lv.tagline}</div>
        <div class="level-hero-stat">
          <strong>${stat.done}</strong><span class="dim"> / ${stat.total || "—"} bài</span>
        </div>
        <div class="bar bar-on-dark"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
      </div>
      <div class="level-body">${groupsHtml}</div>
    </div>
  `;
}

function renderCategoryRow(cat, progressMap, levelKey, studentId) {
  const done = countDoneInCategory(progressMap, cat);
  const total = cat.problems.length;
  const pending = total === 0;
  const pct = total ? (done / total) * 100 : 0;
  const href = pending ? "#" : `problems.html?student=${studentId}&level=${levelKey}&cat=${cat.key}`;
  const attrs = pending ? 'aria-disabled="true" onclick="event.preventDefault()"' : "";

  return `
    <a class="cat-row ${pending ? "cat-pending-row" : ""}" href="${href}" ${attrs}>
      <div class="cat-row-main">
        <div class="cat-row-name">${cat.name}</div>
        <div class="cat-row-sub">
          ${pending
            ? "Chưa có dữ liệu"
            : `${done}/${total} bài${cat.freq ? ` · Độ thường xuyên ${cat.freq}` : ""}`}
        </div>
      </div>
      ${pending
        ? `<span class="pill">Sắp ra mắt</span>`
        : `<div class="cat-row-bar"><div class="bar"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div><span class="cat-row-pct">${pct.toFixed(0)}%</span></div>`}
    </a>
  `;
}

function shiftMonth(delta) {
  const m = _studentCtx.calMonth;
  m.month += delta;
  if (m.month < 0) { m.month = 11; m.year--; }
  if (m.month > 11) { m.month = 0; m.year++; }
  renderCalendar();
}

function renderCalendar() {
  const { calMonth, progressMap, selectedDate, student } = _studentCtx;
  const { year, month } = calMonth;
  document.getElementById("calendar-month-label").textContent = `${VN_MONTHS[month]} ${year}`;

  // Derive history from progressMap
  const history = {};
  for (const rec of progressMap.values()) {
    if (!rec.done || !rec.date) continue;
    if (!history[rec.date]) history[rec.date] = { total: 0, problemKeys: [] };
    history[rec.date].total++;
    history[rec.date].problemKeys.push(rec.problemKey);
  }

  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date(TODAY);

  const cells = [];
  VN_DAYS.forEach(d => cells.push(`<div class="cal-head">${d}</div>`));
  for (let i = 0; i < startWeekday; i++) cells.push(`<div class="cal-day empty"></div>`);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isoStr = toISOLocal(date);
    const rec = history[isoStr];
    const isFuture = date > todayDate;
    const isToday = isoStr === TODAY;
    const classes = ["cal-day"];
    let info = "—";
    if (isFuture) classes.push("future");
    else if (rec) {
      classes.push(rec.total >= student.goal ? "ok" : "warn");
      info = `${rec.total} bài`;
    } else {
      classes.push("warn");
      info = "0 bài";
    }
    if (isToday) classes.push("today");
    if (selectedDate === isoStr) classes.push("selected");

    const clickable = isFuture ? "" : `onclick="selectDay('${isoStr}')"`;
    cells.push(`
      <div class="${classes.join(" ")}" ${clickable}>
        <div class="cal-num">${d}</div>
        <div class="cal-count">${info}</div>
      </div>
    `);
  }
  document.getElementById("calendar").innerHTML = cells.join("");
  _studentCtx._history = history;
}

function selectDay(isoStr) {
  _studentCtx.selectedDate = isoStr;
  renderCalendar();
  const rec = _studentCtx._history[isoStr];
  const { student, curriculum, progressMap } = _studentCtx;
  const section = document.getElementById("day-detail-section");
  const detail = document.getElementById("day-detail");
  document.getElementById("day-title").textContent = `Chi tiết ngày ${formatDateVN(isoStr)}`;

  if (!rec) {
    detail.innerHTML = `
      <div class="day-detail-empty">
        <h3>Chưa có bài làm</h3>
        <p class="muted">Học viên không tick bài nào trong ngày này.</p>
      </div>
    `;
    section.hidden = false;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // Gom theo Mức · Dạng, giữ thứ tự xuất hiện trong curriculum
  const groups = new Map(); // "Mức · Dạng" → { levelName, catName, problems: [{problem, progress}] }
  rec.problemKeys.forEach(pk => {
    const info = findProblemInfo(curriculum, pk);
    if (!info) return;
    const key = `${info.level.name} · ${info.category.name}`;
    if (!groups.has(key)) {
      groups.set(key, { levelName: info.level.name, catName: info.category.name, items: [] });
    }
    groups.get(key).items.push({ problem: info.problem, rec: progressMap.get(pk) });
  });

  const alert = rec.total < student.goal;
  const summary = `
    <div class="day-summary">
      <h3>${rec.total} bài hoàn thành
        ${alert ? `<span class="badge badge-warn" style="margin-left:8px">Chưa đủ ${student.goal}</span>`
                : `<span class="badge badge-ok" style="margin-left:8px">Đủ bài</span>`}
      </h3>
    </div>
  `;

  const groupsHtml = [...groups.values()].map(g => `
    <div class="day-group">
      <div class="day-group-head">
        <span class="day-group-title">${g.levelName} · ${g.catName}</span>
        <span class="day-group-count">+${g.items.length} bài</span>
      </div>
      <div class="day-group-body">
        ${g.items.map(({ problem, rec }) => renderDayProblem(problem, rec)).join("")}
      </div>
    </div>
  `).join("");

  detail.innerHTML = summary + `<div class="day-groups">${groupsHtml}</div>`;
  // Highlight tất cả code blocks
  if (window.hljs) detail.querySelectorAll("pre code.language-cpp").forEach(el => window.hljs.highlightElement(el));

  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDayProblem(problem, rec) {
  const hasCode = !!rec?.code;
  const shots = rec?.screenshots || [];
  const thumbs = shots.length
    ? `<div class="day-thumbs">
         ${shots.map(s => `<img class="day-thumb" src="${s.data}" alt="" onclick="openPreview('${problem.key}', ${s.id})">`).join("")}
       </div>`
    : "";
  const codeHtml = hasCode
    ? `<pre class="day-code"><code class="language-cpp">${escapeHtml(rec.code)}</code></pre>`
    : "";
  const emptyNote = !hasCode && !shots.length
    ? `<div class="day-problem-empty">Chưa có code hoặc ảnh nháp</div>`
    : "";
  return `
    <div class="day-problem">
      <div class="day-problem-head">
        <span class="day-problem-name">${problem.name}</span>
        <span class="day-problem-meta">
          ${hasCode ? `<span class="chip chip-code">&lt;/&gt; code</span>` : ""}
          ${shots.length ? `<span class="chip chip-img">🖼 ${shots.length}</span>` : ""}
        </span>
      </div>
      ${codeHtml}
      ${thumbs}
      ${emptyNote}
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ============================================================
 * Problems checklist page
 * ============================================================ */
let _probCtx = null; // { student, curriculum, level, category, progressMap }

async function renderProblemsPage() {
  const studentId = getParam("student");
  const levelKey = getParam("level");
  const catKey = getParam("cat");
  if (!studentId || !levelKey || !catKey) return showError(new Error("Thiếu tham số URL"));

  try {
    const [curriculum, student] = await Promise.all([api.curriculum(), api.getStudent(studentId)]);
    const level = curriculum.find(l => l.key === levelKey);
    const category = findCategory(curriculum, levelKey, catKey);
    if (!level || !category) return showError(new Error("Không tìm thấy lộ trình / dạng bài"));

    const progressMap = new Map(student.progress.map(p => [p.problemKey, p]));
    _probCtx = { student, curriculum, level, category, progressMap };

    document.getElementById("back-student").href = `student.html?id=${student.id}`;

    document.getElementById("breadcrumb").innerHTML = `
      <a href="index.html">Dashboard</a>
      <span class="sep">›</span>
      <a href="student.html?id=${student.id}">${student.name}</a>
      <span class="sep">›</span>
      <span>${level.name}</span>
      <span class="sep">›</span>
      <span>${category.name}</span>
    `;

    renderProblemsHero();
    renderProblemsTable();
    wireCodeModal();
    wirePreviewModal();
  } catch (e) {
    showError(e);
  }
}

function renderProblemsHero() {
  const { level, category, progressMap } = _probCtx;
  const done = countDoneInCategory(progressMap, category);
  const total = category.problems.length;
  const pct = total ? (done / total) * 100 : 0;

  document.getElementById("problems-hero").innerHTML = `
    <div class="level-hero" style="background:${level.bg};color:${level.fg}">
      <div class="level-hero-head">
        <div>
          <div class="level-hero-name">${level.name} — ${category.name}</div>
          <div class="level-hero-tag">${level.tagline}${category.freq ? ` · Độ thường xuyên ${category.freq}` : ""}</div>
        </div>
        <div class="level-hero-score">
          <div class="level-hero-score-num">${done}<span class="dim"> / ${total}</span></div>
          <div class="level-hero-score-sub">bài đã hoàn thành</div>
        </div>
      </div>
      <div class="bar bar-on-dark"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
    </div>
  `;
}

function renderProblemsTable() {
  const { category, progressMap } = _probCtx;

  const head = `
    <div class="pr-row pr-head">
      <div class="pr-check"></div>
      <div class="pr-idx">#</div>
      <div class="pr-name">Tên bài</div>
      <div class="pr-stars">Điểm</div>
      <div class="pr-date">Ngày AC</div>
      <div class="pr-code">Code C++</div>
      <div class="pr-shots">Ảnh nháp</div>
    </div>
  `;

  const rows = category.problems.map((p, i) => {
    const rec = progressMap.get(p.key);
    const done = !!rec?.done;
    const hasCode = !!rec?.code;
    const shots = rec?.screenshots || [];

    const shotsHtml = shots.length
      ? shots.slice(0, 3).map(s =>
          `<button class="btn-thumb" title="Xem" onclick="openPreview('${p.key}', ${s.id})">
             <img src="${s.data}" alt="">
           </button>`
        ).join("")
        + (shots.length > 3 ? `<span class="shot-more" onclick="openPreview('${p.key}')">+${shots.length - 3}</span>` : "")
      : "";

    return `
      <div class="pr-row ${done ? "pr-done" : ""}" data-pkey="${p.key}">
        <div class="pr-check">
          <label class="checkbox">
            <input type="checkbox" ${done ? "checked" : ""} onchange="onToggle('${p.key}', this.checked)">
            <span></span>
          </label>
        </div>
        <div class="pr-idx">${i + 1}</div>
        <div class="pr-name"><a href="${p.url || "#"}" target="_blank" rel="noopener">${p.name}</a></div>
        <div class="pr-stars">★ ${p.stars}</div>
        <div class="pr-date">${done ? formatDateVN(rec.date) : "—"}</div>
        <div class="pr-code">
          ${hasCode
            ? `<button class="btn btn-code" onclick="openCodeModal('${p.key}')"><span class="code-icon">&lt;/&gt;</span> Xem code</button>`
            : `<button class="btn btn-ghost btn-xs" onclick="openCodeModal('${p.key}')">+ Dán code</button>`}
        </div>
        <div class="pr-shots">
          ${shotsHtml}
          <label class="btn btn-ghost btn-xs upload-btn" title="Thêm ảnh nháp">
            + Ảnh
            <input type="file" accept="image/*" multiple hidden onchange="uploadShots('${p.key}', this.files); this.value=''">
          </label>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("problems-table").innerHTML = head + rows;
}

async function onToggle(problemKey, checked) {
  try {
    const { student, progressMap } = _probCtx;
    const current = progressMap.get(problemKey) || {};
    const rec = await api.upsertProgress(student.id, problemKey, { done: checked });
    progressMap.set(problemKey, { ...rec, screenshots: current.screenshots || [] });
    renderProblemsHero();
    renderProblemsTable();
  } catch (e) {
    alert(`Lỗi lưu: ${e.message}`);
    renderProblemsTable();
  }
}

async function uploadShots(problemKey, files) {
  if (!files?.length) return;
  const { student, progressMap } = _probCtx;
  const rec = progressMap.get(problemKey) || { screenshots: [] };
  try {
    for (const f of files) {
      const data = await readImageAsDataUrl(f);
      const shot = await api.addScreenshot(student.id, problemKey, data);
      rec.screenshots = [...(rec.screenshots || []), shot];
    }
    progressMap.set(problemKey, rec);
    renderProblemsTable();
  } catch (e) {
    alert(`Lỗi upload ảnh: ${e.message}`);
  }
}

async function deleteShot(problemKey, shotId) {
  if (!confirm("Xoá ảnh này?")) return;
  const { student, progressMap } = _probCtx;
  try {
    await api.removeScreenshot(student.id, problemKey, shotId);
    const rec = progressMap.get(problemKey);
    if (rec) rec.screenshots = rec.screenshots.filter(s => s.id !== shotId);
    renderProblemsTable();
    renderPreviewGallery(problemKey);
  } catch (e) {
    alert(`Lỗi: ${e.message}`);
  }
}

/* ============================================================
 * Preview modal (ảnh nháp)
 * ============================================================ */
let _preview = { problemKey: null, index: 0 };

function openPreview(problemKey, shotId) {
  const ctx = _probCtx || _studentCtx;
  if (!ctx) return;
  const progressMap = ctx.progressMap;
  const rec = progressMap.get(problemKey);
  if (!rec?.screenshots?.length) return;
  _preview.problemKey = problemKey;
  _preview.index = shotId ? Math.max(0, rec.screenshots.findIndex(s => s.id === shotId)) : 0;
  document.getElementById("preview-modal").hidden = false;
  renderPreviewGallery(problemKey);
}

function renderPreviewGallery(problemKey) {
  const ctx = _probCtx || _studentCtx;
  const rec = ctx.progressMap.get(problemKey);
  const modal = document.getElementById("preview-modal");
  if (!rec?.screenshots?.length) { modal.hidden = true; return; }

  const idx = Math.min(_preview.index, rec.screenshots.length - 1);
  _preview.index = idx;
  const shot = rec.screenshots[idx];
  const problem = findProblemInfo(ctx.curriculum, problemKey)?.problem;
  document.getElementById("preview-img").src = shot.data;

  const total = rec.screenshots.length;
  const nav = total > 1
    ? `<button class="nav-btn" onclick="previewStep(-1)">‹</button>
       <span>${idx + 1} / ${total}</span>
       <button class="nav-btn" onclick="previewStep(1)">›</button>`
    : "";
  const canDelete = !!_probCtx; // chỉ cho xoá ở trang problems
  document.getElementById("preview-caption").innerHTML = `
    <div class="preview-title">${problem?.name || problemKey}</div>
    <div class="preview-nav">
      ${nav}
      ${canDelete ? `<button class="btn btn-ghost btn-xs" onclick="deleteShot('${problemKey}', ${shot.id})">Xoá ảnh</button>` : ""}
    </div>
  `;
}

function previewStep(delta) {
  const ctx = _probCtx || _studentCtx;
  const rec = ctx.progressMap.get(_preview.problemKey);
  if (!rec) return;
  _preview.index = (_preview.index + delta + rec.screenshots.length) % rec.screenshots.length;
  renderPreviewGallery(_preview.problemKey);
}

function wirePreviewModal() {
  const modal = document.getElementById("preview-modal");
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target.dataset.closePreview) modal.hidden = true;
  });
}

/* ============================================================
 * Code modal (view / edit C++ code with hljs highlight)
 * ============================================================ */
let _codeModalKey = null;

function openCodeModal(problemKey) {
  const { category, progressMap } = _probCtx;
  const problem = category.problems.find(p => p.key === problemKey);
  const rec = progressMap.get(problemKey);
  _codeModalKey = problemKey;

  document.getElementById("code-modal-title").textContent = `Mã nguồn — ${problem.name}`;
  document.getElementById("code-textarea").value = rec?.code || "";
  document.getElementById("code-modal").hidden = false;
  switchCodeMode(rec?.code ? "preview" : "edit");
}

function switchCodeMode(mode) {
  const rec = _probCtx.progressMap.get(_codeModalKey);
  const hasCode = !!rec?.code;
  document.getElementById("code-editor").hidden = mode !== "edit";
  document.getElementById("code-preview").hidden = mode !== "preview";
  document.getElementById("code-edit-btn").hidden = mode !== "preview";
  document.getElementById("code-delete-btn").hidden = !hasCode;

  if (mode === "edit") {
    document.getElementById("code-textarea").focus();
  } else {
    const el = document.getElementById("code-preview-content");
    el.textContent = rec?.code || "";
    el.removeAttribute("data-highlighted");
    el.className = "language-cpp";
    if (window.hljs) window.hljs.highlightElement(el);
  }
}

async function saveCode() {
  const code = document.getElementById("code-textarea").value.trim();
  const { student } = _probCtx;
  try {
    const rec = await api.upsertProgress(student.id, _codeModalKey, { code: code || null });
    _probCtx.progressMap.set(_codeModalKey, rec);
    if (code) {
      switchCodeMode("preview");
    } else {
      document.getElementById("code-modal").hidden = true;
    }
    renderProblemsTable();
  } catch (e) {
    alert(`Lỗi lưu code: ${e.message}`);
  }
}

async function deleteCode() {
  if (!confirm("Xoá code đã lưu cho bài này?")) return;
  const { student } = _probCtx;
  try {
    const rec = await api.upsertProgress(student.id, _codeModalKey, { code: null });
    _probCtx.progressMap.set(_codeModalKey, rec);
    document.getElementById("code-modal").hidden = true;
    renderProblemsTable();
  } catch (e) {
    alert(`Lỗi: ${e.message}`);
  }
}

function wireCodeModal() {
  const modal = document.getElementById("code-modal");
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target.dataset.closeCode) modal.hidden = true;
  });
  document.getElementById("code-save-btn").onclick = saveCode;
  document.getElementById("code-cancel-btn").onclick = () => { modal.hidden = true; };
  document.getElementById("code-edit-btn").onclick = () => switchCodeMode("edit");
  document.getElementById("code-delete-btn").onclick = deleteCode;
}

/* ============================================================
 * Create user form
 * ============================================================ */
function wireCreateForm() {
  const form = document.getElementById("create-form");
  const note = document.getElementById("form-note");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const s = await api.createStudent({
        name: data.name,
        username: data.username,
        password: data.password,
        parent: data.parent || undefined,
      });
      note.hidden = false;
      note.textContent = `✓ Đã tạo học viên "${s.name}" (@${s.username}). Đang chuyển về trang chủ...`;
      setTimeout(() => { window.location.href = "index.html"; }, 900);
    } catch (err) {
      note.hidden = false;
      note.className = "note note-error";
      note.textContent = `Lỗi: ${err.message}`;
    }
  });
}

/* ============================================================
 * Error helper
 * ============================================================ */
function showError(e) {
  console.error(e);
  const main = document.querySelector("main");
  if (main) {
    main.innerHTML = `<div class="card" style="margin-top:24px">
      <h2 style="margin-top:0">Đã xảy ra lỗi</h2>
      <p class="muted">${e.message}</p>
      <a href="index.html" class="btn btn-ghost">Về Dashboard</a>
    </div>`;
  }
}
