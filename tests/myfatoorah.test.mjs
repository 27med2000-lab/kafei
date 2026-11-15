// Offline checks for the MyFatoorah helpers: webhook signatures and method codes. Run: node tests/myfatoorah.test.mjs
import crypto from "node:crypto";
process.env.MYFATOORAH_WEBHOOK_SECRET = "unit-test-secret";
const { webhookIsGenuine, METHODS } = await import("../api/_lib.js");
let fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };
const body = { Event: { Code: 1, Name: "PAYMENT_STATUS_CHANGED" }, Data: { Invoice: { Id: "7323798", Status: "PAID", ExternalIdentifier: null }, Transaction: { Status: "SUCCESS", PaymentId: "07077323798392274173" } } };
// the documented order: Invoice.Id, Invoice.Status, Transaction.Status, Transaction.PaymentId, Invoice.ExternalIdentifier (null becomes empty)
const text = "Invoice.Id=7323798,Invoice.Status=PAID,Transaction.Status=SUCCESS,Transaction.PaymentId=07077323798392274173,Invoice.ExternalIdentifier=";
const sig = crypto.createHmac("sha256", "unit-test-secret").update(text, "utf8").digest("base64");
ok(webhookIsGenuine({ "myfatoorah-signature": sig }, body).ok, "a correctly signed notification is accepted");
ok(!webhookIsGenuine({ "myfatoorah-signature": sig }, { ...body, Data: { ...body.Data, Invoice: { ...body.Data.Invoice, Status: "PENDING" } } }).ok, "changing any signed field breaks the signature");
ok(!webhookIsGenuine({}, body).ok, "a notification without a signature is rejected");
ok(!webhookIsGenuine({ "myfatoorah-signature": "abc" }, body).ok, "a wrong signature is rejected");
ok(METHODS.knet === "kn" && METHODS.card === "vm" && METHODS.apple === "ap", "KNET, card and Apple Pay map to MyFatoorah's codes");
console.log(fail ? "FAILED " + fail : "ALL PASS"); process.exit(fail ? 1 : 0);
