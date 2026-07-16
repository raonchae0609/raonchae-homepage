const crypto = require("crypto");

const COOKIE = "raonchae_admin";
const TTL = 60 * 60 * 8;

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}
function parseCookies(raw = "") {
  return Object.fromEntries(raw.split(";").map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf("="); return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
  }));
}
function b64url(data) {
  return Buffer.from(data).toString("base64url");
}
function sign(payload) {
  const secret = env("ADMIN_SESSION_SECRET");
  const data = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}
function verify(token) {
  try {
    const [data, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", env("ADMIN_SESSION_SECRET")).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now()/1000)) return null;
    return payload;
  } catch { return null; }
}
function isAuthed(event) {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || "");
  return !!verify(cookies[COOKIE] || "");
}
function sessionCookie(value, maxAge = TTL) {
  const secure = process.env.CONTEXT !== "dev";
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function repoConfig() {
  return {
    owner: process.env.GITHUB_OWNER || "raonchae0609",
    repo: process.env.GITHUB_REPO || "raonchae-homepage",
    branch: process.env.GITHUB_BRANCH || "main",
    token: env("GITHUB_TOKEN"),
  };
}
async function github(path, options = {}) {
  const c = repoConfig();
  const res = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${path}`, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${c.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || `GitHub API error ${res.status}`);
  return data;
}
module.exports = { COOKIE, TTL, env, json, sign, verify, isAuthed, sessionCookie, safeEqual, repoConfig, github };
