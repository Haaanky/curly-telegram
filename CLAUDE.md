# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Repository Status

This repository (`curly-telegram`, owned by `Haaanky`) is in its **initial state**. It was created with a single placeholder commit and has no project content yet. This CLAUDE.md should be updated once actual project files and structure are added.

## Git Workflow

### Branches

- `master` / `main` — primary branch
- `claude/<session-id>` — branches used by Claude Code for automated work

### Branch Naming

Claude Code feature branches follow the pattern:

```
claude/<descriptor>-<session-id>
```

### Commit Style

Use clear, imperative commit messages describing what changed:

```
Add user authentication module
Fix null pointer in payment handler
Update README with setup instructions
```

### Push Workflow

Always push with upstream tracking set:

```bash
git push -u origin <branch-name>
```

## Project Setup

> **Note:** No project has been initialized yet. Update this section once the technology stack and tooling are chosen.

### Recommended First Steps

When beginning the project:

1. Choose a language/framework and initialize the project (e.g., `npm init`, `cargo init`, `go mod init`, etc.)
2. Add a `.gitignore` appropriate for the stack
3. Set up a linter and formatter
4. Add a test runner
5. Update this CLAUDE.md with the actual workflows

## Development Commands

> **Note:** No build system exists yet. Replace this section with real commands once the project is initialized.

Typical commands to document here once established:

```bash
# Install dependencies
<install command>

# Run the application
<run command>

# Run tests
<test command>

# Lint/format code
<lint command>

# Build for production
<build command>
```

## Testing

> **Note:** No test suite is configured yet.

Once tests are set up, document:

- How to run the full test suite
- How to run a single test file or test case
- Where test files live relative to source files
- Any test data or fixtures setup required

## Code Conventions

> **Note:** No source code exists yet. Update this section once the codebase develops.

When conventions are established, document:

- File and directory naming patterns
- Code style rules enforced by the linter
- Module/package organization
- Error handling patterns
- Logging conventions

## CI/CD

> **Note:** No CI/CD configuration exists yet.

Once CI is configured (e.g., GitHub Actions), document:

- What runs on pull requests
- What runs on merge to main
- How to interpret pipeline failures

## Working With This Repo as an AI Assistant

When working on tasks in this repository:

1. **Read before writing** — always read existing files before modifying them
2. **Stay on the assigned branch** — all changes go to the designated `claude/` branch
3. **Keep commits focused** — one logical change per commit
4. **Update this file** — if you make structural changes that affect how future assistants should work in the repo, update CLAUDE.md accordingly
5. **Don't over-engineer** — make the minimal change required; avoid adding abstractions, extra error handling, or features that weren't requested
