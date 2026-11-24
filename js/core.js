import { getMode, getProfile, logout, ensureSession } from "./api.js";

const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chart: '<path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/>',
  logout:
    '<path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  alert:
    '<path d="M10.3 3.7 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  userCheck:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 10 2 2 4-4"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  refresh:
    '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2"/>',
};
export function icon(name, size = 18) {
  return `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.info}</svg>`;
}
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export const dateText = (v) => {
  if (!v) return "Não informada";
  const d = new Date(v);
  return Number.isNaN(d.valueOf())
    ? String(v)
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(d);
};
export const dayText = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.valueOf())
    ? String(v)
    : new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
};
export const initialLetters = (v) =>
  String(v || "C")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
export const statusLabel = (s) =>
  ({
    AGENDADA: "Agendada",
    EM_ANDAMENTO: "Em andamento",
    FINALIZADA: "Finalizada",
    PRESENTE: "Presente",
    AUSENTE: "Ausente",
    JUSTIFICADO: "Justificado",
    ATIVO: "Ativo",
    INATIVO: "Inativo",
  })[s] ||
  s ||
  "Não informado";
export const statusChip = (status) =>
  `<span class="chip chip--${esc(status || "default")}"><span class="chip-dot"></span>${esc(statusLabel(status))}</span>`;
export const showError = (target, message, actionHtml = "") => {
  target.innerHTML = `<div class="notice notice--danger">${icon("alert")}<span>${esc(message)}</span>${actionHtml}</div>`;
};

export function renderShell({ active, title, kicker, subtitle }) {
  if (!ensureSession()) return false;
  const root = document.getElementById("app-shell");
  const profile = getProfile();
  const name = profile?.nome || "Coordenação do colegiado";
  root.innerHTML = `<aside class="sidebar" id="sidebar">
    <a class="brand" href="painel-coordenador.html"><span class="brand-symbol">C<span>.</span></span><span><strong>Colegiado</strong><small>Gestão acadêmica</small></span></a>
    <div class="nav-heading">ESPAÇO DE TRABALHO</div>
    <nav class="sidebar-nav" aria-label="Menu principal">
      <a href="painel-coordenador.html" class="nav-link ${active === "dashboard" ? "active" : ""}">${icon("grid", 19)}<span>Visão geral</span></a>
      <a href="gestao-membros.html" class="nav-link ${active === "members" ? "active" : ""}">${icon("users", 19)}<span>Membros</span></a>
      <a href="gestao-reuniao.html" class="nav-link ${active === "meetings" ? "active" : ""}">${icon("calendar", 19)}<span>Reuniões e pautas</span></a>
    </nav>
    <div class="sidebar-bottom"><div class="sidebar-help">${icon("shield", 18)}<div><strong>Acesso administrativo</strong><small>Ações protegidas pelo servidor</small></div></div>
    <button type="button" class="sidebar-signout" id="logout">${icon("logout", 18)} Sair da conta</button></div>
  </aside>
  <div class="workspace"><header class="topbar"><button type="button" class="icon-btn mobile-menu" id="mobile-menu" aria-label="Abrir menu">${icon("menu", 21)}</button>
    <div class="breadcrumb">Sistema de Colegiado ${icon("chevron", 13)} <span>${esc(title)}</span></div>
    <div class="topbar-actions"><span class="mode-chip ${getMode() === "demo" ? "mode-demo" : "mode-api"}">${getMode() === "demo" ? "● Modo demonstração" : "● API local"}</span><span class="topbar-divider"></span><div class="profile-avatar" title="${esc(name)}">${esc(initialLetters(name))}</div><div class="profile-name"><strong>${esc(name)}</strong><small>Coordenação</small></div></div>
  </header><main class="main-content"><div class="page-top"><div><div class="eyebrow">${esc(kicker || "ADMINISTRAÇÃO")}</div><h1>${esc(title)}</h1><p>${esc(subtitle || "")}</p></div><div id="page-actions" class="page-actions"></div></div><div id="page-content"></div></main></div>
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div><div id="toast-region" class="toast-region" aria-live="polite"></div><div id="modal-root"></div>`;
  document.getElementById("logout").addEventListener("click", () => {
    logout();
    window.location.href = "login.html";
  });
  const open = () => document.getElementById("sidebar").classList.add("open");
  const close = () =>
    document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mobile-menu").addEventListener("click", open);
  document.getElementById("sidebar-backdrop").addEventListener("click", close);
  return true;
}
export function toast(message, type = "success") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const item = document.createElement("div");
  item.className = `toast toast--${type}`;
  item.innerHTML = `${icon(type === "success" ? "check" : type === "error" ? "alert" : "info", 18)}<span>${esc(message)}</span><button type="button" class="icon-btn icon-btn--sm" aria-label="Fechar">${icon("close", 14)}</button>`;
  region.append(item);
  const remove = () => item.remove();
  item.querySelector("button").addEventListener("click", remove);
  setTimeout(remove, 5800);
}
export function modal({
  title,
  description = "",
  body,
  wide = false,
  onOpen,
  onClose,
}) {
  const root = document.getElementById("modal-root");
  const before = document.activeElement;
  root.innerHTML = `<div class="modal-overlay"><section class="modal ${wide ? "modal--wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><div><h2>${esc(title)}</h2>${description ? `<p>${esc(description)}</p>` : ""}</div><button type="button" class="icon-btn" data-close aria-label="Fechar">${icon("close", 20)}</button></div><div class="modal-body">${body}</div></section></div>`;
  const overlay = root.querySelector(".modal-overlay");
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    root.innerHTML = "";
    document.removeEventListener("keydown", key);
    before?.focus?.();
    onClose?.();
  };
  const key = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", key);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-close]")) close();
  });
  root.querySelector("input,select,textarea,button")?.focus();
  onOpen?.(root.querySelector(".modal"), close);
  return close;
}
export function confirmAction({
  title,
  message,
  confirmText = "Confirmar",
  danger = false,
}) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const close = modal({
      title,
      description: message,
      body: `<div class="form-actions"><button type="button" class="btn btn--secondary" data-cancel>Cancelar</button><button type="button" class="btn ${danger ? "btn--danger" : "btn--primary"}" data-confirm>${esc(confirmText)}</button></div>`,
      onClose: () => settle(false),
      onOpen(root, closeInternal) {
        root.querySelector("[data-cancel]").addEventListener("click", () => {
          settle(false);
          closeInternal();
        });
        root.querySelector("[data-confirm]").addEventListener("click", () => {
          settle(true);
          closeInternal();
        });
      },
    });
  });
}
export const emptyState = ({
  iconName = "file",
  title,
  description,
  button = "",
}) =>
  `<div class="empty-state"><div class="empty-icon">${icon(iconName, 27)}</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${button}</div>`;
