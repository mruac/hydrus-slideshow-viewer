// http://127.0.0.1:45869/get_files/file_metadata?Hydrus-Client-API-Access-Key=1b1394a5ef4f2db36946ca6f0760717e135972836cc2cbaaf6dea195b2642031&file_ids=[24908219]
var clientKey, clientURL, clientFiles, currentPos = { "x": 0, "y": 0 }, elemIMG, elemVIDEO, elemAUDIO, elemP;
elemIMG = $('<img/>', {
    'src': '',
    'style': 'display:none;'
});
elemVIDEO = $('<video/>', {
    'controls': '',
    'src': '',
    'style': 'display:none;'

});
elemAUDIO = $('<audio/>', {
    'controls': '',
    'src': '',
    'style': 'display:none;'
});
elemP = $('<p/>', {
    'style': 'display:none;'
}); //change textContent with elemP.text("xxx");

// $(window).on("load", function(){});
$(document).ready(function () {

    $("#filePlaceholder").append(elemIMG);
    $("#filePlaceholder").append(elemVIDEO);
    $("#filePlaceholder").append(elemAUDIO);
    $("#filePlaceholder").append(elemP);
    clientKey = "Hydrus-Client-API-Access-Key=" + localStorage["clientKey"];
    clientURL = localStorage["clientURL"];
    $("#command").val(localStorage["command"]);

    $("#clientKey").keyup(function (event) {
        clientKey = "Hydrus-Client-API-Access-Key=" + $(event.target).val();
        localStorage.setItem("clientKey", $(event.target).val());
    });

    $("#clientURL").keyup(function (event) {
        clientURL = $(event.target).val();
        localStorage.setItem("clientURL", $(event.target).val());

    });

    $("#submitTags").keyup(function (event) {
        localStorage.setItem("tagSearches")
    });

    $("#command").keyup(function (event) {
        localStorage.setItem("command", $(event.target).val());
    });

    //submit command textbox
    $("#submitTags").click(function () {
        var tags = $("#command").val().split("\n");
        var urls = [];
        $.each(tags, function (index, value) {
            value = value.replace(/,/g, `","`);
            urls.push(clientURL + `/add_tags/clean_tags?` + clientKey + `&tags=["` + value + `"]`);
            // response = $.ajax({
            //     url: clientURL + `/add_tags/clean_tags?` + clientKey + `&tags=["` + value + `"]`,
            //     // async: false,
            //     dataType: 'json',
            //     crossDomain: true,
            //     type: "GET"
            //     }).done(function(data){console.log(data)});
        });
        cleanTags(urls);
    });
});

/* NOTE: Using recursive functions and keeping responses in an array because i cannot figure out how to keep asynchronous AJAX in order!
Applies to: cleanTags(), getFiles()
I just realised that the answer using map() function to keep track of responses is similar to my method, only I use an array instead.
(not this one, I can't find it but I need TODO: learn array.reduce) https://stackoverflow.com/questions/22090764/alternative-to-async-false-ajax

 */
//clean tags from array of tag searches
function cleanTags(urls, response) {
    if (urls.length == 0) {
        getFiles(response);
        return;
    }
    $.ajax({
        url: urls[0],
        dataType: "json",
        crossDomain: true,
        type: "GET",
    }).done(function (data) {
        if (response == undefined) { response = []; }
        response.push(data);
        urls.shift();
        cleanTags(urls, response);
    });
}

//get fileIDs from a tag search
function getFiles(tags, response) {
    if (tags.length == 0) {
        finishedFetchTags(response);
        return;
    }
    $.ajax({
        url: clientURL + `/get_files/search_files?` + clientKey + `&tags=["` + tags[0]["tags"].toString().replace(/,/g, `","`) + `"]`,
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }).done(function (data) {
        if (response == undefined) { response = []; }
        response.push(data);
        tags.shift();
        getFiles(tags, response);
    });
}

function finishedFetchTags(arrayFileIDs) {
    clientFiles = arrayFileIDs;
    currentPos = { "x": 0, "y": 0 }
    console.log(clientFiles);
    loadFile(clientFiles[currentPos.y]["file_ids"][currentPos.x]);
/*  NOTE: what is currentPos if we're keeping an array of fileIDs in order?
    clientFiles[0][0] is the first (currentPos = 0), but it can go up to clientFiles[0][x] horizontally, AND vertically clientFiles[x][0]!
    
    how the shit do I keep track of that? I think I need a new function that detects when the currentPos reaches the end of x and y - clientFiles.length (y) & clientFiles[x].length (x), then go backwards into the previous and forwards into the next set as needed.
    
    in the end - ditch the linear 0-x currentPos var, navigate using an x,y of the currentFiles array of fileIDs.
    CURRENT ATTEMPT: Using json of x and y to store current position because my dumb brain cannot bother to remember that 0 = x and 1 = y in terms of array index against key-value pairs.
 */}

/* function getURL(url, dataype) {
    if (typeof url == "string") {
        var response;
        $.ajax({
            url: url,
            dataType: dataype,
            crossDomain: true,
            type: "GET",
        }).done(function (data) {
            console.log(data);
            response = data;
        });
    }
    if (Array.isArray(url)) {
        var response = [];
    }
    return response;
}
 */
