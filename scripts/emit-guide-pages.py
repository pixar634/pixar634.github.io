# One-shot emitter for the public guide cluster. Run from landing/:
#   python scripts/emit-guide-pages.py
# Not a catalog dump — five places, five moods, two hubs.

import json
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = "/styles.css?v=hero-sequence-147"

HEAD = """<!doctype html>
<html lang="en-IN" class="is-theme-air">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>@@TITLE@@</title>
  <meta name="description" content="@@DESCRIPTION@@" />
  <link rel="canonical" href="https://letsgolighthouse.co.in/@@PATH@@" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <meta name="theme-color" content="#F4F1EA" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Lighthouse" />
  <meta property="og:locale" content="en_IN" />
  <meta property="og:title" content="@@OG_TITLE@@" />
  <meta property="og:description" content="@@OG_DESCRIPTION@@" />
  <meta property="og:url" content="https://letsgolighthouse.co.in/@@PATH@@" />
  <meta property="og:image" content="https://letsgolighthouse.co.in/og.png?v=6" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="A cream map of the country around Bangalore with weekend places pinned across it, under the words: Your next road trip is a swipe away." />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="@@OG_TITLE@@" />
  <meta name="twitter:description" content="@@OG_DESCRIPTION@@" />
  <meta name="twitter:image" content="https://letsgolighthouse.co.in/og.png?v=6" />
  <script type="application/ld+json">
@@LD@@
  </script>
  <link rel="stylesheet" href="@@CSS@@" />
</head>
<body>
  <a class="skip" href="/#join">Skip to waitlist</a>
  <div class="grain" aria-hidden="true"></div>
  <div class="beam" aria-hidden="true"></div>
  <header class="nav" id="nav">
    <a class="nav__brand" href="/">LIGHTHOUSE<span class="nav__dot">.</span></a>
    <div class="nav__right">
      <span class="utility nav__label">@@NAV@@</span>
      <a class="btn btn--ghost" href="/#join">Join waitlist</a>
    </div>
  </header>
  <main>
"""

# Two paths: the bubble and the handset. Inlined rather than fetched so the
# button is recognisable on first paint — it is the only thing on the page that
# has to be identified by shape rather than read.
WA_ICON = (
    '<svg class="btn__wa" viewBox="0 0 24 24" width="17" height="17" fill="currentColor"'
    ' aria-hidden="true" focusable="false">'
    '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38'
    'c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01'
    'A9.82 9.82 0 0 0 12.04 2zm0 18.02h-.01c-1.53 0-3.03-.41-4.34-1.19l-.31-.18-3.23.85.86-3.15'
    '-.2-.33a8.23 8.23 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42'
    'a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z"/>'
    '<path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16'
    '-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61'
    '.15-.15.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2'
    '-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46 0 1.45 1.06 2.85'
    ' 1.2 3.05.15.2 2.05 3.13 4.96 4.39.69.3 1.24.48 1.66.61.7.22 1.33.19 1.83.12.56-.08 1.72-.7'
    ' 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.57-.35z"/>'
    "</svg>"
)

FOOT = """
    <div class="guide__cta">
      <a class="btn btn--solid" href="/#join" data-magnetic>Join the waitlist</a>
      <a class="btn btn--ghost btn--wa" href="@@WA@@" target="_blank" rel="noopener"
         aria-label="Share this page on WhatsApp" data-magnetic>@@WA_ICON@@<span>Share on WhatsApp</span></a>
    </div>
  </main>
  <footer class="footer">
    <div class="footer__top">
      <div class="footer__brand">
        <a class="footer__mark" href="/" aria-label="Lighthouse, home">LIGHTHOUSE<span class="footer__dot">.</span></a>
        <p class="footer__pitch">Weekend discovery for Bangalore. Real places, computed drive times, and a group vote that ends the “up to you.”</p>
        <a class="btn btn--ghost footer__cta" href="/#join">Join the waitlist</a>
      </div>
      <nav class="footer__col" aria-labelledby="g-app">
        <p class="utility footer__coltitle" id="g-app">THE APP</p>
        <a class="footer__link" href="/#mood">Explore the map</a>
        <a class="footer__link" href="/#clock">The Return Clock</a>
        <a class="footer__link" href="/from/bengaluru.html">From Bengaluru</a>
        <a class="footer__link" href="/time/back-by-dark.html">Back by dark</a>
      </nav>
      <nav class="footer__col" aria-labelledby="g-moods">
        <p class="utility footer__coltitle" id="g-moods">MOODS</p>
        <a class="footer__link" href="/moods/summit-treks.html">Summit Treks</a>
        <a class="footer__link" href="/moods/misty-hikes.html">Misty Hikes</a>
        <a class="footer__link" href="/moods/secret-cascades.html">Secret Cascades</a>
        <a class="footer__link" href="/moods/wild-lakeside.html">Wild Lakeside</a>
        <a class="footer__link" href="/moods/breakfast-runs.html">Breakfast Runs</a>
      </nav>
      <nav class="footer__col" aria-labelledby="g-co">
        <p class="utility footer__coltitle" id="g-co">COMPANY</p>
        <a class="footer__link" href="/about.html">About</a>
        <a class="footer__link" href="/support.html">Support</a>
        <a class="footer__link" href="/contact.html">Contact</a>
      </nav>
    </div>
    <div class="footer__meta">
      <span class="utility">© 2026 TELLTALE SOFTWARES PVT LTD</span>
      <span class="footer__sep" aria-hidden="true">·</span>
      <span class="utility">MADE IN BANGALORE</span>
      <a href="https://www.instagram.com/letsgolighthouse.co.in" target="_blank" rel="noopener" class="footer__link utility footer__social">INSTAGRAM ↗</a>
    </div>
  </footer>
  <script src="/analytics.js" defer></script>
  <script src="/pages.js" defer></script>
</body>
</html>
"""


