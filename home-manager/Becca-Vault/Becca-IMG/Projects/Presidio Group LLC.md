---
Type: Project
Subtype: QuickStart
Client: Presidio Group LLC
Job: IMG

Status: Active
Priority: 
Start Date: 
Due Date: 

tags: 

Created_Date: 2023-04-26
Created_Date_Time: 2023-04-26 19:04
Last_Modified: 2023-04-26 19:04
Template_Version: 1.0

---
### Administrative
---



### Stakeholders
---



### Project Documents
---
SOP?:
Asana Project:
Google Spreadsheet: 
Engagement Studio Document:

### Presentations & Videos
---
Kickoff:
Training 1:
Training 2:
Strategy Session #1:
Strategy Session #2:
Strategy Session #3:


### Brag Book
---



```button
name Meetings
type note(IMG/Meetings/Meetings) template
action ~Meetings~ YYYY.MM.DD - COMPANY-or-PERSON - SUBTYPEorTOPIC Meeting
```
```button
name Work Log
type note(IMG/Work Logs/Work Log) template
action ~WorkLogNotes~ YYYY.MM.DD -
```
```dataview
TABLE
    Created_Date,
    "<div class=" + (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) +"></div>" as 📅
FROM "/"
WHERE Type = "Meeting" AND Project = "Presidio Group LLC"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

