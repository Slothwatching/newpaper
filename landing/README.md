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

## Preview locally

From the repository root:

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory landing
```

Open http://127.0.0.1:8080. Article navigation uses URL fragments, so no server-side
route rewrites are needed. On an HTTP IP address, clipboard access may be blocked;
the copy button selects the text for manual copying in that case.

## Publish

Serve only these three files from a dedicated static document root:

- `index.html`
- `style.css`
- `app.js`

Do not expose the repository root, private logs, deployment credentials, or Git
metadata. Keep each release in its own directory and switch the web server's
current-directory symlink after verification, retaining the previous release for
rollback. Inspect existing listeners and configuration before choosing a port.
Keep the demo label until the content and access instructions are finalized.

The landing workflow checks JavaScript syntax and deployment receiver tests on
PRs. After required repository CI allows a PR to merge, pushes to `main`
automatically deploy the tested commit. Manual workflow dispatch is also supported
on `main`; other branches cannot deploy. Superseded commits are skipped and
production jobs are serialized.

The `landing-preview` GitHub environment permits only `main` and stores the
`LANDING_HOST` variable plus `LANDING_DEPLOY_KEY` and `LANDING_KNOWN_HOSTS` secrets.
The dedicated `newpaper-deploy` SSH user has no sudo privileges. Its authorized
key uses `restrict,command="/usr/bin/python3 -I /usr/local/lib/newpaper-deploy.py"`;
it can only send a bounded archive of the three static files. The receiver is
installed by an administrator from `deploy-receiver.py` and is root-owned.
Changes to the receiver require administrator installation before deployment;
the workflow cannot update executable server code or Nginx configuration.

The receiver publishes a versioned directory, atomically switches `current`, and
checks the local HTTP response for all three files. It restores the previous
symlink on failure. Actions also compares the public HTTP files to the source.
Up to five full-SHA releases are retained, preserving current and previous targets;
failed new releases are removed after rollback. The initial manual release is
left intact. To roll back content, revert the relevant
PR through another PR; the reverted content deploys after merge. Deployment keys
and host identity records belong in the environment secrets, never in Git.

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
