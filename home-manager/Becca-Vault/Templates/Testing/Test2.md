<%*

const title = await tp.system.prompt("Title");

const folders = this.app.vault.getAllLoadedFiles().filter(i => i.children).map(folder => folder.path);

const folder = await tp.system.suggester(folders, folders);

await tp.file.rename(${title})

await tp.file.move(/${folder}/${title})

%>

title: <%* tR += title %>

creation-date: <% tp.file.creation_date() %>