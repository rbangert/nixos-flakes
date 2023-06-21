---
Type: Review
Subtype: Daily
Job: 
Location: 

tags: 

Created_Date: 2023-06-07
Created_Date_Time: 2023-06-07 11:30
Last_Modified: 2023-02-24 15:44
Template_Version: 1.0
---
# Tasks Created Today
```dataview
TASK
WHERE Created_Date = date(2023-06-07)
```

# Meetings Today
```dataview
TABLE Attendees, tags , Subtype
WHERE Created_Date = date(2023-06-07)
WHERE Type = "Meeting"
```
# All New Files Today with Metadata
```dataview
TABLE Type, Subtype, file.ctime AS "Time and Date"
WHERE Created_Date = date(2023-06-07)
```

# All Files Created Today
```dataview
TABLE Created_Date AS "Date"
WHERE file.cday = date(2023-06-07)
```

# All Files Modified Today
```dataview
TABLE Created_Date AS "Date"
WHERE file.cday < date(2023-06-07)
WHERE file.mday = date(2023-06-07)
```

# Recap
---
