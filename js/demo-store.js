import { KEYS } from "./config.js";

const seed = () => ({
  nextMember: 7,
  nextMeeting: 5,
  nextAgenda: 9,
  nextParticipation: 12,
  members: [
    {
      id: 1,
      nome: "Ana Carolina Mendes",
      email: "ana.mendes@ifpa.edu.br",
      matricula: "202410001",
      papel: "COORDENADOR",
      ativo: true,
    },
    {
      id: 2,
      nome: "Marcos Vinícius Silva",
      email: "marcos.silva@ifpa.edu.br",
      matricula: "202410002",
      papel: "MEMBRO",
      ativo: true,
    },
    {
      id: 3,
      nome: "Juliana Ferreira Costa",
      email: "juliana.costa@ifpa.edu.br",
      matricula: "202410003",
      papel: "MEMBRO",
      ativo: true,
    },
    {
      id: 4,
      nome: "Pedro Henrique Souza",
      email: "pedro.souza@ifpa.edu.br",
      matricula: "202410004",
      papel: "MEMBRO",
      ativo: true,
    },
    {
      id: 5,
      nome: "Camila Oliveira Lima",
      email: "camila.lima@ifpa.edu.br",
      matricula: "202410005",
      papel: "MEMBRO",
      ativo: true,
    },
    {
      id: 6,
      nome: "Rafael Almeida Santos",
      email: "rafael.santos@ifpa.edu.br",
      matricula: "202410006",
      papel: "MEMBRO",
      ativo: false,
    },
  ],
  meetings: [
    {
      id: 1,
      dataHora: "2026-11-27T14:00:00",
      local: "Sala 101 · IFPA Campus Tucuruí",
      status: "AGENDADA",
      ataConteudo: null,
      dataGeracaoAta: null,
      pautas: [
        {
          id: 1,
          titulo: "Calendário acadêmico 2027",
          ordemApresentacao: 1,
          deliberacao: "",
        },
        {
          id: 2,
          titulo: "Revisão de atividades complementares",
          ordemApresentacao: 2,
          deliberacao: "",
        },
      ],
      participacoes: [],
    },
    {
      id: 2,
      dataHora: "2026-12-03T09:00:00",
      local: "Sala de reuniões · Bloco Administrativo",
      status: "AGENDADA",
      ataConteudo: null,
      dataGeracaoAta: null,
      pautas: [
        {
          id: 3,
          titulo: "Planejamento do semestre letivo",
          ordemApresentacao: 1,
          deliberacao: "",
        },
      ],
      participacoes: [],
    },
    {
      id: 3,
      dataHora: "2026-11-18T15:00:00",
      local: "Google Meet · reunião virtual",
      status: "FINALIZADA",
      dataGeracaoAta: "2026-11-18T17:12:00",
      ataConteudo:
        "ATA DA REUNIÃO DO COLEGIADO\nData: 18/11/2026, às 15h00\nLocal: Google Meet · reunião virtual\n\nMembros presentes: Ana Carolina Mendes, Marcos Vinícius Silva, Juliana Ferreira Costa.\n\nPAUTAS E DELIBERAÇÕES\n1. Avaliação de projetos integradores — Projetos aprovados por unanimidade.\n2. Distribuição de atividades — Encaminhamento aprovado.\n\nReunião finalizada.",
      pautas: [
        {
          id: 4,
          titulo: "Avaliação de projetos integradores",
          ordemApresentacao: 1,
          deliberacao: "Projetos aprovados por unanimidade.",
        },
        {
          id: 5,
          titulo: "Distribuição de atividades",
          ordemApresentacao: 2,
          deliberacao: "Encaminhamento aprovado.",
        },
      ],
      participacoes: [
        {
          id: 1,
          membro: { id: 1 },
          statusPresenca: "PRESENTE",
          justificativaFalta: null,
        },
        {
          id: 2,
          membro: { id: 2 },
          statusPresenca: "PRESENTE",
          justificativaFalta: null,
        },
        {
          id: 3,
          membro: { id: 3 },
          statusPresenca: "PRESENTE",
          justificativaFalta: null,
        },
        {
          id: 4,
          membro: { id: 4 },
          statusPresenca: "JUSTIFICADO",
          justificativaFalta: "Compromisso acadêmico",
        },
      ],
    },
    {
      id: 4,
      dataHora: "2026-11-25T10:30:00",
      local: "Sala 202 · IFPA Campus Tucuruí",
      status: "EM_ANDAMENTO",
      ataConteudo: null,
      dataGeracaoAta: null,
      pautas: [
        {
          id: 6,
          titulo: "Adequação do PPC",
          ordemApresentacao: 1,
          deliberacao: "Aguardando votação.",
        },
        {
          id: 7,
          titulo: "Distribuição de orientações de TCC",
          ordemApresentacao: 2,
          deliberacao: "",
        },
        {
          id: 8,
          titulo: "Demandas estudantis",
          ordemApresentacao: 3,
          deliberacao: "",
        },
      ],
      participacoes: [
        {
          id: 5,
          membro: { id: 1 },
          statusPresenca: "PRESENTE",
          justificativaFalta: null,
        },
        {
          id: 6,
          membro: { id: 2 },
          statusPresenca: "PRESENTE",
          justificativaFalta: null,
        },
        {
          id: 7,
          membro: { id: 3 },
          statusPresenca: "AUSENTE",
          justificativaFalta: null,
        },
      ],
    },
  ],
});
const clone = (x) => JSON.parse(JSON.stringify(x));
export function getDb() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEYS.demoDb) || "null");
    if (saved && Array.isArray(saved.members) && Array.isArray(saved.meetings))
      return saved;
  } catch {}
  const data = seed();
  localStorage.setItem(KEYS.demoDb, JSON.stringify(data));
  return data;
}
function mutate(fn) {
  const db = getDb();
  const result = fn(db);
  localStorage.setItem(KEYS.demoDb, JSON.stringify(db));
  return clone(result);
}
const fail = (msg, status = 400) => {
  const e = new Error(msg);
  e.status = status;
  throw e;
};
export async function demoRequest(path, { method = "GET", body } = {}) {
  await new Promise((r) => setTimeout(r, 160));
  method = method.toUpperCase();
  const db = getDb();
  if (path === "/api/auth/login" && method === "POST") {
    if (body?.email === "coordenacao@ifpa.edu.br" && body?.senha === "demo123")
      return {
        token: "demo-token-local-nao-e-autenticacao",
        usuario: {
          nome: "Coordenação do Colegiado",
          papel: "COORDENADOR",
          email: body.email,
        },
      };
    fail("Credenciais de demonstração inválidas.", 401);
  }
  if (path === "/api/membros" && method === "GET") return clone(db.members);
  if (path === "/api/membros" && method === "POST")
    return mutate((d) => {
      if (
        d.members.some(
          (m) => m.email.toLowerCase() === String(body.email).toLowerCase(),
        )
      )
        fail("E-mail já cadastrado.", 409);
      const m = {
        id: d.nextMember++,
        nome: body.nome,
        email: body.email,
        matricula: body.matricula,
        papel: body.papel || "MEMBRO",
        ativo: body.ativo !== false,
      };
      d.members.unshift(m);
      return m;
    });
  let mat = path.match(/^\/api\/membros\/(\d+)$/);
  if (mat && method === "PUT")
    return mutate((d) => {
      const m = d.members.find((x) => x.id === Number(mat[1]));
      if (!m) fail("Membro não encontrado.", 404);
      Object.assign(m, {
        nome: body.nome ?? m.nome,
        email: body.email ?? m.email,
        matricula: body.matricula ?? m.matricula,
        papel: body.papel ?? m.papel,
        ativo: body.ativo ?? m.ativo,
      });
      return m;
    });
  if (path === "/api/reunioes" && method === "GET") return clone(db.meetings);
  if (path === "/api/reunioes" && method === "POST")
    return mutate((d) => {
      if (!body?.dataHora || !body?.local)
        fail("Data/hora e local são obrigatórios.");
      const meeting = {
        id: d.nextMeeting++,
        dataHora: body.dataHora,
        local: body.local,
        status: "AGENDADA",
        ataConteudo: null,
        dataGeracaoAta: null,
        pautas: [],
        participacoes: [],
      };
      d.meetings.unshift(meeting);
      return meeting;
    });
  mat = path.match(
    /^\/api\/reunioes\/(\d+)\/(pautas|participacoes|finalizar)$/,
  );
  if (mat) {
    const id = Number(mat[1]),
      kind = mat[2];
    return mutate((d) => {
      const meeting = d.meetings.find((m) => m.id === id);
      if (!meeting) fail("Reunião não encontrada.", 404);
      if (kind === "pautas" && method === "POST") {
        if (meeting.status === "FINALIZADA")
          fail("A reunião já foi finalizada.", 409);
        if (
          !body.titulo?.trim() ||
          !Number.isInteger(body.ordemApresentacao) ||
          body.ordemApresentacao < 1
        )
          fail("Informe o título e a ordem da pauta.");
        const p = {
          id: d.nextAgenda++,
          titulo: body.titulo.trim(),
          ordemApresentacao: body.ordemApresentacao,
          deliberacao: body.deliberacao || "",
        };
        meeting.pautas.push(p);
        return p;
      }
      if (kind === "participacoes" && method === "POST") {
        if (meeting.status === "FINALIZADA")
          fail("A reunião já foi finalizada.", 409);
        const member = d.members.find((m) => m.id === Number(body.membro?.id));
        if (!member || !member.ativo)
          fail("Selecione um membro ativo e existente.");
        if (meeting.participacoes.some((p) => p.membro.id === member.id))
          fail("Presença já registrada para este membro.", 409);
        if (
          !["PRESENTE", "AUSENTE", "JUSTIFICADO"].includes(body.statusPresenca)
        )
          fail("Situação de presença inválida.");
        if (
          body.statusPresenca === "JUSTIFICADO" &&
          !String(body.justificativaFalta || "").trim()
        )
          fail("Informe a justificativa.");
        const p = {
          id: d.nextParticipation++,
          membro: { id: member.id },
          statusPresenca: body.statusPresenca,
          justificativaFalta: body.justificativaFalta || null,
        };
        meeting.participacoes.push(p);
        return p;
      }
      if (kind === "finalizar" && method === "PUT") {
        if (meeting.status === "FINALIZADA")
          fail("Reunião já finalizada.", 409);
        const participants = meeting.participacoes
          .filter((p) => p.statusPresenca === "PRESENTE")
          .map(
            (p) =>
              d.members.find((m) => m.id === p.membro.id)?.nome ||
              `Membro #${p.membro.id}`,
          );
        const lines = meeting.pautas
          .sort((a, b) => a.ordemApresentacao - b.ordemApresentacao)
          .map(
            (p, i) =>
              `${i + 1}. ${p.titulo}\n   Deliberação: ${p.deliberacao || "Não registrada"}`,
          );
        meeting.status = "FINALIZADA";
        meeting.dataGeracaoAta = new Date().toISOString();
        meeting.ataConteudo = `ATA DA REUNIÃO DO COLEGIADO\nData: ${meeting.dataHora}\nLocal: ${meeting.local}\n\nMembros presentes: ${participants.join(", ") || "Nenhum membro registrado"}\n\nPAUTAS E DELIBERAÇÕES\n${lines.join("\n") || "Nenhuma pauta registrada"}\n\nReunião finalizada.`;
        return meeting;
      }
      fail("Operação não implementada no modo demonstração.", 404);
    });
  }
  fail(
    "Rota não definida no protótipo de demonstração: " + method + " " + path,
    404,
  );
}
export function resetDemo() {
  localStorage.removeItem(KEYS.demoDb);
  getDb();
}
