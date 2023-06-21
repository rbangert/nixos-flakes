function main() {
  setTimeout(() => {
    const cursor = app.workspace.activeLeaf.view.editor.getCursor()
    app.workspace.activeLeaf.view.editor.setCursor({line: 0, ch: 0})
    app.commands.executeCommandById('editor:toggle-fold')
    app.workspace.activeLeaf.view.editor.setCursor(cursor)
    return ''
  }, 100)
}
module.exports = main