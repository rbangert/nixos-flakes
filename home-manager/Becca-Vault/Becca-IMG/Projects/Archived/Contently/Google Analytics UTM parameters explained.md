https://www.pragm.co/post/google-analytics-utm-parameters-explained

Google Analytics UTM parameters explained 
This is a quick guide to survival taken from my beginner Google Analytics course.

What are UTM codes? Here's a simple explanation
Let's start by a quick definition: UTM stands for Urchin Tracking Module. Urchin was the old name of Google Analytics. Marketers used these UTM parameters are a way to track your incoming site traffic. A UTM is used to measure the impact of your marketing efforts on different web platforms. UTMs can answer several questions marketers ask themselves: what is the best ad? What are the best geographic markets? Does the influencer marketing campaign work? The parameters in the UTM help you fill in some gaps in your analysis. They make attributing conversions to marketing efforts more realistic.

Why and when do you use a UTM?
We use a UTM every time we want to add additional information in Google Analytics that we could not get otherwise. Browsers collect data as soon as you navigate to a website. In Web marketing, UTMs are used to fill browsers' blind spots. They are not always able to provide everything you need. UTM is used for external traffic to capture its source and nature. An event is used to measure a user's action on the site once they have arrived.

Warning: never use a UTM on your own website. You must use an event in this case. UTM parameters should be used with caution as they overwrite existing reference data.

UTM FAQ
What are the 5 UTM parameters?
There are 5 standard UTM values: campaign, source, medium, term, and content.

Which UTM parameters are required?
Out of the 5 standard UTM values, the first three parameters – source, medium, and campaign are required. Term and content parameters are optional.

How do I find UTM URL in Google Analytics?
You can follow the performance of UTMs in Google Analytics by going to the "Acquisition" tab, then "Campaigns", and finally "All campaigns".

What can I track with a UTM?
You can track a campaign source, for example: emailing flows, contests, promotions, links from influencers, banners on sites, white papers, links in employee signatures, QR codes and more.

How to keep track of your custom campaign parameters
A good practice is to keep track of your UTMs so that you can remember everything. After a few years, it is difficult to remember all the details of our web marketing campaigns. I use a custom Excel file as a URL builder and to document my UTMs when I need a solution that's fast, free, and usable by the majority of people. Normally, I use a tool called UTM.io which allows me to document everything neatly, add users and create UTM templates so that my colleagues can make their links well without having to stress. Not everyone is comfortable generating a UTM and this is where a tool can simplify the task for some. Google offers a UTM builder to help you create your first UTMs. 

Here are the standards for all the parameters 
We do not put capital letters, emojis, accents or spaces in a UTM. There are always small risks of technical issues or inconsistencies (one person capitalizes the name of the campaign and the other does not - which causes two separate campaigns to appear in your reports). 
Use lowercase whenever possible - "Email", "email" and "eMail" "are considered three values ​​in Google Analytics. (The exception is if you need to attach data from Google Analytics to another tool for analysis). The caveat does not apply to utm_source and utm_medium, which must always be lowercase).
Use dashes instead of white space for any campaign parameter.
Don't use punctuation or special characters (I'll pick up my first tip because it's the most important)
The utm_source and utm_medium parameters are the most important to get right, since they need to match Google Analytics' default channel grouping definition and historical data. Avoid using your own, try to match the existing ones (see our next points)
Can you use custom UTM parameters?
You can't do whatever you want with UTM parameters. You must respect some conventions (kind of like UTM codes).

Why do my tracking URLs not show up in the GA campaign report?
Because you have most likely made a mistake in your tracking link. To avoid errors and (others) in your channels, you should only use these channels in your UTMs. Indeed, if you invent a marketing channel that does not already exist in Google Analytics, your UTMs will fall into the marketing channel (other). This does not apply to advanced users who have created custom channels in Google Analytics. For the beginner or intermediate user, it is necessary to respect the fixed channels.

