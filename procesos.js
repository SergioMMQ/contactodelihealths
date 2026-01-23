// =====================
// 1) DATOS (catálogo)
// =====================
const DOCUMENTS = [
  {
    id: "PROC-001",
    title: "Proceso de Destrucción de Datos (Clientes)",
    description: "Vista para clientes sobre alcance general y controles del proceso.",
    area: "TI / Seguridad",
    type: "Proceso",
    version: "v1.0",
    classification: "Compartible",
    shareable: true,
    updated: "2026-01-15",
    file: "docs/proceso-destruccion-datos-clientes.pdf"
  },
  {
    id: "PROC-002",
    title: "Proceso de Destrucción de Datos (Interno)",
    description: "Guía interna con responsabilidades, evidencias y trazabilidad.",
    area: "TI / Seguridad",
    type: "Proceso",
    version: "v1.0",
    classification: "Uso interno",
    shareable: false,
    updated: "2026-01-15",
    file: "docs/proceso-destruccion-datos-interno.pdf"
  },
  {
    id: "FMT-010",
    title: "Formato: Solicitud de Destrucción de Datos",
    description: "Formato de solicitud para iniciar el proceso y anexar evidencias.",
    area: "Cumplimiento",
    type: "Formato",
    version: "v1.0",
    classification: "Uso interno",
    shareable: false,
    updated: "2026-01-14",
    file: "docs/formato-solicitud-destruccion.pdf"
  }
];

// =====================
// 2) Helpers
// =====================
const $ = (sel) => document.querySelector(sel);
const rowsEl = $("#rows");
const emptyEl = $("#empty");
const countEl = $("#count");

const qEl = $("#q");
const areaEl = $("#area");
const tipoEl = $("#tipo");
const compEl = $("#compartible");

const modal = $("#modal");
const preview = $("#preview");
const modalTitle = $("#modalTitle");
const modalSub = $("#modalSub");
const modalDownload = $("#modalDownload");
const modalOpen = $("#modalOpen");

function formatDate(iso){
  // iso: YYYY-MM-DD
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString("es-MX", { year:"numeric", month:"short", day:"2-digit" });
}

function badgeFor(doc){
  if (doc.shareable) return `<span class="badge badge--ok">Compartible</span>`;
  return `<span class="badge badge--warn">Uso interno</span>`;
}

function safeText(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

// =====================
// 3) Render
// =====================
function render(list){
  rowsEl.innerHTML = "";

  if (!list.length){
    emptyEl.hidden = false;
    countEl.textContent = "0";
    return;
  }
  emptyEl.hidden = true;
  countEl.textContent = String(list.length);

  for (const doc of list){
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="doc-title">${safeText(doc.title)}</div>
        <div class="doc-desc">${safeText(doc.description || "")}</div>
        <div class="doc-desc"><span style="font-family: var(--mono);">${safeText(doc.id)}</span></div>
      </td>
      <td>${safeText(doc.area)}</td>
      <td>${safeText(doc.type)}</td>
      <td>${safeText(doc.version || "-")}</td>
      <td>${badgeFor(doc)}</td>
      <td>${safeText(formatDate(doc.updated))}</td>
      <td>
        <div class="actions">
          <button class="btn btn--small btn--ghost" data-view="${safeText(doc.id)}" type="button">Vista</button>
          <a class="btn btn--small" href="${safeText(doc.file)}" download>Descargar</a>
        </div>
      </td>
    `;

    rowsEl.appendChild(tr);
  }
}

// =====================
// 4) Filtros
// =====================
function uniqueAreas(){
  const areas = Array.from(new Set(DOCUMENTS.map(d => d.area))).sort((a,b)=>a.localeCompare(b,"es"));
  areaEl.innerHTML = `<option value="">Todas</option>` + areas.map(a => `<option value="${safeText(a)}">${safeText(a)}</option>`).join("");
}

function applyFilters(){
  const q = qEl.value.trim().toLowerCase();
  const area = areaEl.value;
  const tipo = tipoEl.value;
  const comp = compEl.value; // "", "true", "false"

  const filtered = DOCUMENTS.filter(d => {
    const hayQ = !q || (
      (d.title || "").toLowerCase().includes(q) ||
      (d.description || "").toLowerCase().includes(q) ||
      (d.id || "").toLowerCase().includes(q)
    );

    const hayArea = !area || d.area === area;
    const hayTipo = !tipo || d.type === tipo;

    const hayComp =
      !comp ||
      (comp === "true" ? d.shareable === true : d.shareable === false);

    return hayQ && hayArea && hayTipo && hayComp;
  });

  render(filtered);
}

// =====================
// 5) Modal Vista previa
// =====================
function openModalById(id){
  const doc = DOCUMENTS.find(d => d.id === id);
  if (!doc) return;

  modalTitle.textContent = doc.title;
  modalSub.textContent = `${doc.area} · ${doc.type} · ${doc.version || ""}`.trim();

  modalDownload.href = doc.file;
  modalOpen.href = doc.file;

  // Vista: PDFs usan <embed>, otros usan <iframe> (depende del navegador)
  const isPdf = (doc.file || "").toLowerCase().endsWith(".pdf");
  preview.innerHTML = isPdf
    ? `<embed src="${safeText(doc.file)}" type="application/pdf" />`
    : `<iframe src="${safeText(doc.file)}" loading="lazy"></iframe>`;

  modal.setAttribute("aria-hidden", "false");
}

function closeModal(){
  modal.setAttribute("aria-hidden", "true");
  preview.innerHTML = "";
}

document.addEventListener("click", (e) => {
  const viewBtn = e.target.closest("[data-view]");
  if (viewBtn){
    openModalById(viewBtn.getAttribute("data-view"));
    return;
  }

  if (e.target.matches("#closeModal") || e.target.matches("[data-close]")){
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false"){
    closeModal();
  }
});

// =====================
// 6) UX
// =====================
$("#clearFilters").addEventListener("click", () => {
  qEl.value = "";
  areaEl.value = "";
  tipoEl.value = "";
  compEl.value = "";
  applyFilters();
});

[qEl, areaEl, tipoEl, compEl].forEach(el => el.addEventListener("input", applyFilters));
[qEl, areaEl, tipoEl, compEl].forEach(el => el.addEventListener("change", applyFilters));

// Tema
const themeBtn = $("#toggleTheme");
themeBtn.addEventListener("click", () => {
  const root = document.documentElement;
  const cur = root.getAttribute("data-theme");
  const next = cur === "light" ? "" : "light";
  if (next) root.setAttribute("data-theme", next);
  else root.removeAttribute("data-theme");
  localStorage.setItem("theme", next || "dark");
});

(function init(){
  $("#year").textContent = String(new Date().getFullYear());

  const saved = localStorage.getItem("theme");
  if (saved === "light") document.documentElement.setAttribute("data-theme", "light");

  uniqueAreas();
  render(DOCUMENTS);
})();
