

Beyond the Basics
1) Install Pardot AppExchange Application
2) Manage Business Units & Assign Admins
3) Turn on Pardot Lighting App in Salesforce
4) Manage Pardot Users from Salesforce
5) Setup Lighting Experience Email Builder
	1) Prerequisites - Make sure these settings are enabled. If your Pardot account was created after July 12, 2020, Connected Campaigns & HML are enabled by default.
		1) Connect Pardot & Salesforce Campaigns [link](https://help.salesforce.com/s/articleView?id=sf.campaigns_pardot_alignment_enable.htm&type=5)
		2) Upgrade to Handlebars Merge Language (HML) link in salesforce didn't work
		3) Set up a domain to host images with Salesforce CMS [link](https://help.salesforce.com/s/articleView?id=sf.pardot_eilex_setup_domain.htm&type=5)    #task4cedar
	2) Grant Admin & User Access [link](https://help.salesforce.com/s/articleView?id=sf.pardot_eilex_setup_user_perms.htm&type=5)
		1) Create Permission Set
			![[chrome_OeEMiAMdKM.png]]
		2) Assign Permission Set
	3) Configure CMS for Content Experience
		1) Create a workspace and channel  [link](https://help.salesforce.com/s/articleView?id=sf.pardot_eilex_setup_cms.htm&type=5)   #task4me-after Go to Marketing Setup > Content Setup > Open CMS > Enable Domain in question. Select the CMS Channel after.
		2) Select a channel to use with the Pardot content experience. (link in SF didn't work)
1) Configure Email & Tracker domains
	1) Email Domain: [link](https://help.salesforce.com/s/articleView?id=sf.mcae_email_add_domain.htm&type=5)
		1) Cedargate.com
		2) SPF  cedargate.com   TXT  v=spf1 include:aspmx.pardot.com ~all
		3) Validation Key     cedargate.com     txt      sending_domain1015272=4c83b56f0db1064704748ea684e5f07a26a8d4ab98cc3005ad30679b26f9548a
		4) DomainKey    200608._domainkey.cedargate.com     TXT     k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDGoQCNwAQdJBy23MrShs1EuHqK/dtDC33QrTqgWd9CJmtM3CK2ZiTYugkhcxnkEtGbzg+IJqcDRNkZHyoRezTf6QbinBB2dbyANEuwKI5DVRBFowQOj9zvM3IvxAEboMlb0szUjAoML94HOkKuGuCkdZ1gbVEi3GcVwrIQphal1QIDAQAB;
	2) Tracker Domain:
		1) http://go.cedargate.com
		2) pardot1015272=bbc4956a339ba51da41fa3e3fe47f3d2a9743fe6f8469dace5a7a7995fe32a34
2) Set Up Connected Campaigns [link](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/pardot_connected_campaigns_implementation_guide.pdf)
	1) Create two Campaigns #task4me-after #task4cedar (There isn't a new campaign record button)![[chrome_A2DKqCdaPW.png]]![[chrome_2mYVQjZJy7.png]]
		1) Website Tracking (this will get you the web tracking code)  
		2) Salesforce/Pardot Sync (this will be the campaign you add to the connector for when new leads/contacts are created as prospects automatically)
3) Unpause Connector to Begin Syncing Data [link](https://help.salesforce.com/s/articleView?id=sf.pardot_sf_connector_v2_setup_add_connector.htm&type=5)
4) Turn on Engagement History Dashboards [link](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/engagement_history_implementation_guide.pdf)

Create Domain for Enhanced Email
https://help.salesforce.com/s/articleView?id=sf.pardot_eilex_setup_domain.htm&type=5


https://help.salesforce.com/s/articleView?id=sf.pardot_eilex_setup_user_perms.htm&type=5