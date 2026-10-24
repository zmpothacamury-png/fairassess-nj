# Site format

Written 2026-10-14. Updated 2026-10-18 (UI redesign): page patterns and the design quality checklist below; values in `docs/design-system.md`. FairAssess NJ follows the same site **format** as Zaden's other site, Trust & Transition (trustandtransition.org, "T&T"): the same kind of tabs, page skeletons, scroll-to-explore button, and text transitions with the **same motion values**. Colors, fonts, and components come from `docs/design-system.md`. Page content is built on top of these patterns.

**T&T source used:** `C:\Users\sxp15\trustAndTransition\TrustAndTransition\` (`site.css`, `site.js`, `index.html`, `about.html`, `contact.html`). These files are identical to the live trustandtransition.org (checked 2026-10-14). Citations below are `file:line` in that folder. No T&T text, logo, images, or colors were copied.

---

## 1. What T&T does

### Header
- **Layout:** logo icon + name on the left (`index.html:104`), tabs in the middle-right (`index.html:105-110`), a gold "Sign Up" button on the right that links to `contact.html#waitlist` (`index.html:111-112`). Height 84px (`site.css:31`).
- **Sticky:** `position: sticky; top: 0` with a frosted, see-through background (`site.css:28`).
- **On scroll:** after `scrollY > 8` the header gets a `scrolled` class (`site.js:12-16`). That fades in a bottom border and a soft shadow over 0.3s (`site.css:29-30`).
- **Active tab:** the current page's link has `class="active"` (`index.html:106`, `about.html:80`, `contact.html:67`). A 2px gold underline grows from left to right (`right: 100%` → `right: 0`) over 0.3s on hover and on the active tab (`site.css:37-41`).
- **Mobile menu:** below 860px the tabs become a full-height panel under the header that slides in from the right (`translateX(100%)` → `none`, 0.3s) when the menu button is pressed. The header button is hidden (`site.css:44-53`). Clicking a link closes the menu (`site.js:3-9`).

### Page skeletons, in order
- **Home** (`index.html`):
  1. Hero (`118-138`): eyebrow with a gold dot, large headline, lead paragraph, two buttons (Sign Up + a ghost button), three stat figures (`128-132`), and the logo visual on the right (`134-136`).
  2. Sections, each with eyebrow + heading + paragraph (`140-146`).
  3. Five numbered cards, 01–05 (`147-152`).
  4. A numbered schedule list (`157-187`).
  5. Testimonials carousel (`189-215`).
  6. "Meet the Founder" teaser with a "Read the Full Story" button to About (`217-226`).
  7. Closing call-to-action band (`228-238`).
  8. Footer.
- **About** (`about.html`):
  1. Founder header (`90-100`): logo, "About the Founder" eyebrow, name as the main heading, a role line, and a bio.
  2. "The Story" (`102-115`).
  3. "Our Team" cards (`117-136`).
  4. "Stay Connected" social boxes (`138-177`).
  5. "What Drives This Work" values cards (`179-191`).
  6. Closing call-to-action band (`193-200`).
- **Contact** (`contact.html`):
  1. Page header: eyebrow + heading + paragraph on a dark band (`76-82`).
  2. Sign-up form at `#waitlist`, beside a short explanation (`84-102`).
  3. Contact details beside a message form (`104-124`).
  4. FAQ accordion (`126-155`).
- **Inner-page header pattern:** dark band, eyebrow + h1 + one paragraph, revealed as a group (`contact.html:76-82`).

### Footer (`index.html:240-253`)
- **Top row:** brand (icon + name) on the left. Columns on the right: **Site** (Home, Modules, About, Contact), **Get Involved** (Sign Up, Contact Us), **Contact** (email), **Social Media** (Instagram, Facebook).
- **Bottom bar:** a thin top border, then the tagline line ("Empowering Tomorrow Together.") (`site.css:117-118`).

### Scroll-to-explore button (`site.js:218-249`, `site.css:120-135`)
- **Text:** "Scroll to explore" (`site.js:225`). Spoken name: "Scroll to see more" (`site.js:224`).
- **Icon:** a 9×9px chevron made from two 2px gold borders, rotated 45° (`site.css:129-131`).
- **Position and size:** fixed, centered, 26px from the bottom (18px at 600px wide or less). Pill shape, padding 11×20px (9×16px small), 11px bold uppercase text with 0.2em spacing (10px and 0.16em small) (`site.css:121-127, 135`).
- **Idle animation:** the chevron bobs from −2px to +2px and its opacity goes from 0.5 to 1, over a 1.7s loop with the T&T ease (`site.css:131-132`).
- **Click:**
  - It scrolls to the first `section` or `footer` whose top, minus the 84px header, plus 4px, is more than 40px below the current position. If there is none, it scrolls to the page end.
  - It uses smooth scrolling (`site.js:229-239`).
