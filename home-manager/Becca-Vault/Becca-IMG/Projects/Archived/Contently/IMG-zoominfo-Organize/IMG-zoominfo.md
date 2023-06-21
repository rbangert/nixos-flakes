

### The ZoomInfo integration with Pardot
- This was handed off to me partially completed.
- Make them feel special about teaching you a lesson to not assume they didn't throw a wrench in your spokes before you jumped into the middle of this mess. 
---

### Content Security Policy
- There appears to be content security policy is enabled on your site that.
- Without access to the WordPress site, I'm unable to verify, however when I add ZoomInfo to the forms, I'm seeing errors that indicate the requests that are sent off to zoominfo.com are getting blocked.
  
>[!warning] Error
>Could not load content for https://ws-assets.zoominfo.com/formcomplete.js.map: HTTP error: status code 404, net::ERR_HTTP_RESPONSE_CODE_FAILURE

>[!info] The following domains most likely need to be whitelisted.
 ws-assets.zoominfo.com
 ws.zoominfo.com
 schedule.zoominfo.com
 api.schedule.zoominfo.com

---


### The last thing that I believe could fuck us
- On the Clearbit forms, these fields come into ZoomInfo, with their proper titles. 
- **There is something in play here I haven't tracked down yet.**
- Any time we fiddle with the Clearbit stuff, they change and look like this:

![[Pasted image 20230120093359.png]]


#### I suspect the source of this issue could be coming from: 
- Google Analytics Connector
- A custom tracker domain
- Google Tag Manager (lowest of suspicion)

### Use your knowledge of the platform, to point me in the right direction and I'll look into this. 

---

### Overcoming these hurdles and getting access to the Wordpress site, will have everything out of our way. 

### After that:
- Using UTM links to funnel >20-30 places on their website should be straightforward and simple to implement. 
  
#### They would create new UTM link [Link Builder– for client](https://ga-dev-tools.web.app/campaign-url-builder/)
>[!info]
>The Form links such as:
>`https://info.contently.com/l/791483/2023-01-18/42px6r`
>
>Would be appended with the UTM data:
>```
>?utm_source=formsourcelocation&
>utm_medium=website&
>utm_campaign=campaignname&
>utm_id=campaignid
>```
>**To create a "new form" the client would need to generate a link with the correct UTM info, and post the link that leads to the ZoomInfo form in the right place on their site.**
>
>**I'm unsure of how the tracking domains work, but I imagine they could post these links ANYWHERE to funnel into the same form. They may need to switch to the pardot default tracking domain though. We will need to look into this. 





