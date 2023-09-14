import * as file from "./file_functions.js";
import * as tag from "./tag_functions.js";
import * as ui from "./ui_functions.js";

export let clientKey = "",
    clientURL = "http://127.0.0.1:45869",
    clientFiles = [],
    client_named_Searches = [],
    menuTimeout, cursor_timeout,
    menuTimeout_delay = 2000,
    isResizingLSidebar = false,
    isResizingRSidebar = false,
    nav_increment = 1,
    panzoom_persist = false,
    floating_notes_persist = false,
    pointer_start = null,
    fitToggle = false;

let is_fullscreenchange_event = true;

const offcanvasElementList = document.querySelectorAll('.offcanvas');
const offcanvasList = [...offcanvasElementList].map(offcanvasEl => new bootstrap.Offcanvas(offcanvasEl));

const panzoom_elem = panzoom(document.querySelector('#filePlaceholder'), {
    bounds: true,
    boundsPadding: 0.4,
    maxZoom: 200,
    minZoom: 0.1,
    zoomDoubleClickSpeed: 1,
    filterKey: function (/* e, dx, dy, dz */) {
        // don't let panzoom handle this event:
        return true;
    }

});
panzoom_elem.pause();

const MAX_TIMER_INT = 2147483647;
const SWIPE_THRESHOLD = 30;
const sort_val_to_sort_int = {
    "0": [0, true],
    "1": [0, false],
    "2": [1, true],
    "3": [1, false],
    "4": [2, true],
    "5": [2, false], //api default
    "6": [3],
    "7": [4],
    "8": [5, true],
    "9": [5, false],
    "10": [6, true],
    "11": [6, false],
    "12": [7, true],
    "13": [7, false],
    "14": [8, true],
    "15": [8, false],
    "16": [9, true],
    "17": [9, false],
    "18": [10, true],
    "19": [10, false],
    "20": [11, true],
    "21": [11, false],
    "22": [12, true],
    "23": [12, false],
    "24": [13, true],
    "25": [13, false],
    "26": [14, true],
    "27": [14, false],
    "28": [15, true],
    "29": [15, false],
    "30": [16, true],
    "31": [16, false],
    "32": [18, true],
    "33": [18, false],
    "34": [19, true],
    "35": [19, false],
    "36": [20],
    "37": [100, false],
    "38": [100, true]
};
const floating_notes_styles = {
    "text shadow outline_BH": `
    .custom-body {
        text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;
        backdrop-filter: blur(2px);
    }

    .custom-header {
        font-weight: bold; 
   }`,

    "text shadow outline": `
    .custom-body {
        text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;
        backdrop-filter: blur(2px);
    }`,

    "dark transclucent_BH": `
    .custom-body {
        background: #0000006b;
        box-shadow: 0 0 0.5em 0.5em #0000006b;
        backdrop-filter: blur(2px);
    }

    .custom-header {
         font-weight: bold; 
    }`,

    "dark transclucent": `
    .custom-body {
        background: #0000006b;
        box-shadow: 0 0 0.5em 0.5em #0000006b;
        backdrop-filter: blur(2px);
    }`,

    "what": `
    .custom-body {
        backdrop-filter: blur(2px);
    }

    .custom-header{
        font-family: sans-serif;
        font-weight: bold; 
        letter-spacing: 0.15rem;
        color: #fff;
        text-shadow: -4px 4px #ef3550,
                     -8px 8px #f48fb1,
                     -12px 12px #7e57c2,
                     -16px 16px #2196f3,
                     -20px 20px #26c6da,
                     -24px 24px #43a047,
                     -28px 28px #eeff41,
                     -32px 32px #f9a825,
                     -36px 36px #ff5722;
      
    }

    .custom-content {
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: #ff0000;
        -webkit-text-fill-color: #f2ff00;
        font-family: 'Comic Sans MS', cursive, sans-serif;
        text-shadow: 4px 4px 4px #00ffee;
    }
    `
}

clientKey = localStorage["clientKey"];
clientURL = localStorage["clientURL"];
$.ajaxSetup({
    headers: { "Hydrus-Client-API-Access-Key": localStorage["clientKey"] },
    error: function (err) { console.error(err) },
    success: function (res) { console.debug(res) }
});