def crumbs(*pairs):
    parts = ['      <nav class="guide__crumbs" aria-label="Breadcrumb">']
    for i, (name, href) in enumerate(pairs):
        if i:
            parts.append('        <span aria-hidden="true">/</span>')
        if href:
            parts.append(f'        <a href="{href}">{name}</a>')
        else:
            parts.append(f"        <span>{name}</span>")
    parts.append("      </nav>")
    return "\n".join(parts)


def write(rel, html):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    print("wrote", rel)


def hero_of(img):
    """Guide heroes render up to 900px wide, so they use the 1280px Commons
    rendition in assets/places/lg/ rather than the 500px thumb the phone
    replicas share. See scripts/fetch-guide-heroes.py."""
    name = img.rsplit("/", 1)[1]
    return f"/assets/places/lg/{name}"


def wa_href(meta):
    """A wa.me link with the message baked in at build time. GitHub Pages runs
    no server code and this has to survive pages.js failing to load, so there is
    nothing to compute in the browser: the sentence is the page's own facts and
    the URL is its canonical."""
    text = f"{meta.get('share', meta['og_description'])} https://letsgolighthouse.co.in/{meta['path']}"
    # safe="" leaves only unreserved characters and %, so the result needs no
    # further escaping to sit in an href.
    return "https://wa.me/?text=" + urllib.parse.quote(text, safe="")


def page(meta, body):
    subs = {
        "@@TITLE@@": meta["title"],
        "@@DESCRIPTION@@": meta["description"],
        "@@PATH@@": meta["path"],
        "@@OG_TITLE@@": meta["og_title"],
        "@@OG_DESCRIPTION@@": meta["og_description"],
        "@@NAV@@": meta["nav_label"],
        "@@LD@@": meta["ld"],
        "@@CSS@@": CSS,
        "@@WA@@": wa_href(meta),
        "@@WA_ICON@@": WA_ICON,
    }
    head, foot = HEAD, FOOT
    for key, val in subs.items():
        head = head.replace(key, val)
        foot = foot.replace(key, val)
    return head + body + foot


def place_ld(p):
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TouristAttraction",
                "@id": f"https://letsgolighthouse.co.in/{p['path']}#place",
                "name": p["name"],
                "url": f"https://letsgolighthouse.co.in/{p['path']}",
                "image": f"https://letsgolighthouse.co.in{hero_of(p['img'])}",
                "description": p["description"][:280],
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": p["lat"],
                    "longitude": p["lon"],
                },
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": p["city"],
                    "addressRegion": p["state"],
                    "addressCountry": "IN",
                },
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://letsgolighthouse.co.in/"},
                    {"@type": "ListItem", "position": 2, "name": p["mood_name"], "item": f"https://letsgolighthouse.co.in/{p['mood_path']}"},
                    {"@type": "ListItem", "position": 3, "name": p["name"]},
                ],
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a},
                    }
                    for q, a in p["faqs"]
                ],
            },
        ],
    }
    return json.dumps(graph, ensure_ascii=False, indent=2)


def mood_ld(m):
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": f"https://letsgolighthouse.co.in/{m['path']}#webpage",
                "url": f"https://letsgolighthouse.co.in/{m['path']}",
                "name": m["title"],
                "description": m["description"],
                "isPartOf": {"@id": "https://letsgolighthouse.co.in/#website"},
                "about": {"@id": "https://letsgolighthouse.co.in/#organization"},
                "inLanguage": "en-IN",
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://letsgolighthouse.co.in/"},
                    {"@type": "ListItem", "position": 2, "name": "From Bengaluru", "item": "https://letsgolighthouse.co.in/from/bengaluru.html"},
                    {"@type": "ListItem", "position": 3, "name": m["name"]},
                ],
            },
        ],
    }
    return json.dumps(graph, ensure_ascii=False, indent=2)


