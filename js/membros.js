import { listMembers, createMember, updateMember, getMode } from "./api.js";
import {
  renderShell,
  icon,
  esc,
  initialLetters,
  modal,
  confirmAction,
  toast,
  statusChip,
  emptyState,
} from "./core.js";

if (
  renderShell({
    active: "members",
    title: "Gestão de membros",
    kicker: "CADASTRO E CONTROLE",
    subtitle:
      "Cadastre, edite e acompanhe a situação dos integrantes do colegiado.",
  })
) {
  let members = [];
  let filters = { term: "", state: "todos", role: "todos" };
  const root = document.getElementById("page-content");
  const actions = document.getElementById("page-actions");
  actions.innerHTML = `<button type="button" id="add-member" class="btn btn--primary">${icon("plus")} Novo membro</button>`;
  actions
    .querySelector("#add-member")
    .addEventListener("click", () => memberForm());
  function render() {
    const filtered = members.filter((m) => {
      const text =
        `${m.nome || ""} ${m.email || ""} ${m.matricula || ""}`.toLowerCase();
      return (
        text.includes(filters.term) &&
        (filters.state === "todos" ||
          (filters.state === "ativos"
            ? m.ativo !== false
            : m.ativo === false)) &&
        (filters.role === "todos" || m.papel === filters.role)
      );
    });
    const avatarClass = (i) => ["", "avatar--peach", "avatar--lavender"][i % 3];
    root.innerHTML = `<div class="notice notice--info">${icon("info", 17)}<div>Os perfis de acesso são <b>COORDENADOR</b> e <b>MEMBRO</b>, conforme o contrato disponível. A distinção entre <b>docente</b> e <b>representante discente</b>, exigida pelo RF-01, ainda precisa de um campo definido em conjunto com o back-end.</div></div>
      ${getMode() === "api" ? `<div class="api-note">${icon("alert", 16)}<span>A rota <b>/api/membros</b> é citada no plano, mas os formatos de cadastro, edição e inativação não estão detalhados no contrato anexo. O código de PUT está preparado como hipótese de integração e deve ser alinhado com o integrante 2.</span></div>` : ""}
      <div class="toolbar"><div class="toolbar-left"><label class="search-control">${icon("search", 17)}<input id="search-member" type="search" placeholder="Buscar por nome, e-mail ou matrícula" value="${esc(filters.term)}" aria-label="Buscar membros"></label>
        <select id="filter-role" class="filter-select" aria-label="Filtrar por papel"><option value="todos">Todos os perfis</option><option value="COORDENADOR" ${filters.role === "COORDENADOR" ? "selected" : ""}>Coordenadores</option><option value="MEMBRO" ${filters.role === "MEMBRO" ? "selected" : ""}>Membros</option></select>
        <select id="filter-state" class="filter-select" aria-label="Filtrar por situação"><option value="todos">Todas as situações</option><option value="ativos" ${filters.state === "ativos" ? "selected" : ""}>Ativos</option><option value="inativos" ${filters.state === "inativos" ? "selected" : ""}>Inativos</option></select></div><button type="button" id="refresh-members" class="btn btn--secondary">${icon("refresh", 16)} Atualizar</button></div>
      <section class="card"><div class="table-wrap">${filtered.length ? `<table class="data-table"><thead><tr><th>Membro</th><th>Matrícula</th><th>Perfil</th><th>Situação</th><th style="text-align:right">Ações</th></tr></thead><tbody>${filtered.map((m, i) => `<tr><td><div class="name-cell"><span class="avatar ${avatarClass(i)}">${esc(initialLetters(m.nome))}</span><span><strong class="table-title">${esc(m.nome)}</strong><small class="table-sub">${esc(m.email)}</small></span></div></td><td>${esc(m.matricula || "—")}</td><td><strong class="small">${esc(m.papel === "COORDENADOR" ? "Coordenador" : "Membro")}</strong></td><td>${statusChip(m.ativo === false ? "INATIVO" : "ATIVO")}</td><td><div class="table-actions"><button type="button" class="icon-btn" data-edit="${Number(m.id)}" title="Editar membro" aria-label="Editar ${esc(m.nome)}">${icon("edit", 16)}</button><button type="button" class="icon-btn" data-toggle="${Number(m.id)}" title="${m.ativo === false ? "Reativar" : "Inativar"} membro" aria-label="${m.ativo === false ? "Reativar" : "Inativar"} ${esc(m.nome)}">${icon(m.ativo === false ? "userCheck" : "close", 17)}</button></div></td></tr>`).join("")}</tbody></table>` : emptyState({ iconName: "users", title: "Nenhum membro encontrado", description: "Ajuste os filtros ou cadastre um novo membro." })}</div><div class="table-footer"><span>${filtered.length} membro(s) exibido(s)</span><span>${members.filter((m) => m.ativo !== false).length} ativo(s) no total</span></div></section>`;
    root.querySelector("#search-member").addEventListener("input", (e) => {
      const pos = e.target.selectionStart;
      filters.term = e.target.value.toLowerCase();
      render();
      const next = root.querySelector("#search-member");
      next.focus();
      next.setSelectionRange(pos, pos);
    });
    root.querySelector("#filter-role").addEventListener("change", (e) => {
      filters.role = e.target.value;
      render();
    });
    root.querySelector("#filter-state").addEventListener("change", (e) => {
      filters.state = e.target.value;
      render();
    });
    root.querySelector("#refresh-members").addEventListener("click", refresh);
    root
      .querySelectorAll("[data-edit]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          memberForm(members.find((m) => m.id === Number(b.dataset.edit))),
        ),
      );
    root
      .querySelectorAll("[data-toggle]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          toggleMember(members.find((m) => m.id === Number(b.dataset.toggle))),
        ),
      );
  }
  async function refresh() {
    try {
      const data = await listMembers();
      if (!Array.isArray(data))
        throw new Error("Esperava-se um array JSON de membros.");
      members = data;
      render();
    } catch (err) {
      root.innerHTML = `<div class="notice notice--danger">${icon("alert", 18)}<span>${esc(err.message)}</span><button class="btn btn--secondary btn--sm" id="retry">Tentar novamente</button></div>`;
      root.querySelector("#retry").onclick = refresh;
    }
  }
  function memberForm(member) {
    const edit = Boolean(member);
    const close = modal({
      title: edit ? "Editar membro" : "Novo membro",
      description: edit
        ? "Atualize os dados e salve as alterações."
        : "Preencha os dados do novo integrante do colegiado.",
      body: `<form id="member-form"><div class="form-grid"><div class="field field--full"><label for="member-name">Nome completo <span>*</span></label><input id="member-name" name="nome" required maxlength="120" value="${esc(member?.nome || "")}" placeholder="Nome e sobrenome"></div>
      <div class="field field--full"><label for="member-email">E-mail <span>*</span></label><input id="member-email" name="email" type="email" required value="${esc(member?.email || "")}" placeholder="nome@ifpa.edu.br"></div>
      <div class="field"><label for="member-matricula">Matrícula <span>*</span></label><input id="member-matricula" name="matricula" required maxlength="30" value="${esc(member?.matricula || "")}" placeholder="Ex.: 202410001"></div>
      <div class="field"><label for="member-role">Perfil de acesso <span>*</span></label><select id="member-role" name="papel" required><option value="MEMBRO" ${member?.papel !== "COORDENADOR" ? "selected" : ""}>Membro</option><option value="COORDENADOR" ${member?.papel === "COORDENADOR" ? "selected" : ""}>Coordenador</option></select></div>
      ${!edit ? `<div class="field field--full"><label for="member-pass">Senha inicial <span>*</span></label><input id="member-pass" name="senha" type="password" minlength="6" required placeholder="Senha inicial do usuário"><div class="field-hint">Campo citado no plano de segurança; o DTO de cadastro precisa ser confirmado com o integrante 2.</div></div>` : ""}
      <div class="field field--full"><label class="toggle"><input type="checkbox" name="ativo" ${member?.ativo === false ? "" : "checked"}> Membro ativo</label></div></div>
      <div id="form-error" class="form-alert" role="alert"></div><div class="form-actions"><button class="btn btn--secondary" type="button" data-close>Cancelar</button><button class="btn btn--primary" type="submit">${edit ? "Salvar alterações" : "Cadastrar membro"}</button></div></form>`,
      onOpen(dialog) {
        const form = dialog.querySelector("#member-form");
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (!form.reportValidity()) return;
          const body = {
            nome: form.elements.nome.value.trim(),
            email: form.elements.email.value.trim(),
            matricula: form.elements.matricula.value.trim(),
            papel: form.elements.papel.value,
            ativo: form.elements.ativo.checked,
          };
          if (!edit) body.senha = form.elements.senha.value;
          const save = form.querySelector("[type=submit]");
          save.disabled = true;
          save.textContent = "Salvando...";
          try {
            if (edit) await updateMember(member.id, body);
            else await createMember(body);
            close();
            toast(edit ? "Membro atualizado." : "Membro cadastrado.");
            await refresh();
          } catch (err) {
            form.querySelector("#form-error").innerHTML =
              `<div class="notice notice--danger">${icon("alert", 17)}<span>${esc(err.message)}</span></div>`;
          } finally {
            save.disabled = false;
            save.textContent = edit ? "Salvar alterações" : "Cadastrar membro";
          }
        });
      },
    });
  }
  async function toggleMember(member) {
    const activate = member.ativo === false;
    const confirmed = await confirmAction({
      title: activate ? "Reativar membro?" : "Inativar membro?",
      message: activate
        ? `Reativar ${member.nome} para novas participações?`
        : `${member.nome} permanecerá no histórico, mas não deverá ser selecionado em novos registros de presença.`,
      confirmText: activate ? "Reativar" : "Inativar",
      danger: !activate,
    });
    if (!confirmed) return;
    try {
      await updateMember(member.id, {
        nome: member.nome,
        email: member.email,
        matricula: member.matricula,
        papel: member.papel,
        ativo: activate,
      });
      toast(activate ? "Membro reativado." : "Membro inativado.");
      await refresh();
    } catch (err) {
      toast(err.message, "error");
    }
  }
  refresh().then(() => {
    if (new URLSearchParams(location.search).get("novo") === "1") memberForm();
  });
}
