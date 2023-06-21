# The biggest issue of today:
##### I just discovered their download content pages have GTM integration. 
It looks to be a complicated mess of code, that is well outside your scope.

### But it's no big deal 
I can manually add ZoomInfo to the forms to meet the deadline. 

### Consider an early morning email contact with the client
##  To let them know everything is going to be ok

We need to: 
- ##### Confirm these fields on the ZoomInfo base form: 
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
Before we clone the 4 forms to get started with the deployment
[This is a list of what Zoominfo can enrich](https://api-docs.zoominfo.com/#c145dd01-eb54-4fc2-bbdb-9edc04b7ea1b)

- ##### Get a list of active forms used for downloadable content








# Changes
- #### Were made to the Salesforce Content Security Policy 
The following domains have been added, with the **frame-src** directive:
- ws-assets.zoominfo.com - zoominfoscript 
- ws.zoominfo.com - zoominfoconnect

- #### Snippets changed with the Pardot Form Layout Code  
The Pardot Form Layout [TwoColumns (gray, placeholders, new 2020 buttons)](https://embedded.pardot.force.com/layoutTemplate/read/id/2558) was cloned to create [Zoominfo Base](https://embedded.pardot.force.com/layoutTemplate/read/id/7492)
- ##### Within the form tab (lines 52 - 68):
-  Clearbit code was removed
```javascript
<script src="https://tag.clearbitscripts.com/v1/pk_dee227d8313a9fbb99ad4c929fb26c18/tags.js"></script>
```


-  Dynamic Show/Hide was relocated into the layout 
```javascript
[[<script>
    var labels = document.querySelectorAll("label");
    var i = labels.length;    
    while (i--) {
        var label = labels.item(i);
        var text = label.textContent;
            label.parentNode.classList.contains("required") && (text += "*");
            label.nextElementSibling.setAttribute("placeholder", text);
        }

    var selects = document.getElementsByClassName("select");
        for (i = 0; i < selects.length; i++) {
            selects[i][0].innerHTML = selects[i].attributes.placeholder.nodeValue;
            selects[i][0].value = "";
        }
</script>]]
```




- ##### Within the layout tab (lines 139 - 186):
-  ZoomInfo: Form Complete was added
```javascript
<script>
    window.ZIProjectKey = "<secret_key>"; 
    var zi = document.createElement('script');
        (zi.type = 'text/javascript'),
        (zi.async = true),
        (zi.src = 'https://js.zi-scripts.com/zi-tag.js'),
                
        document.readyState === 'complete'?
        document.body.appendChild(zi):
        window.addEventListener('load', function(){
        document.body.appendChild(zi)
   });
</script>
```

-  UTM Capture from Pardot iframe URL was added
```javascript
<script>
	jQuery(function($){
	    if($("#pardot-form").length>0) {
			$("#pardot-form .utm input, 
			#pardot-form .utm").val(document.referrer);
	        }
	});
</script>
```



---
---

-  Dynamic Show/Hide was added
```javascript
<script>
    var labels = document.querySelectorAll("label");
    var i = labels.length;    
    while (i--) {
        var label = labels.item(i);
        var text = label.textContent;
            label.parentNode.classList.contains("required") && (text += "*");
            label.nextElementSibling.setAttribute("placeholder", text);
        }

    var selects = document.getElementsByClassName("select");
        for (i = 0; i < selects.length; i++) {
            selects[i][0].innerHTML = selects[i].attributes.placeholder.nodeValue;
            selects[i][0].value = "";
        }
</script>
```






---







# The client might want to know:
- ##### Some existing forms carry Clearbit Code (has content)
- It appears to be all forms related to the downloadable content.
- This should be removed if they are switched over to a ZoomInfo layout template. 
  
- To remove the code:
	- Click the Show Source button on the right end of the toolbar to expose the code.
	- Remove The entire contents of the input field .
	  
Example: WF-2023-G2-Enterprise-Content-Creation-Report-Download
![[Pasted image 20230122230546.png]]

---



- ##### WordPress link replacement process (no content)


- ##### How to make UTM Links (no content)



# The client may be interested in:
- ##### GTM & custom WP layout considerations
- ##### ZoomInfo: [Existing Pardot Data Mass Enrichment](https://university.zoominfo.com/learn/article/how-to-pardot-mass-enrichment)

https://utmbuilder.net/
https://university.zoominfo.com/learn/article/how-to-pardot-mass-enrichment