def hub_ld(h):
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": f"https://letsgolighthouse.co.in/{h['path']}#webpage",
                "url": f"https://letsgolighthouse.co.in/{h['path']}",
                "name": h["title"],
                "description": h["description"],
                "isPartOf": {"@id": "https://letsgolighthouse.co.in/#website"},
                "about": {"@id": "https://letsgolighthouse.co.in/#organization"},
                "inLanguage": "en-IN",
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://letsgolighthouse.co.in/"},
                    {"@type": "ListItem", "position": 2, "name": h["name"]},
                ],
            },
        ],
    }
    return json.dumps(graph, ensure_ascii=False, indent=2)



def place_body(p):
    notes = "".join(f"            <li>{n}</li>\n" for n in p["notes"])
    notes_block = (
        f"""        <h2>Good to know</h2>
        <ul class="guide__notes">
{notes}        </ul>"""
        if p["notes"]
        else ""
    )
    faq_html = "".join(
        f"""      <div class="faqitem">
        <button class="faqitem__q" type="button">{q}<span class="faqitem__chevron">+</span></button>
        <div class="faqitem__a"><p>{a}</p></div>
      </div>
"""
        for q, a in p["faqs"]
    )
    return f"""    <section class="docpage__hero">
{crumbs(("Home", "/"), (p["mood_name"], "/" + p["mood_path"]), (p["name"], None))}
      <p class="utility docpage__eyebrow">{p["eyebrow"]}</p>
      <h1 class="docpage__title">{p["h1"]}</h1>
      <p class="docpage__sub">{p["sub"]}</p>
    </section>
    <figure class="guide__hero-img">
      <img src="{hero_of(p['img'])}" alt="{p['alt']}" width="1200" height="800" fetchpriority="high" />
      <figcaption class="guide__credit">{p['credit']} · <a href="{p['commons']}" rel="noopener">Commons</a></figcaption>
    </figure>
    <div class="guide__stats">
      <div class="guide__stat"><b>{p['drive']}</b><small>driving from Bengaluru</small></div>
      <div class="guide__stat"><b>{p['km']}</b><small>one way, computed</small></div>
      <div class="guide__stat"><b>{p['on_site']}</b><small>typical time on site</small></div>
    </div>
    <div class="docpage__body">
      <h2>The drive</h2>
      <p>{p['drive_copy']}</p>
      {notes_block}
      <h2>Same day or overnight</h2>
      <p>{p['clock_copy']}</p>
    </div>
    <div class="faqlist">
      <p class="utility faqcat">FROM BENGALURU</p>
{faq_html}    </div>
"""