if (localStorage["command"] != undefined) { $("#command").val(localStorage["command"]); }
if (localStorage["clientKey"] != undefined) { $("#clientKey").val(localStorage["clientKey"]); }
if (localStorage["clientURL"] != undefined) { $("#clientURL").val(localStorage["clientURL"]); }
if (localStorage["custom_namespace"] != undefined) { $("#custom_namespace").val(localStorage["custom_namespace"]); }
if (localStorage["sort_order"] != undefined) { $("#sort_order").val(localStorage["sort_order"]); }
if (localStorage["jump_files_by"] != undefined) { $("#jump_files_by").val(localStorage["jump_files_by"]); nav_increment = parseInt(localStorage["jump_files_by"]); }
if (localStorage["floating_notes_css"] != undefined) { $("#floating_notes_css").val(localStorage["floating_notes_css"]); $("#notesCSS").html(floating_notes_styles[localStorage["floating_notes_css"]]); }
if (localStorage["floating_notes_checkbox"] != undefined) {
    floating_notes_persist = localStorage["floating_notes_checkbox"] === "true" ? true : false;
    $("#floating_notes_checkbox").prop("checked", floating_notes_persist);

}

if (localStorage["hideSidebarDelay"] != undefined) {
    $("#sidebarDelay").val(localStorage["hideSidebarDelay"]);
    menuTimeout_delay = localStorage["hideSidebarDelay"];
} else {
    $("#sidebarDelay").val("2000");
    menuTimeout_delay = 2000;
}

$("#sidebarDelay").on("keyup", function (event) {
    localStorage.setItem("hideSidebarDelay", $(event.target).val());
    menuTimeout_delay = $(event.target).val();
});

$("#custom_namespace").on("keyup", function (event) {
    localStorage.setItem("custom_namespace", $(event.target).val());
});

$("#floating_notes_css").on("change", function (event) {

    localStorage.setItem("floating_notes_css", $(event.target).val());
    $("#notesCSS").html(floating_notes_styles[$(event.target).val()]);
});

$(document).on('keydown', (e) => {
    if (e.repeat) return;

    if (e.key === "Shift") {
        panzoom_elem.resume();
        $("[for='zoomToggle']").addClass("active");

    }
});

$(document).on('keyup', (e) => {

    if (e.key === "Shift") {
        panzoom_elem.pause();
        $("[for='zoomToggle']").removeClass("active");

        if (!panzoom_persist) {
            // resetZoom(panzoom_elem);
            // setTimeout(() => {
            //     $("#filePlaceholder").removeAttr("style");
            // }, 50);
        }
    }
});

$(".popup select").on("change", function (e) {
    const notes = file.navFile(0, true)?.notes;
    if (Object.keys(notes).length === 0 || notes === undefined) { return; }
    const keys = Object.keys(notes);
    $(".popup-header span").text(keys[parseInt($(e.target).val())]);
    $(".popup-content p").text(notes[keys[parseInt($(e.target).val())]]);

});


$("#zoomToggle").on("change", (e) => {
    if ($(e.target).is(':checked')) {
        panzoom_elem.resume();
    } else {
        panzoom_elem.pause();
        if (!panzoom_persist) {
            resetZoom(panzoom_elem);
            setTimeout(() => {
                $("#filePlaceholder").removeAttr("style");
            }, 50);
        }
    }
});

$("#window_fitToggle").on("change", (e) => {
    if ($(e.target).is(':checked')) {
        fitToggle = true;
        const currentFile = "";
        extendToWindow(currentFile);
        //FIXME: tell the scrollNav() to scroll when end of image has been reached.
        //TODO: convert vertical scroll into horizontal scroll so the mouse scroll and scroll just fine.
        //maybe rotate the container and image 90 degrees?

        //call this each time navFile() is called to update the $("#filePlaceholder div *").css()
        //call this on viewport resize

    } else {
        fitToggle = false;
        resetFit();
    }

    function extendToWindow(file) {
        //the overflow works fine when fit
        //nav() fires before scroll down
        //it allows scroll up THEN nav() fires.
        $("#fileCanvas").css({
            "position": "absolute",
            "overflow": "auto",
            "-ms-overflow-style": "none",
            "scrollbar-width": "none"
        });
        //calculate if file is tall or wide
        //file.videoWidth > file.videoHeight
        if (file.naturalWidth > file.naturalHeight) {
            //if wide
            $("#filePlaceholder div *").css({
                "width": "initial",
                "height": "100%"
            });
        } else {
            //if tall
            $("#filePlaceholder div *").css({
                "width": "100%",
                "height": "initial"
            });
        }
    }

    function resetFit() {
        $("#filePlaceholder div *").removeAttr('style');
    }


});

