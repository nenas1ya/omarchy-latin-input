var UNTYPED_KEYBOARDS = /^(hl-virtual-keyboard|power-button|sleep-button|lid-switch|video-bus|.*-consumer-control$|.*-system-control$)/
var TERMINAL_CLASS = /^(Alacritty|kitty|com\.mitchellh\.ghostty|foot|org\.codeberg\.dnkl\.foot|wezterm|org\.omarchy\.|TUI\.)/

function hasMultiLayout(keyboard) {
  return !!(keyboard
    && keyboard.layout
    && String(keyboard.layout).indexOf(",") !== -1)
}

function isTypedKeyboard(name) {
  return !UNTYPED_KEYBOARDS.test(String(name || ""))
}

function layoutIndex(keyboard) {
  return (keyboard && keyboard.active_layout_index) || 0
}

function typedKeyboards(devices) {
  var keyboards = devices && devices.keyboards ? devices.keyboards : []
  return keyboards.filter(function(keyboard) {
    return keyboard && hasMultiLayout(keyboard) && isTypedKeyboard(keyboard.name)
  })
}

function fcitxVirtualKeyboard(devices) {
  var keyboards = devices && devices.keyboards ? devices.keyboards : []
  for (var i = 0; i < keyboards.length; i++) {
    var keyboard = keyboards[i]
    if (!keyboard) continue
    var name = String(keyboard.name || "")
    if (name.indexOf("hl-virtual-keyboard") !== 0) continue
    if (!hasMultiLayout(keyboard)) continue
    return keyboard
  }
  return null
}

function eventKeyboardName(event) {
  var parts

  try {
    if (event && event.parse) parts = event.parse(2)
  } catch (error) {
  }

  if (!parts) parts = String(event && event.data ? event.data : "").split(",")

  var name = String(parts[0] || "")
  return name.indexOf("hl-virtual-keyboard") === 0 ? "" : name
}

function selectKeyboard(devices, namedByEvent) {
  var fcitx = fcitxVirtualKeyboard(devices)
  if (fcitx) return fcitx

  var typed = typedKeyboards(devices)
  if (!typed.length) return null

  for (var i = 0; i < typed.length; i++) {
    if (typed[i].name === namedByEvent) return typed[i]
  }

  return typed.reduce(function(best, keyboard) {
    return layoutIndex(keyboard) > layoutIndex(best) ? keyboard : best
  }, typed[0])
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
        keyboard: state.keyboard,
        savedIndex: state.savedIndex,
        contexts: Object.assign({}, state.contexts)
      }
    : null

  if (!next) return { state: null, action: "prepare-open", context: context }

  next.contexts[context] = true
  return { state: next, action: null }
}

function beginState(keyboard, savedIndex, context) {
  var contexts = {}
  contexts[context] = true
  return {
    keyboard: keyboard.name,
    savedIndex: savedIndex,
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
      keyboard: state.keyboard,
      savedIndex: state.savedIndex
    }
  }

  return {
    state: {
      keyboard: state.keyboard,
      savedIndex: state.savedIndex,
      contexts: nextContexts
    },
    action: null
  }
}

function shouldSwitchToUs(savedIndex) {
  return savedIndex !== 0
}

if (typeof module !== "undefined") {
  module.exports = {
    beginState: beginState,
    closeContext: closeContext,
    eventKeyboardName: eventKeyboardName,
    fcitxVirtualKeyboard: fcitxVirtualKeyboard,
    hasContext: hasContext,
    isTerminal: isTerminal,
    layoutIndex: layoutIndex,
    openContext: openContext,
    selectKeyboard: selectKeyboard,
    shouldSwitchToUs: shouldSwitchToUs,
    typedKeyboards: typedKeyboards
  }
}

if (typeof require !== "undefined" && require.main === module) {
  var devices = {
    keyboards: [
      { name: "sonix-usb-keyboard", layout: "us,ru", active_layout_index: 1, main: false },
      { name: "hl-virtual-keyboard-fcitx5", layout: "us,ru", active_layout_index: 1, main: true }
    ]
  }
  var selected = selectKeyboard(devices)
  if (!selected || selected.name !== "hl-virtual-keyboard-fcitx5") {
    throw new Error("expected fcitx virtual keyboard, got " + (selected && selected.name))
  }
}