PLACES = [
    dict(
        path="places/ganalu-falls.html",
        name="Ganalu Falls",
        h1="Ganalu Falls",
        eyebrow="SECRET CASCADES · FROM BENGALURU",
        nav_label="GANALU FALLS",
        mood_name="Secret Cascades",
        mood_path="moods/secret-cascades.html",
        title="Ganalu Falls From Bangalore — 98 km, ~1h 48m",
        description="A Shimsha cascade a few kilometres before Shivanasamudra. 98 km from Bengaluru, computed drive about 1 hour 48 minutes. Aggressive in the monsoon. Uncommercialized.",
        og_title="Ganalu Falls — Lighthouse",
        og_description="98 km from Bengaluru. Needs rain. Not a packaged fall.",
        sub="On the Shimsha, a few kilometres before Shivanasamudra. Raw in the monsoon. Not a ticketed stop.",
        img="/assets/places/ganalu.jpg",
        alt="Ganalu Falls on the Shimsha river, Karnataka",
        credit="SWE-Yaatrik / Wikimedia Commons / CC BY-SA 4.0",
        commons="https://commons.wikimedia.org/wiki/File:Ganalu_Falls.jpg",
        lat=12.348032,
        lon=77.197294,
        city="Malavalli",
        state="Karnataka",
        drive="1h 48m",
        km="98 km",
        on_site="~6 hrs",
        drive_copy="From Bengaluru the computed drive is about 1 hour 48 minutes and 98 kilometres, by car, on the road network — not a straight-line guess. Nearest city on the catalog is Malavalli. Maddur is the nearest station on record; that timing is indicative.",
        notes=[
            "A few kilometres before Shivanasamudra, on the Shimsha — not the packaged falls further along.",
            "Aggressive in the monsoon. That is when it runs; it is also when it is least polite.",
            "Uncommercialized. Do not expect stalls at the lip.",
        ],
        clock_copy="This is a same-day trip if you set the Return Clock to back by dark. The typical time on site in the catalog is six hours — leave room for the wet rock, not just the drive.",
        faqs=[
            (
                "How far is Ganalu Falls from Bangalore?",
                "About 98 km and about 1 hour 48 minutes driving from Bengaluru, computed from the road network. Not a straight-line guess.",
            ),
            (
                "Can I do Ganalu Falls as a day trip?",
                "Yes, if you still get home by dark. The catalog's typical time on site is six hours. The fall is aggressive in the monsoon — that is when it has water.",
            ),
        ],
    ),
    dict(
        path="places/gundamagere-lake.html",
        name="Gundamagere Lake",
        h1="Gundamagere Lake",
        eyebrow="WILD LAKESIDE · FROM BENGALURU",
        nav_label="GUNDAMAGERE",
        mood_name="Wild Lakeside",
        mood_path="moods/wild-lakeside.html",
        title="Gundamagere Lake From Bangalore — 60 km, ~1h",
        description="A quieter reservoir north of Doddaballapur. About 60 km and 1 hour from Bengaluru. Dirt last stretch, parking on the bund, no stalls. Carry supplies from Doddaballapur.",
        og_title="Gundamagere Lake — Lighthouse",
        og_description="60 km from Bengaluru. Park on the bund. Bring your own food.",
        sub="North of Doddaballapur. Park on the bund. No shops. Thorns on the last track.",
        img="/assets/places/gundamagere.jpg",
        alt="Gundamagere Lake, north of Doddaballapur",
        credit="SWE-Yaatrik / Wikimedia Commons / CC BY-SA 4.0",
        commons="https://commons.wikimedia.org/wiki/File:Gundamagere_Lake.jpg",
        lat=13.437969,
        lon=77.479104,
        city="Gundamagere",
        state="Karnataka",
        drive="1h",
        km="60 km",
        on_site="~6 hrs",
        drive_copy="From Bengaluru: about 1 hour and 60 kilometres by car, computed. Tarmac holds until the village turn-off; the last stretch is a narrow unpaved track. Wider cars pick up thorn scratches. Hatchbacks and bikes cope. Best season in the catalog is post-monsoon, October to February.",
        notes=[
            "Final stretch is a narrow dirt track with thorns; watch for vehicle scratches.",
            "Ample parking available directly on the lake bund.",
            "No shops or food stalls nearby; carry all supplies from Doddaballapur.",
            "Mobile signal is patchy near the water but stable on the higher bund sections.",
        ],
        clock_copy="This is a back-by-dark place. There is no shade on the bund — mid-morning sun is the catch, not the kilometres. Overnight is wasted on a reservoir with no stay.",
        faqs=[
            (
                "How far is Gundamagere Lake from Bangalore?",
                "About 60 km and about 1 hour driving from Bengaluru, computed. The last stretch is dirt, not the highway.",
            ),
            (
                "Is there food at Gundamagere Lake?",
                "No shops or stalls at the bund. Carry supplies from Doddaballapur. That is the point of a car picnic here.",
            ),
        ],
    ),
    dict(
        path="places/rayakottai-fort.html",
        name="Rayakottai Fort",
        h1="Rayakottai Fort",
        eyebrow="A CLIMB · FROM BENGALURU",
        nav_label="RAYAKOTTAI",
        mood_name="Summit Treks",
        mood_path="moods/summit-treks.html",
        title="Rayakottai Fort From Bangalore — 76 km, ~1h 12m",
        description="An 18th-century hill fort on the interior road toward Salem. About 76 km and 1 hour 12 minutes from Bengaluru. Exposed granite, start before the sun is high. No entry fee.",
        og_title="Rayakottai Fort — Lighthouse",
        og_description="76 km from Bengaluru. Start before the rock bakes. No ticket.",
        sub="Granite steps, ruined ramparts, the Bangalore–Salem line in the plains. No tree cover. Start early.",
        img="/assets/places/rayakottai.jpg",
        alt="Dilapidated structure on Rayakottai Fort, Tamil Nadu",
        credit="Venkasub / Wikimedia Commons / CC BY-SA 3.0",
        commons="https://commons.wikimedia.org/wiki/File:Dilapidated_Structure_-1_,_Tip_Sultan_Fort,_Rayakottai,_Tamilnadu,_India.JPG",
        lat=12.521642,
        lon=78.037022,
        city="Rayakottai",
        state="Tamil Nadu",
        drive="1h 12m",
        km="76 km",
        on_site="~7 hrs",
        drive_copy="From Bengaluru: about 1 hour 12 minutes and 76 kilometres by car, computed. The town at the base has tea and snacks; you will not find them on the hill. The climb is about an hour on stone steps through old gateways. Best season in the catalog: November to February.",
        notes=[
            "Bikes and cars can be parked near the base of the hill in the town.",
            "The path is exposed to the sun; start early morning to avoid the heat.",
            "No entry fee or formal permit is required for the trek.",
            "Basic food and water are available in Rayakottai town but not on the hill.",
        ],
        clock_copy="Same day, back by dark, if you start before the granite cooks. This is the one Summit Treks example we publish — the rest of that collection stays on the map.",
        faqs=[
            (
                "How far is Rayakottai Fort from Bangalore?",
                "About 76 km and about 1 hour 12 minutes driving from Bengaluru, computed. The climb from town is about an hour on stone.",
            ),
            (
                "Do I need a permit for Rayakottai Fort?",
                "No entry fee or formal permit is in the catalog notes. Park in town. Carry water; there is none on the hill.",
            ),
        ],
    ),
    dict(
        path="places/kakkadampoyil-ghat.html",
        name="Kakkadampoyil Ghat",
        h1="Kakkadampoyil Ghat",
        eyebrow="MIST · A Ghat · FROM BENGALURU",
        nav_label="KAKKADAMPOYIL",
        mood_name="Misty Hikes",
        mood_path="moods/misty-hikes.html",
        title="Kakkadampoyil Ghat From Bangalore — 318 km, ~4h 27m",
        description="Tight Western Ghats hairpins above Nilambur. About 318 km and 4 hours 27 minutes from Bengaluru. Afternoon fog can drop visibility to a few metres. Overnight, not a day trip.",
        og_title="Kakkadampoyil Ghat — Lighthouse",
        og_description="318 km from Bengaluru. The fog is the point. Not a same-day loop.",
        sub="The road is the place. Tight hairpins, year-round canopy, fog that arrives without a warning.",
        img="/assets/places/kakkadampoyil.jpg",
        alt="Kakkadampoyil in the Kerala Western Ghats",
        credit="Manojk / Wikimedia Commons / CC BY-SA 4.0",
        commons="https://commons.wikimedia.org/wiki/File:Kakkadampoyil_Kerala_Western_Ghats_DSC09436.jpg",
        lat=11.335265,
        lon=76.110903,
        city="Kakkadampoyil",
        state="Kerala",
        drive="4h 27m",
        km="318 km",
        on_site="overnight",
        drive_copy="From Bengaluru: about 4 hours 27 minutes and 318 kilometres by car, computed. That is past the same-day band. The Return Clock wants overnight or the weekend. Best season in the catalog: monsoon and post-monsoon, July to January — which is also when the fog is honest.",
        notes=[
            "Tight hairpins and steep sections.",
            "Heavy afternoon fog reduces visibility.",
            "Intermittent phone signal.",
            "Multiple roadside pull-over spots.",
        ],
        clock_copy="Do not pretend this is back-by-dark from Bengaluru. Clock it overnight. Check brakes and cooling before the climb. Signal dies in the forest stretches.",
        faqs=[
            (
                "How far is Kakkadampoyil from Bangalore?",
                "About 318 km and about 4 hours 27 minutes driving from Bengaluru, computed. That is an overnight, not a day trip.",
            ),
            (
                "Why is the fog a problem on Kakkadampoyil Ghat?",
                "It can roll in during the afternoon and cut visibility to a few metres. The catalog notes that as the catch, not a surprise.",
            ),
        ],
    ),
    dict(
        path="places/muthathi.html",
        name="Muthathi River Bank",
        h1="Muthathi",
        eyebrow="A MORNING OUT · FROM BENGALURU",
        nav_label="MUTHATHI",
        mood_name="Breakfast Runs",
        mood_path="moods/breakfast-runs.html",
        title="Muthathi From Bangalore — 92 km, ~1h 41m",
        description="Kaveri inside Cauvery Wildlife Sanctuary. About 92 km and 1 hour 41 minutes from Bengaluru. The forest tarmac is the reason to go. Out early, home before it gets hot.",
        og_title="Muthathi River Bank — Lighthouse",
        og_description="92 km from Bengaluru. Forest road, Kaveri bank. Leave early.",
        sub="The Kaveri cutting through the sanctuary. The road in is a ribbon of tarmac through forest.",
        img="/assets/places/muthathi.jpg",
        alt="Bank of the Kaveri at Muthathi, Karnataka",
        credit="Nagaraj Sinhasan / Wikimedia Commons / CC BY-SA 4.0",
        commons="https://commons.wikimedia.org/wiki/File:Bank_of_River_Kaveri_at_Muthathi,_Karnataka.jpg",
        lat=12.305418,
        lon=77.311772,
        city="Malavalli",
        state="Karnataka",
        drive="1h 41m",
        km="92 km",
        on_site="~6 hrs",
        drive_copy="From Bengaluru: about 1 hour 41 minutes and 92 kilometres by car, computed. Channapatna is the nearest station on record; that figure is indicative. Typical time on site: six hours. This is the one morning-out we publish — not a list of every breakfast run on the map.",
        notes=[
            "Kaveri river bank inside Cauvery Wildlife Sanctuary, near Malavalli.",
            "The approach is forest tarmac with hairpins — the road is half the reason.",
            "Catalog tags: forest, hairpins, riverside. Leave early if you want shade left on the bank.",
        ],
        clock_copy="Back by dark is easy if you leave at dawn. The Breakfast Runs standfirst is out by six, eating by eight, home before it gets hot — this bank will punish a noon start more than a slow driver.",
        faqs=[
            (
                "How far is Muthathi from Bangalore?",
                "About 92 km and about 1 hour 41 minutes driving from Bengaluru, computed.",
            ),
            (
                "Is Muthathi a same-day trip?",
                "Yes. Typical time on site is six hours. Leave early; the sanctuary road and the bank both get hotter than the kilometres suggest.",
            ),
        ],
    ),
]


