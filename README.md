# Kafei كفي: website source

The online shop at https://kafeikw.com. It runs as a Node.js web app on Hostinger, with Supabase for the database and sign-in.

## What is where
- `parts/`: the website itself (a.html = layout and styles, js1.js = settings, products, colours and all English/Arabic text, views.js = pages, js2–js5 = cart, checkout, clicks).
- `img/`: photos used on the site.
- `api/`: server functions (payments with MyFatoorah, cash orders, products, dashboard). `api/prices.json` = prices the server charges.
- `admin.html`, `admin.js`: the owner dashboard (kafeikw.com/admin).
- `supabase/`: database setup. Run schema.sql, then 002, 003, 004, 005, 006 and 007 in order in Supabase > SQL Editor (all already done for the live site).
- `server.mjs`: runs the shop on Node.js hosts (Hostinger: `npm start`).
- `deploy/`: the built site, exactly what Hostinger runs. Made by `build.py`; don't edit it by hand.
- `tests/`: automatic checks (`node tests/dashboard.test.mjs`, `colors`, `myfatoorah`, `inventory`).
- Guides: PAYMENTS.md, DOMAIN-SETUP.md (written before the move to Hostinger + Google Workspace), DESIGN.md.

## Making a change
1. Edit files in `parts/` (and `api/prices.json` if a price changes).
2. Run `python3 build.py`. It rebuilds `deploy/`.
3. Run the tests, then commit and push.
4. Put it live: on Hostinger, Websites > Web Apps > the Kafei app > Deployments. Never upload into File Manager / public_html.

## Secrets
No keys or passwords are stored here. The live keys (Supabase secret key, MyFatoorah keys) live only in the Hostinger web app's environment variables. The Supabase *publishable* key in the code is public by design.

Easiest: ask Claude to make the change.
