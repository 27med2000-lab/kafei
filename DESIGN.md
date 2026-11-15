# Kafei v3: "Poured, until enough"

Second demo built with the /awwwards skill, for comparison with v2 (the wall of niches).
v2 stays live as the "before"; this file covers only v3.

## Brief
- Subject: Kafei (كفي), a small coffee-gear shop in Kuwait with four real products in stock.
- Audience: home brewers in Kuwait, mostly on phones, Arabic or English.
- Job: open a product and ask for its price on WhatsApp (cart and checkout ready for when prices exist).
- Constraints: owner's palette is pinned, real stock and owner photos only, no invented prices, reviews or specs.
- Stack: the existing project is one static HTML page published as an artifact, so v3 stays static
  HTML with GSAP + ScrollTrigger + Lenis from a CDN (no build step, same publishing path).

## Concepts considered
| | Idea | Anchor | Signature | O/F/Fe/P |
|---|---|---|---|---|
| A. Name + place | The page pours like a host: one product per pour, and you stop when you have had enough | In the Gulf a guest shakes the finjan to say "enough"; كفي means enough | a pinned vessel that fills from below with each product as you scroll; a finjan meter fills with it | 4 / 5 / 4 / 1 |
| B. Material | Scroll is brew time: the ground darkens from limewash to espresso as the page "extracts" | the products are brewers | global ground/ink tween across the page | 3 / 4 / 4 / 4 |
| C. Formal | One product per screen and nothing else, "exactly enough" | the name's meaning | full-screen snap per product | 3 / 3 / 5 / 3 |

Pick A: the only one tied to both the name and a real local custom; it gives layout (one vessel),
motion (fill from below), hover (fills rise), transition (a pour in, a drain out) and the 404 (an empty finjan).
Stolen from C: each product holds the whole stage while it is poured.

## Concept card
```
Idea:        Kafei pours its stock for you one cup at a time, the way a host keeps pouring until you shake your finjan.
Metaphor:    Gulf coffee service: the dallah, the finjan, the shake that means enough.
Signature:   the pour: a pinned vessel; scrolling fills it from below with the next product, a liquid surface leading the fill; the corner finjan fills in step.
Emotion:     unhurried hospitality; one thing offered at a time.
Motion verb: fill from below and settle, like coffee rising in a cup.
Screenshot:  the vessel half poured: one product rising under a coffee surface, the next name arriving beside it.
```

## System
- Palette (owner's): ground limewash #F5F1E8, ink espresso #29221E, muted #6F645A, sand #EAE3D6,
  line #D8CDBD, accent crema #B9824B (the pour, focus, fills), roast #76513B (Arabic names, the pour's surface), curtain espresso.
  This is the warm-cream family the skill lists as a default to avoid; it is pinned by the owner, so it is
  carried with conviction through the pour instead of a serif-and-terracotta treatment.
- Type: Bricolage Grotesque (Latin display, 800, opsz 96, tracking -0.04em) + IBM Plex Sans Arabic
  (all Arabic, and Latin text). Two families, clearly distinct roles.
- Grid: 12 columns, 48px gutters desktop / 20px phone; left-aligned (mirrored in Arabic).
- Shape: the vessel (finjan profile, round bottom) for product media; pills for buttons; 6px elsewhere.
- Motion: ease expo.out for entrances, power2 for the curtain; fills 450ms; one clock (gsap.ticker drives Lenis).
- Idle: the pour's liquid surface and the meter's surface keep a slow ripple while the visitor is still.
- Reduced motion: no Lenis, no pin, no curtain; the pour becomes a calm stacked list.

## Sections
```
HOME   [ video hero: Kafei / كفي, lead, one button            ]
       [ pinned pour: copy left | vessel right | finjan meter  ]  x4 products
       [ categories: two-column list, rows fill on hover       ]
       [ delivery: espresso field, short headline              ]
FOOTER [ giant كفي, the finjan custom in one line, links        ]
SHOP   [ pour list: one row per product, thumbnail vessel      ]
404    [ an empty finjan: nothing poured here                  ]
```

## QA (pass 1 critic: separate subagent, from screenshots only)
Design 7 · Usability 7 · Creativity 7 · Content 7 → 7.0 weighted. Accessibility 8, WPO 8.
Critic's reading of the idea matched the concept card. Fixed after pass 1: the finjan custom moved
into the hero, outgoing product fades during the pour, empty categories collapsed to one line on
home, language button fills on hover, meter finjan shakes at the last cup, Arabic footer number isolated.
Final measured: mobile LCP 1.0 s, CLS 0.003, 60 fps, 0 axe violations, 0 audit FAILs.
Open: canonical, robots.txt, sitemap (need the real domain); prices; sharper product photos.