def mood_body(m, proof):
    return f"""    <section class="docpage__hero">
{crumbs(("Home", "/"), ("From Bengaluru", "/from/bengaluru.html"), (m["name"], None))}
      <p class="utility docpage__eyebrow">{m['eyebrow']}</p>
      <h1 class="docpage__title">{m['h1']}</h1>
      <p class="docpage__sub">{m['standfirst']}</p>
    </section>
    <div class="docpage__body">
      <p>{m['lede']}</p>
    </div>
    <article class="guide__proof">
      <img src="{proof['img']}" alt="{proof['alt']}" width="280" height="280" />
      <div>
        <p class="utility">ONE PLACE, FROM THE MAP</p>
        <h2>{proof['name']}</h2>
        <p>{proof['blurb']}</p>
        <a class="guide__go" href="/{proof['path']}">{proof['name']} from Bengaluru →</a>
      </div>
    </article>
    <div class="docpage__body">
      <h2>The rest stays on the map</h2>
      <p>{m['rest']}</p>
      <p><a href="/time/back-by-dark.html">Clock out when you need to be home.</a> Same-day or overnight is a setting, not a blog radius.</p>
    </div>
"""


MOODS = [
    dict(
        path="moods/summit-treks.html",
        name="Summit Treks",
        h1="Summit treks<br /><em>from Bengaluru.</em>",
        eyebrow="43 IN THE CATALOG · ONE ON THIS PAGE",
        nav_label="SUMMIT TREKS",
        title="Summit Treks Near Bangalore — Bettas, Drive Times",
        description="Betta climbs that pay out. Start before the rock bakes. One published climb from Bengaluru — Rayakottai Fort, 76 km. The rest of the 43 stays on the map.",
        og_title="Summit Treks from Bengaluru — Lighthouse",
        og_description="Start before the rock bakes. One climb published. The rest is on the map.",
        standfirst="Betta climbs that pay out. Start before the rock bakes.",
        lede="From Bengaluru, a summit is a Saturday if the Return Clock still has you home by dark — and a waste of granite if you start at noon. We publish one climb here, not the tourist-circuit roster and not the other forty-two in the collection.",
        rest="The map holds the set. This page holds the kind of answer: computed kilometres, an exposed path, a leave-early note. Join the waitlist for the rest.",
        proof_key="rayakottai",
    ),
    dict(
        path="moods/misty-hikes.html",
        name="Misty Hikes",
        h1="Misty hikes<br /><em>from Bengaluru.</em>",
        eyebrow="12 IN THE CATALOG · ONE ON THIS PAGE",
        nav_label="MISTY HIKES",
        title="Misty Hikes Near Bangalore — Fog, Ghats, Drive Times",
        description="Better in bad weather. Low visibility is the point. One published ghat from Bengaluru — Kakkadampoyil, 318 km, overnight. The rest of the 12 stays on the map.",
        og_title="Misty Hikes from Bengaluru — Lighthouse",
        og_description="Low visibility is the point. One ghat published. The rest is on the map.",
        standfirst="Better in bad weather. Low visibility is the point.",
        lede="Mist is not a filter. It is afternoon fog on a ghat, a canopy that stays wet, a clock that has to admit overnight. We publish one of those roads from Bengaluru. Not Mullayanagiri. Not a listicle of twelve names.",
        rest="Twelve misty hikes sit in the catalog. This page names one. The Return Clock decides whether the rest still fit your Saturday.",
        proof_key="kakkadampoyil",
    ),
    dict(
        path="moods/secret-cascades.html",
        name="Secret Cascades",
        h1="Secret cascades<br /><em>from Bengaluru.</em>",
        eyebrow="29 IN THE CATALOG · ONE ON THIS PAGE",
        nav_label="SECRET CASCADES",
        title="Secret Cascades Near Bangalore — Falls That Need Rain",
        description="Falls nobody has packaged yet. Most of them need rain. One published cascade from Bengaluru — Ganalu Falls, 98 km. The rest of the 29 stays on the map.",
        og_title="Secret Cascades from Bengaluru — Lighthouse",
        og_description="Most of them need rain. One fall published. The rest is on the map.",
        standfirst="Falls nobody has packaged yet. Most of them need rain.",
        lede="A cascade without rain is a rock. The cards say so. We publish one Shimsha fall from Bengaluru — not twenty-nine names, and not the ticketed circus at the next river bend.",
        rest="Twenty-nine secret cascades in the catalog. One on this site. Weather on a place comes from Open-Meteo, in the app — this page will not pretend a live chart.",
        proof_key="ganalu",
    ),
    dict(
        path="moods/wild-lakeside.html",
        name="Wild Lakeside",
        h1="Wild lakeside<br /><em>from Bengaluru.</em>",
        eyebrow="67 IN THE CATALOG · ONE ON THIS PAGE",
        nav_label="WILD LAKESIDE",
        title="Wild Lakeside Near Bangalore — Bunds Worth Slow Hours",
        description="Backwaters and lake bunds worth three slow hours. One published lake from Bengaluru — Gundamagere, 60 km. The rest of the 67 stays on the map.",
        og_title="Wild Lakeside from Bengaluru — Lighthouse",
        og_description="Park on the bund. One lake published. The rest is on the map.",
        standfirst="Backwaters and lake bunds worth three slow hours.",
        lede="A lakeside from Bengaluru is a car picnic if the last stretch is honest and the bund is empty. We publish one reservoir north of Doddaballapur. Not the crowded Chikkaballapur circuit.",
        rest="Sixty-seven wild lakesides in the catalog. This page is a sample, not a directory. The clock still has to fit the drive home.",
        proof_key="gundamagere",
    ),
    dict(
        path="moods/breakfast-runs.html",
        name="Breakfast Runs",
        h1="Breakfast runs<br /><em>from Bengaluru.</em>",
        eyebrow="50 IN THE CATALOG · ONE ON THIS PAGE",
        nav_label="BREAKFAST RUNS",
        title="Breakfast Runs Near Bangalore — Out by Six, Home Before Heat",
        description="Out by six, eating by eight, home before it gets hot. One published morning from Bengaluru — Muthathi on the Kaveri, 92 km. The rest of the 50 stays on the map.",
        og_title="Breakfast Runs from Bengaluru — Lighthouse",
        og_description="Out by six. One morning published. The rest is on the map.",
        standfirst="Out by six, eating by eight, home before it gets hot.",
        lede="A breakfast run is a clock problem, not a cafe list. We publish one Kaveri bank you can reach before the sanctuary road bakes. Not fifty names. Not the city forest everyone already rides.",
        rest="Fifty breakfast runs in the catalog. One on this site. Set back-by-dark and leave at dawn — or do not go.",
        proof_key="muthathi",
    ),
]