$("#panzoom_persist").on("change", (e) => {
    if ($(e.target).prop("checked")) {
        panzoom_persist = true;
    } else {
        panzoom_persist = false;
    }
});

$("#floating_notes_checkbox").on("change", (e) => {
    if ($(e.target).prop("checked")) {
        floating_notes_persist = true;
        localStorage.setItem("floating_notes_checkbox", $(e.target).prop("checked"));
        ui.loadFileNotes(file.navFile(0, true));
    } else {
        floating_notes_persist = false;
        localStorage.setItem("floating_notes_checkbox", $(e.target).prop("checked"));
        ui.loadFileNotes(file.navFile(0, true));
        $(".popup").addClass("d-none");
    }
});

$("#committags").on("click", function () { tag.commitTags(); });

$("#tagRepositoryList , #displayTagToggle").each(function (i, v) {
    $(v).on("change", function (e) {
        ui.loadFileTags(file.navFile(0, true));
    });
});

$(document).on("pointerdown", function (e) {
    if ($(e.target).is("#leftSidebarDraggable")) {
        isResizingLSidebar = true;
    } else if ($(e.target).is("#rightSidebarDraggable")) {
        isResizingRSidebar = true;
    }

    if ($(e.target).parents("#fileCanvas")[0]) {//swipe nav
        pointer_start = e;
    }


});

$(document).on("pointerup", function (e) {
    if ((isResizingLSidebar || isResizingRSidebar)) { //if resizing sidebar

        isResizingLSidebar = false;
        isResizingRSidebar = false;

        // const sidebarLheight = parseInt($('#leftSidebarMenu').css("height"));
        const sidebarLwidth = parseInt($('.leftSidebar').css("width"));
        const sidebarRwidth = parseInt($('.rightSidebar').css("width"));

        // if (sidebarLheight > window.innerHeight - 15) {
        //     $('#leftSidebarMenu').css("height", window.innerHeight - 15 + 'px');
        // } else if (sidebarLheight < 15) {
        //     $('#leftSidebarMenu').css("height", 15 + 'px');
        // }

        if (sidebarLwidth < 20) {
            $('.leftSidebar').css("width", 20 + 'px');
        } else if (sidebarLwidth > window.innerWidth - 20) {
            $('.leftSidebar').css("width", window.innerWidth - 20 + 'px');
        }

        if (sidebarRwidth < 20) {
            $('.rightSidebar').css("width", 20 + 'px');
        } else if (sidebarRwidth > window.innerWidth - 20) {
            $('.rightSidebar').css("width", window.innerWidth - 20 + 'px');
        }

    } else {
        if ($(e.target).parents("#fileCanvas")[0]) {
            let pointer_end = e;
            const directionX = pointer_end.screenX - pointer_start.screenX;
            //don't nav while zooming, but allow toggleUI()
            if (directionX < SWIPE_THRESHOLD && directionX > -(SWIPE_THRESHOLD)) {
                toggleUI();
            } else {
                if (panzoom_elem.isPaused()) {
                    if (directionX > SWIPE_THRESHOLD) { //+, swipe left
                        file.navFile(-1);
                    }
                    else if (directionX < -(SWIPE_THRESHOLD)) { //-, swipe right
                        file.navFile(1);
                    }
                }
            }

        }
    }
});

$('#fileCanvas').on('touchmove', function (e) {
    e.preventDefault(); //allow swipenav by passing touch to pointer event
});

$(document).on("shown.bs.collapse", (e) => {
    adjustDraggableHeight();
});

$(document).on("hidden.bs.collapse", (e) => {
    adjustDraggableHeight();
});

$("#rightSidebar").on('shown.bs.offcanvas', () => {
    bootstrap.ScrollSpy.getInstance($("#file_info_notefield")).refresh();
});