Tip: use the English channel nomenclature, it is simpler. Google Analytics automatically translates everything in the interface.

Examples of what to put in utm_source =?
The parameter is meant to track your sources of traffic. The traffic source, or utm_source, is the only mandatory element of a UTM. You have to put the source, therefore the website. Here are some examples:

For Facebook ads, the traffic coming from Facebook, should have facebook.com or facebook (because sometimes big websites just fit like facebook or twitter rather than twitter.com). 
The traffic comes from remedes.ca, we put remedes.ca. For regular websites, we prefer to clearly indicate the TLD (top level domain). Remedes.ca is not the same as remedes.com.
The traffic comes from a newsletter, we put the type of email therefore newsletter or email-blast, or the name of the software as mailchimp. It's up to you! Some marketers prefer to insert the name of the mailing list or newsletter as utm_source rather than the name of the email service provider. It's even recommended in Google's documentation:
Every reference to a website has an origin or a source. Among the possible sources, one can quote: "google" (the name of a search engine), "facebook.com", "facebook.com (the name of a referring site)," spring_newsletter "(the name of 'one of your newsletters), and "direct" (users who typed your URL directly into their browser, or bookmarked your site.)

The idea goes back to a time when email was mostly used sending newsletters, and where email automation tools were not yet popular. This approach can be useful if you only want to report on the performance of email traffic, and not compare the performance of email traffic. email to other sources and media. But this approach has drawbacks: if you have more than 20 lists, it will look like this in Google Analytics.

Not very easy to analyze ...

Traffic is coming from ad to ad radio and your developer did something that made and we type the URL given on the radio, we redirect the user to the real landing page ... or another situation like that: we must put where it comes from in the source so ideally we put a word like pub-radio or something else that clearly indicates the source of the traffic.
What to put in utm_medium 
Here is what you must put in the campaign medium of any link you track:

Direct: never use it because direct is tracked from the base. If Google doesn't know which channel it is coming from, the traffic is put in Direct.
Organic: do not use it, it is reserved for organic referencing (SEO).
Social: use the word social in your UTM for social networking sites. The most common sources of social traffic are: facebook.com, twitter.com, linkedin.com, pinterest.com, etc.
Email: use the word email in your UTM if the traffic comes from a link in a newsletter or any other email communication.
Referral: use the word referral when the link is placed on a partner site, blog, etc. Anything that is done for free and that is not a banner must be with an utm medium referral.
Paid Search: use the word ppc for all paid ads. Google Ads automatically uses this in their tracking. No need to set this up for Google Ads, however, other ad agencies should fall into this channel unless it is about banners.
Display: the display channel is used for banners. If you are doing banner ads with LaPress + or any website that sells banners, you must use the word display or the word banner in the UTM. It's up to you.
Anything that is not tracked with the correct words in UTM medium will fall into (other). It's all the other types of ads that Google hasn't assigned a channel to. When Google doesn't know where the traffic is coming from, it falls live. When Google knows the traffic is coming from somewhere but doesn't recognize the marketing channel, it falls into (other).


![[Pasted image 20230124203739.png]]

https://support.google.com/analytics/answer/3297892?hl=en

What else?
The campaign in utm_campaign
Although the value of utm_campaign is optional, it is strongly recommended. If omitted, the value is reported as "(undefined)" in Google Analytics. If you don't put your campaign name in the UTM, your marketing campaign won't be listed in the campaign report ... or anywhere else. Don't forget to specify your campaign. If the campaign is recurring from year to year, a clear nomenclature must be provided: campaign name + year. There are a few schools of thought on values ​​for the utm_campaign. I'll cover two approaches.

Approach 1: The Tactical Approach
Most marketers follow this approach. It consists of using the name of the marketing campaign used internally as the value for utm_campaign:

Source / Medium Value of utm_campaignmailchimp / email The title of the email campaign google / cpc The title of the paid campaign Google Adsfacebook / social The title of the social media campaign no paid

