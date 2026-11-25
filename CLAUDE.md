# CLAUDE.md

General development guidance. It applies to any project started here.

## Starting a new project

1. **Clarify before building.** Confirm platform (web, iOS, Android, cross-platform, game,
   backend), stack, and constraints with the user. Do not assume technology choices.
2. **Find the relevant skills.** The full list is in
   [`docs/UNIVERSAL_SKILLS_INVENTORY.md`](docs/UNIVERSAL_SKILLS_INVENTORY.md).
   - Installed plugins: `claude plugin list`. Contents: `claude plugin details <name>@<marketplace>`
   - Skills load automatically when a task matches their description. Invoke one directly with `/<skill-name>`.
   - Stack-specific plugins (Unreal, Xcode, Supabase, Firebase, vector DBs, cloud providers …)
     are listed under "Available, not installed". Install only what the chosen stack needs:
     `claude plugin install <name>@anthropic-plugin-directory -s project`
   - For a capability without a skill, use the `context7` MCP or the official docs in
     the inventory's "Missing capabilities" table. Never invent package or skill names.
3. **Quick map** (task → skill/plugin):
   - UI/UX, design systems, typography, accessibility → `ui-ux-pro-max`, `frontend-design`, `web-design-guidelines`
   - React / Next.js → `vercel-react-best-practices`, `vercel-composition-patterns`
   - Expo / React Native → `expo` skills, `react-native-best-practices`, `react-navigation`, `react-native-testing`
   - Unity games → `unity` skills
   - Redis → `redis-development` skills
   - Claude API, agents, MCP → built-in `claude-api`, `agent-sdk-dev`, `mcp-server-dev`
   - New feature end to end → `/feature-dev`
   - Review → built-in `/code-review`, `/security-review`, `/review-pr` (pr-review-toolkit)
   - E2E / browser testing → `playwright` MCP, `webapp-testing`
   - Git → `/commit`, `/commit-push-pr`
4. Once a stack is chosen, run `/init` (or `claude-automation-recommender`) to add
   project-specific guidance to that project's own CLAUDE.md.

## Engineering principles

- Read the existing code and conventions before changing anything. Match them.
- Prefer the smallest change that solves the problem. No speculative abstractions.
- Use official documentation as the source of truth, and check versions with `context7`.
- Type everything that can be typed (TypeScript strict mode, Python type hints).
- Keep secrets out of code and git. Use environment variables and `.env.example` files.
- Validate all external input. Follow OWASP guidance for web, API and mobile.
- Don't add dependencies lightly. Prefer maintained, widely used packages, and audit them
  (`npm audit`, `pip-audit`).
- Accessibility is required: semantic markup, contrast, focus states, screen-reader labels.

## Quality bar

- Write or update tests with each change: unit tests first, integration and E2E for critical flows.
- Run the linter, type checker and tests before calling work done. Report failures honestly.
- Verify UI changes in a real browser, simulator or device (`run` skill, Playwright).
- Keep commits small and descriptive. Never commit generated secrets or build output.

## Environment notes

- Plugins and marketplaces are declared at project scope in `.claude/settings.json`, so new
  sessions re-install them automatically.
- Do not install SDKs, game engines or paid services unless the user approves.
