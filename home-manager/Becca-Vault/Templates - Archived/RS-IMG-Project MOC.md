---
type: project
created: [06-07-02023]
parent: [[rs-work-overview]]
job: IMG

status: 
prio:
org:

tags:
- #Work/SalesForce
- 
- 
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
type note(Work-RS/IMG/Meetings/New Meeting) template
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

