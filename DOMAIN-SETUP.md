# kafeikw.com + Zoho Mail: setup steps

Do them in this order. Everything happens in your own accounts. Never paste passwords or keys into a chat.

## 1. Buy the domain (Cloudflare)
1. Make a free account at dash.cloudflare.com.
2. Go to Domain Registration > Register Domains, search **kafeikw.com** and buy it (renews yearly).
3. Contact details are hidden from the public lookup by default. That keeps your name, phone and address private.

## 2. Zoho Mail (business email)
1. Go to zoho.com/mail > Business email > choose a plan:
   - **Forever Free**: web and phone app only.
   - **Mail Lite**: adds sending from other apps (SMTP), which step 4 needs.
2. Sign up with **kafeikw.com** ("I already own a domain").
3. Zoho asks you to **verify the domain**. It gives you a TXT record (zoho-verification=zb…). Add it in Cloudflare (DNS > Records > Add record), then click Verify in Zoho.
4. Create your first address, e.g. **hello@kafeikw.com**. You can add aliases later, such as orders@kafeikw.com.
5. Add Zoho's mail records in Cloudflare. These are for Zoho's main (.com) region. If Zoho's setup page shows `.eu` or another region, use exactly what it shows.

| Type | Name | Content | Priority |
|---|---|---|---|
| MX | @ | mx.zoho.com | 10 |
| MX | @ | mx2.zoho.com | 20 |
| MX | @ | mx3.zoho.com | 50 |
| TXT | @ | v=spf1 include:zohomail.com ~all | |
| TXT | (Zoho shows it, e.g. zmail._domainkey) | (copy the DKIM value from Zoho Admin > Domains > Email configuration > DKIM) | |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:hello@kafeikw.com | |

6. Delete any other MX records. In Zoho, click Verify on each record. Mail usually starts arriving within an hour.
7. Install the Zoho Mail app on your phone and sign in with hello@kafeikw.com.

## 3. The website (Vercel)
1. In Vercel, open the project made from the `deploy` folder > Settings > Domains > add **kafeikw.com** and **www.kafeikw.com**.
2. Vercel shows the records to add (usually an A record for @ and a CNAME for www). Add them in Cloudflare exactly as shown, with the proxy **off (grey cloud, "DNS only")**.
3. In Vercel > Settings > Environment Variables, set `SITE_URL` = `https://kafeikw.com`.

## 4. Sign-in emails for customer accounts (Supabase)
Supabase's built-in sender only allows a few emails per hour, so send through Zoho instead. This needs a Zoho plan with SMTP (Mail Lite or higher).
1. In Zoho, turn on two-factor sign-in, then create an **app-specific password** (accounts.zoho.com > Security > App passwords).
2. In Supabase > Authentication > Emails > SMTP Settings, enable custom SMTP:
   - host `smtp.zoho.com` (or `smtp.zoho.eu` if your account is in the EU region), port `465`
   - user `hello@kafeikw.com`, password: the app-specific password
   - sender name `Kafei كفي`
3. In Supabase > Authentication > URL Configuration, set the Site URL to `https://kafeikw.com`.

## 5. Payments
Tell MyFatoorah your domain during go-live. Ask them to register **kafeikw.com for Apple Pay**.

## Already done in the website files
- `deploy/index.html` names https://kafeikw.com as the shop's address.
- `deploy/robots.txt` and `deploy/sitemap.xml` are ready.
