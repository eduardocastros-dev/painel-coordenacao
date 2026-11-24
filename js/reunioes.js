import {
  listMeetings,
  listMembers,
  createMeeting,
  createAgenda,
  registerAttendance,
  finishMeeting,
  readCachedRelations,
  rememberRelation,
  getMode,
} from "./api.js";
import {
  renderShell,
  icon,
  esc,
  dateText,
  dayText,
  statusChip,
  modal,
  confirmAction,
  toast,
  emptyState,
} from "./core.js";

if (
  renderShell({
    active: "meetings",
    title: "Reuniões e pautas",
    kicker: "GESTÃO DE REUNIÕES",
    subtitle:
      "Agende encontros, organize as pautas, acompanhe presenças e consolide atas.",
  })
) {
  let meetings = [];
  let members = [];
  let selectedId = null;
  let tab = "pautas";
  let search = "";
  let statusFilter = "todos";
  let membersError = "";
  const root = document.getElementById("page-content");
  const actions = document.getElementById("page-actions");
  actions.innerHTML = `<button type="button" id="new-meeting" class="btn btn--primary">${icon("plus")} Agendar reunião</button>`;
  actions.querySelector("#new-meeting").addEventListener("click", meetingForm);
  const params = new URLSearchParams(location.search);
  const idQuery = Number(params.get("id")) || null;

  function getMeeting() {
    return meetings.find((m) => m.id === selectedId);
  }
  function relations(meeting) {
    if (!meeting) return { pautas: [], participacoes: [], isEmbedded: false };
    const cached = readCachedRelations(meeting.id);
    const join = (embedded, session) => {
      const out = [...(Array.isArray(embedded) ? embedded : [])];
      (session || []).forEach((item) => {
        if (!out.some((x) => String(x.id) === String(item.id))) out.push(item);
      });
      return out;
    };
    return {
      pautas: join(meeting.pautas, cached.pautas),
      participacoes: join(meeting.participacoes, cached.participacoes),
      isEmbedded:
        Array.isArray(meeting.pautas) && Array.isArray(meeting.participacoes),
    };
  }
  function dateBadge(value) {
    const d = new Date(value);
    if (Number.isNaN(d.valueOf()))
      return "<strong>--</strong><small>DATA</small>";
    return `<strong>${new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(d)}</strong><small>${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "").toUpperCase()}</small>`;
  }
  function meetingTitle(m) {
    return `Reunião #${m.id}`;
  }
  function render() {
    const list = meetings
      .filter(
        (m) =>
          `${m.local || ""} ${m.id || ""}`.toLowerCase().includes(search) &&
          (statusFilter === "todos" || m.status === statusFilter),
      )
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    root.innerHTML = `<div class="toolbar"><div class="toolbar-left"><label class="search-control">${icon("search", 17)}<input id="meeting-search" type="search" placeholder="Buscar pelo local ou ID" value="${esc(search)}"></label><select id="meeting-status-filter" class="filter-select" aria-label="Filtrar por situação"><option value="todos">Todas as situações</option>${["AGENDADA", "EM_ANDAMENTO", "FINALIZADA"].map((s) => `<option value="${s}" ${statusFilter === s ? "selected" : ""}>${s === "AGENDADA" ? "Agendadas" : s === "EM_ANDAMENTO" ? "Em andamento" : "Finalizadas"}</option>`).join("")}</select></div><button type="button" id="reload-meetings" class="btn btn--secondary">${icon("refresh", 16)} Atualizar</button></div>
      <div class="meeting-layout"><section class="card meeting-list"><div class="meeting-list-head"><h2>Todos os encontros</h2><p>${list.length} reunião(ões) encontrada(s)</p></div><div class="meeting-list-items">${list.length ? list.map((m) => `<button type="button" class="meeting-item ${selectedId === m.id ? "active" : ""}" data-meeting="${Number(m.id)}"><span class="meeting-date-block">${dateBadge(m.dataHora)}</span><span class="meeting-item-body"><strong>${esc(meetingTitle(m))} · ${esc(dateText(m.dataHora).split(",")[1]?.trim() || "")}</strong><small>${esc(m.local)}</small>${statusChip(m.status)}</span>${selectedId === m.id ? icon("chevron", 16) : ""}</button>`).join("") : emptyState({ iconName: "calendar", title: "Nenhuma reunião", description: "Agende uma reunião ou ajuste a busca." })}</div></section>
      <section class="card meeting-detail" id="detail-area">${selectedId ? detailHTML(getMeeting()) : emptyState({ iconName: "calendar", title: "Selecione uma reunião", description: "Escolha um encontro na lista para visualizar pautas, presenças e ata." })}</section></div>`;
    root.querySelector("#meeting-search").addEventListener("input", (e) => {
      search = e.target.value.toLowerCase();
      const p = e.target.selectionStart;
      render();
      const input = root.querySelector("#meeting-search");
      input.focus();
      input.setSelectionRange(p, p);
    });
    root
      .querySelector("#meeting-status-filter")
      .addEventListener("change", (e) => {
        statusFilter = e.target.value;
        render();
      });
    root.querySelector("#reload-meetings").addEventListener("click", refresh);
    root.querySelectorAll("[data-meeting]").forEach((b) =>
      b.addEventListener("click", () => {
        selectedId = Number(b.dataset.meeting);
        tab = "pautas";
        history.replaceState(null, "", `gestao-reuniao.html?id=${selectedId}`);
        render();
      }),
    );
    attachDetail();
  }
  function detailHTML(m) {
    if (!m)
      return emptyState({
        iconName: "calendar",
        title: "Reunião indisponível",
        description: "Selecione outro registro.",
      });
    const done = m.status === "FINALIZADA";
    const sub = relations(m);
    return `<div class="meeting-detail-head"><div class="detail-overline">REUNIÃO Nº ${Number(m.id)}</div><h2>${esc(meetingTitle(m))}</h2><div class="detail-meta"><span>${icon("clock", 15)}${esc(dateText(m.dataHora))}</span><span>${icon("calendar", 15)}${esc(m.local)}</span>${statusChip(m.status)}</div>
      <div class="detail-action-row"><span class="tiny muted">${sub.pautas.length} pauta(s) · ${sub.participacoes.length} participação(ões) ${getMode() === "api" && !sub.isEmbedded ? "(carregadas nesta sessão)" : ""}</span>
      ${!done ? `<button type="button" id="finish-meeting" class="btn btn--secondary btn--sm">${icon("check", 16)} Finalizar e gerar ata</button>` : `<span class="chip chip--FINALIZADA">${icon("check", 13)} Ata gerada</span>`}</div></div>
      <div class="detail-tabs" role="tablist" aria-label="Dados da reunião"><button type="button" class="detail-tab ${tab === "pautas" ? "active" : ""}" data-tab="pautas">Pautas (${sub.pautas.length})</button><button type="button" class="detail-tab ${tab === "presencas" ? "active" : ""}" data-tab="presencas">Presenças (${sub.participacoes.length})</button><button type="button" class="detail-tab ${tab === "ata" ? "active" : ""}" data-tab="ata">Ata</button></div>
      <div class="tab-body" id="tab-content">${tab === "pautas" ? agendaHTML(m, sub) : tab === "presencas" ? attendanceHTML(m, sub) : ataHTML(m)}</div>`;
  }
  function apiCaution(sub) {
    return getMode() === "api" && !sub.isEmbedded
      ? `<div class="api-note">${icon("alert", 17)}<span>A API contratada ainda não informa como buscar pautas e presenças antigas. Os registros criados agora aparecem somente nesta sessão até o back-end expor um GET ou enviar as coleções na resposta de reuniões.</span></div>`
      : "";
  }
  function agendaHTML(m, r) {
    return `<div class="tab-heading"><div><h3>Itens de pauta</h3><p>Assuntos apresentados em ordem de discussão</p></div>${m.status !== "FINALIZADA" ? `<button type="button" class="btn btn--primary btn--sm" id="add-agenda">${icon("plus", 14)} Nova pauta</button>` : ""}</div>${apiCaution(r)}${
      r.pautas.length
        ? [...r.pautas]
            .sort(
              (a, b) => (a.ordemApresentacao || 0) - (b.ordemApresentacao || 0),
            )
            .map(
              (p) =>
                `<article class="agenda-item"><div class="number-bubble">${esc(p.ordemApresentacao)}</div><div><h4>${esc(p.titulo)}</h4><p><strong>Deliberação:</strong> ${esc(p.deliberacao || "Ainda não registrada")}</p></div></article>`,
            )
            .join("")
        : emptyState({
            iconName: "file",
            title: "Nenhuma pauta carregada",
            description:
              "Adicione um assunto para começar a organizar esta reunião.",
          })
    }`;
  }
  function memberName(item) {
    const id = Number(item?.membro?.id || item?.membroId);
    return (
      members.find((m) => Number(m.id) === id)?.nome ||
      item?.membro?.nome ||
      `Membro #${id || "?"}`
    );
  }
  function attendanceHTML(m, r) {
    return `<div class="tab-heading"><div><h3>Controle de presença</h3><p>Registros individuais dos participantes</p></div>${m.status !== "FINALIZADA" ? `<button type="button" class="btn btn--primary btn--sm" id="add-attendance" ${!members.length ? "disabled" : ""}>${icon("plus", 14)} Registrar</button>` : ""}</div>${membersError ? `<div class="notice notice--danger">${icon("alert", 17)}<span>${esc(membersError)}</span></div>` : ""}${apiCaution(r)}
    ${r.participacoes.length ? `<div class="table-wrap"><table class="attendance-table"><thead><tr><th>Membro</th><th>Situação</th><th>Justificativa</th></tr></thead><tbody>${r.participacoes.map((p) => `<tr><td><strong>${esc(memberName(p))}</strong></td><td>${statusChip(p.statusPresenca)}</td><td>${esc(p.justificativaFalta || "—")}</td></tr>`).join("")}</tbody></table></div>` : emptyState({ iconName: "userCheck", title: "Sem presenças carregadas", description: "Registre as situações dos membros convocados." })}`;
  }
  function ataHTML(m) {
    if (m.status !== "FINALIZADA")
      return `<div class="notice notice--info">${icon("info", 18)}<span>A ata será criada pelo Spring Boot quando a reunião for finalizada. O front-end apenas exibe o campo <b>ataConteudo</b> retornado pela API.</span></div>${emptyState({ iconName: "file", title: "Ata ainda não disponível", description: "Finalize a reunião quando as pautas e presenças estiverem registradas." })}`;
    return `<div class="tab-heading"><div><h3>Ata da reunião</h3><p>Gerada em ${esc(dateText(m.dataGeracaoAta))}</p></div><button type="button" class="btn btn--secondary btn--sm" id="copy-ata" ${!m.ataConteudo ? "disabled" : ""}>${icon("file", 15)} Copiar texto</button></div>${m.ataConteudo ? `<div class="ata-preview">${esc(m.ataConteudo)}</div>` : emptyState({ iconName: "file", title: "Texto de ata indisponível", description: "A API informou uma reunião finalizada, mas não trouxe ataConteudo." })}`;
  }
  function attachDetail() {
    const m = getMeeting();
    if (!m) return;
    root.querySelectorAll("[data-tab]").forEach((el) =>
      el.addEventListener("click", () => {
        tab = el.dataset.tab;
        render();
      }),
    );
    root
      .querySelector("#add-agenda")
      ?.addEventListener("click", () => agendaForm(m));
    root
      .querySelector("#add-attendance")
      ?.addEventListener("click", () => attendanceForm(m));
    root
      .querySelector("#finish-meeting")
      ?.addEventListener("click", () => finalize(m));
    root.querySelector("#copy-ata")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(m.ataConteudo);
        toast("Texto da ata copiado.");
      } catch {
        toast("O navegador não permitiu copiar o texto.", "error");
      }
    });
  }
  async function refresh() {
    try {
      const [res, memberResult] = await Promise.allSettled([
        listMeetings(),
        listMembers(),
      ]);
      if (res.status === "rejected") throw res.reason;
      if (!Array.isArray(res.value))
        throw new Error("GET /api/reunioes não retornou um array JSON.");
      meetings = res.value;
      if (
        memberResult.status === "fulfilled" &&
        Array.isArray(memberResult.value)
      ) {
        members = memberResult.value;
        membersError = "";
      } else {
        members = [];
        membersError =
          memberResult.reason?.message ||
          "GET /api/membros não retornou uma lista.";
      }
      selectedId = meetings.some((m) => m.id === selectedId)
        ? selectedId
        : meetings.some((m) => m.id === idQuery)
          ? idQuery
          : meetings[0]?.id || null;
      render();
    } catch (err) {
      root.innerHTML = `<div class="notice notice--danger">${icon("alert", 18)}<span>${esc(err.message)}</span><button class="btn btn--secondary btn--sm" id="retry">Tentar novamente</button></div>`;
      root.querySelector("#retry").onclick = refresh;
    }
  }
  function meetingForm() {
    const localNow = new Date();
    localNow.setMinutes(localNow.getMinutes() - localNow.getTimezoneOffset());
    const start = localNow.toISOString().slice(0, 16);
    const close = modal({
      title: "Agendar nova reunião",
      description: "Defina a data, o horário e o local do próximo encontro.",
      body: `<form id="meeting-form"><div class="form-grid"><div class="field field--full"><label for="meeting-when">Data e horário <span>*</span></label><input id="meeting-when" name="dataHora" type="datetime-local" required value="${start}"></div>
      <div class="field field--full"><label for="meeting-location">Local ou link virtual <span>*</span></label><input id="meeting-location" name="local" required maxlength="250" placeholder="Ex.: Sala 101 ou https://meet.google.com/..."><small class="field-hint">O contrato usa um campo único <b>local</b>. Não envie linkVirtual: esse campo não foi contratado.</small></div></div>
      <div id="form-error" class="form-alert" role="alert"></div><div class="form-actions"><button type="button" data-close class="btn btn--secondary">Cancelar</button><button type="submit" class="btn btn--primary">Agendar reunião</button></div></form>`,
      onOpen(dialog) {
        const form = dialog.querySelector("#meeting-form");
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!form.reportValidity()) return;
          const body = {
            dataHora:
              form.elements.dataHora.value.length === 16
                ? form.elements.dataHora.value + ":00"
                : form.elements.dataHora.value,
            local: form.elements.local.value.trim(),
          };
          const btn = form.querySelector("[type=submit]");
          btn.disabled = true;
          btn.textContent = "Salvando...";
          try {
            const meeting = await createMeeting(body);
            selectedId = Number(meeting?.id) || null;
            close();
            toast("Reunião agendada.");
            await refresh();
            if (selectedId)
              history.replaceState(
                null,
                "",
                `gestao-reuniao.html?id=${selectedId}`,
              );
          } catch (err) {
            form.querySelector("#form-error").innerHTML =
              `<div class="notice notice--danger">${icon("alert", 17)}<span>${esc(err.message)}</span></div>`;
          } finally {
            btn.disabled = false;
            btn.textContent = "Agendar reunião";
          }
        });
      },
    });
  }
  function agendaForm(meeting) {
    const r = relations(meeting);
    const nextOrder =
      Math.max(0, ...r.pautas.map((p) => Number(p.ordemApresentacao) || 0)) + 1;
    const close = modal({
      title: "Adicionar pauta",
      description: `Reunião #${meeting.id} · ${dateText(meeting.dataHora)}`,
      body: `<form id="agenda-form"><div class="form-grid"><div class="field field--full"><label for="agenda-title">Título da pauta <span>*</span></label><input id="agenda-title" name="titulo" required maxlength="200" placeholder="Assunto a ser discutido"></div>
      <div class="field field--full"><label for="agenda-order">Ordem de apresentação <span>*</span></label><input id="agenda-order" name="ordemApresentacao" required type="number" min="1" step="1" value="${nextOrder}"></div>
      <div class="field field--full"><label for="agenda-decision">Deliberação</label><textarea id="agenda-decision" name="deliberacao" placeholder="Preencha quando houver uma decisão (se disponível)"></textarea><div class="field-hint">O contrato já recebe a deliberação no POST. Ainda não há rota documentada para editá-la posteriormente.</div></div></div>
      <div id="form-error" class="form-alert" role="alert"></div><div class="form-actions"><button type="button" data-close class="btn btn--secondary">Cancelar</button><button type="submit" class="btn btn--primary">Salvar pauta</button></div></form>`,
      onOpen(dialog) {
        const form = dialog.querySelector("#agenda-form");
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!form.reportValidity()) return;
          const body = {
            titulo: form.elements.titulo.value.trim(),
            ordemApresentacao: Number(form.elements.ordemApresentacao.value),
            deliberacao: form.elements.deliberacao.value.trim(),
          };
          const btn = form.querySelector("[type=submit]");
          btn.disabled = true;
          btn.textContent = "Salvando...";
          try {
            const result = await createAgenda(meeting.id, body);
            rememberRelation(meeting.id, "pautas", result || body);
            close();
            toast("Pauta cadastrada.");
            await refresh();
            tab = "pautas";
            render();
          } catch (err) {
            form.querySelector("#form-error").innerHTML =
              `<div class="notice notice--danger">${icon("alert", 17)}<span>${esc(err.message)}</span></div>`;
          } finally {
            btn.disabled = false;
            btn.textContent = "Salvar pauta";
          }
        });
      },
    });
  }
  function attendanceForm(meeting) {
    const recorded = new Set(
      relations(meeting).participacoes.map((p) => Number(p?.membro?.id)),
    );
    const activeMembers = members.filter((m) => m.ativo !== false);
    const choices = activeMembers.filter((m) => !recorded.has(Number(m.id)));
    if (!choices.length) {
      toast(
        "Todos os membros ativos já foram registrados nesta sessão ou não há membros cadastrados.",
        "info",
      );
      return;
    }
    const close = modal({
      title: "Registrar presença",
      description: `Reunião #${meeting.id} · uma participação por membro`,
      body: `<form id="attendance-form"><div class="form-grid"><div class="field field--full"><label for="attendance-member">Membro convocado <span>*</span></label><select id="attendance-member" name="membroId" required><option value="">Selecione o membro</option>${choices.map((m) => `<option value="${Number(m.id)}">${esc(m.nome)} · ${esc(m.matricula || "sem matrícula")}</option>`).join("")}</select></div>
      <div class="field field--full"><label for="attendance-status">Situação de presença <span>*</span></label><select id="attendance-status" name="statusPresenca"><option value="PRESENTE">Presente</option><option value="AUSENTE">Ausente</option><option value="JUSTIFICADO">Justificado</option></select></div>
      <div class="field field--full" id="justification-group" hidden><label for="attendance-reason">Justificativa de falta</label><textarea id="attendance-reason" name="justificativaFalta" placeholder="Motivo da ausência"></textarea></div></div>
      <div id="form-error" class="form-alert" role="alert"></div><div class="form-actions"><button type="button" data-close class="btn btn--secondary">Cancelar</button><button type="submit" class="btn btn--primary">Registrar presença</button></div></form>`,
      onOpen(dialog) {
        const form = dialog.querySelector("#attendance-form");
        const status = form.elements.statusPresenca;
        const sync = () => {
          const visible = status.value !== "PRESENTE";
          const group = form.querySelector("#justification-group");
          group.hidden = !visible;
          form.elements.justificativaFalta.required =
            status.value === "JUSTIFICADO";
        };
        status.addEventListener("change", sync);
        sync();
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!form.reportValidity()) return;
          const memberId = Number(form.elements.membroId.value);
          if (!members.some((m) => Number(m.id) === memberId)) {
            toast("Membro inexistente.", "error");
            return;
          }
          const body = {
            membro: { id: memberId },
            statusPresenca: status.value,
            justificativaFalta:
              status.value === "PRESENTE"
                ? null
                : form.elements.justificativaFalta.value.trim() || null,
          };
          const btn = form.querySelector("[type=submit]");
          btn.disabled = true;
          btn.textContent = "Registrando...";
          try {
            const result = await registerAttendance(meeting.id, body);
            rememberRelation(meeting.id, "participacoes", result || body);
            close();
            toast("Presença registrada.");
            await refresh();
            tab = "presencas";
            render();
          } catch (err) {
            form.querySelector("#form-error").innerHTML =
              `<div class="notice notice--danger">${icon("alert", 17)}<span>${esc(err.message)}</span></div>`;
          } finally {
            btn.disabled = false;
            btn.textContent = "Registrar presença";
          }
        });
      },
    });
  }
  async function finalize(meeting) {
    const sub = relations(meeting);
    const confirmed = await confirmAction({
      title: "Finalizar reunião?",
      message: `O backend definirá o status como FINALIZADA e criará a ata com as pautas e presenças registradas. ${sub.pautas.length === 0 || sub.participacoes.length === 0 ? "Atenção: não há pautas ou presenças carregadas nesta interface; verifique os registros antes de prosseguir." : ""} Esta ação não possui rota de reversão no contrato.`,
      confirmText: "Finalizar e gerar ata",
    });
    if (!confirmed) return;
    try {
      const result = await finishMeeting(meeting.id);
      meetings = meetings.map((m) =>
        Number(m.id) === Number(meeting.id) ? { ...m, ...result } : m,
      );
      tab = "ata";
      render();
      toast("Reunião finalizada e ata gerada.");
    } catch (err) {
      toast(err.message, "error");
    }
  }
  refresh().then(() => {
    if (params.get("nova") === "1") meetingForm();
  });
}
