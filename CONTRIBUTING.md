# Contributing to FairAssess NJ

Thank you for helping. FairAssess NJ is a student research project, so the most helpful thing you can do is tell us when something looks wrong.

**This repo is public. Please never post your name, your home address, or your assessed value in an issue.**

## Report a bug

Something on the website is broken, hard to use, or looks wrong on your device.

1. Open a [new issue](https://github.com/zmpothacamury-png/fairassess-nj/issues/new/choose) and pick **Bug report**.
2. Say which page, what you did, what you expected, and what happened.
3. Add your browser and device, and a screenshot if you can.

## Report a data problem

A number for a town looks wrong, or a deadline, fee, or link is out of date.

1. Open a [new issue](https://github.com/zmpothacamury-png/fairassess-nj/issues/new/choose) and pick **Report a data problem**.
2. Say which town and page, what looks wrong, and where you saw the right value. A link to a public source (for example, the [NJ Division of Taxation](https://www.nj.gov/treasury/taxation/lpt/statdata.shtml) or the [Bergen County Board of Taxation](https://bergencountynj.gov/boards-commissions/about-board-of-taxation/)) helps a lot.

Every analysis rule is in [docs/methodology.md](docs/methodology.md). If you think a rule is wrong, say which rule (for example, "C8" or "K2") and why.

## Run the tests

The steps below are for Windows PowerShell. Setup (Python, Node.js, and the raw data download) is in the [README](README.md#run-it-yourself).

Run every check at once (Python tests, site unit tests, lint, data check, build, browser tests):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-all.ps1
```

Or run them one at a time:

```powershell
.\.venv\Scripts\python.exe -m pytest pipeline/tests   # Python tests
cd site
npm test                  # site unit tests (Vitest)
npm run lint              # lint
npm run validate-data     # data files match docs/data-contract.md
npm run build             # production build
npx playwright test       # browser tests (needs the build first)
```

Python tests that need the raw data skip themselves if `data\raw\` is empty. The same checks run on GitHub for every push and pull request.

## Pull requests

Pull requests are welcome, but please open an issue first so we can talk about the change. A pull request should:

- pass `scripts\check-all.ps1`;
- add a test for every new calculation;
- follow `docs/methodology.md` (a change to a rule needs a change to that file first);
- never edit `site/public/data/` by hand (the pipeline writes those files).

By contributing, you agree that your code is shared under the [MIT License](LICENSE).