$(document).on("pointermove", function (e) {
    if (!(isResizingLSidebar || isResizingRSidebar)) { //if not resizing sidebar
        $("#fileCanvas").removeClass("nocursor");
        clearTimeout(cursor_timeout);
        cursor_timeout = setTimeout(() => {
            if (!($("#leftSidebar, #rightSidebar").hasClass("show"))) {
                $("#fileCanvas").addClass("nocursor")
            }
        }, menuTimeout_delay);
        return;
    } else {
        if (isResizingLSidebar) {
            if (e.clientX > (window.innerWidth * 0.2) &&
                e.clientX < (window.innerWidth * 0.8)
            ) {
                $('.leftSidebar').css("width", e.clientX + 'px');
            }
        }
        if (isResizingRSidebar) {
            if (e.clientX > (window.innerWidth * 0.2) &&
                e.clientX < (window.innerWidth * 0.8)
            ) {
                $('#rightSidebar').css("width", (window.innerWidth - e.clientX) + 'px');
            }
        }
    }
});

$(".menu-submenu").on("click", function (e) {
    const popout = $(e.target).parent().find(".div-popout");
    if (popout.is(":visible")) {
        popout.hide();
    } else {
        popout.show();
    }
});

export function loading_error() {
    $(".progress").show().removeClass("border-secondary").addClass("border-danger");
    $(".progress-bar").removeClass("bg-secondary").addClass("bg-danger")

    setTimeout(() => {
        $("#progress_bar").hide();
        $("#progress_bar_status").text("");
    }, 10000);
    return;
}

$("#submitButton").on("click", function () {
    $("#progress_bar").show();
    $("#progress_bar_status").text("");
    $(".progress").removeClass("border-danger").addClass("border-secondary");
    $(".progress-bar").removeClass("bg-danger").addClass("bg-secondary")
    $(".progress-bar").css("width", `0%`);
    $(".popup").addClass("d-none");

    $("#filePlaceholder *").remove();
    $("#filePlaceholder *").removeClass("visible").addClass("hidden");
    file.currentPos.x = 0;
    file.currentPos.y = 0;
    clientFiles = [];
    client_named_Searches = [];
    const order = sort_val_to_sort_int[$("#sort_order").val()]

    try {

        const input = JSON.parse($("#command").val());
        $("#command").val(JSON.stringify(input, null, 4));

        const map = new Map(Object.entries(input));

        let searches = [];
        $("#jump_to_search_name option").remove();
        $("#jump_to_search_number").prop("max", map.size);


        for (const search_name of map.keys()) {
            searches.push(map.get(search_name));

            let index = client_named_Searches.push(search_name) - 1;
            $("#jump_to_search_name").append(
                $('<option/>', { 'value': index }).text(search_name)
            );
        }

        ui.getFileMetaData(searches, order[0], order[1]);
        console.debug(JSON.stringify(searches));

    } catch (e) {
        console.log(e);
        if (e instanceof SyntaxError) {
            error_textInput($("#command"), "Search error: JSON Syntax error. Check your search input.");
        } else {
            error_textInput($("#command"), e);
        }

        return;
    }

});

testClient();

export function set_clientFiles(files) {
    clientFiles = files;
}

function testClient() {
    $.ajax({
        // url: clientURL + `/get_services`,
        url: clientURL + `/verify_access_key`,
        dataType: 'json',
        crossDomain: true,
        method: "GET"
    }).done(function () {
        $("#clientStatus").text("Success").css("color", "lime");

        $.ajax({
            url: clientURL + `/get_services`,
            dataType: 'json',
            crossDomain: true,
            method: "GET"
        }).done((data) => {
            const tag_repos_elem = $("#tagRepositoryList");
            tag_repos_elem.find("*").remove();
            const all_known_tags = data["all_known_tags"][0];
            const remote_tag_services = data["tag_repositories"];
            const local_tag_services = data["local_tags"];
            const local_tags_elem = $("<optgroup/>", { "label": "local tag services" });
            const remote_tags_elem = $("<optgroup/>", { "label": "remote tag services" });

            for (const service of local_tag_services) {
                local_tags_elem.append(
                    $("<option/>", { "value": service.service_key }).text(service.name)
                );
            }

            for (const service of remote_tag_services) {
                remote_tags_elem.append(
                    $("<option/>", { "value": service.service_key }).text(service.name)
                );
            }

            tag_repos_elem.append($("<option/>", { "value": all_known_tags.service_key }).text(all_known_tags.name));
            tag_repos_elem.append(local_tags_elem);
            tag_repos_elem.append(remote_tags_elem);
        });
    }).fail(function () {
        $("#clientStatus").text("Fail").css("color", "red");
    });
    return;
}



