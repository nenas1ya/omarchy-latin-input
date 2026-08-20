var TERMINAL_CLASS = /^(Alacritty|kitty|com\.mitchellh\.ghostty|foot|org\.codeberg\.dnkl\.foot|wezterm|org\.omarchy\.|TUI\.)/

function hasMultiLayout(keyboard) {
  return !!(keyboard
    && keyboard.layout
    && String(keyboard.layout).indexOf(",") !== -1)
}

function layoutIndex(keyboard) {
  return (keyboard && keyboard.active_layout_index) || 0
}

function switchableKeyboards(devices) {
  var keyboards = devices && devices.keyboards ? devices.keyboards : []
  return keyboards.filter(function(keyboard) {
    return keyboard && hasMultiLayout(keyboard)
  })
}

function savedLayouts(keyboards) {
  var layouts = {}
  for (var i = 0; i < keyboards.length; i++) {
    var keyboard = keyboards[i]
    var index = layoutIndex(keyboard)
    if (index !== 0) layouts[keyboard.name] = index
  }
  return layouts
}

function isTerminal(client) {
  if (!client) return false

  var tags = client.tags || []
  for (var i = 0; i < tags.length; i++) {
    if (String(tags[i]).replace(/\*$/, "") === "terminal") return true
  }

  return TERMINAL_CLASS.test(String(client.class || ""))
}

function hasContext(state, context) {
  return !!(state && state.contexts && state.contexts[context])
}

function openContext(state, context) {
  if (hasContext(state, context)) return { state: state, action: null }

  var next = state
    ? {
        layouts: Object.assign({}, state.layouts),
        contexts: Object.assign({}, state.contexts)
      }
    : null

  if (!next) return { state: null, action: "prepare-open", context: context }

  next.contexts[context] = true
  return { state: next, action: null }
}

function beginState(layouts, context) {
  var contexts = {}
  contexts[context] = true
  return {
    layouts: layouts,
    contexts: contexts
  }
}

function closeContext(state, context) {
  if (!hasContext(state, context)) return { state: state, action: null }

  var nextContexts = Object.assign({}, state.contexts)
  delete nextContexts[context]

  if (Object.keys(nextContexts).length === 0) {
    return {
      state: null,
      action: "restore",
      layouts: state.layouts
    }
  }

  return {
    state: {
      layouts: state.layouts,
      contexts: nextContexts
    },
    action: null
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    beginState: beginState,
    closeContext: closeContext,
    hasContext: hasContext,
    isTerminal: isTerminal,
    layoutIndex: layoutIndex,
    openContext: openContext,
    savedLayouts: savedLayouts,
    switchableKeyboards: switchableKeyboards
  }
}

if (typeof require !== "undefined" && require.main === module) {
  var devices = {
    keyboards: [
      { name: "sonix-usb-keyboard", layout: "us,ru", active_layout_index: 1 },
      { name: "hl-virtual-keyboard-fcitx5", layout: "us,ru", active_layout_index: 1 },
      { name: "power-button", layout: "us,ru", active_layout_index: 0 }
    ]
  }
  var keyboards = switchableKeyboards(devices)
  if (keyboards.length !== 3) throw new Error("expected 3 switchable keyboards, got " + keyboards.length)
  var saved = savedLayouts(keyboards)
  if (saved["sonix-usb-keyboard"] !== 1 || saved["hl-virtual-keyboard-fcitx5"] !== 1) {
    throw new Error("expected both non-us keyboards saved, got " + JSON.stringify(saved))
  }
  if (saved["power-button"] !== undefined) throw new Error("did not expect power-button in saved layouts")
}
