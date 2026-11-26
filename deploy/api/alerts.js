// Order alerts: when an order turns paid, tell the owner on WhatsApp (CallMeBot) and by email (SMTP).
// Each channel is optional and switches on when its settings are present in the host's environment variables:
//   CALLMEBOT_PHONE    the WhatsApp number that gets alerts, with country code, e.g. 96566908822
//   CALLMEBOT_APIKEY   the key CallMeBot sends to that number when it is activated (keep secret)
//   SMTP_HOST          e.g. smtp.hostinger.com        SMTP_PORT  465 (SSL)
//   SMTP_USER          the mailbox that sends, e.g. info@kafeikw.com
//   SMTP_PASS          that mailbox's password (keep secret)
//   ALERT_EMAIL        where alerts go (defaults to SMTP_USER)
//   NOTIFY_URL         optional: a Slack/Discord/Make/Zapier webhook
// An alert never blocks or fails an order: every channel has a time limit and errors are only logged.
import tls from "node:tls";
import net from "node:net";

const kwd = f => `KWD ${(Number(f || 0) / 1000).toFixed(3)}`;
const METHOD = { knet: "KNET", card: "card", apple: "Apple Pay", cod: "cash" };

export function alertText(o) {
  const items = (o.items || []).map(i => `• ${i.qty} × ${i.name}`).join("\n");
  return [`New paid order ${o.id}: ${kwd(o.total_fils)} by ${METHOD[o.method] || o.method || "card"}`,
    items,
    o.discount_code ? `Code ${o.discount_code}: -${kwd(o.discount_fils)}` : "",
    `Phone: +965 ${o.phone || "?"}`,
    `Address: ${o.address || "?"}`,
    `Open the dashboard: ${(process.env.SITE_URL || "https://kafeikw.com").replace(/\/$/, "")}/admin`].filter(Boolean).join("\n");
}

const withLimit = (p, ms = 8000) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("timed out")), ms))]);

async function whatsapp(text) {
  const phone = (process.env.CALLMEBOT_PHONE || "").replace(/\D/g, ""), key = (process.env.CALLMEBOT_APIKEY || "").trim();
  if (!phone || !key) return "off";
  const r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`);
  if (!r.ok) throw new Error("CallMeBot " + r.status);
  return "sent";
}

// A small SMTP client: enough to send one plain-text email over SSL (port 465) with a password.
export function sendMail({ host, port = 465, user, pass, from, to, subject, text, secure = true }) {
  return new Promise((ok, fail) => {
    const sock = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    let buf = "", step = 0;
    const b64 = s => Buffer.from(s, "utf8").toString("base64");
    const msg = [`From: Kafei <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${b64(subject)}?=`, `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@${from.split("@")[1] || "kafeikw.com"}>`,
      "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
      b64(text).replace(/.{76}/g, "$&\r\n"), ""].join("\r\n");
    const plan = [
      [220, () => `EHLO kafeikw.com`], [250, () => `AUTH LOGIN`], [334, () => b64(user)], [334, () => b64(pass)],
      [235, () => `MAIL FROM:<${from}>`], [250, () => `RCPT TO:<${to}>`], [250, () => `DATA`], [354, () => msg + "\r\n."], [250, () => `QUIT`]];
    const done = e => { sock.destroy(); e ? fail(e) : ok("sent"); };
    sock.setTimeout(10000, () => done(new Error("SMTP timed out")));
    sock.on("error", done);
    sock.on("data", d => {
      buf += d.toString("utf8");
      // a reply is complete when its last line has a space after the code ("250 ok", not "250-...")
      const lines = buf.split("\r\n").filter(Boolean); const last = lines[lines.length - 1];
      if (!buf.endsWith("\r\n") || !/^\d{3} /.test(last || "")) return;
      const code = Number(last.slice(0, 3)); buf = "";
      if (step >= plan.length) return done();
      const [want, next] = plan[step];
      if (code !== want) return done(new Error(`SMTP said ${last}`));
      step++; sock.write(next() + "\r\n");
      if (step === plan.length) setTimeout(() => done(), 300);
    });
  });
}

async function email(o, text) {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass } = process.env;
  if (!host || !user || !pass) return "off";
  return sendMail({ host, port: Number(process.env.SMTP_PORT || 465), user, pass, from: user, to: process.env.ALERT_EMAIL || user,
    subject: `New Kafei order ${o.id}: ${kwd(o.total_fils)}`, text });
}

async function hook(text) {
  if (!process.env.NOTIFY_URL) return "off";
  await fetch(process.env.NOTIFY_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, content: text }) });
  return "sent";
}

// order: the saved order row. Returns what happened on each channel (for logs and tests).
export async function orderAlert(o) {
  const text = alertText(o);
  const [wa, mail, wh] = await Promise.allSettled([withLimit(whatsapp(text)), withLimit(email(o, text), 15000), withLimit(hook(text))]);
  const out = { whatsapp: wa.value || "failed", email: mail.value || "failed", webhook: wh.value || "failed" };
  for (const [k, r] of [["whatsapp", wa], ["email", mail], ["webhook", wh]]) if (r.status === "rejected") console.error(`order alert (${k}) failed:`, r.reason && r.reason.message);
  return out;
}
