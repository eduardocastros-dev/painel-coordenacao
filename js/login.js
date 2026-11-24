import {
  getMode,
  setMode,
  getToken,
  login,
  persistSession,
  logout,
} from "./api.js";
import { esc, icon } from "./core.js";
const form = document.getElementById("form-login");
let current = getMode();
form.querySelector(`[name=mode][value=${current}]`).checked = true;
if (current === "api") {
  form.elements.email.value = "";
  form.elements.senha.value = "";
}
function updateTip() {
  const demo = form.elements.mode.value === "demo";
  const tip = document.getElementById("demo-tip");
  tip.innerHTML = demo
    ? "Para explorar a interface sem o back-end, use <code>coordenacao@ifpa.edu.br</code> e a senha <code>demo123</code>. Os dados da demonstração são fictícios e ficam apenas no seu navegador."
    : "A aplicação enviará as credenciais para <code>POST http://localhost:8080/api/auth/login</code>. O formato de resposta com <code>token</code> precisa ser confirmado com o integrante 2.";
}
form.querySelectorAll("[name=mode]").forEach((el) =>
  el.addEventListener("change", () => {
    logout();
    setMode(form.elements.mode.value);
    if (form.elements.mode.value === "api") {
      form.elements.email.value = "";
      form.elements.senha.value = "";
    } else {
      form.elements.email.value = "coordenacao@ifpa.edu.br";
      form.elements.senha.value = "demo123";
    }
    document.getElementById("login-error").innerHTML = "";
    updateTip();
  }),
);
updateTip();
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-login");
  const error = document.getElementById("login-error");
  error.innerHTML = "";
  if (!form.reportValidity()) return;
  btn.disabled = true;
  btn.textContent = "Validando credenciais...";
  try {
    const result = await login({
      email: form.elements.email.value.trim(),
      senha: form.elements.senha.value,
    });
    persistSession(result);
    window.location.replace("painel-coordenador.html");
  } catch (err) {
    error.innerHTML = `<div class="notice notice--danger">${icon("alert", 17)}<span>${esc(err.message)}</span></div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar no painel →";
  }
});
if (getToken()) window.location.replace("painel-coordenador.html");
