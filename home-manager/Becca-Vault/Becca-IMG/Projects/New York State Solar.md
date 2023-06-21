---
Type: Project
Subtype: Consulting/QuickStart
Client: New York State Solar
Job: IMG

Status: Active
Priority: 
Start Date: 
Due Date: 

tags: 

Created_Date: 2023-04-26
Created_Date_Time: 2023-04-26 20:05
Last_Modified: 2023-04-26 20:05
Template_Version: 1.0

---
### Administrative
---
Notes from Melinda: Move over from Sandbox. Do the re-install over again. They are slow slow.
##### Information Passed Along to Me
**New York State Solar - Rebecca
-   Got this one from Mallory. Everything is set up in their sandbox. Just waiting for them to say they’re ready to switch to production.
-   Moving slow, check in once a week 
-   Need training once moved to production
-   Contacts: [rmurdocco@nystatesolar.com](mailto:rmurdocco@nystatesolar.com), [bianca@nystatesolar.com](mailto:bianca@nystatesolar.com), [dmurray@nystatesolar.com](mailto:dmurray@nystatesolar.com)**

### Stakeholders
---
Richard Murdocco (Point of Contact? ) New York 
Bianca Penaloza (Salesforce Guru) Miami - Online Teaching Porgam English lessions to kids in Columbia and brazil. they didn't have aconcept of seasons. 
Daniel Murray (CTO) Late 




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
type note(IMG/Work Log/Work Log) template
action ~WorkLogNotes~ YYYY.MM.DD -
```
```dataview
TABLE
    Created_Date,
    "<div class=" + (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) +"></div>" as 📅
FROM "/"
WHERE Type = "Meeting" AND Project = "New York State Solar"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

