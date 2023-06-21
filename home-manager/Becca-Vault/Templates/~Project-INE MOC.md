---
Type: Project
Subtype: 
Name: 
Parent:
Children:
Purpose:
Job:

Status:
Priority:
Start Date:
Due Date:

tags: 

Created_Date: 2023-06-07
Created_Date_Time: 2023-06-07 11:30
Last_Modified: 2023-02-24 15:44
Template_Version: 1.0

---
### Administrative
---



### Stakeholders
---



### Project Documents
---



### Presentations
---



### Brag Book
---



```button
name Meetings
type note(Meetings/New Meeting) template
action Meeting Template-RS
```
```dataview
TABLE
    status,
    length(filter(file.tasks, (t) => !t.completed)) AS 🔳,
    "<div class=" + any(filter(file.tasks, (t) => t.annotated and !t.completed)) +"></div>" AS 🎫,
    prio AS 🏷,
    org,
    "<div class=" + (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) +"></div>" as 📅
FROM "/"
WHERE type = "meeting"
	 AND client != "templates"
  AND status != "closed"
  AND org != "work"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

