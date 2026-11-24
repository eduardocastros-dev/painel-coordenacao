import { API_BASE_URL, KEYS, PATHS } from "./config.js";
import { demoRequest } from "./demo-store.js";

export const getMode = () =>
  localStorage.getItem(KEYS.mode) === "api" ? "api" : "demo";
export const setMode = (mode) =>
  localStorage.setItem(KEYS.mode, mode === "api" ? "api" : "demo");
export const getToken = () => localStorage.getItem(KEYS.auth);
export const getProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.profile) || "null");
  } catch {
    return null;
  }
};
export function persistSession(payload) {
  const token = payload?.token || payload?.accessToken; // resposta.token conforme plano; accessToken por compatibilidade
  if (!token)
    throw new Error(
      "Login retornou sucesso, mas não enviou token. Confirme o contrato com a equipe de segurança.",
    );
  localStorage.setItem(KEYS.auth, token);
  localStorage.setItem(
    KEYS.profile,
    JSON.stringify(payload.usuario || payload.user || null),
  );
}
export function logout() {
  localStorage.removeItem(KEYS.auth);
  localStorage.removeItem(KEYS.profile);
  sessionStorage.removeItem(KEYS.sessionRelations);
}
export function ensureSession() {
  if (!getToken()) {
    window.location.replace("login.html");
    return false;
  }
  return true;
}

export async function request(
  path,
  { method = "GET", body, auth = true } = {},
) {
  if (getMode() === "demo") return demoRequest(path, { method, body });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);
  try {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
    const response = await fetch(API_BASE_URL + path, {
      method,
      headers,
      signal: controller.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let result = null;
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }
    }
    if (!response.ok) {
      let msg =
        result?.message ||
        result?.error ||
        `A API retornou HTTP ${response.status}.`;
      if (typeof msg !== "string") msg = JSON.stringify(msg);
      const error = new Error(msg);
      error.status = response.status;
      throw error;
    }
    return result;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("A API não respondeu em 14 segundos.");
    if (error instanceof TypeError)
      throw new Error(
        "Não foi possível conectar ao Spring Boot. Verifique localhost:8080 e o CORS.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export const login = (credentials) =>
  request(PATHS.login, { method: "POST", body: credentials, auth: false });
export const listMembers = () => request(PATHS.members);
export const createMember = (body) =>
  request(PATHS.members, { method: "POST", body });
/** Provisório: PUT /api/membros/{id} não está detalhado no contrato de API anexado. */
export const updateMember = (id, body) =>
  request(PATHS.member(id), { method: "PUT", body });
export const listMeetings = () => request(PATHS.meetings);
export const createMeeting = (body) =>
  request(PATHS.meetings, { method: "POST", body });
export const createAgenda = (id, body) =>
  request(PATHS.agenda(id), { method: "POST", body });
export const registerAttendance = (id, body) =>
  request(PATHS.attendance(id), { method: "POST", body });
export const finishMeeting = (id) =>
  request(PATHS.finish(id), { method: "PUT" }); // sem body conforme contrato

// O contrato não contém GET de pautas/participações. Cache de sessão NÃO substitui persistência no backend.
function relationsDb() {
  try {
    return JSON.parse(sessionStorage.getItem(KEYS.sessionRelations) || "{}");
  } catch {
    return {};
  }
}
export function readCachedRelations(id) {
  return relationsDb()[id] || { pautas: [], participacoes: [] };
}
export function rememberRelation(id, type, item) {
  const data = relationsDb();
  data[id] ??= { pautas: [], participacoes: [] };
  const collection = (data[id][type] ??= []);
  if (!collection.some((x) => String(x.id) === String(item.id)))
    collection.push(item);
  sessionStorage.setItem(KEYS.sessionRelations, JSON.stringify(data));
}
