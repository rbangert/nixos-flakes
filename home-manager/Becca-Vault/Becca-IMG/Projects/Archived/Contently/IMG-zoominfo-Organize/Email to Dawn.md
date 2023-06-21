Good Morning Team, 

  

Overview

-   ZoomInfo is enriching forms its code has been added to (it's test forms only at this point)
-   UTM data is being pulled in for the forms that have manually had a link added to them.
-   [Clearbit code](https://pastebin.com/krqLAxnj) removed from Pardot Form Layout  
    
-   [Dynamic Hide/Show relocated into the layout](https://pastebin.com/1d0nXRLL)
-   [UTM Capture from Pardot iframe](https://pastebin.com/Jyc4FMh6)
-   [ZoomInfo Enrich Data](https://pastebin.com/gDE94hgK)

  

**Can I get confirmation that these are the fields you want on all the forms:** 

  

Business Email (r) (a) [Default Field: Email]  
First Name (r) [Default Field: First Name]  
Last Name (r) [Default Field: Last Name]  
Job Title (r) [Default Field: Job Title]  
Company (r) [Default Field: Company]  
Country (r) [Default Field: Country]  
Annual Revenue (r) [Custom Field: CB - Annual Revenue [Estimated]]  
Industry (r) [Custom Field: CB - Sub-Industry]  
Source [Custom Field: utm_source]  
Medium [Custom Field: utm_medium]  
Campaign (a) [Custom Field: utm_campaign]  
Term (a) [Custom Field: utm_term]  
Content (a) [Custom Field: utm_content]  
Source ID (a) [Custom Field: Source ID]  
[This is a list of what Zoominfo can enrich](https://api-docs.zoominfo.com/#c145dd01-eb54-4fc2-bbdb-9edc04b7ea1b)  

  

Something to note, what I have set up now for the forms I am building is a manual way of managing the utm information outside of GTM. It's a simple way to manage them, and it's passing through well. Your download forms have coding in them that says that GTM is in place, I don't see the information being passed through to Pardot though. Without access to GTM I am unsure why. Adding GTM to custom Wordpress Templates like yours requires a website developer, and the best fit for that usually is the one that created the template. If your website developer is that same one, they would be best suited to add the code for GTM if you want to use it. 

  

You mentioned that you wanted to make sure that the On Demand, Demo Request & G2 Report are up and that the download forms are less of a priority. So this request is less of a priority, but I also need the list of downloads you want in the download form. :)