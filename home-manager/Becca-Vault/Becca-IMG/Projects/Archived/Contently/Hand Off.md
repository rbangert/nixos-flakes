So they wanted: 

- Switching from Clearbit to ZoomInfo Form Complete (this was the reason they gave me that they hired IMG)
- Forms Merged
- UTM Information coming through their site
- Campaigns Better Organized

Here is a Drive Folder with some of the resources:
https://drive.google.com/drive/folders/13I8wFW9c_2n0WbPXVKL3dmnm_R3RZpZw

There is one spreadsheet with all their forms, another spreadsheet that has all the forms active on their website. The original Pardot Form information + the new form link. If I switched them out. The blue were all one form we found, that was in the footer and had been switched out. 

ZoomInfo Pardot Integration: https://tech-docs.zoominfo.com/pardot-integration-guide.pdf
ZoomInfo Form Complete Guide: https://tech-docs.zoominfo.com/formcomplete-implementation-guide.pdf

This is their code snippet for Zoominfo. It was tested on multiple forms and was working: 
<script>  
window.ZIProjectKey = "efb02f5fac1672159830";  
var zi = document.createElement('script');  
(zi.type = 'text/javascript'),  
(zi.async = true),  
(zi.src = '[https://js.zi-scripts.com/zi-tag.js](https://js.zi-scripts.com/zi-tag.js)'),  
document.readyState === 'complete'?  
document.body.appendChild(zi):  
window.addEventListener('load', function() {  
document.body.appendChild(zi) });  
</script>

There is some clearbit stuff hanging around somewhere on their site, but I'm not 100% sure where and it wasn't causing problems after their Clearbit expired and things went live with ZoomInfo. 

Their Web Developer needs to update the code for UTM
<iframe src="http://go.pardot.com/l/93172/xxxx-xx-xx/6mcmdj" width="100%" height="500" type="text/html" frameborder="0" allowTransparency="true" style="border: 0" id="myiframe"></iframe>

<script type="text/javascript"> var iframe = document.getElementById('myiframe'); iframe.src = iframe.src + window.location.search; </script>

I switched it out with manual UTM information so they could see how the information was coming through before they merged the forms and had the UTM information being passed through from the iframe. 

The link on the pages I glanced at don't show the updated links I put in. So it looks like they changed at least a few of them back. 