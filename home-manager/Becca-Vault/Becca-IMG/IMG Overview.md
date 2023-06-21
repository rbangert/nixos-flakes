---
Type: Dashboard
Subtype: Consulting
Client: IMG
Job: IMG

Status: Active
Priority: 
Start Date: 
Due Date: 

tags: 

Created_Date: 2023-04-26
Created_Date_Time: 2023-04-26 19:06
Last_Modified: 2023-04-26 19:06
Template_Version: 1.0

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

### Administrative
---
###### Upwork Information
- 6pm Sunday is when the "Work Week Ends"
- I get Paid 10 days after that to Colorado
- I pay out within 24 hours from Discover

###### Contractor Agreement
[[(OLD) Integrated Media Group _ Contractor Agreement.pdf]]



###### Info from Katie Originally
_Our contractor team, AlphaCrew Studios:_
This is Ricky's team, they are our contractors that help with email template building (based off mockup or previous email template) and can also help build forms and landing pages. They will help with DNS, form integration, and landing page integrations. The form should be filled out with your IMG email, not the client's email. 
[https://form.asana.com/?k=zJIY1aR_v9BuQ_12y7E_5Q&d=1141243335092573](https://form.asana.com/?k=zJIY1aR_v9BuQ_12y7E_5Q&d=1141243335092573)  

_Digital Marketing Team:_
The DM team has its own set of clients, but we work with Cassandra (team director) and Brittany on Engagement Program and Copywriting for clients who choose that add-on service. Submit Engagement Program form request: 
[https://form.asana.com/?k=weMxow7imnvHmraxm01GLA&d=169287428434747](https://form.asana.com/?k=weMxow7imnvHmraxm01GLA&d=169287428434747)

_Web Team:_
Luciano is wonderful. He will field requests for help with web related requests and integration questions, etc. Submit form request: 
[https://form.asana.com/?k=SLKyJvMmoL5DUXZth0730Q&d=169287428434747](https://form.asana.com/?k=SLKyJvMmoL5DUXZth0730Q&d=169287428434747)

###### Passwords & Verification Codes
- Keeper
- There's a Slack Channel for some too

### People
---
###### Management
[[Gil]]
[[Cathy Coppolino]]

###### Pardot
[[Laura Bailey]]
[[Trisha Banahue]]
[[Sarah Sweeney]]

###### Salesforce
Leah Ecaruan
Annabella Williamson
Brittany Jadin
Catherine Wright


### Project Resources
---
[[Engagement Program Outline Template.pdf]]
[[Engage Email Send Checklist.pdf]]
[[IMG/Inbox/IMG Cleanup - New/SOP - Pardot Quickstarts.pdf]]
[[Pardot_Implementation_Guide.pdf]]
[Quick Clips Libaray](https://www.pardotquickclips.com/video-library/)
[Pardot Instal Link](https://pardot-appexchange.herokuapp.com/)

### Presentations & Videos
---
[Quick Clips Libaray](https://www.pardotquickclips.com/video-library/)


### Brag Book
---


### Meetings & Work Logs
##### Active Projects
```dataview
TABLE
    Subtype, Created_Date as "Created Date 📅"
FROM "IMG"
WHERE Type = "Project"
	 AND Status = "Active"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

##### IMG Meeting & Work Logs
```dataview
TABLE
    Attendees, Created_Date as "Created Date 📅"
from "IMG"
where Project = "IMG"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) ASC
```

