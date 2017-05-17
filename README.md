# CartograTree
## Installation
### Template
Create a template for the application page that 1) does not show the breadcrumbs, and 2) uses the whole width for the content.
1. Copy the page template from the theme (e.g., Bartik):
```bash
$ cd themes/bartik/templates
$ sudo cp page.tpl.php page--cartogratree.tpl.php
```
2. Remove the breadcrumbs, i.e., delete the following lines in **`page--cartogratree.tpl.php`**:
```
<?php if ($breadcrumb): ?>
  <div id="breadcrumb"><?php print $breadcrumb; ?></div>
<?php endif; ?>
```
3. Set the width of the content to 100%, i.e., add **` style="width:100%"`** to **`div id="main-wrapper"`** and **`div id="content"`** in **`page--cartogratree.tpl.php`**.
### OpenLayers3 files
Copy the `ol.js` and `ol.css` files in the `sites/all/libraries/openlayers` directory.
