# Latin input

Omarchy shell plugin that temporarily switches to the first keyboard layout (usually US) while the Omarchy menu or a terminal is focused, then restores the previous layout when you leave.

Useful when menu search and terminal commands expect Latin letters but you normally type in another layout such as Russian.

## Requirements

- [Omarchy](https://omarchy.org/) with Hyprland and the Quattro shell
- Multiple keyboard layouts configured with Latin first, for example in `~/.config/hypr/input.lua`:

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

Manual install:

```bash
git clone https://github.com/nenas1ya/omarchy-latin-input.git \
  ~/.config/omarchy/plugins/nenas1ya.latin-input
omarchy-shell shell rescanPlugins
omarchy plugin enable nenas1ya.latin-input
```

## Remove

```bash
omarchy plugin disable nenas1ya.latin-input
omarchy plugin remove nenas1ya.latin-input --yes
```

This plugin does not modify Hyprland config, shell.json beyond the enabled plugin entry, or any other user files outside `~/.config/omarchy/plugins/nenas1ya.latin-input/`.

## What it covers

- Omarchy menu (`Super+Space`, bar icon, and other menu routes)
- Terminals tagged by Omarchy defaults: foot, alacritty, kitty, ghostty, wezterm, `org.omarchy.*`, `TUI.*`

## External dependencies

- Omarchy shell (`omarchy-shell`, Quickshell)
- Hyprland `hyprctl` for keyboard layout switching
- No network access, no extra packages, no install hooks

## Validate

```bash
omarchy plugin validate .
```

## License

MIT. See [LICENSE](LICENSE).
