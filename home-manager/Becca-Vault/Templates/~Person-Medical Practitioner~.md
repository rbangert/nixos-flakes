---
Type: Person
Subtype: Medical Practioner

Name: 
Speciality: 
Gender: 

Name-of-Practice: 
Location: 
Referred-By: 

First-Visit: 
Most-Recent: 

Created_Date: 2023-06-07
Created_Date_Time: 2023-06-07 11:30
Last_Modified: 2023-02-24 15:44
Template_Version: 1.0

---
# Fun Facts
---



### tags
---


```button
name New Visit
type note(Medical & Dental/Visits/New Visit) template
action Medical Visits
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
WHERE type = "medical"
	 AND client != "templates"
  AND status != "closed"
  AND org != "work"
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

