# Video script (2:30 to 3:00)

Prompt 17, 2026-10-23. A first-person script for Zaden's App Challenge demo video, with a shot list. Every number comes from the live site or from `docs/facts-sheet.md`. The demo home is **made up**: you type only a town and an assessed value, never a real address.

> FairAssess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation.

Say it slowly. About 150 words a minute is a calm pace. The words below are about 430 words, so 2:50 with pauses. If you run long, cut the lines marked *(optional)*.

---

## Part 1: The problem (0:00 to 0:30)

| Time | Shot | What to click | What to say |
|---|---|---|---|
| 0:00 | You on camera, or the home page (`/`) | Nothing | "Hi, I'm Zaden Pothacamury from Ramapo High School. In New Jersey, your property tax bill depends on your home's assessed value: the number your town sets for your home. If that number is too high compared with what your home is worth, you pay more than your fair share." |
| 0:12 | `/towns/new-milford`, scrolled to **"Cheaper homes compared with pricier homes"** | Scroll down slowly to the bar chart | "Here's a real example from my site. In New Milford, homes in the cheapest quarter, worth about $500,000 to $620,000, were assessed at about 97% of their sale price. Homes in the most expensive quarter were assessed at about 81%. So owners of cheaper homes were taxed on a bigger share of what their home is worth." |
| 0:26 | Same page | Pause on the chart | "I built Fair Assess NJ so any Bergen County homeowner can check this for free." |

## Part 2: Live demo (0:30 to 1:45)

| Time | Shot | What to click | What to say |
|---|---|---|---|
| 0:30 | Home page (`/`) top | Move the mouse over the two buttons | "This is the home page. There are two tools: town rankings and an appeal checker." |
| 0:36 | Home page | Click **See town rankings** | "First, the rankings." |
| 0:39 | `/towns`, scroll to the forest plot | Scroll to the dot chart | "I studied 3,806 home sales from last year. For the 48 towns with enough sales, I used the standard tests from the International Association of Assessing Officers. Each dot is a town's PRB. That number shows how much the ratio changes each time a home's value doubles. Dots to the left mean cheaper homes were assessed at a higher share of their value." |
| 0:55 | `/towns` table | Point at the labels column | "28 towns are within the standards. 2 show a regressive pattern. Towns with too few sales say 'not enough sales' instead of guessing." |
| 1:02 | Click **New Milford** in the table → town page | Scroll past the key numbers to **"03 · Appeals"** | "Each town gets its own page with its numbers, their ranges, and New Jersey's Chapter 123 range for 2027 appeals." |
| 1:10 | Header | Click **Appeal Checker** | "Now the appeal checker." |
| 1:13 | `/check` | Type "Teaneck", choose it; type **450000** in assessed value; click **Check** | "I'll try a made-up home in Teaneck assessed at $450,000. You type only your town and your assessed value from your tax bill. Nothing you type leaves your browser." |
| 1:22 | Result: verdict card | Pause | "It compares my home to recent sales of homes with similar assessed values in Teaneck. It estimates a market value of about $601,000, and says my assessment is within the normal range." |
| 1:30 | Scroll to **"Where your ratio sits"** (the balance meter) | Point at the green zone and the navy bar | "This is the balance meter. Green is the range the state allows. Gold, above it, means you may have grounds to appeal. My home sits just inside the green." |
| 1:37 | Click **Show the math** | Scroll through the steps | "Show the math lists every step, with the real numbers." |
| 1:41 | Scroll to **What to do next** | Point at the deadline and fee | "And it explains how and when to file: by April 1, 2027 for most towns, with a $25 fee for this home." |

*(Optional, adds about 10 seconds; say it at 1:37, before Show the math.)* Go back up, type **430000** in "Your own estimate," and check again: "If you have your own evidence, like an appraisal, you can enter it. Then the checker tests that too, and warns you when the two estimates are far apart."

## Part 3: How I built and checked it (1:45 to 2:30)

| Time | Shot | What to click | What to say |
|---|---|---|---|
| 1:45 | `/methodology`, **"From raw sales to clean data"** | Scroll down the funnel | "The data is the state's public sales file. I started with 14,012 Bergen sales. My Python program removes condos, non-usable sales, multi-lot sales, and extreme outliers. It logs how many each rule removes, and 3,806 sales are left." |
| 1:58 | `/methodology`, **"07 · Validation: How we checked our work"** | Scroll to the validation numbers | "Then I checked my numbers against the state. My sale counts matched in all 70 towns. At first my ratios didn't match, until I found a Tax Court opinion explaining the state's method. When I rebuilt it, all 70 towns matched within 5 points." |
| 2:12 | VS Code: `site/lib/checker/` and `pipeline/checker_reference.py` side by side | Nothing | "I wrote the checker twice, once in TypeScript and once in Python, and tests make them agree on 58 cases. Another test proves the checker never sends what you type anywhere." |
| 2:22 | PowerShell running `scripts\check-all.ps1` | Show the PASS summary at the end | "One script runs all of it: Python tests, site tests, the build, and 157 browser tests. Everything passes." |

## Part 4: What I learned and what's next (2:30 to 3:00)

| Time | Shot | What to click | What to say |
|---|---|---|---|
| 2:30 | You on camera, or the home page | Nothing | "The biggest thing I learned: real data is messy. The state's own file guide didn't match its data, and I almost threw out 881 good sales. Testing every step is what caught it." |
| 2:40 | `/about`, the roadmap ("2.0") | Scroll to the roadmap | "Next, in version 2.0, I want to cover all of New Jersey, let people look up their home by address, and add a Spanish version." |
| 2:50 | Home page, logo | Nothing | "Fair Assess NJ: check your property tax fairness. Thanks for watching." |

Before you record, check that the 2.0 items you say match the roadmap on your About page and in the README.

---

## Recording tips (Windows)

**Set up the screen**
1. Close every other browser tab and app. Turn on **Do not disturb** (Win + N, then the bell) so no pop-ups appear.
2. Set the display to **1920 x 1080** (Settings → System → Display → Display resolution).
3. Open the live site in Chrome, full screen with the window maximized, and zoom to **125%** (Ctrl and + until it says 125%).
4. Open each page once before recording so it loads instantly.

**Record**
- **Xbox Game Bar (built in):** press **Win + Alt + R** to start and stop. Videos save to `Videos\Captures`. It records one app window at a time, so for the VS Code and PowerShell shots, record a separate clip.
- **OBS Studio (free, more control):** Settings → Video → Base and Output resolution **1920x1080**, 30 FPS. Add a "Display Capture" source. Use a headset mic if you have one.
- Record each part as its own clip. It's easier to redo one part than the whole video.

**Upload to YouTube**
1. Upload, then set visibility to **Public**. The App Challenge needs a public link, not Unlisted or Private.
2. Turn on captions: in YouTube Studio → **Subtitles**, check the automatic captions and fix any words they got wrong (like "Pothacamury," "PRB," "Chapter 123"). Or upload this script's words as a transcript.
3. Title idea: "Fair Assess NJ: Property Tax Fairness for Bergen County (2026 Congressional App Challenge)".
4. Watch it once all the way through on your phone before you submit the link.
