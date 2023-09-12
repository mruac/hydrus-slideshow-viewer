2nd try, start VERY basic then add features later
first try making something with jquery

{
    "test notes": [
        "system:num notes> 1",
        "test3"
    ]
}

* [X] Start off with fetching and loading the actual tags:
* [X] text entry for user input of tag searches.
* [X] window (do small for now!) for image viewing
* [X] function to handle image loading without hogging memory (Looking into preloading atm)
    * Done, this should be "hogging user waiting time" while the images load upon pressing "search". This was accomplished by loading the next and previous 50 files into memory, then loading more as the user navigates nearer to those 50 images. (`filemetadata["elem"] = loadFile(filemetadata)`)

    NOTE: This is a possible point where the user's memory may run out due to not dumping the loaded images that are in memory. A possible solution for this is to dump the image if it is WAY out of view, eg. 500 files away from currentPos, using `delete filemetadata["elem"]`. Hopefully the `delete` keyword puts the jquery element object into the garbage collector.

    ```
    Local variables are released for garbage collection when they are no longer accessible.

    ```
* [X] navigation (next, prev, shuffle) Add shuffle mode (random mode added. User can just keep using random navigation to "shuffle")
* [X] Prevent textarea being expanded beyond the sidebar
    * Solution: Prevent horizontal adjustment but allow vertical adjustment

Additional features:
* [X] indicate which tag search the current file belongs to
* [X] loading icon when starting a new search - I don't want to see the last search while waiting.
* [X] jumping to another picture
* [ ] jumping to another tag search
* [X] jumping to specified page number (Eg: "page [] of the []'nd search result" to use the currentPos feature)
* [ ] viewing all results in gallery
    * Gallery view of all page results, using my new lazyloading technique (load elems into memory then attach to page.) - requires /get_files/thumbnail for thumbnail image.
* [X] editing tag for current picture
* [X] Sort files (replicate hydrus sort system, especially by tags: character> series> title> volume> chapter> page
* [X] Allow "naming" a search to make referring to complicated searches more easier.
    Use JSON input in the #command instead of array of searches - This 
* [ ] Load results as soon as the first available results are available, rather than waiting for all results to be available. This will save time on waiting to load on particularly large searches.
* [X] Add Loading bar to show progress of all the ajax calls to download the file metadatas
* [X] Autoplay media, by default they loop, and volume is set to 50%.

Mobile mode:
- [X] Swipe left/right for next/previous file. The next/previous file can be seen as it enters the viewport while swiping. If the swipe exceeds the defined limit, bring the peeking file into view. If the swipe does not exceed the limit, reset the swipe and restore the view. (see: hydrus web, SwiperJS navigation demo) - (implemented without viewing the next image)
- [X] Single tap to show sidebar buttons. Tapping on sidebar buttons opens their sidebar.
- [X] Pinch to zoom in/out. While zooming, go to next/previous file if a swipe exceeds the panzoom element's boundary limits. (Essentially "forcing" the swipe left/right while zoomed in/out, and the media is at the borders.)
- [ ] Add floating notes viewer - shown when UI is visible, hidden when UI is hidden. https://stackoverflow.com/a/47596086/5791312
- [X] Add Shift + right/left to "jump" files by (eg. 5 or 10)
- [X] Update "by search number or name" fields to the current file number / name
- [ ] FIXME: Prevent fetching files from file_metadata if search_files return `[]`
- [ ] TODO: Skip search if there is nothing to search. (Eg: {"Empty search":[]})
- [ ] TESTME: Fixed? Revise error message to include the name of the failed search name.
- [X] Remember last used settings: sort order, etc
- [ ] FIXME: Navigation does not work on mobile
- [ ] TODO: Disable panzoom if mobile UI is detected, as users can manually do the pinch and zoom themselves
- [X] implement sticky note titles
- [ ] add smooth js scroll when pressing up/down to scroll floating note / sidebar up/downk
- [ ] reload file (and include "excluded" message if no longer matching search) after submitting tags
- [X] add fullscreen toggle for mobile 
- [ ] add "fit to window" option - if reached end of image and the swipe / scroll is triggered, go to next/prev file. (bottom = next / top = prev, right = next / left = prev)

```
{"p": ["system:hash = a951e9fcad5bb7fe8a4f145d97d51ce08ba6e29e95a6d9bc2d3c12a87c7797b3"]}
```
