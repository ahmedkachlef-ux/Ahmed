# Ahmed

## Link Claude Code with VS Code

### 1. Install the extension

- Open VS Code → Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`)
- Search **"Claude Code"** (publisher: `anthropic`) and click **Install**
- Or open this workspace — VS Code will prompt you via the recommended extension

Requires VS Code **1.98.0+** and an Anthropic account.

### 2. Sign in

Run the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → `Claude Code: Sign In`.

### 3. Useful shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+P` → "Claude Code" | Command palette actions |
| `Alt+K` / `Option+K` | Insert `@file:line` reference |
| `Ctrl+Esc` / `Cmd+Esc` | Toggle focus editor ↔ Claude |
| `Ctrl+Shift+Esc` / `Cmd+Shift+Esc` | New conversation tab |

### 4. Features

- Inline diff review (accept / reject changes)
- `@file` and `@file#5-10` mentions for context
- Permission modes: Normal, Plan, Auto-accept
- Session history and parallel conversation tabs
- `/` command menu for models, extended thinking, MCP servers

Docs: <https://code.claude.com/docs/en/ide-integrations>