//fill information and show element - instead of destroying and creating a new one on the fly for memory saving (reflows).
//bug: when navigating from elemX to elemY, the file can take a bit to load - while still showing the previous file.
//fix DONE: remove src before hiding so that while it loads user does not see anything. Added loading CSS for inbetween files
//implement preloading system to load files ahead of time so that it shows as soon as user navs to it. (navRandomFile excluded - for that clear the preload and preload those next / prev to it. Repeat each time navRandomFile is called.)
//for preload maybe use an array of elemX where the currently viewing file is in the middle? eg. elemP = [<p>,<p>,<p>,<p>,<p>]
//Preloading is definitely needed, issue lies in the browser rendering the image: https://i.imgur.com/pJxzDFB.png
//definitely need metadata to handle preloading of different file types instead of doing it one by one
//preload next image while user is looking at current image.
//DONE: copying floogulinc's hydrus.app method by preloading images (without display:none!) out of view.
//turns out the tall orange test image is still taking a while to load.

//keyboard nav
$(document).on("keyup", (event) => {
    if ($(".leftSidebar").find(event.target)[0]) {//if leftSidebar

        if ($("#clientKey").is(event.target)) {
            $.ajaxSetup({
                headers: { "Hydrus-Client-API-Access-Key": $(event.target).val() }
            });
            clientKey = $(event.target).val();
            localStorage.setItem("clientKey", $(event.target).val());
            testClient();
        }

        if ($("#clientURL").is(event.target)) {
            clientURL = $(event.target).val().replace(/(http(|s):\/\/.*(|:.*?))(\/)$/gm, `$1`);
            localStorage.setItem("clientURL", clientURL);
            testClient();
        }

        if ($("#command").is(event.target)) {
            localStorage.setItem("command", $(event.target).val());
        }

        return;
    }

    if ($(".rightSidebar").find(event.target)[0]) {
        event.preventDefault();

        return;
    }

    if (event.key === "ArrowLeft") { //left
        event.preventDefault();
        if (event.shiftKey) {
            file.navFile(-(nav_increment));
        } else {
            file.navFile(-1);
        }
    }
    else if (event.key === "ArrowRight") { //right
        event.preventDefault();
        if (event.shiftKey) {
            file.navFile(nav_increment);
        } else {
            file.navFile(1);
        }
    } else if (event.key === "R" || event.key === "r") {
        event.preventDefault();
        file.navRandomFile();
    } else if (event.key === "F" || event.key === "f") {
        event.preventDefault();
        toggleFullscreen();
    }

});

$("#fullscreen_mode").on("change", (e) => {
    if (is_fullscreenchange_event) {
        toggleFullscreen();
    }
});

function toggleFullscreen() {
    is_fullscreenchange_event = false;
    if (document.fullscreenElement === null) {
        document.body.requestFullscreen();
        $("#fullscreen_mode").prop("checked", true);
    } else {
        document.exitFullscreen();
        $("#fullscreen_mode").prop("checked", false);
    }
    is_fullscreenchange_event = true;
    return;
}

$("#jump_files_by").on("change", (e) => {
    nav_increment = parseInt($(e.target).val());
    localStorage.setItem("jump_files_by", $(e.target).val());
});

$("#sort_order").on("change", (event) => {
    localStorage.setItem("sort_order", $(event.target).val());
});

$("#file_next").on("click", () => {
    file.navFile(1);
});
$("#file_previous").on("click", () => {
    file.navFile(-1);
});
$("#file_random").on("click", () => {
    file.navRandomFile();
});

$("#jump_to_search_number").on("input", (e) => {
    $($("#jump_to_search_name").children("option")[parseInt($(e.target).val()) - 1]).prop("selected", true);
});
$("#jump_to_search_name").on("change", (e) => {
    $("#jump_to_search_number").val(parseInt($(e.target).val()) + 1);
    $("#file_length").text(`of ${clientFiles[parseInt($(e.target).val())].length} files`);
});

$("#submit_jump").on("click", () => {
    const x = $("#jump_to_file_number");
    const y = $("#jump_to_search_number");
    if (!(/^\d*$/.test(x.val()))) {
        error_textInput(x);
        return;
    }
    if (!(/^\d*$/.test(y.val()))) {
        error_textInput(y);
        return;
    }
    file.jumpToFile(parseInt(y.val() - 1), parseInt(x.val() - 1));
});

