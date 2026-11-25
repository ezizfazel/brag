# Universal Claude Code Skills Inventory

General-purpose development skills prepared for future projects. No application,
framework project, or engine was created or installed.

- **Prepared:** 2026-11-25 · Claude Code 2.1.332
- **Install scope:** project (`.claude/settings.json` + `.claude/skills/`), so a fresh
  clone or a new cloud session re-installs the same set automatically.
- **Sources used** (in priority order):
  1. Built-in Claude Code skills (ship with the CLI)
  2. `anthropic-plugin-directory`: the official Anthropic plugin directory (built in;
     mirrors [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)).
     Includes vendor-official plugins (Expo, Unity, Redis …)
  3. Vetted community marketplaces declared in `.claude/settings.json` → `extraKnownMarketplaces`
  4. Standalone skills via the [`skills` CLI](https://www.skills.sh) (tracked in `skills-lock.json`, which stays local)

Status legend: ✅ installed & verified · 🟡 installed, needs a manual step to be fully
functional · 📦 available, not installed (install when a project needs it) · ❌ no verified
skill exists (use the official docs instead)

Maintenance legend: **Official** = maintained by Anthropic or the technology vendor ·
**Active** = community repo with commits in the last 60 days

---

## 1. Built-in Claude Code skills (no install needed)

| Name | Category | Usage scenario |
|---|---|---|
| `claude-api` | AI / Claude API | Anthropic SDK, model IDs, tool use, caching, agents |
| `code-review` | Quality | Review a diff, branch or PR for bugs (`/code-review`) |
| `security-review` | Security | Security review of pending branch changes |
| `simplify` | Quality | Cleanup / reuse / efficiency pass on changed code |
| `run` | Testing | Launch and drive the app to verify a change |
| `init` | Claude Code | Generate a project `CLAUDE.md` |
| `update-config`, `fewer-permission-prompts` | Claude Code | settings.json, hooks, permissions |
| `dataviz` | Frontend / UI | Charts, dashboards, stat tiles |
| `anthropic-skills:skill-creator` | Claude Code | Create and evaluate new skills |
| `anthropic-skills:pdf/docx/xlsx/pptx` | Docs | Document file handling |

## 2. Installed plugins

Install command format: `claude plugin install <name>@<marketplace> -s project`

| Name | Category | Source | Installation command | Status | Maintenance | Dependencies | Usage scenario |
|---|---|---|---|---|---|---|---|
| `expo` | Mobile: Expo / React Native | anthropic-plugin-directory → [expo/skills](https://github.com/expo/skills) | `claude plugin install expo@anthropic-plugin-directory -s project` | 🟡 | Official (Expo) | Node.js. The bundled `expo` MCP server needs an Expo account login | 24 skills: Expo Router, native UI (SwiftUI/Compose components), animation, data fetching, dev client, EAS Build/Update/Workflows/Hosting, App Store/Play Store, SDK upgrades, brownfield |
| `building-react-native-apps` | Mobile: React Native | [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills) | `claude plugin install building-react-native-apps@callstack-agent-skills -s project` | ✅ | Active (Callstack, core RN contributors) | none | RN performance best practices, React Navigation, library creation, RN upgrades, TV |
| `testing-react-native-apps` | Testing: React Native | callstackincubator/agent-skills | `claude plugin install testing-react-native-apps@callstack-agent-skills -s project` | ✅ | Active | Device/simulator for `agent-device` | RN Testing Library, on-device QA (`agent-device`, `dogfood`), GitHub Actions for mobile CI |
| `ui-ux-pro-max` | UI/UX & design | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill -s project` | ✅ | Active (v2.15.0) | Python 3 (local search scripts, no network) | 7 skills: styles, palettes, font pairings, design systems, UI styling, brand, accessibility, for web and mobile stacks (React, Next.js, SwiftUI, Compose, Flutter, RN …) |
| `frontend-design` | UI/UX & frontend | anthropic-plugin-directory | `claude plugin install frontend-design@anthropic-plugin-directory -s project` | ✅ | Official (Anthropic) | none | Distinctive, production-grade web interfaces |
| `feature-dev` | Workflow / architecture | anthropic-plugin-directory | `… feature-dev@anthropic-plugin-directory …` | ✅ | Official | none | Guided feature work: code-explorer, code-architect, code-reviewer agents |
| `pr-review-toolkit` | Quality | anthropic-plugin-directory | `… pr-review-toolkit@anthropic-plugin-directory …` | ✅ | Official | none | 6 review agents: tests, silent failures, type design, comments, simplification |
| `commit-commands` | Git / GitHub | anthropic-plugin-directory | `… commit-commands@anthropic-plugin-directory …` | ✅ | Official | git | `/commit`, `/commit-push-pr`, `/clean_gone` |
| `security-guidance` | Security | anthropic-plugin-directory | `… security-guidance@anthropic-plugin-directory …` | ✅ | Official | none (hooks only) | Pattern warnings on edits plus LLM diff security review on Stop |
| `hookify` | Claude Code | anthropic-plugin-directory | `… hookify@anthropic-plugin-directory …` | ✅ | Official | Python 3 | Turn "never do X" rules into hooks |
| `plugin-dev` | Claude Code | anthropic-plugin-directory | `… plugin-dev@anthropic-plugin-directory …` | ✅ | Official | none | Build plugins, skills, agents, hooks, MCP integrations |
| `agent-sdk-dev` | AI agents | anthropic-plugin-directory | `… agent-sdk-dev@anthropic-plugin-directory …` | ✅ | Official | Node or Python when used | Scaffold and verify Claude Agent SDK apps (TS/Python) |
| `mcp-server-dev` | AI / tool calling | anthropic-plugin-directory | `… mcp-server-dev@anthropic-plugin-directory …` | ✅ | Official | none | Design and build MCP servers, MCP apps, `.mcpb` bundles |
| `claude-code-setup` | Claude Code | anthropic-plugin-directory | `… claude-code-setup@anthropic-plugin-directory …` | ✅ | Official | none | Recommend hooks/skills/MCP for a new codebase |
| `claude-md-management` | Claude Code | anthropic-plugin-directory | `… claude-md-management@anthropic-plugin-directory …` | ✅ | Official | none | Audit and maintain CLAUDE.md |
| `playwright` | Testing: E2E | anthropic-plugin-directory (Microsoft MCP) | `… playwright@anthropic-plugin-directory …` | ✅ | Official (Microsoft) | Node.js (`npx @playwright/mcp`) | Drive a browser, E2E checks, screenshots |
| `context7` | Docs lookup (all stacks) | anthropic-plugin-directory (Upstash) | `… context7@anthropic-plugin-directory …` | ✅ | Official (Upstash) | Network. Optional `CONTEXT7_API_KEY` (free tier works anonymously) | Version-specific docs for any library: Next.js, NestJS, FastAPI, Socket.IO, Flutter … |
| `typescript-lsp` | Frontend / backend code intelligence | anthropic-plugin-directory | `… typescript-lsp@anthropic-plugin-directory …` | ✅ | Official | `typescript-language-server` (installed by the SessionStart hook `.claude/hooks/session-start.sh`) | Go-to-definition, diagnostics for TS/JS |
| `pyright-lsp` | Python code intelligence | anthropic-plugin-directory | `… pyright-lsp@anthropic-plugin-directory …` | ✅ | Official | `pyright-langserver` (present) | Type checking for Python / FastAPI |
| `unity` | Game development | anthropic-plugin-directory → Unity-Technologies/unity-agent-plugin | `… unity@anthropic-plugin-directory …` | ✅ | Official (Unity) | Unity Editor only when building a real project (not installed) | 33 skills: 2D/3D, physics, audio, UI, live games, monetization, performance |
| `redis-development` | Database | anthropic-plugin-directory → redis/agent-skills | `… redis-development@anthropic-plugin-directory …` | ✅ | Official (Redis) | none | Redis data structures, caching, pub/sub, vector search, security |

## 3. Installed standalone skills (`.claude/skills/`)

| Name | Category | Source | Installation command | Status | Maintenance | Usage scenario |
|---|---|---|---|---|---|---|
| `vercel-react-best-practices` | Frontend: React / Next.js | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices -a claude-code -y` | ✅ | Official (Vercel) | React/Next.js performance, data fetching, bundle size |
| `vercel-composition-patterns` | Frontend: component architecture | vercel-labs/agent-skills | `… --skill vercel-composition-patterns …` | ✅ | Official (Vercel) | Compound components, scalable component APIs, React 19 |
| `web-design-guidelines` | UI audit / accessibility | vercel-labs/agent-skills | `… --skill web-design-guidelines …` | ✅ | Official (Vercel) | UI, UX and accessibility audit of web code |
| `webapp-testing` | Testing: E2E | [anthropics/skills](https://github.com/anthropics/skills) | `npx skills add anthropics/skills --skill webapp-testing -a claude-code -y` | ✅ | Official (Anthropic) | Playwright scripts to test local web apps |

## 4. Available, not installed (install when a project needs it)

Kept out on purpose: they are stack-specific, need accounts or credentials, or add context
cost with no use until a stack is chosen. All are in `anthropic-plugin-directory` unless noted.

| Name | Category | Install command | Why deferred |
|---|---|---|---|
| `unreal-engine-skills-for-claude-code` | Game: Unreal | `claude plugin install unreal-engine-skills-for-claude-code@anthropic-plugin-directory -s project` | Official (Epic). Drives a running Unreal Editor over MCP, so it is useless without the engine |
| `xcode` | Native iOS / SwiftUI | `claude plugin install xcode@anthropic-plugin-directory -s project` | Official (Apple). Needs macOS + Xcode (`xcrun`) |
| `swift-lsp` | iOS / Swift | `claude plugin install swift-lsp@anthropic-plugin-directory -s project` | Needs `sourcekit-lsp` (Swift toolchain) |
| `kotlin-lsp-anthropics` | Android / Kotlin | `claude plugin install kotlin-lsp-anthropics@anthropic-plugin-directory -s project` | Needs the `kotlin-lsp` binary from JetBrains |
| `superpowers` | Workflow: TDD, debugging, planning | `claude plugin install superpowers@anthropic-plugin-directory -s project` | Opinionated SessionStart workflow that overlaps `feature-dev`. Pick one |
| `mongodb` | Database | `claude plugin install mongodb@anthropic-plugin-directory -s project` | Official. MCP needs a connection string |
| `supabase` / `neon` / `prisma` | Postgres platforms | `… supabase@… / neon@… / prisma@…` | Vendor accounts |
| `firebase` | Backend / push (FCM) | `… firebase@anthropic-plugin-directory …` | Google account |
| `github` | GitHub MCP | `… github@anthropic-plugin-directory …` | Needs a GitHub token. Cloud sessions already have GitHub tools |
| `semgrep` | Security: SAST | `… semgrep@anthropic-plugin-directory …` | Semgrep account/CLI |
| `sentry` | Monitoring | `… sentry@anthropic-plugin-directory …` | Sentry account |
| `chrome-devtools-mcp` | Frontend performance | `… chrome-devtools-mcp@anthropic-plugin-directory …` | Overlaps Playwright. Add for perf traces |
| `pinecone` / `qdrant-skills` / `zilliz` | Vector DBs (RAG) | `… pinecone@… / qdrant-skills@…` | Pick one when a RAG project starts |
| `huggingface-skills` | AI: open models | `… huggingface-skills@anthropic-plugin-directory …` | Only for open-model work |
| `vercel` / `cloudflare` / `aws-core` / `azure` | Deployment / cloud | `… vercel@… / cloudflare@… / aws-core@…` | Pick per hosting choice |
| `figma` | Design handoff | `… figma@anthropic-plugin-directory …` | Figma account |
| `stripe` | E-commerce payments | `… stripe@anthropic-plugin-directory …` | Stripe account |
| `migrating-to-react-native` | Mobile migration | `claude plugin install migrating-to-react-native@callstack-agent-skills -s project` | Only for brownfield migrations |
| `vercel-react-native-skills` | React Native | `npx skills add vercel-labs/agent-skills --skill vercel-react-native-skills -a claude-code -y` | Duplicates Callstack RN skills |
| `deploy-to-vercel`, `vercel-optimize` | Deployment | `npx skills add vercel-labs/agent-skills --skill <name> -a claude-code -y` | Only if deploying to Vercel |

## 5. Missing capabilities: no verified skill, use official docs

For these, no official or reputable maintained Claude Code skill was found. Use the
`context7` MCP (installed) to pull current docs, or the links below.

| Capability | Official documentation |
|---|---|
| Flutter / Dart | https://docs.flutter.dev · https://dart.dev/guides |
| Native Android, Kotlin, Jetpack Compose | https://developer.android.com/develop · https://developer.android.com/compose · https://kotlinlang.org/docs |
| Native iOS, Swift, SwiftUI (without macOS) | https://developer.apple.com/documentation/swiftui · https://www.swift.org/documentation |
| Godot | https://docs.godotengine.org |
| Multiplayer game architecture | https://docs-multiplayer.unity3d.com · https://docs.godotengine.org/en/stable/tutorials/networking |
| WebSockets / Socket.IO | https://developer.mozilla.org/docs/Web/API/WebSockets_API · https://socket.io/docs/v4 |
| Voice / video (WebRTC) | https://webrtc.org/getting-started/overview · https://developer.mozilla.org/docs/Web/API/WebRTC_API |
| Push notifications | https://docs.expo.dev/push-notifications/overview · https://firebase.google.com/docs/cloud-messaging · https://developer.apple.com/documentation/usernotifications |
| End-to-end encryption concepts | https://signal.org/docs (Double Ratchet, X3DH) · https://www.rfc-editor.org/rfc/rfc9420 (MLS) |
| Next.js, Tailwind CSS, TypeScript | https://nextjs.org/docs · https://tailwindcss.com/docs · https://www.typescriptlang.org/docs |
| Node.js, Express, NestJS | https://nodejs.org/docs · https://expressjs.com · https://docs.nestjs.com |
| Python, FastAPI | https://docs.python.org/3 · https://fastapi.tiangolo.com |
| GraphQL | https://graphql.org/learn · (Apollo: `apollo-skills` plugin, available) |
| PostgreSQL, MySQL, SQLite | https://www.postgresql.org/docs · https://dev.mysql.com/doc · https://sqlite.org/docs.html |
| OpenAI API | https://platform.openai.com/docs |
| RAG / embeddings / evals (Claude) | https://docs.claude.com (also built-in `claude-api` skill) |
| OWASP (web, API, mobile) | https://owasp.org/www-project-top-ten · https://owasp.org/API-Security · https://mas.owasp.org |
| Dependency auditing | `npm audit`, `pip-audit` (https://pypi.org/project/pip-audit), https://docs.github.com/code-security/dependabot |
| Jest, API and performance testing | https://jestjs.io/docs · https://k6.io/docs |
| Docker, GitHub Actions, Linux | https://docs.docker.com · https://docs.github.com/actions · https://man7.org/linux/man-pages |
| Monitoring / logging | https://opentelemetry.io/docs · (`sentry` plugin, available) |

## 6. Duplicates and conflicts avoided

| Skipped | Reason |
|---|---|
| `code-review` plugin | Built-in `/code-review` already exists |
| `skill-creator` plugin | Built-in `anthropic-skills:skill-creator` already exists |
| `claude-api` skill (anthropics/skills) | Built into Claude Code |
| `frontend-design` from anthropics/skills | Same skill as the installed `frontend-design` plugin |
| `mcp-builder` (anthropics/skills) | Installed, then removed: overlaps `mcp-server-dev` |
| `vercel-react-native-skills` | Overlaps Callstack `react-native-best-practices` |
| `superpowers` | Overlapping workflow with `feature-dev` plus a heavy SessionStart hook |
| `kotlin-lsp-msapps-mobile` | Unofficial duplicate of `kotlin-lsp-anthropics` |
| `code-review-16urls` and other look-alikes | Unofficial duplicates in the directory |

## 7. Security notes

- Community sources (`ui-ux-pro-max-skill`, `callstack-agent-skills`) were cloned and checked
  before installing: no hooks, no `.mcp.json` in the plugin roots, and no network or subprocess
  calls in the shipped scripts. ui-ux-pro-max's Python scripts only search local CSV data.
- Plugins that **run hooks** automatically: `security-guidance`, `hookify`, `expo`
  (PostToolUse, UserPromptExpansion). All are official.
- Plugins that **reach the network**: `context7` (mcp.context7.com), `playwright` (`npx` package
  download), `expo` MCP (Expo services, needs login).
- Community marketplaces track their default branch. Re-review before `claude plugin update`.
- Standalone skills are copied into `.claude/skills/`. Re-audit the diff when updating them.

## 8. Maintenance

```bash
claude plugin list                          # what is installed
claude plugin details <name>@<marketplace>  # skills, hooks, MCP, token cost
claude plugin marketplace update            # refresh catalogs
claude plugin update <name>@<marketplace>   # update one plugin (review first)
claude plugin disable <name>@<marketplace> -s project   # turn off for this project
npx skills add <repo> --skill <name> -a claude-code -y  # add or refresh a standalone skill
```
