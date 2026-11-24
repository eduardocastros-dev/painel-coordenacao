import { listMeetings, listMembers, getMode } from "./api.js";
import {
  renderShell,
  icon,
  esc,
  statusChip,
  dateText,
  showError,
  emptyState,
} from "./core.js";
if (
  renderShell({
    active: "dashboard",
    title: "Visão geral",
    kicker: "PAINEL DA COORDENAÇÃO",
    subtitle:
      "Acompanhe o andamento das reuniões e tenha acesso rápido às ações administrativas.",
  })
) {
  const root = document.getElementById("page-content");
  const actions = document.getElementById("page-actions");
  actions.innerHTML = `<a class="btn btn--primary" href="gestao-reuniao.html?nova=1">${icon("plus")} Nova reunião</a>`;
  root.innerHTML =
    '<div class="grid-4"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
  const fetchData = async () => {
    const [meetingResult, memberResult] = await Promise.allSettled([
      listMeetings(),
      listMembers(),
    ]);
    const meetings =
      meetingResult.status === "fulfilled" && Array.isArray(meetingResult.value)
        ? meetingResult.value
        : [];
    const members =
      memberResult.status === "fulfilled" && Array.isArray(memberResult.value)
        ? memberResult.value
        : [];
    const activeCount = members.filter((m) => m.ativo !== false).length;
    const pending = meetings.filter((m) => m.status === "AGENDADA").length;
    const running = meetings.filter((m) => m.status === "EM_ANDAMENTO").length;
    const finished = meetings.filter((m) => m.status === "FINALIZADA").length;
    const upcoming = [...meetings]
      .filter((m) => m.status !== "FINALIZADA")
      .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
      .slice(0, 5);
    const stat = (label, value, ic, color, extra) =>
      `<article class="card stat-card"><div class="stat-top"><div class="stat-icon ${color}">${icon(ic, 19)}</div></div><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-caption">${esc(extra)}</div></article>`;
    root.innerHTML = `${meetingResult.status === "rejected" ? `<div class="notice notice--danger">${icon("alert")} <span>Não foi possível carregar as reuniões: ${esc(meetingResult.reason.message)}</span></div>` : ""}
      ${memberResult.status === "rejected" ? `<div class="notice notice--danger">${icon("alert")} <span>Não foi possível carregar os membros: ${esc(memberResult.reason.message)}</span></div>` : ""}
      <div class="grid-4">${stat("Reuniões agendadas", pending, "calendar", "", "Aguardando realização")}${stat("Em andamento", running, "clock", "stat-icon--amber", "Reuniões em execução")}${stat("Reuniões finalizadas", finished, "file", "stat-icon--green", "Atas geradas")}${stat("Membros ativos", memberResult.status === "rejected" ? "—" : activeCount, "users", "stat-icon--violet", "Integrantes habilitados")}</div>
      <div class="split-dashboard"><section class="card"><div class="card-body"><div class="section-head"><div><h2>Próximas reuniões</h2><p>Encontros agendados ou em andamento</p></div><a class="text-link" href="gestao-reuniao.html">Ver todas ${icon("arrow", 15)}</a></div>
      ${upcoming.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Data e hora</th><th>Local</th><th>Situação</th><th></th></tr></thead><tbody>${upcoming.map((m) => `<tr><td class="table-title">${esc(dateText(m.dataHora))}</td><td>${esc(m.local)}</td><td>${statusChip(m.status)}</td><td><a class="text-link" href="gestao-reuniao.html?id=${encodeURIComponent(m.id)}" aria-label="Abrir reunião ${esc(m.id)}">${icon("chevron", 16)}</a></td></tr>`).join("")}</tbody></table></div>` : emptyState({ iconName: "calendar", title: "Nenhuma reunião a acompanhar", description: "Quando uma reunião for cadastrada, ela aparecerá aqui." })}</div></section>
      <section class="card"><div class="card-body"><div class="section-head"><div><h2>Acesso rápido</h2><p>Gerencie as atividades do colegiado</p></div></div><div class="quick-actions">
        <a class="quick-link" href="gestao-reuniao.html?nova=1"><span class="quick-link-icon">${icon("plus")}</span><span><strong>Agendar reunião</strong><small>Definir data, horário e local</small></span>${icon("chevron", 16)}</a>
        <a class="quick-link" href="gestao-membros.html?novo=1"><span class="quick-link-icon">${icon("users")}</span><span><strong>Cadastrar membro</strong><small>Adicionar integrante ao colegiado</small></span>${icon("chevron", 16)}</a>
        <a class="quick-link" href="gestao-reuniao.html"><span class="quick-link-icon">${icon("userCheck")}</span><span><strong>Registrar presença</strong><small>Selecionar reunião e participantes</small></span>${icon("chevron", 16)}</a></div></div></section></div>
      <div class="dashboard-note">${icon("info", 18)}<div><strong>Seu espaço como coordenador.</strong> O painel organiza membros, reuniões, pautas e presenças. A assinatura de atas e as declarações semestrais pertencem ao módulo do integrante 5.${getMode() === "demo" ? " Você está vendo dados fictícios da demonstração." : ""}</div></div>`;
  };
  fetchData();
}