$("#file_jump_next").on("click", () => {
    file.navFile(nav_increment);
});

$("#file_jump_previous").on("click", () => {
    file.navFile(-(nav_increment));
});

$("#fileCanvas").on('click', function (event) {
    offcanvasList.forEach((v) => { v.hide(); });
})

new bootstrap.ScrollSpy($("#file_info_notefield"), {
    target: $("#file_info_notes")
});

$("#file_info_notefield").on("activate.bs.scrollspy", function (e) {
    const active_note = $("#file_info_notes li .active").text();
    const note_button_label = $("#file_info_notes span");
    note_button_label.text(active_note).prop("title", active_note);
});

//scroll nav
//NOTE:uncomment me once panzoom has been implemented properly
$("#fileCanvas").on('mousewheel', function (event) {
    if (event.ctrlKey) { event.preventDefault(); }
    // if(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey){
    //     return;
    // }
    // if ($(".leftSidebar").find(event.target)[0]) { return; }
    if (panzoom_elem.isPaused()) {
        if (!fitToggle) {
            if (event.originalEvent.wheelDelta / 120 > 0) {//scroll up
                file.navFile(-1);
            }
            else { //scroll down
                file.navFile(1);
            }
        } else { }
    }
});

export function error_textInput(input_elem, error_msg) {
    const elem = $(input_elem);
    elem.css("background-color", "red");
    setTimeout(() => {
        elem.css("background-color", "");
        $("#progress_bar").hide();
    }, 10000);

    if (error_msg) {
        console.error(error_msg);
        $("#progress_bar_status").text(error_msg);
    }

    return;
}

function resetZoom(instance) {
    instance.showRectangle($("#fileCanvas")[0].getBoundingClientRect());
    instance.moveTo(0, 0);
}

function adjustDraggableHeight() {
    $("#leftSidebarDraggable").css("height", `${$("#leftSidebar .accordion").height()}px`)
    $("#rightSidebarDraggable").css("height", `${$("#rightSidebar .accordion").height()}px`)
}

function toggleUI() {
    clearTimeout(menuTimeout);
    $("[for=zoomToggle], [for=window_fitToggle], #leftSidebarToggle, #rightSidebarToggle").fadeIn(400);

    menuTimeout = setTimeout(() => {
        $("[for=zoomToggle], [for=window_fitToggle], #leftSidebarToggle, #rightSidebarToggle").fadeOut(400);
    }, menuTimeout_delay);
}

function initDragElement() { //https://stackoverflow.com/a/72293914/5791312
    //TODO: add resizer elems back (maybe on top and left side as well?)
    //TODO: figure out how to keep floating div in viewport on window resize
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    var popups = document.getElementsByClassName("popup");
    var elmnt = null;

    for (var i = 0; i < popups.length; i++) {
        var popup = popups[i];
        var header = getHeader(popup);

        if (header) {
            header.parentPopup = popup;
            header.onpointerdown = dragMouseDown;
        }
    }

    $('.popup-header').on('touchmove', function (e) {
        e.preventDefault(); //allow swipenav by passing touch to pointer event
    });

    function dragMouseDown(e) {
        elmnt = this.parentPopup;

        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        $(document).on("pointerup", closeDragElement);
        // call a function whenever the cursor moves:
        $(document).on("pointermove", elementDrag);
    }

    function elementDrag(e) {

        if (!elmnt) {
            return;
        }

        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // set the element's new position:
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        $(document).off("pointerup", closeDragElement);
        $(document).off("pointermove", elementDrag);
    }

    function getHeader(element) {
        var headerItems = element.getElementsByClassName("popup-header");
        if (headerItems.length === 1) {
            return headerItems[0];
        }

        return null;
    }
}
$(document).ready(function () {
    if ("serviceWorker" in navigator) {
        window.addEventListener('load', async () => {
            navigator.serviceWorker.register("/service-worker.js").then((registration) => {
                console.log("Service Worker registered with scope:",
                    registration.scope);
            }).catch((err) => {
                console.error("Service worker registration failed:", err);
            });
        });
    }else{console.error("does not support service worker!");}
    
    initDragElement();
});



