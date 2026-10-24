# newpaper landing preview

A standalone Chinese-language content preview: a homepage, four short learning
articles, prompt exercises, and attributed educational resources. The external
service entry opens https://slothcode.dev (currently branded Sloth Code).

This directory is independent of the New API application in `web/`. It needs no
backend, database, package installation, or build step. It publishes the approved
static demo rather than importing React components, routing, or application
locales. The existing New API / QuantumNous application and attribution remain
unchanged. A future integrated application should use the shared UI and i18n
conventions instead of extending this preview into a second console.

## Legacy demo: preview locally

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory landing
```

Open http://127.0.0.1:8080. Article navigation uses URL fragments, so no server-side
route rewrites are needed. On an HTTP IP address, clipboard access may be blocked;
the copy button selects the text for manual copying in that case.

## Legacy demo: manual publishing

Serve only these three files from a dedicated static document root:

- `index.html`
- `style.css`
- `app.js`

Do not expose the repository root, private logs, deployment credentials, or Git
metadata. Keep each release in its own directory and switch the web server's
current-directory symlink after verification, retaining the previous release for
rollback. Inspect existing listeners and configuration before choosing a port.
Keep the demo label until the content and access instructions are finalized.

The live site now uses the integrated React frontend in `web/src/features/newpaper/`.
The original three-file demo and its receiver remain here for reference and
rollback. Learning articles and prompts are editorial Chinese content; interface
labels support all seven application languages. Newpaper links to Sloth Code for
tool access and configuration.

The landing workflow builds `web/dist` with Bun and tests both receivers. After
required PR checks pass and changes merge into `main`, it publishes the built
frontend through the main-only `landing-preview` environment. That environment
stores `LANDING_HOST`, `LANDING_DEPLOY_KEY` and `LANDING_KNOWN_HOSTS`; the dedicated
SSH user has no sudo and cannot run uploaded code. Its root-owned authorized key
forces `/usr/bin/python3 -I /usr/local/lib/newpaper-web-deploy.py`, installed by an
administrator from `web-deploy-receiver.py`.

Only bounded static files are accepted (100 MiB archive, 2,000 files, 10 MiB per
file). The receiver verifies index and its direct script/style assets through
localhost port 3180, switches releases atomically, rolls back on failure, and
retains up to three full-SHA releases while preserving current/previous targets.
Actions separately compares the public homepage. Revert content through a PR to
roll it back. Deployment is serialized and superseded commits are skipped.

The existing New API backend runs as a separate unprivileged service. Public HTTP
serves only the learning routes, static assets and read-only status/notice/setup
checks; management, authentication and relay endpoints are not published. The
backend is initialized internally and is limited to loopback traffic. Its data,
secrets and logs stay outside the document root. Backend binaries, receiver code,
Nginx and service configuration require administrator deployment; this workflow
updates only the frontend. Upstream attribution remains visible.

## Content provenance

Original exercises are illustrative prompts, not measured model responses.
External resources are linked with short original introductions, not republished.
Sources reviewed on 2026-10-23:

- [Li Hong-yi's official course](https://speech.ee.ntu.edu.tw/~hylee/genai/2024-spring.php): course directory and lecture 3 video link verified; video not fully watched.
- [OpenAI Academy student prompt pack](https://academy.openai.com/en/public/clubs/higher-education-05x4z/resources/prompt-pack-for-students): article read; ChatGPT Edu product capabilities are not attributed to Sub9api.
- [CUHK-Shenzhen Library citation guide](https://library.cuhk.edu.cn/zh-hans/citation-guides): citation and generative AI record guidance reviewed.
- [UBC Library information evaluation](https://guides.library.ubc.ca/EvaluatingSources/GenerativeAI): citation existence and source verification guidance reviewed.
- [Datawhale LLM Cookbook](https://github.com/datawhalechina/llm-cookbook): README and prerequisites reviewed; presented as advanced community reading.

The public Sloth Code homepage and its login, registration, and configuration
links were inspected. Account creation, payment, API keys, and real model calls
were not tested. Institutions and authors listed here do not endorse this site.

- [OpenAI official videos](https://developers.openai.com/learn/videos): Codex demonstrations directory checked on 2026-10-24; not presented as a paper-writing course.
