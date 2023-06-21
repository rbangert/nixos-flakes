---
top: true
p: 1
sorting-spec: |
    target-folder: .
    Inbox
    %
    Meetings
    WorkLogs
    Docs
    Attachments
template_version: 1.1
created: <% tp.date.now("YYYY-MM-DD @ HH:mm") %>
id: <% tp.date.now('YYYYMMDDHHmm') %>
week: <% tp.date.now("YYYY [Week] WW") %>
plugin-prettier: true
obsidianUIMode: source
obsidianEditingMode: live
#banner: "![[banner3.png]]"
banner_y: 0.495
cssClass:
- max 
- foldernote 
type: foldernote
up: [[Work]]
tags:
- Work
- IMG

---