PROOF = {
    "rayakottai": dict(
        path="places/rayakottai-fort.html",
        name="Rayakottai Fort",
        img="/assets/places/rayakottai.jpg",
        alt="Rayakottai Fort",
        blurb="76 km · 1h 12m from Bengaluru. Exposed granite. Start before the sun is high. No ticket.",
    ),
    "kakkadampoyil": dict(
        path="places/kakkadampoyil-ghat.html",
        name="Kakkadampoyil Ghat",
        img="/assets/places/kakkadampoyil.jpg",
        alt="Kakkadampoyil Ghat",
        blurb="318 km · 4h 27m from Bengaluru. Overnight. Afternoon fog. The road is the point.",
    ),
    "ganalu": dict(
        path="places/ganalu-falls.html",
        name="Ganalu Falls",
        img="/assets/places/ganalu.jpg",
        alt="Ganalu Falls",
        blurb="98 km · 1h 48m from Bengaluru. Shimsha, before Shivanasamudra. Needs rain.",
    ),
    "gundamagere": dict(
        path="places/gundamagere-lake.html",
        name="Gundamagere Lake",
        img="/assets/places/gundamagere.jpg",
        alt="Gundamagere Lake",
        blurb="60 km · 1h from Bengaluru. Dirt last stretch. Park on the bund. Bring food.",
    ),
    "muthathi": dict(
        path="places/muthathi.html",
        name="Muthathi",
        img="/assets/places/muthathi.jpg",
        alt="Muthathi River Bank",
        blurb="92 km · 1h 41m from Bengaluru. Forest tarmac, Kaveri bank. Leave early.",
    ),
}


