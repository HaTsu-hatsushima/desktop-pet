# Codex Setup

This note helps a new Codex chat or a newly cloned PC continue Mio Desktop Pet work safely.

## Project Location

- This repository is the canonical Mio Desktop Pet project.
- Do not use an old mixed workspace copy such as `C:\Users\sweet\codex-projects\desktop-pet` for status comments or development.
- On the user's main PC, the active local path is usually `C:\Users\sweet\projects\desktop-pet`.
- On another PC, use the folder where this repository was cloned.

## First Checks

Run these checks before editing or launching Mio:

```powershell
Get-Location
git status --short --branch
git remote -v
Test-Path node_modules
```

If `node_modules` is missing, run:

```powershell
npm.cmd install
```

Confirm Electron:

```powershell
npx.cmd electron --version
```

## Mio Status Comments

Mio comments should be sparse and automatic when the situation matches these rules:

- Do not show a bubble just because a new chat or project started.
- Do not show bubbles for normal chat, routine progress, or short status updates.
- Before approval-gated or elevated commands, run the matching `status:approval*` command immediately before the approval-gated command.
- While approval is waiting, leave the approval bubble visible.
- After the approval-gated command returns, replace it with `status:error*`, `status:done*` for long or substantial completed work, or `status:clear`.
- Use `status:done*` only for long work, substantial implementations, multi-step debugging, or tasks where the user may be away.

Project-specific commands:

```powershell
npm.cmd run status:approval:pet
npm.cmd run status:error:pet
npm.cmd run status:done:pet

npm.cmd run status:approval:news
npm.cmd run status:error:news
npm.cmd run status:done:news

npm.cmd run status:approval:kakeibo
npm.cmd run status:error:kakeibo
npm.cmd run status:done:kakeibo

npm.cmd run status:clear
```

For a project without a dedicated command, use a label:

```powershell
npm.cmd run status:approval -- --label="Project Name"
npm.cmd run status:error -- --label="Project Name"
npm.cmd run status:done -- --label="Project Name"
```

## Verification

Run syntax checks after JavaScript changes:

```powershell
node --check main.js
node --check preload.js
node --check scripts\status.js
node --check src\renderer.js
```

Verify the status script before relying on bubbles:

```powershell
npm.cmd run status:clear
```

For GUI smoke tests, launch briefly with:

```powershell
npm.cmd start
```

Stop or restart an existing Mio only after the user confirms it is OK.
