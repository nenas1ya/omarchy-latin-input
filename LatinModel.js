var TERMINAL_CLASS = /^(Alacritty|kitty|com\.mitchellh\.ghostty|foot|org\.codeberg\.dnkl\.foot|wezterm|org\.omarchy\.|TUI\.)/

function nonUsLayouts(devices) {
  var layouts = {}
  var keyboards = (devices && devices.keyboards) || []
  for (var i = 0; i < keyboards.length; i++) {
    var keyboard = keyboards[i]
    if (!keyboard || !keyboard.layout || String(keyboard.layout).indexOf(",") === -1) continue
    var index = keyboard.active_layout_index || 0
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
  if (!state) return { state: null, action: "prepare-open" }

  var contexts = Object.assign({}, state.contexts)
  contexts[context] = true
  return { state: { layouts: state.layouts, contexts: contexts }, action: null }
}

function beginState(layouts, context) {
  var contexts = {}
  contexts[context] = true
  return { layouts: layouts, contexts: contexts }
}

function closeContext(state, context) {
  if (!hasContext(state, context)) return { state: state, action: null }

  var nextContexts = Object.assign({}, state.contexts)
  delete nextContexts[context]

  if (Object.keys(nextContexts).length === 0) {
    return { state: null, action: "restore", layouts: state.layouts }
  }

  return {
    state: { layouts: state.layouts, contexts: nextContexts },
    action: null
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    beginState: beginState,
    closeContext: closeContext,
    isTerminal: isTerminal,
    nonUsLayouts: nonUsLayouts,
    openContext: openContext
  }
}

if (typeof require !== "undefined" && require.main === module) {
  function assert(condition, message) {
    if (!condition) throw new Error(message)
  }

  var saved = nonUsLayouts({
    keyboards: [
      { name: "kbd-a", layout: "us,ru", active_layout_index: 1 },
      { name: "kbd-b", layout: "us,ru", active_layout_index: 2 },
      { name: "kbd-us", layout: "us,ru", active_layout_index: 0 },
      { name: "kbd-single", layout: "us", active_layout_index: 0 }
    ]
  })
  assert(Object.keys(saved).length === 2, "only non-us multi-layout keyboards are saved")
  assert(saved["kbd-a"] === 1 && saved["kbd-b"] === 2, "saved layout indices")
  assert(saved["kbd-us"] === undefined && saved["kbd-single"] === undefined, "skip us and single-layout")

  assert(isTerminal({ class: "foot" }), "foot is a terminal")
  assert(!isTerminal({ class: "firefox" }), "browser is not a terminal")

  assert(openContext(null, "menu").action === "prepare-open", "first open queries devices")

  var state = beginState({ "kbd-a": 1 }, "menu")
  var stacked = openContext(state, "terminal")
  assert(stacked.action === null, "second context reuses saved layouts")
  assert(stacked.state.contexts.menu && stacked.state.contexts.terminal, "contexts stack")

  var partial = closeContext(stacked.state, "menu")
  assert(partial.action === null && partial.state.contexts.terminal, "partial close keeps state")

  var restored = closeContext(partial.state, "terminal")
  assert(restored.action === "restore" && restored.layouts["kbd-a"] === 1, "last close restores layouts")
}
