2nd try, start VERY basic then add features later
first try making something with jquery

* [X] Start off with fetching and loading the actual tags:
* [X] text entry for user input of tag searches.
* [X] window (do small for now!) for image viewing
* [X] function to handle image loading without hogging memory (Looking into preloading atm)
    * Done, this should be "hogging user waiting time" while the images load upon pressing "search". This was accomplished by loading the next and previous 50 files into memory, then loading more as the user navigates nearer to those 50 images. (`filemetadata["elem"] = loadFile(filemetadata)`)

    NOTE: This is a possible point where the user's memory may run out due to not dumping the loaded images that are in memory. A possible solution for this is to dump the image if it is WAY out of view, eg. 100 files away from currentPos, using `delete filemetadata["elem"]`. Hopefully the `delete` keyword puts the jquery element object into the garbage collector.

    ```
    Local variables are released for garbage collection when they are no longer accessible.

    ```
* [ ] navigation (next, prev, shuffle) TODO: Add shuffle mode
* [ ] FIXME: Prevent textarea being expanded beyond the sidebar
    * Solution: Prevent horizontal adjustment but allow vertical adjustment

Additional features:
* [X] indicate which tag search the current file belongs to
* [X] loading icon when starting a new search - I don't want to see the last search while waiting.
* [ ] jumping to another picture
* [ ] jumping to another tag search
* [ ] jumping to specified page number (Eg: "page [] of the []'nd search result" to use the currentPos feature)
* [ ] viewing all results in gallery
    * Gallery view of all page results, using my new lazyloading technique (load elems into memory then attach to page.) - requires /get_files/thumbnail for thumbnail image.
* [] editing tag for current picture
* [ ] Sort files (replicate hydrus sort system, especially by tags: character> series> title> volume> chapter> page

Mobile mode:
- [ ] Swipe left/right for next/previous file. The next/previous file can be seen as it enters the viewport while swiping. If the swipe exceeds the defined limit, bring the peeking file into view. If the swipe does not exceed the limit, reset the swipe and restore the view. (see: hydrus web, SwiperJS navigation demo)
- [ ] Single tap to show sidebar buttons. Tapping on sidebar buttons opens their sidebar.
- [ ] Pinch to zoom in/out. While zooming, go to next/previous file if a swipe exceeds the panzoom element's boundary limits. (Essentially "forcing" the swipe left/right while zoomed in/out, and the media is at the borders.)