Advantages of the tactical approach
It is easy to see the results of each campaign in Google Analytics.
If there is a cost associated with running a campaign (i.e. ad campaigns), it's easy to see the revenue and ROAS of each campaign.
It is easy to communicate with the different teams.
As the values ​​of utm_campaign come from marketing tools and advertising platforms, it is easy to relate the campaign of the tool / platform to data from Google Analytics.
Disadvantages of the Tactical Approach
In some cases there is no internal campaign name clearly indicating the channel where the link is shared (e.g. organic post on Facebook, tweet, video on a brand's YouTube channel , affiliate link). Therefore, much of the traffic will be of no value to the campaign.
Inconsistent naming of campaigns can cause a mess, rendering the Google Analytics campaign report virtually useless.
This can cause chaos when looking at campaign reports that are not filtered for a single source / medium.
Approach 2: The Strategic Approach
The second approach is to use a high level strategic value for the universal marketing campaign that identifies the product / category / event being promoted or the higher level marketing or promotion objective. This approach is closer to the classic concept of a traditional marketing campaign. The campaign is the same but broadcast on several marketing channels. This is what we use when we have recurring campaigns like Black Friday, Valentine's Day, etc.

Benefits of the strategic approach for campaign tracking
A clean campaign report with clear and strategic values
A clear overview of the campaign performance by traffic sources
The ability to visualize and compare the results of different marketing campaigns.
Disadvantages of the strategic approach when tracking online campaigns
Campaigns shown in Google Analytics reports do not match the campaign title in every marketing tool / platform, making it more difficult to compare Analytics data with the costs shown in the 'tool.
Only the costs and revenues of the entire marketing campaign from all sources can be directly compared, and the breakdown of the report requires further analysis.
Clear communication and centralized documentation are needed. If a team or person does not follow this approach, all campaign data in Google Analytics will become virtually useless.
UTM content and UTM term
According to Google, utm_term is used to "identify paid keywords", and therefore these values ​​appear in the "Keyword" field in Google Analytics. However, you can use this field to convey useful information from other sources.

The utm_content field, on the other hand, is meant to be used to give details about the content of the page / platform that is bringing you the traffic. But then again, you can use it however you like to segment your data based on certain parameters, like language, geo-targeting, or more.

A good tip to know: when I need to track a special ad, an angle, a specific sharing group or the position of a link in an email, I use UTM content. I specific if the link is in the footer, the header, the body of the content via this portion of the UTM. If it's a special angle, I put the angle in one word: price, emotion, moms.

utm_term: an option in Google Analytics
The value of utm_term depends on the marketing source and channel. Depending on the medium, utm_term can identify a specific email, ad in an ad group, social post, blog post title, search keyword, video title, or the body of a tweet.

Need training to better understand all this?

How to use UTMs in your Facebook campaigns? Here's an example
You can track your Facebook communications and their impact on your web traffic directly in Google Analytics by putting UTMs at the end of your campaign URLs. If you are running advertising campaigns, we strongly advise you to take the time to specify the following elements for each of the landing pages:

UTM Source: facebook
UTM Medium: social
UTM campaign: the name of your campaign
UTM content: the content of your advertisement to see which version works best
How do I add UTM parameters to Facebook ads?
Go at the Ad level to set your URL Parameters. Click Build a URL Parameter under Website URL.

Google My Business Tracker Tip
For local SEO, using UTM tracking on a Google My Business listing is absolutely essential to better understand how your local SEO strategy contributes to your overall SEO goals. Before adding a UTM, you will see the visits of your GMB listing in the "direct" channel. Just add: [? Utm_source = GMBlisting & utm_medium = organic] at the end of your link to the Google My Business site and you're done.

Go further
We can use UTMs to track links to the site, to making appointments or even links in posts shared via Google My Business.

domain.com?utm_source=GMB&utm_medium=site
domain.com?utm_source=GMB&utm_medium=rdv
domain.com?utm_source=GMB&utm_medium=post