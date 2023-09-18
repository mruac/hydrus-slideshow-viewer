# Hydrus Slideshow Viewer
<p align="center">
  <img src="icons/android-chrome-192x192.png" />
</p>

Hydrus Slideshow Viewer (HSV) is a slideshow web application for your [Hydrus Client](https://github.com/hydrusnetwork/hydrus), which must be accessible over the network.

## Features
- Installable or Self Hostable
    - Visit and use the [site](https://mruac.github.io/hydrus-slideshow-viewer), then [Install](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_pwas)
    - Self-host with NodeJS
    ```bash
    cd /path/to/repository/
    npm install
    node app.js
    # access at https://127.0.0.1:3415
    ```
- Works without the internet (All information is processed client-side)
- Shows multiple _named_ searches side by side, in slideshow format  
  ![](md_images/image-1.png)
- Draggable/resizeable floating notes  
  ![](md_images/image.png)
- Navigation features (skip by x files, random, jump to search)  
  ![](md_images/image-2.png)
- Edit tags for the current file (Only editable in "Actual tags")  
  ![](md_images/image-3.png)