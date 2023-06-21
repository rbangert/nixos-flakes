---
Type: Project
Subtype: Consulting/QuickStart
Client: Galaxy America
Job: IMG

Status: Active
Priority: 
Start Date: 
Due Date: 

tags: 

Created_Date: 2023-04-26
Created_Date_Time: 2023-04-26 20:04
Last_Modified: 2023-04-26 20:04
Template_Version: 1.0

---
### Administrative
---
##### Information Passed to me
Galaxy America (Consulting) - Rebecca 
-   Sent them their first Engagement Studio for Mechanical bulls. They just provided updated images on 4/19. - new template needed; need Kristin to build 
-   Copy: [https://docs.google.com/document/d/1siPDwpTIeyEHgVZbThjANblkA2IQRwpnXzWJF5eYypk/edit?usp=sharing](https://docs.google.com/document/d/1siPDwpTIeyEHgVZbThjANblkA2IQRwpnXzWJF5eYypk/edit?usp=sharing)
-   Here is the link for the APPROVED PRODUCT IMAGES 
-   [https://drive.google.com/drive/folders/11J9DNPfI4RUUnoXU3WympXP7iOU6Vuek?usp=sharing](https://drive.google.com/drive/folders/11J9DNPfI4RUUnoXU3WympXP7iOU6Vuek?usp=sharing)
POC: [mike@galaxymultirides.com](https://img.newoldstamp.com/r/604102/e?id=1)


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
type note(IMG/Work Log/Work Log) template
action ~WorkLogNotes~ YYYY.MM.DD -
```
```dataview
TABLE
    Created_Date,
    "<div class=" + (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) +"></div>" as 📅
FROM "/"
WHERE type = "Meeting"
	 AND client = "Galaxy"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

