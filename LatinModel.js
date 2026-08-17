var UNTYPED_KEYBOARDS = /^(hl-virtual-keyboard|power-button|sleep-button|lid-switch|video-bus|.*-consumer-control$|.*-system-control$)/
var TERMINAL_CLASS = /^(Alacritty|kitty|com\.mitchellh\.ghostty|foot|org\.codeberg\.dnkl\.foot|wezterm|org\.omarchy\.|TUI\.)/

function isTypedKeyboard(name) {
  return !UNTYPED_KEYBOARDS.test(String(name || ""))
}

function layoutIndex(keyboard) {
  return (keyboard && keyboard.active_layout_index) || 0
}

function typedKeyboards(devices) {
  var keyboards = devices && devices.keyboards ? devices.keyboards : []
  return keyboards.filter(function(keyboard) {
    return keyboard
      && keyboard.layout
      && String(keyboard.layout).indexOf(",") !== -1
      && isTypedKeyboard(keyboard.name)
  })
}

function selectKeyboard(devices) {
  var typed = typedKeyboards(devices)
  if (!typed.length) return null

  for (var i = 0; i < typed.length; i++) {
    if (typed[i].main === true) return typed[i]
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
    hasContext: hasContext,
    isTerminal: isTerminal,
    layoutIndex: layoutIndex,
    openContext: openContext,
    selectKeyboard: selectKeyboard,
    shouldSwitchToUs: shouldSwitchToUs,
    typedKeyboards: typedKeyboards
  }
}
