# Tasks Created Today
```dataview
TASK
WHERE Date = 2023-06-07
```


# Tags - Full Notes
```dataview
LIST FROM #task4me-after 
WHERE Date = 2023-06-07
```
# Tags - Tasks
```dataview
TASK FROM #test 
WHERE Date = 2023-06-07
```

# Meetings
```dataview
TABLE file.ctime AS "Time and Date", Attendees, Topics
WHERE Date = date(today)
WHERE Type = Meeting
```

Need to find a way to add type.
```dataview
TABLE file.ctime AS "Time and Date", Attendees, Topics
WHERE Date = date(today)
```
# All New Files Today
```dataview
TABLE file.ctime AS "Time and Date", Attendees, Topics, Type
WHERE Date = 2023-06-07
```
