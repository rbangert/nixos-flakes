 [[Inbox/2023-02-24]]

 [[2023-06-07]]
<%

const title = await tp.system.prompt("Note Title");

const folders = this.app.vault.getAllLoadedFiles().filter(i => i.children).map(folder => folder.path);

const folder = await tp.system.suggester(folders, folders);

await tp.file.rename(${title})

await tp.file.move(/${folder}/${title})


%>