- **Hides when:**
  - The footer's top rises above 92% of the screen height, or the page is within 4px of its end (`site.js:241-245`).
  - Hiding fades it out and slides it down 16px over 0.45s (`site.css:127, 133`).
- **On every page:** `site.js` adds it to any page that has a footer (`site.js:219-226`).
- **Reduced motion:** the chevron stops bobbing (`site.css:134`).

### Text transitions (scroll-linked reveal) (`site.js:19-53`, `site.css:158-169`)
- **Which elements:**
  - `[data-reveal]` blocks animate as one piece.
  - The direct children of `[data-reveal-group]` each animate in turn.
  - Used on hero text, section heads, card grids, the founder teaser, and call-to-action bands.
- **Not tied to a timer.** On each scroll frame (`requestAnimationFrame`), each element's progress is how far its top has moved from **94%** of the screen height to **50%** of it, with sibling *i* shifted by *i* × **34px** (`site.js:40-41`).
- **What changes:** progress goes through a cubic ease-out (`1 − (1 − t)³`, `site.js:31`). Then:
  - opacity runs 0 → 1
  - position runs `translateY(54px)` → 0 (`site.js:33, 46`)
  - scale runs 0.972 → 1 (`site.js:46`)
- **Smoothing:** a 0.13s linear CSS transition smooths the steps between frames (`site.css:163`).
- **Repeats:** yes, in both directions. Scrolling back down past an element hides it again (`site.js:19-21`).
- **No-JavaScript safety:** the hidden starting state only applies under `.has-reveal`, which an inline script adds (`index.html:12`, `site.css:159`). With JavaScript off, everything shows.
- **Reduced motion:** the script does nothing, and the CSS forces `opacity: 1; transform: none` (`site.js:28-29`, `site.css:166-168`).
- **Unused attribute:** the HTML puts numbers on some groups, such as `data-reveal-group="120"`, but `site.js` ignores them. The stagger is always 34px.

### Motion table

| Element | Effect | Duration | Easing | Delay / stagger | Trigger | Repeats | T&T source |
|---|---|---|---|---|---|---|---|
| Text, cards (`data-reveal`, group children) | opacity 0→1, rise 54px→0, scale 0.972→1 | No timer: tied to scroll; 130ms linear smoothing | cubic ease-out `1-(1-t)^3` | 34px of scroll per sibling | top moves from 94% to 50% of screen height (rAF on scroll/resize) | Yes, both directions | site.js:31-46; site.css:159-164 |
| Scroll cue chevron | translateY −2px↔+2px, opacity 0.5↔1 | 1.7s loop | `cubic-bezier(.16,.84,.44,1)` | — | always | Infinite | site.css:129-132 |
| Scroll cue show/hide | opacity 1↔0, translateY 0↔16px | 0.45s | same | — | footer top < 92% of screen height, or page end (within 4px) | Yes | site.js:241-245; site.css:127, 133 |
| Scroll cue hover | lift 2px | 0.45s | same | — | hover | — | site.css:127-128 |
| Scroll cue click | smooth scroll to next section/footer | browser smooth scroll | browser | — | click; next stop > 40px below; lands header − 4px | — | site.js:228-238 |
| Header elevation | border and shadow fade in | 0.3s | same | — | scrollY > 8 | Yes | site.js:12-16; site.css:28-30 |
| Tab underline | gold 2px line grows left→right (ours: `scaleX` from the left edge; T&T animates `right`) | 0.3s | same | — | hover, or current page | — | site.css:37-41 |
| Mobile menu | slides in from the right (translateX 100%→0) | 0.3s | same | — | menu button | — | site.css:44-48 |
| Buttons | lift 2px, shadow grows | 0.25s | same | — | hover | — | site.css:56-64 |
| Cards (some) | lift 5px, shadow grows | 0.32s | same | — | hover | — | site.css:84-87 |
| Reduced motion | reveal off (shown in place), chevron still | — | — | — | `prefers-reduced-motion: reduce` | — | site.js:22-29; site.css:134, 166-168 |

---

## 2. FairAssess NJ version

### Tabs (header)
1. Home `/`
2. Town Rankings `/towns` (tool 1; also active on `/towns/[slug]`)
3. Appeal Checker `/check` (tool 2)
4. **Learn ▾:** How It Works `/methodology`, Appeal Guide `/appeal-guide`
5. About `/about`

