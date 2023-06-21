There are 5 standard UTM values: **campaign, source, medium, term, and content**.
 **First three parameters – source, medium, and campaign** are required. Term and content parameters are optional.

Building & Tracking Options:
- Excel Spreadsheet
- [[Information Library/Technology-Professional/-org-Technology-Professional-RS/Marketing/UTM.io]]
- Google Analytics Campaign URL Builder https://ga-dev-tools.web.app/campaign-url-builder/

-   We do not put capital letters, emojis, accents or spaces in a UTM. There are always small risks of technical issues or inconsistencies (one person capitalizes the name of the campaign and the other does not - which causes two separate campaigns to appear in your reports). 
-   Use lowercase whenever possible - "Email", "email" and "eMail" "are considered three values ​​in Google Analytics. (The exception is if you need to attach data from Google Analytics to another tool for analysis). The caveat does not apply to utm_source and utm_medium, which must always be lowercase).
-   Use dashes instead of white space for any campaign parameter.
-   Don't use punctuation or special characters (I'll pick up my first tip because it's the most important)
-   The utm_source and utm_medium parameters are the most important to get right, since they need to match Google Analytics' default channel grouping definition and historical data. Avoid using your own, try to match the existing ones (see our next points)

### utm_source
The only mandatory element of a UTM. You have to put the source, therefore the website.
Have a standard convention, and try to use TLD's. For things coming from emails, you can put the type of email it's coming from. This is up to you. Some marketers prefer to insert the name of the mailing list or newsletter as utm_source rather than the name of the email service provider. It's even recommended in Google's documentation

### utm_medium
Here is what you must put in the campaign **medium** of any link you track:

-   Direct: **never use it because direct is tracked from the base.** If Google doesn't know which channel it is coming from, the traffic is put in **Direct.**
-   Organic: do not use it, it is reserved for organic referencing (SEO).
-   Social: use the word **social** in your UTM for social networking sites. The most common sources of social traffic are: facebook.com, twitter.com, linkedin.com, pinterest.com, etc.
-   Email: use the word **email** in your UTM if the traffic comes from a link in a newsletter or any other email communication.
-   Referral: use the word **referral** when the link is placed on a partner site, blog, etc. Anything that is done for free and that is not a banner must be with an utm medium **referral.**
-   Paid Search: use the word **ppc** for all paid ads. Google Ads automatically uses this in their tracking. No need to set this up for Google Ads, however, other ad agencies should fall into this channel unless it is about banners.
-   Display: the display channel is used for banners. If you are doing banner ads with LaPress + or any website that sells banners, you must use the word **display** or the word **banner** in the UTM. It's up to you.
https://support.google.com/analytics/answer/3297892?hl=en


### **utm_campaign**
Optional, but it is strongly recommended
Various approachess 

### **utm_term**
utm_term is used to "identify paid keywords", and therefore these values ​​appear in the "Keyword" field in [Google Analytics](https://www.pragm.co/fr/blog/principales-metriques-dans-google-analytics/). However, you can use this field to convey useful information from other sources.

The value of utm_term depends on the marketing source and channel. Depending on the medium, utm_term can identify a specific email, ad in an ad group, social post, blog post title, search keyword, video title, or the body of a tweet.

### **utm_content**
Is meant to be used to give details about the content of the page / platform that is bringing you the traffic. But then again, you can use it however you like to segment your data based on certain parameters, like language, geo-targeting, or more.


https://www.pragm.co/post/google-analytics-utm-parameters-explained