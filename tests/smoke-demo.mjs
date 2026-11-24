// Teste sem navegador: node tests/smoke-demo.mjs
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get("l:" + k) ?? null,
  setItem: (k, v) => store.set("l:" + k, String(v)),
  removeItem: (k) => store.delete("l:" + k),
};
globalThis.sessionStorage = {
  getItem: (k) => store.get("s:" + k) ?? null,
  setItem: (k, v) => store.set("s:" + k, String(v)),
  removeItem: (k) => store.delete("s:" + k),
};
const { demoRequest } = await import("../js/demo-store.js");
const assert = (value, message) => {
  if (!value) throw new Error(message);
};
const auth = await demoRequest("/api/auth/login", {
  method: "POST",
  body: { email: "coordenacao@ifpa.edu.br", senha: "demo123" },
});
assert(Boolean(auth.token), "Login sem token");
let members = await demoRequest("/api/membros");
assert(members.length >= 6, "Listagem de membros vazia");
const member = await demoRequest("/api/membros", {
  method: "POST",
  body: {
    nome: "Membro de teste",
    email: "teste@exemplo.edu.br",
    matricula: "99999",
    papel: "MEMBRO",
    ativo: true,
  },
});
assert(Boolean(member.id), "Cadastro de membro sem id");
const edited = await demoRequest(`/api/membros/${member.id}`, {
  method: "PUT",
  body: { nome: "Membro atualizado", ativo: false },
});
assert(
  edited.nome === "Membro atualizado" && !edited.ativo,
  "Falha de edição e inativação",
);
const meeting = await demoRequest("/api/reunioes", {
  method: "POST",
  body: { dataHora: "2026-12-10T14:00:00", local: "Sala de teste" },
});
assert(meeting.status === "AGENDADA", "Status inicial diferente de AGENDADA");
const agenda = await demoRequest(`/api/reunioes/${meeting.id}/pautas`, {
  method: "POST",
  body: {
    titulo: "Item de pauta",
    ordemApresentacao: 1,
    deliberacao: "Aprovado",
  },
});
assert(Boolean(agenda.id), "Falha ao criar pauta");
const attendance = await demoRequest(
  `/api/reunioes/${meeting.id}/participacoes`,
  {
    method: "POST",
    body: {
      membro: { id: 1 },
      statusPresenca: "PRESENTE",
      justificativaFalta: null,
    },
  },
);
assert(attendance.statusPresenca === "PRESENTE", "Falha de presença");
const final = await demoRequest(`/api/reunioes/${meeting.id}/finalizar`, {
  method: "PUT",
});
assert(
  final.status === "FINALIZADA" && final.ataConteudo.includes("Item de pauta"),
  "Falha na finalização e ata",
);
console.log("✓ 7 fluxos principais da demonstração validados.");
