---
Type: Person
Subtype: Professional

Name: 
Job: IMG
Title: 
Gender: 
 
Location: 
Birthday: 
Partner: 
Kids: 
Pets: 
Hobbies: 

First-Met: 
Most-Recent-Contact: 

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
name New 121
type note(IMG/Meetings/121) template
action ~Meetings~ YYYY.MM.DD - COMPANY-or-PERSON - SUBTYPEorTOPIC Meeting
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
WHERE contains(Attendees, "Trisha Banahue")
  SORT
   (string(reviewed)> string(dateformat(date(today) - dur(default(period, "7d")), "yyyyMMdd"))) ASC,
   (default(prio, 1) * length(filter(file.tasks, (t) => !t.completed))) DESC
```

