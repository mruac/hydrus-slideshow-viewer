/*
test2
character:patches (toastycommander)
test

title:c95新刊
 */

import * as file from "./file_functions.js";
import * as tag from "./tag_functions.js";
import * as ui from "./ui_functions.js";

export let clientKey = "",
    clientURL = "http://127.0.0.1:45869",
    clientFiles = undefined,
    menuTimeout,
    menuTimeout_delay = 2000,
    isResizingLSidebar = false,
    isResizingRSidebar = false,
    nav_increment = 1,
    panzoom_persist = false,
    pointer_start = null;

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
}

clientKey = localStorage["clientKey"];
clientURL = localStorage["clientURL"];
$.ajaxSetup({
    headers: { "Hydrus-Client-API-Access-Key": localStorage["clientKey"] },
    error: function (err) { console.error(err) },
    success: function (res) { console.debug(res) }
});

$("#command").val(localStorage["command"]);
$("#clientKey").val(localStorage["clientKey"]);
$("#clientURL").val(localStorage["clientURL"]);

if (localStorage["hideSidebarDelay"] != undefined) {
    $("#sidebarDelay").val(localStorage["hideSidebarDelay"]);
    menuTimeout_delay = localStorage["hideSidebarDelay"];
} else {
    $("#sidebarDelay").val("2000");
    menuTimeout_delay = 2000;
}

$(window).bind('beforeunload', function () {
    return "Do you want to exit this page?";
});

$("#sidebarDelay").on("keyup", function (event) {
    localStorage.setItem("hideSidebarDelay", $(event.target).val());
    menuTimeout_delay = $(event.target).val();
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

$("#panzoom_persist").on("change", (e) => {
    if ($(e.target).prop("checked")) {
        panzoom_persist = true;
    } else {
        panzoom_persist = false;
    }
});

$("#committags").on("click", function () { tag.commitTags(); });

$("#tagRepositoryList , #displayTagToggle").each(function (i, v) {
    $(v).on("change", function (e) {
        ui.loadFileTags(file.navFile(0, true));
    });
});

$("#file_info_notes").on("change", function (e) {
    ui.loadNote(file.navFile(0, true), $(e.target).val());
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

$(document).on("shown.bs.collapse", (e) => {
    adjustDraggableHeight();
});

$(document).on("hidden.bs.collapse", (e) => {
    adjustDraggableHeight();
});

$(document).on("pointermove", function (e) {
    if (!(isResizingLSidebar || isResizingRSidebar)) { //if not resizing sidebar
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

$("#submitButton").on("click", function () {
    $(".dot-flashing").show();
    $("#filePlaceholder *").remove();
    $("#filePlaceholder *").removeClass("visible").addClass("hidden");
    file.currentPos.x = 0;
    file.currentPos.y = 0;
    clientFiles = undefined;
    const order = sort_val_to_sort_int[$("#sort_order").val()]
    //get list of searches, split by newline, and remove any blank searches
    let searches = $("#command").val().split("\n").filter(search => search.trim().length > 0);
    if (searches.length === 0) {
        error_textInput($("#command"));
        return;
    }

    //split it further for the tags, by the comma - excluding escaped commas and square brackets (for OR searches)
    for (let i = 0; i < searches.length; i++) {
        // searches[i] = searches[i].split(/(?<!\\),/).filter(tag => tag.trim().length > 0);
        // for (let ii = 0; ii < searches[i].length; ii++) {
        //     searches[i][ii] = searches[i][ii].trim();
        // }
        try {
            searches[i] = JSON.parse(searches[i]);
        } catch {
            error_textInput($("#command"));
            return;
        }
    }


    ui.getFileMetaData(searches, order[0], order[1])
    console.debug(JSON.stringify(searches));
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

        if ($("#jump_files_by").is(event.target)) {
            nav_increment = parseInt($(e.target).val());
        }

        return;
    }

    if (event.key === "ArrowLeft") { //left
        event.preventDefault();
        file.navFile(-1);
    }
    else if (event.key === "ArrowRight") { //right
        event.preventDefault();
        file.navFile(1);
    }

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

//scroll nav
//NOTE:uncomment me once panzoom has been implemented properly
$("#fileCanvas").on('mousewheel', function (event) {
    if (event.ctrlKey) { event.preventDefault(); }
    // if(event.ctrlKey || event.altKey || event.metaKey || event.shiftKey){
    //     return;
    // }
    // if ($(".leftSidebar").find(event.target)[0]) { return; }
    if (panzoom_elem.isPaused()) {
        if (event.originalEvent.wheelDelta / 120 > 0) {//scroll up
            file.navFile(-1);
        }
        else { //scroll down
            file.navFile(1);
        }
    }
});

export function error_textInput(input_elem, error_msg) {
    const elem = $(input_elem);
    elem.css("background-color", "red");
    setTimeout(() => {
        elem.css("background-color", "")
    }, 1000);

    if (error_msg) {
        console.error(error_msg);
    }

    $(".dot-flashing").hide();

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
    $("[for=zoomToggle], #leftSidebarToggle, #rightSidebarToggle").fadeIn(400);

    menuTimeout = setTimeout(() => {
        $("[for=zoomToggle], #leftSidebarToggle, #rightSidebarToggle").fadeOut(400);
    }, menuTimeout_delay);
}