- **Learn dropdown:** chosen by Zaden so the header fits at 1280px.
- **Contact:** not a tab, by Zaden's choice. It is in the footer link row.
- **Header button:** "Check My Assessment" → `/check`, in T&T's "Sign Up" spot.
- **Second call to action:** "Get Updates" at `/contact#updates` (the Contact page), the way T&T uses Sign Up → `contact.html#waitlist`.
- **Mobile menu:** appears below **1280px** (T&T: 860px), because we have more tabs.

### Footer (reworked 2026-10-14 to be less crowded; Zaden removed "Get Involved")
- **Band 1:** brand and the disclaimer on the left (5 of 12 columns). Link columns on the right: **Site** (all pages), **Tools** (Town Rankings, Appeal Checker, Download the data → GitHub `data/processed/`), and **Project** (Methodology, Privacy, About, Contact, GitHub). Contact sits with these, not in the header (Zaden's choice).
- **Band 2:** after a hairline, three short lines: "Data as of" (read from `site/public/data/meta.json`; until the pipeline writes it, it says results are coming soon), the source line, and the "not affiliated" line. Side by side on laptops and desktops; stacked on phones and iPads.
- **Band 3:** after a hairline, "Built by Zaden Pothacamury, Ramapo High School." and the tagline **"Public Assessment Equity."** in navy with a gold dot, in T&T's tagline spot.
- **Colors (changed 2026-10-15, Zaden: "less like T&T"):** same layout, Fair Assess NJ colors. Light blue tint background (blue-100, like the logo's background) instead of T&T's dark navy; navy text; the full-color logo icon; column headings in navy with a small blue/green bar; a thick blue/green balance line with the gold pivot dot across the top, and a thin one between bands 1 and 2.
- **Phones:** link columns sit two across (Site | Tools, then Project). **iPads:** three across.
- **Get Updates** and **Report a data problem** now live only on the Contact page.

### Page skeletons

| Page | Skeleton | Built in |
|---|---|---|
| Home | Hero (eyebrow, headline at `text-5xl`, one sentence, buttons **Check my assessment** + **See town rankings**, NJ watermark, logo visual on the right) → four StatCards from `meta.json` and `county.json` → the page's one balance divider → "How It Works" 01–03 as a numbered list (no boxes) → "Why it matters" (made-up two-home example, labeled) → rankings preview (first 5 towns by PRB, with real labels and caveats) → "Meet the Founder" teaser + "Read the Full Story" + "Get updates" link → closing band "Is your assessment fair? Find out in two minutes." + Check My Assessment → disclaimer. This order dropped the "Two free tools" cards (the hero buttons and CTA band cover both tools). **No testimonials** (never invent quotes). The hero is not wrapped in `Reveal`; rankings preview and founder teaser are 12-column splits. | Built 2026-10-15, restyled 2026-10-18 |
| Town Rankings | `PageHeader` → intro split (how the tests work, left; label counts as figures, right) → forest plot → rankings: table from 1024px; below 1024px compact cards with "More numbers", first 12 towns then "Show all" (a search or filter shows every match) → towns without enough sales (two across on phones) → "Check our numbers" → `CtaBand` → disclaimer | 2026-10-18 |
| Town page | `PageHeader` with `back` link and `meta` row (label pill, rank, sales) → short band (what the label means + notes) → 01 Key numbers (4 StatCards) → 02 Charts → 03 Chapter 123 (figure row, sentence, deadline + fee, checker button) → 04 Checking our work (figure panel + text) → 05 Context (one panel of 3 figures) → 06 Data notes → `CtaBand` → disclaimer | 2026-10-18 |
| Appeal Checker | `PageHeader` ("Is your assessment fair?") → white band: 12-column split, form (Steps 1–3, 7 columns) and aside (privacy panel with lock icon; "What the checker does" with Term pop-ups, 5 columns; on phones the privacy panel comes first) → mist band: the result, which appears at once (never revealed or faded in): verdict card → balance meter → key numbers → warnings → Show the math → comps table → What to do next → Print / Check another home → disclaimer → `CtaBand` to /towns. Print shows only the result. | 2026-10-18 |
| How It Works | `PageHeader` (with methodology version in `meta`) → short band: 01 The question (split with an "On this page" list) → numbered report sections 02–09, white | mist: data sources table, cleaning funnel (ChartFrame + table), measure cards with KaTeX formulas + IAAO range table + label rules, Chapter 123 with a labeled made-up example, checker steps 01–06 + price index chart, validation (headline, figure row, "What I changed", full table in a `<details>`), limitations, versions + CSV + GitHub + disclaimer → `CtaBand` to /check | 2026-10-18 |
| Appeal Guide | `PageHeader` ("Sources last checked" in `meta`) → short band: figure row (deadline, revaluation deadline, fee) + "You file your own appeal" callout + step links → 7 numbered steps, each a 12-column split (big number + h2 left, text right), white | mist; every fact followed by its source link; missing facts say "Check with the Bergen County Board of Taxation" → disclaimer + source list → `CtaBand` to /check. Facts only from `data/raw/notes/appeal-info.md`. | 2026-10-18 |
| About | Founder header (logo, "About the Founder", "Zaden Pothacamury", "Founder, Fair Assess NJ", bio) → "The Story" ("Why Fair Assess NJ exists", 3 paragraphs in Zaden's words) → "Four promises to every homeowner" (no eyebrow; Accuracy with the real validation number from `validation.json`, Transparency, Privacy, Free & accessible) → "What's next" (Version 2.0, 6 items) beside a Credits panel (data, measures, GitHub, email, Get Updates) → band "Want to get in touch?" → `/contact`. No team section (no other names given). | Built 2026-10-15; roadmap and credits 2026-10-18 |
| Contact | `PageHeader` → Get Updates form at `#updates` (the Supabase waitlist form) beside: email, Report a data problem, press/partnerships | Now |
| Privacy | `PageHeader` ("Last updated" in `meta`) → one narrow column of 5 items with icons (the checker, the updates list, analytics and cookies, no ads, reporting a problem) → `CtaBand` to /contact | 2026-10-18 |
| 404 | `PageHeader` → buttons Home and Check My Assessment (no second divider) | Now, restyled 2026-10-18 |

### Inner-page colors (changed 2026-10-15, Zaden: "different than T&T", not too green or yellow)
- **Page header:** the logo's light blue tint (blue-100) instead of T&T's dark navy band, with a faint NJ outline, a blue-600 eyebrow with a gold dot, a navy-900 heading, and the logo's blue | green balance line with a gold pivot along the bottom. The About page's founder header uses the same look.
- **Closing band (`CtaBand`):** inner pages use a white panel with the blue | green stripe on top and a blue button (`tone="light"`, the default). The home page keeps the navy band (`tone="navy"`), which Zaden asked to keep.
- **Browser tab:** every page's title is exactly "Fair Assess NJ" (`SITE_NAME`), with the logo favicon.
- **Scroll to explore:** a white frosted pill with a blue-600 outline, navy text, and a blue chevron, on every page. T&T's sizes and motion are unchanged.

### Motion: same values, our colors
- **Where the numbers live:** `site/lib/motion.ts` holds every number above, each with its T&T line. The root layout passes them to the CSS as variables, so `app/globals.css` uses the same values.
- **Components:**
  - `Reveal` marks blocks (`<Reveal>`) or groups (`<Reveal group>`).
  - `RevealController` (one per page, in the layout) animates them the same way `site.js` does.
  - `ScrollCue` is on every page, like T&T.
  - `Header` does the scroll elevation, the underline, and the mobile slide.
- **Differences from T&T, on purpose:**
  1. **Landing offset:** the scroll cue lands at **our** header's height minus 4px. It measures the header, which is 72px. T&T hard-codes its own 84px header.
  2. **Spoken name:** the button's name is "Scroll to explore: go to the next section". T&T's "Scroll to see more" breaks WCAG 2.5.3 (the name must contain the visible words).
  3. **Focus:** clicking the cue also moves keyboard focus to the section it scrolls to.
  4. **Card hover lift:** not used yet. Button hover keeps the design-system look.
  5. **Reduced motion:** smooth scrolling also turns off (the cue jumps instantly).
  6. **Home hero is not revealed**. It is the first screen, so it shows at full strength on load. Wrapped in `Reveal`, its buttons loaded part-transparent on phones and failed Lighthouse's contrast check. Every other `Reveal` keeps T&T's exact timing.
  7. **Scroll cue label never wraps** (`white-space: nowrap`). On phones `left: 50%` capped its width and the label broke onto two lines. Sizes and motion unchanged.
  8. **Micro-interactions**: press, hover, focus, pop-ups, menus, and chevrons have their own short motion (120–160ms). Table in `docs/design-system.md` section 4. They never touch the T&T values.
- **Accessibility:**
  - Content is always in the HTML, so search engines and no-JavaScript visitors see everything.
  - The scroll cue is a real button. It is hidden from screen readers and removed from the Tab order while it is invisible.
  - **Never wrap a checker result in `Reveal`.** Results must appear at once.
- **Replaces:** this spec replaces the earlier "under 200ms" note.

### Side by side

| T&T | FairAssess NJ |
|---|---|
| Tabs: Home, Modules, About, Contact | Tabs: Home, Town Rankings, Appeal Checker, Learn (How It Works, Appeal Guide), About |
| Header button: Sign Up → contact.html#waitlist | Header button: Check My Assessment → /check |
| Second CTA: Sign Up | Second CTA: Get Updates → /contact#updates |
| Home: hero + 3 stats + logo visual | Home: hero + 3 real stats from county.json + logo visual |
| 01–05 numbered cards | "How It Works" 01–03 cards |
| Schedule list | "Two free tools" cards + rankings preview |
| Testimonials | Left out (no testimonials; never invent quotes) |
| Meet the Founder teaser | Meet the Founder teaser |
| Closing CTA band | "Is your assessment fair? Find out in two minutes." |
| About: founder header, The Story, Our Team, Stay Connected, values, CTA | About: founder header, The Story, (team only if given), What Drives This Work (4 values), CTA |
| Contact: page header, sign-up #waitlist, details + message form, FAQ | Contact: page header, Get Updates #updates, email, report a data problem, press line |
| Footer: Site, Get Involved, Contact, Social Media; tagline bar | Footer: Site, Tools, Project (incl. Contact); disclaimer + trust lines; tagline bar |

---

## 3. Design quality checklist (run before launch)

Goal: automatic credibility, like a state agency report crossed with a well-run research institute.

**Layout**
- [ ] One consistent grid: `max-w-content` (1120px), 12 columns where a layout needs columns.
- [ ] Editorial layouts: text on one side, data or the visual on the other. Not everything centered.
- [ ] Same section padding everywhere (`py-20 sm:py-24`), same spacing scale, corner radii, and button styles on every page.
- [ ] Works at every screen size: phone (390px), iPad (768px and 1024px), laptop (1280px), desktop (1440px). Multi-column layouts stack until there is room. `e2e/layout.spec.ts` fails on any sideways scrolling.

**Visuals**
- [ ] Real data and the logo are the only visuals. No stock photos, decorative blobs, gradient meshes, glassmorphism, or emoji.
- [ ] No icon-in-a-colored-circle on every card.
- [ ] No shadow on anything at rest. Cards are outline only; side notes are tone panels; only pop-ups and menus float (`shadow-raised`).
- [ ] No colored side stripe on callouts, list items, or menu items (a stock template look). Use a tinted surface + icon + bold title.
- [ ] At most one `BalanceDivider` per page. Separate sections by white | mist tone steps.
- [ ] Never a card inside a card. Never three identical boxed cards as a section's whole layout: use a numbered list, a 12-column split, or a figure row.
- [ ] Mostly white, mist, and navy. Blue, green, and gold carry meaning (assessed vs. market, fair vs. caution, the balance point), never decoration.

**Type**
- [ ] Precise hierarchy from the type scale only; one h1 per page.
- [ ] Thin hairline rules (outline-200) inside panels and tables; report-style section numbers (01, 02, 03) on report pages (town pages) and real sequences (How it works), not on every eyebrow.
- [ ] Tabular numbers on every statistic and dollar amount.

**Trust signals, in the same place on every page**
- [ ] "Data as of" date (footer; from `meta.json`, never typed by hand).
- [ ] "Source: NJ Division of Taxation" under every chart and stat.
- [ ] "Checked against state ratios" note with the real validation number (from the pipeline's validation output).
- [ ] Methodology version.
- [ ] Open-source link (GitHub).
- [ ] The disclaimer, word for word (disclaimer rule).

**Copy**
- [ ] Specific, calm, real numbers. Eighth-grade reading level.
- [ ] No hype words: "revolutionary", "unlock", "game-changing", "seamless", "cutting-edge".
- [ ] Never "you will win". Deadline and fee wherever appeals come up.
- [ ] No leftover template text (no "Lorem", "Coming soon" on a launched page, default Next.js text, or placeholder links).

**Motion**
- [ ] Only the T&T motion in `lib/motion.ts` for page motion. Micro-interactions follow the table in `docs/design-system.md` section 4 (120–160ms, transform/opacity/color only, `--ease-out`, reduced-motion fallback). No other animations.
- [ ] Things opened often (disclosures, sort, filters) open instantly.

**Worst-case data**
- [ ] Long names wrap; numbers never wrap or truncate. Counts use `formatCount()`. Long stat values step down a size.
- [ ] Test new tables and cards with: "Lower Alloways Creek Township", 1,284 sales, PRB −0.4445 (−0.9821 to +0.2607), $16,500,000, an empty list, and a list of one.
- [ ] Reduced motion turns movement off; content still shows.
- [ ] Nothing a homeowner needs (checker results, deadlines) waits on an animation.
