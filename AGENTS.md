# Desktop Pet Project Notes

## Response and Operation

- This project is a Windows Electron desktop pet named Mio.
- Keep changes small and focused.
- Use `npm.cmd`, not `npm`, from PowerShell.
- Start the app with `npm.cmd start`.
- The desktop shortcut runs `start-desktop-pet.vbs`.

## App Behavior

- `main.js` owns the transparent always-on-top Electron window.
- After changes to `main.js`, `preload.js`, `src/renderer.js`, or notification queue behavior, restart Desktop Pet so the running pet loads the new logic.
- The window is draggable and stays out of the taskbar.
- `status.txt` is polled by the app and shown as a speech bubble.
- `status-queue.json` stores queued Mio notifications; the app displays them in order and keeps `status.txt` in sync for compatibility.
- An empty `status.txt` hides the speech bubble.
- Avoid adding a speaker prefix such as `Mio:` in bubble text; the pet is the speaker.
- Use the project-specific `status:approval*` command immediately before commands that require user approval. Approval messages are delayed briefly so they appear after the Codex approval UI has time to show.
- Once an approval bubble is scheduled, leave it visible while the Codex approval UI is waiting. Do not clear or replace it until the approval-gated command has returned.
- After the approval-gated command returns, immediately replace the approval bubble with `status:error*`, `status:done*` for long/substantial completed work, or clear it with `npm.cmd run status:clear` when no follow-up notice is needed.
- For new chats or projects without a dedicated status script, pass a label such as `npm.cmd run status:approval -- --label="<chat-name>"` so Mio shows the source chat.
- Use `npm.cmd run status:error` when a task fails and the user should notice the problem; error messages intentionally stay visible until the next status update or clear command.
- Use `npm.cmd run status:done` only when long work, substantial implementation, or multi-step debugging is completed and the user should be notified; completion messages are queued and clear after a short delay.
- Prefer the Desktop Pet-specific scripts (`status:*:pet`) when the work is about Mio or this Electron app so the project name stays visible in the bubble.
- Use the same `--label` value consistently for approval, error, and done notices in a new chat.
- Use `npm.cmd run status:clear` when a temporary speech bubble should disappear.

## Sprite Assets

- Sprite assets live in `assets/`.
- Current key frames:
  - `pet-idle-1.png`, `pet-idle-2.png`
  - `pet-blink-1.png`, `pet-blink-2.png`
  - `pet-ear-fold.png`, `pet-ear-1.png`
  - `pet-tail-1.png`, `pet-tail-2.png`
  - `pet-grab-1.png`
  - `pet-walk-1.png`, `pet-walk-2.png`
- Prefer true transparent PNG sources when replacing sprites.
- When cutting frames from a sheet, keep frame canvases aligned to avoid visual jumps.

## Motion Rules

- Idle state floats gently.
- Idle randomly triggers blink, ear, or tail motion.
- Dragging/moving the pet uses the grabbed pose, not walking.
- Walking frames are currently retained as assets but are not the active drag behavior.

## Verification

- Run syntax checks after JS changes:
  - `node --check main.js`
  - `node --check preload.js`
  - `node --check src\renderer.js`
- For GUI smoke tests, launch briefly with `npm.cmd start` and stop Electron afterward.