def main():
    for p in PLACES:
        meta = dict(
            title=p["title"],
            description=p["description"],
            path=p["path"],
            og_title=p["og_title"],
            og_description=p["og_description"],
            nav_label=p["nav_label"],
            ld=place_ld(p),
            share=f"{p['name']} — {p['km']} from Bengaluru, about {p['drive']} driving.",
        )
        write(p["path"], page(meta, place_body(p)))

    for m in MOODS:
        meta = dict(
            title=m["title"],
            description=m["description"],
            path=m["path"],
            og_title=m["og_title"],
            og_description=m["og_description"],
            nav_label=m["nav_label"],
            ld=mood_ld(m),
            share=f"{m['name']} near Bengaluru — with computed drive times and a return clock, not a top-ten list.",
        )
        write(m["path"], page(meta, mood_body(m, PROOF[m["proof_key"]])))

    beng = dict(
        title="Weekend Getaways From Bengaluru — Day, Overnight, Weekend",
        description="Day trips, overnight, or the whole weekend from Bengaluru. The Return Clock decides what still fits. Five moods, five published places. The rest is on the map.",
        path="from/bengaluru.html",
        og_title="From Bengaluru — Lighthouse",
        og_description="Day, overnight, or the weekend. The clock decides. Not a top-ten list.",
        nav_label="FROM BENGALURU",
        name="From Bengaluru",
        share="Weekend getaways from Bengaluru, sorted by what actually fits the day — day trip, overnight, or the whole weekend.",
    )
    beng["ld"] = hub_ld(beng)
    beng_body = f"""    <section class="docpage__hero">
{crumbs(("Home", "/"), ("From Bengaluru", None))}
      <p class="utility docpage__eyebrow">AROUND 12°58′N  77°35′E</p>
      <h1 class="docpage__title">From Bengaluru.<br /><em>The clock decides.</em></h1>
      <p class="docpage__sub">Same-day if you are home by dark. Overnight if the kilometres refuse. The weekend if you drop the bound.</p>
    </section>
    <div class="docpage__body">
      <p>Search still asks for “places near Bangalore.” The useful question is whether you can leave after breakfast and be back before the group-chat anxiety starts. Drive times on these pages are computed from Bengaluru on the road network. They are not a 150 km circle drawn on a listicle.</p>
      <h2>Day trip</h2>
      <p>Back by dark — or by a time you set. The product’s free day-trip band is about 100 km. <a href="/places/gundamagere-lake.html">Gundamagere</a>, <a href="/places/rayakottai-fort.html">Rayakottai</a>, <a href="/places/ganalu-falls.html">Ganalu</a>, <a href="/places/muthathi.html">Muthathi</a> all still fit that if you leave on time.</p>
      <h2>Overnight</h2>
      <p>Past the same-day window, still inside a weekend. <a href="/places/kakkadampoyil-ghat.html">Kakkadampoyil Ghat</a> is the published example: 318 km, fog in the afternoon, not a loop you squeeze before sunset.</p>
      <h2>Moods, not a roster</h2>
      <p>Five collections, one proof place each. We do not publish the tourist circuit, and we do not publish the rest of the catalog.</p>
      <ul>
        <li><a href="/moods/summit-treks.html">Summit Treks</a></li>
        <li><a href="/moods/misty-hikes.html">Misty Hikes</a></li>
        <li><a href="/moods/secret-cascades.html">Secret Cascades</a></li>
        <li><a href="/moods/wild-lakeside.html">Wild Lakeside</a></li>
        <li><a href="/moods/breakfast-runs.html">Breakfast Runs</a></li>
      </ul>
      <p><a href="/time/back-by-dark.html">Read the Return Clock as a document.</a></p>
    </div>
"""
    write(beng["path"], page(beng, beng_body))

    clock = dict(
        title="Back by Dark From Bangalore — The Return Clock",
        description="A same-day trip from Bengaluru is whatever still gets you home before dark. Drive times are computed, not guessed. Set the clock; the map sheds what no longer fits.",
        path="time/back-by-dark.html",
        og_title="Back by dark — Lighthouse",
        og_description="The Return Clock, written down. Same-day from Bengaluru is a sunset, not a radius.",
        nav_label="BACK BY DARK",
        name="Back by dark",
        share="Which trips from Bengaluru still get you home before dark — worked out from real drive times, not vibes.",
    )
    clock["ld"] = hub_ld(clock)
    clock_body = f"""    <section class="docpage__hero">
{crumbs(("Home", "/"), ("From Bengaluru", "/from/bengaluru.html"), ("Back by dark", None))}
      <p class="utility docpage__eyebrow">THE RETURN CLOCK</p>
      <h1 class="docpage__title">Back by dark.<br /><em>From Bengaluru.</em></h1>
      <p class="docpage__sub">Home before the light goes. The map only keeps what still fits.</p>
    </section>
    <div class="docpage__body">
      <p>The Return Clock is not a distance filter with a prettier name. It is a wall-clock deadline. Back by dark uses sunset. Back by midnight keeps your own bed. Overnight is one night away — a real ceiling, not “anywhere.” The weekend drops the bound.</p>
      <p>On these public pages, origin is Bengaluru, named. Live GPS belongs in the app. A share card that carries “56 km” without saying from where is a lie.</p>
      <h2>What still fits a same-day clock</h2>
      <p>Of the five places we publish, four still work if you leave on time: <a href="/places/gundamagere-lake.html">Gundamagere Lake</a> (60 km), <a href="/places/rayakottai-fort.html">Rayakottai Fort</a> (76 km), <a href="/places/muthathi.html">Muthathi</a> (92 km), <a href="/places/ganalu-falls.html">Ganalu Falls</a> (98 km). <a href="/places/kakkadampoyil-ghat.html">Kakkadampoyil</a> does not — that is overnight, and the page says so.</p>
      <h2>The other presets</h2>
      <p>Midnight, overnight, and the whole weekend live in the app. This document is the same-day setting, because that is the query Bangalore actually types: one-day return, under three hours, back before dark.</p>
      <p><a href="/from/bengaluru.html">From Bengaluru</a> · <a href="/#clock">See it on the map</a></p>
    </div>
"""
    write(clock["path"], page(clock, clock_body))


if __name__ == "__main__":
    main()
