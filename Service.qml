import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "LatinModel.js" as LatinModel

Item {
  id: root

  property var shell: null
  property var latinState: null
  property bool terminalActive: false
  property string pendingOpenContext: ""

  readonly property string menuPluginId: {
    if (!shell || !shell.pluginRegistry) return "omarchy.menu"
    return shell.pluginRegistry.resolveEnabledId("omarchy.menu") || "omarchy.menu"
  }

  readonly property bool menuOpen: shell && shell.openPanelIds
    ? shell.openPanelIds[menuPluginId] === true
    : false

  function applyOpenResult(context, devices) {
    var keyboards = LatinModel.switchableKeyboards(devices)
    var saved = LatinModel.savedLayouts(keyboards)
    if (!Object.keys(saved).length) return

    root.latinState = LatinModel.beginState(saved, context)
    switchLayouts(saved, 0)
  }

  function openLatinContext(context) {
    var result = LatinModel.openContext(root.latinState, context)
    root.latinState = result.state

    if (result.action === "prepare-open") {
      root.pendingOpenContext = context
      devicesProc.running = true
    }
  }

  function closeLatinContext(context) {
    var result = LatinModel.closeContext(root.latinState, context)
    root.latinState = result.state
    if (result.action === "restore")
      switchLayouts(result.layouts)
  }

  function switchLayouts(layouts, layoutIndex) {
    var names = Object.keys(layouts || {})
    if (!names.length) return

    var commands = []
    for (var i = 0; i < names.length; i++) {
      var name = names[i]
      var index = layoutIndex === undefined ? layouts[name] : layoutIndex
      commands.push("hyprctl switchxkblayout " + name + " " + index)
    }

    layoutProc.command = ["bash", "-c", commands.join("; ")]
    layoutProc.running = true
  }

  function syncMenu() {
    if (root.menuOpen) root.openLatinContext("menu")
    else root.closeLatinContext("menu")
  }

  function syncTerminal(client) {
    var active = LatinModel.isTerminal(client)
    if (active === root.terminalActive) return

    root.terminalActive = active
    if (active) root.openLatinContext("terminal")
    else root.closeLatinContext("terminal")
  }

  function refreshActiveWindow() {
    if (!activeWindowProc.running) activeWindowProc.running = true
  }

  Component.onCompleted: {
    Qt.callLater(function() {
      root.syncMenu()
      root.refreshActiveWindow()
    })
  }

  onMenuOpenChanged: root.syncMenu()

  Connections {
    target: root.shell
    function onOpenPanelIdsChanged() { root.syncMenu() }
  }

  Connections {
    target: Hyprland
    function onRawEvent(event) {
      if (!event || !event.name) return
      var name = String(event.name)
      if (name === "activewindow" || name === "activewindowv2" || name === "configreloaded")
        root.refreshActiveWindow()
    }
  }

  Process {
    id: devicesProc
    command: ["hyprctl", "-j", "devices"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var context = root.pendingOpenContext
        root.pendingOpenContext = ""
        if (!context) return

        var devices
        try {
          devices = JSON.parse(text || "{}")
        } catch (error) {
          return
        }

        root.applyOpenResult(context, devices)
      }
    }
  }

  Process {
    id: activeWindowProc
    command: ["hyprctl", "-j", "activewindow"]
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var client = null
        try {
          client = JSON.parse(text || "null")
        } catch (error) {
          client = null
        }
        root.syncTerminal(client)
      }
    }
  }

  Process {
    id: layoutProc
  }
}
