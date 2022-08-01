# ![Icon](resources/icon.png) Rule34.XXX Enhanced Favorites

[![Install](resources/install.png)](R34.XXX%20Enhanced%20Favorites.user.js?raw=1) [![Support Me on Ko-fi](resources/kofi.png)](https://ko-fi.com/ganbat)

An overhaul of the favorites system used by Rule34.XXX with emphasis on useability.

This script is an extension of my earlier script, [R34.XXX Favorites Button](https://sleazyfork.org/en/scripts/440779-r34-xxx-favorites-button).

## Features

* Add favorites from search pages and other user's favorites
* Remove favorites from post pages and search pages
* Integration with [Image Board Enhancer](https://sleazyfork.org/en/scripts/387312-image-board-enhancer-rule34-gelbooru-e621-and-more)'s enhanced thumbnails (Requires right-click details enabled)

## Instructions for Use

Once the script is installed and you are logged in, add and remove favorite buttons will begin appearing on search pages and remove buttons will be available on posts.

If used by itself, the script will place simple text buttons below posts. If used with Image Board Enhancer with enhanced thumbnails and right-click details, add and remove buttons will be appear in the upper-left corner of the enhanced thumbnail popup.

In order for the script to recognize existing favorites, the local favorites list needs to be populated, and doing so automatically would be against the ToS of the site. To do this yourself, simply browse your existing favorites. Once a page of favorites is loaded, any missing favorites will be automatically added to the script's memory. After browsing all pages of your favorites, the script should be ready.

## Known Issues

* If used while browsing multiple tabs, local favorites may be lost. Favorites stored by the site will not be, and can be added to local storage by browsing your favorites page.
    * Workaround: Refresh pages before favoriting anything when using multiple tabs.
* If using Image Board Enhancer with enhanced thumbnails but without right-click details, the favorite button does not appear.
    * Workaround: Enable right-click details or disable enhanced thumbnails.