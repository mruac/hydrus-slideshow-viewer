//mobile.js
//mobile cannot detect pointerup and pointerdown, only pointermove
//this js file will focus on the touchevents for swiping
let pointer_start = undefined;
const SWIPE_THRESHOLD = 30;
let isResizingLSidebar = false;
let isResizingRSidebar = false;
import * as file from "./file_functions.js";
import * as tag from "./tag_functions.js";
import * as ui from "./ui_functions.js";

$('#fileCanvas').on('touchmove', function (e) {
  e.preventDefault();
//   console.log(e);
});
