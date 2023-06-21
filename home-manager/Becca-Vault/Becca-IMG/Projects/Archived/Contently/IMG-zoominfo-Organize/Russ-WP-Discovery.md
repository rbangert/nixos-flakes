## Milestones

>[!success] **Security Policy** – Complete

>[!fail] Verify ZoomInfo functionality 

>[!fail] Build the 4 Pardot forms 

>[!fail] Create ZoomInfo layout with CSS styling

>[!fail] Deploy forms to Wordpress site

>[!question] Select a Google Task Manager integration 


---

>[!warning] **Discovering existing GTM-WP integration** – This doesn't exist.
 I spent 3+ hours, looking for something that was never there. This is often what making assumptions in this process results in. I made a mistake.

>[!attention] It appears we can manually insert the form links to meet the deadline
>- This ends up being more work
>- **The Amount of links** on WordPress may cause this to be an **unrealistic option**. 
>- **The amount of Campaigns** could also cause this to be an **unrealistic option.**

>[!todo] High Priority Tasks: 

 - Search for discussion on **404 errors involving zoominfo/wpengine.com?** ✅ 2023-01-21
 - [Do the Docs](https://university.zoominfo.com/catalog?labels=%5B%22ZoomInfo%20Product%22%2C%22Integrations%22%5D&query=&values=%5B%22MarketingOS%22%2C%22Pardot%22%5D) mention anything?
  - Locate logs for the Salesforce site, and FormComplete

---
### GTM integration

### The existing Pardot form Links are found on:
- All **Landing Pages** 
- Some **Flexible Pages**
- **Gated Pages** & **Uhub Pages** appear to be clear of links have links

##### Existing links are placed on the site, using the hero-4 template
- Only the **right hand side** of the table can be edited, the value in the left field, is **hardcoded into the template**. 
- We should be able to utilize this to manually insert the links, to meet the deadline.
  ![[Pasted image 20230120172526.png]]
  **The value from the input field on the right, is placed into the iframe that pulls the pardot form, as an environmental variable. `$pardot_form_url;`**

### Hero-4 template code:
>[!tip] This is where that input is placed into form link
```
<iframe 
                  src="https://info.contently.com/l/791483/<?php echo $pardot_form_url; ?>" 
                  width="100%" height="500" 
                  type="text/html" 
                  frameborder="0" 
                  allowTransparency="true" 
                  style="border: 0">              
                </iframe> 
```

>[!tip] template-parts/flexible-hero-4
```
<?php if ( have_rows('hero_4') ) { ?>
  <?php while ( have_rows('hero_4') ) { the_row(); ?>
    <?php 
      // Setting section styles.
      $section_classes = 'section hero4_layout';
      $section_styles = '';
      
      // Getting custom styles from "Section customization" ACF fields.
      $section_custom = section_customizer();
    ?>  
    <div 
      <?php if ("" !== $section_custom['ID']) { echo ' ' . 'id="' . $section_custom['ID'] . '"' . ' '; } ?>
      class="<?php echo $section_classes . $section_custom['classes']; ?>"
      style="<?php echo $section_styles. $section_custom['styles']; ?>"
      <?php 
        foreach( $section_custom['data'] as $key => $value ) {
          echo ' data-' . $key . '="' . $value . '"';
        }
      ?>
      >
      <?php section_animations(); ?>
      <?php
        $subtitle = get_sub_field('subtitle');
        $intro = get_sub_field('intro');
        $cta_button = get_sub_field('cta_button');
        $pardot_form_url = get_sub_field('pardot_form_url');
      ?>
      <div class="container-fluid lg">
        <div class="row">
          <div class="col-12 col-sm-8 offset-sm-2 col-md-6 offset-md-0">
            <div class="container-inner-left">
              <h1><?php the_sub_field('title'); ?></h1>
              <?php if ( '' !== $subtitle ) : ?>
              <div class="hero-subtitle"><?php echo $subtitle; ?></div>
              <?php endif; ?>
              <?php if ( '' !== $intro ) : ?>
              <div class="hero-intro"><?php echo $intro; ?></div>
              <?php endif; ?>
            </div>
          </div>
          <div class="col-12 col-sm-8 offset-sm-2 col-md-6 offset-md-0">
            <div class="container-inner-right">
              <div class="form-wrapper pardot-iframe">
                <iframe 
                  src="https://info.contently.com/l/791483/<?php echo $pardot_form_url; ?>" 
                  width="100%" height="500" 
                  type="text/html" 
                  frameborder="0" 
                  allowTransparency="true" 
                  style="border: 0">              
                </iframe>                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  <?php } ?>
<?php } ?>
```
 ```


```

---






