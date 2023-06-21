<%
// Get the current cursor location
const cursor = app.workspace.activeLeaf.view.editor.getCursor()
// Move the cursor to the start of the document
app.workspace.activeLeaf.view.editor.setCursor({line: 0, ch: 0})
// Fold/unfold the YAML
app.commands.executeCommandById('editor:toggle-fold')
// Move the cursor back to the original location
app.workspace.activeLeaf.view.editor.setCursor(cursor)
%>