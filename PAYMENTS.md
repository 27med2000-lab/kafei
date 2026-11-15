# Kafei payments: MyFatoorah

KNET, Visa/Mastercard and Apple Pay go through MyFatoorah. Cash on delivery goes through WhatsApp.
The server always works out the price itself from `api/prices.json` (or the dashboard's products); the browser never decides what a customer pays.

## How a payment works
1. The customer chooses KNET, card or Apple Pay at checkout.
2. `/api/checkout` checks the cart, works out the total, and creates a MyFatoorah invoice with the order number as its **CustomerReference**, the items, the customer's name and phone, and the delivery address. The order is saved as **pending**.
3. The customer pays on MyFatoorah's secure page.
4. MyFatoorah sends them back to `kafeikw.com/?pay=return&order=…&paymentId=…` (or `?pay=cancel…` if it failed).
5. The shop asks MyFatoorah directly (`/api/status`, GetPaymentStatus) whether it was paid. It never trusts the return address alone. A confirmed payment marks the order **paid**.
6. MyFatoorah also sends a signed notification to `/api/myfatoorah-webhook`, which re-checks the payment with MyFatoorah and marks the order paid, even if the customer closed the page.

## Environment variables (Hostinger > your Node.js app > Environment variables)
| Name | Value |
|---|---|
| `SITE_URL` | `https://kafeikw.com` |
| `MYFATOORAH_API_KEY` | API token from the MyFatoorah portal (Integration Settings > API Key). **Secret.** |
| `MYFATOORAH_BASE` | Test: `https://apitest.myfatoorah.com` (the default). Live Kuwait account: `https://api.myfatoorah.com` |
| `MYFATOORAH_WEBHOOK_SECRET` | Webhook secret key from the portal (Integration Settings > Webhook). **Secret.** |
| `NOTIFY_URL` | Optional: a Slack/Discord/Make/Zapier webhook that gets a message for each paid order |

## Webhook (portal > Integration Settings > Webhook)
- URL: `https://kafeikw.com/api/myfatoorah-webhook`
- Version: **2**, event: **Payment Status Changed**
- Turn on the secret key and copy it into `MYFATOORAH_WEBHOOK_SECRET`.

## Testing
- Test server: `https://apitest.myfatoorah.com`, with your **test** API key (or MyFatoorah's public demo token from docs.myfatoorah.com/docs/test-token).
- Test Mastercard: `2223000000000007`, expiry `01/39`, CVV `100`.
- Test KNET: `8888880000000001`, expiry `09/30`, any 4-digit PIN (MyFatoorah notes KNET testing isn't available on every account).
- Checked on 2026-11-09 against MyFatoorah's test server: invoices for KNET, card and Apple Pay; a full card payment returned to the shop and was confirmed paid; the return page shows "Paid", "Pending" and "Payment not completed" correctly; signed webhooks are accepted and forged ones rejected.

## Going live
1. Finish MyFatoorah's account approval (company documents, bank account).
2. In the portal, switch to live and copy the **live** API key.
3. In Hostinger, set `MYFATOORAH_API_KEY` to the live key and `MYFATOORAH_BASE` to `https://api.myfatoorah.com`, then restart the app.
4. Set up the webhook on the live account and update `MYFATOORAH_WEBHOOK_SECRET`.
5. Make one small real payment (for example a KD 1 test product) and refund it from the portal.
6. Apple Pay: ask MyFatoorah to register `kafeikw.com` for Apple Pay on your account.

Tests: `node tests/myfatoorah.test.mjs` (signatures), `node tests/colors.test.mjs`, `node tests/dashboard.test.mjs`.