/* function getFiles(tags) {
    //tags = `"tag1","tag2 tag21","tag3 tag3child"`
    // $.get(clientURL + `/get_files/search_files?` + clientKey + `&tags=[""]`).done((data) => { clientFiles = data });
    clientFiles = $.ajax({
        url: clientURL + `/get_files/search_files?` + clientKey + `&tags=[` + tags + `]`,
        async: false,
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }
    ).responseJSON;
    loadFile(currentPos);
}
 */

//TODO: fix this ajax so it doesn't use async=false
function loadFile(fileID) {
    $.ajax({
        url: clientURL + `/get_files/file_metadata?` + clientKey + `&file_ids=[` + fileID + `]`,
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }).done(function (data) {
        console.log(data);
        console.log(data.metadata[0].mime);
        switch (data.metadata[0].mime) {
            //Supported file thumbnails
            case 'image/jpe':
            case 'image/jpeg':
            case 'image/jpg':
            case 'image/x-png':
            case 'image/png':
            case 'image/apng':
            case 'image/gif':
            case 'image/bmp':
            case 'image/webp':
            case 'image/tiff':
            case 'image/x-icon':
            case 'image/vnd.microsoft.icon':
            case 'image':
                createElem(elemIMG, data);
                break;

            case 'video/mp4':
            case 'video/webm':
                createElem(elemVIDEO, data);
                break;
            case 'audio/mp3':
                createElem(elemAUDIO, data);
                break;
            //TO BE ADDED & HAS OR DOESNT HAVE THUMBNAIL
            case 'application/x-photoshop':
            case 'application/pdf':
            case 'video/x-matroska': // VIDEO_MKV
            case 'application/zip':
            default:
                createElem(elemP, data);
                break;
        }
    });
    // console.log(fileURL);

    //DONE: add support for different file types - maybe remove img src replacement method? Different methods:
    //add the elems needed and hide/show as needed while changing the src attr. (using!)
    //add elems with prefilled attrs and destroy elems when not needed (memory intensive - long time to reflow!) https://medium.com/swlh/what-the-heck-is-repaint-and-reflow-in-the-browser-b2d0fb980c08


}

//fill information and show element - instead of destroying and creating a new one on the fly for memory saving (reflows).
//bug: when navigating from elemX to elemY, the file can take a bit to load - while still showing the previous file.
//fix: remove src before hiding so that while it loads user does not see anything. Maybe add a loading gif/css animation here?
function createElem(elem, file) {
    var url = clientURL + "/get_files/file?" + clientKey + "&file_id=" + file.metadata[0]["file_id"];
    //prefill elem
    if (elem == elemP) {
        if (typeof file == 'string') { //reusing var file for string text
            elem.text(file); //error output
        } else {
            elem.text(`The file could not be loaded. (type: ${file.metadata[0].mime})`);
        }
    } else { elem.attr("src", url); }

    //show elem (skip if already visible)
    if (!$(elem).is(":visible")) {
        if ($("#filePlaceholder *:visible").is(elemP)) {
            elemP.text("");
        } else {
            $("#filePlaceholder *:visible").attr("src", "");
        }
        $("#filePlaceholder *:visible").hide();
        $(elem).show();
    }
}

//TODO: fix nav so that it works with currentPos.x and y
//if (x < 0){x = 0; y--; if(y < 0){y = currentPos.length-1;}} //previous tag set
//if (x >= currentPos.[0]["file_ids"].length){x = 0; y = y++; if (y >= currentPos.length){y = 0;}} //next tag set
//bug: tag searches can return an empty array [] and break this. hacky fix: check if the new position returns undefined and move onto the next one if it does.
function navNextFile() {
    currentPos.x++;
    if (currentPos.x >= clientFiles[currentPos.y]["file_ids"].length) {
        currentPos.x = 0;
        currentPos.y++;
        if (currentPos.y >= clientFiles.length) {
            currentPos.y = 0;
        }
    }
    if (clientFiles[currentPos.y]["file_ids"][currentPos.x] == undefined) { navNextFile() }
    loadFile(clientFiles[currentPos.y]["file_ids"][currentPos.x]);
}
function navPrevFile() {
    currentPos.x--;
    if (currentPos.x < 0) {
        currentPos.y--;
        if (currentPos.y < 0) {
            currentPos.y = clientFiles.length - 1;
        }
        currentPos.x = clientFiles[currentPos.y]["file_ids"].length - 1;
    }
    if (clientFiles[currentPos.y]["file_ids"][currentPos.x] == undefined) { navPrevFile() }
    loadFile(clientFiles[currentPos.y]["file_ids"][currentPos.x]);
}

// DONE: add button, mouse scroll & keyboard naviagation -- removed click nav

//keyboard nav
$(document).keyup((event) => {
    if ($("#command").is(event.target)){return;}
    console.log(event.target);
    if (event.which == 37) { //left
        navPrevFile();
    }
    else if (event.which == 39) { //right
        navNextFile();
    }
});

//scroll nav
$(document).bind('mousewheel', function (event) {
    console.log(event.target);

    if (event.originalEvent.wheelDelta / 120 > 0) {//scroll up
        navPrevFile();
    }
    else { //scroll down
        navNextFile();
    }
});

