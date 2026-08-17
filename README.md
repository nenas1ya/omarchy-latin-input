# latin-input

Omarchy shell plugin: switch to the first keyboard layout (usually US) while the Omarchy menu or a terminal is focused, then restore the previous layout.

## Requirements

- Omarchy with Hyprland
- Multiple layouts configured with Latin first, for example in `~/.config/hypr/input.lua`:

```lua
hl.config({
  input = {
    kb_layout = "us,ru",
  },
})
```

## Install

```bash
omarchy plugin add https://github.com/nenas1ya/omarchy-latin-input.git --enable
```

Or copy the folder into `~/.config/omarchy/plugins/latin-input`, then:

```bash
omarchy-shell shell rescanPlugins
omarchy plugin enable latin-input
```

## Validate (for authors)

```bash
omarchy plugin validate ./omarchy-latin-input
```

## What it covers

- Omarchy menu (`Super+Space`, bar icon, other menu routes)
- Terminals tagged by Omarchy defaults: foot, alacritty, kitty, ghostty, wezterm, `org.omarchy.*`, `TUI.*`
