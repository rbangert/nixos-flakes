---
type: project
created: [01-24-02023]
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
[Asana](https://app.asana.com/0/1203664495400196/1203664502832426)



### Stakeholders
---
- Dawn
- Rachel
- Deniz Ayaydin (dayaydin@contently.com)


### Project Documents
---
[[Form Audit]]
[[01-10-23 - Contently - Kickoff PDF.pdf]]

### Presentations
---



### Brag Book
---



```button
name Meetings
type note(Work-RS/IMG/Meetings/New Meeting) template
action RS-IMG-Meeting Template
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
	 AND client = "Contently"
  AND status != "closed"
  AND org != "work"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

