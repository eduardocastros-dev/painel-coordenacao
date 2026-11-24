/** Configuração central — mantenha os caminhos contratados exatos. */
export const API_BASE_URL = "http://localhost:8080";
export const KEYS = Object.freeze({
  mode: "colegiado_front_mode_v1",
  auth: "authToken", // Nome definido no Plano de Desenvolvimento (demonstração/trabalho acadêmico).
  profile: "colegiado_front_profile_v1",
  demoDb: "colegiado_demo_db_v1",
  sessionRelations: "colegiado_front_relacoes_sessao_v1",
});
export const PATHS = Object.freeze({
  login: "/api/auth/login", // plano (payload/resposta ainda não detalhados)
  members: "/api/membros", // plano (PUT e inativação a confirmar)
  member: (id) => `/api/membros/${encodeURIComponent(id)}`,
  meetings: "/api/reunioes", // contrato confirmado
  agenda: (id) => `/api/reunioes/${encodeURIComponent(id)}/pautas`,
  attendance: (id) => `/api/reunioes/${encodeURIComponent(id)}/participacoes`,
  finish: (id) => `/api/reunioes/${encodeURIComponent(id)}/finalizar`,
});
