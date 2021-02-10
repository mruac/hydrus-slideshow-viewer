var clientKey, clientURL, clientFiles, currentPos = { "x": 0, "y": 0 }, elemIMG, elemVIDEO, elemAUDIO, elemP;
elemIMG = $('<img/>', {
    'src': '',
    'style': 'display:none;'
}).on("load", function (e) {
    $(".dot-elastic").hide();
    $(e.target).show();
});
elemVIDEO = $('<video/>', {
    'controls': '',
    'src': '',
    'style': 'display:none;'

}).on("loadeddata", function (e) {
    $(".dot-elastic").hide();
    $(e.target).show();
});
elemAUDIO = $('<audio/>', {
    'controls': '',
    'src': '',
    'style': 'display:none;'
}).on("loadeddata", function (e) {
    $(".dot-elastic").hide();
    $(e.target).show();
});
elemP = $('<p/>', {
    'style': 'display:none;'
}); //change textContent with elemP.text("xxx");


$(document).ready(function () {
    clientKey = localStorage["clientKey"];
    $.ajaxSetup({
        headers: { "Hydrus-Client-API-Access-Key": localStorage["clientKey"] }
    });
    clientURL = localStorage["clientURL"];
    $("#command").val(localStorage["command"]);
    $("#clientKey").val(localStorage["clientKey"]);
    $("#clientURL").val(localStorage["clientURL"]);

    //TESTME: When add_tags/add_tags function is fixed
    $("#committags").on("click", function (e) {
        var changedTags = $("#taglist").val().split("\n");
        var destTagRepo = $("#tagRepositoryList :selected");
        var originalTags = clientFiles[currentPos.y][currentPos.x]["service_names_to_statuses_to_display_tags"][destTagRepo.text()][0];
        var toAdd = $(changedTags).not(originalTags)[0];
        var toDel = $(originalTags).not(changedTags)[0];
        data = {};
        data["hash"] = clientFiles[currentPos.y][currentPos.x]["hash"];
        if ($("#tagRepositoryList :selected").parent().attr("label") == "local tags") {
            data["service_names_to_actions_to_tags"][destTagRepo.text()]["0"] = toAdd;
            data["service_names_to_actions_to_tags"][destTagRepo.text()]["1"] = toDel;
        }
        if ($("#tagRepositoryList :selected").parent().attr("label") == "tag repositories") {
            //TESTME: test these situations if there are existing pending tags or not. Does it break the client?
            //TESTME: data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = [[]];
            //TESTME: data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = [""];
            //TESTME: data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = ["",[""],[]];
            toPend = [];
            toPetition = [];
            toRescindPetition = [];
            $.each(toDel, function (i, v) { //not possible to "undelete" a tag via API.
                //check if tag status is "pending"
                if (clientFiles[currentPos.y][currentPos.x]["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][1].indexOf(v) > -1) {
                    toPend.push(v);
                }
                //check if tag status is "current"
                if (clientFiles[currentPos.y][currentPos.x]["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][0].indexOf(v) > -1) {
                    toPetition.push(v);
                }
                //check if tag status is "petitioned"
                if (clientFiles[currentPos.y][currentPos.x]["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][3].indexOf(v) > -1) {
                    toRescindPetition.push(v);
                }
            });
            if (toPetition.length > 0 && $("#commitmsg input").length > 0) { //petition (remove) with message
                $("#commitmsg").hide();
                toDelwithReason = [];
                $("#commitmsg input").each(function (i, e) {
                    if ($(e).val() == "") {
                        toDelwithReason.push([$(e).attr("placeholder"), "Petitioned from API"]);
                    } else {
                        toDelwithReason.push([$(e).attr("placeholder"), $(e).val()]);
                    }
                });
                data["service_names_to_actions_to_tags"][destTagRepo.text()]["4"] = toDelwithReason;
                $("#commitmsg input").remove();

            } else if (toPetition.length > 0 && $("#commitmsg input").length == 0) {
                $("#commitmsg span").text(destTagRepo.text());
                $.each(toDel, function (i, v) {
                    $("#commitmsg").append($("<input\>").attr("type", "text").attr("placeholder", v));
                });
                $("#commitmsg").show();
                return;
            }

            data["service_names_to_actions_to_tags"][destTagRepo.text()]["2"] = toAdd; //pend new tag
            data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = toPend; //rescind pending tag
            data["service_names_to_actions_to_tags"][destTagRepo.text()]["5"] = toRescindPetition; //rescind petitioned tag
        }

        $.ajax({
            type: "POST",
            url: clientURL + `/add_tags/add_tags`,
            data: data,
            contentType: "application/json"
        }).done(function (response) {
            //DONE: refetch and redisplay tags
            $.ajax({
                url: clientURL + `/get_files/file_metadata?file_ids=[${clientFiles[currentPos.y][currentPos.x]["file_id"]}]`,
                dataType: 'json',
                crossDomain: true,
                type: "GET"
            }).done(function (response) {
                clientFiles[currentPos.y][currentPos.x] = response["metadata"][0];
                loadFileTags(response["metadata"][0]);
                $("#committags").css("color", "lime");
                setTimeout(() => {
                    $("#committags").css("color", "")
                        ;
                }, 2000);

            });
        }).fail(function (response) {
            //DONE: maybe change submit button red for a second?
            $("#committags").css("color", "red");
            setTimeout(() => {
                $("#committags").css("color", "")
                    ;
            }, 2000);
        });
    });

    $("#tagRepositoryList , #displayTagToggle").each(function (i, v) {
        $(v).on("change", function (e) {
            try {
                loadFileTags(clientFiles[currentPos.y][currentPos.x]);
                if ($("#tagRepositoryList :selected").text() !== "all known tags" && $("#displayTagToggle :selected").text() == "Actual Tags") {
                    $("#committags").show();
                } else {
                    $("#committags").hide();
                }
            } catch {
                $("#taglist").val("");
            }
        });
    });


    $.ajax({
        url: clientURL + `/add_tags/get_tag_services`,
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }).done(function (data) {
        $.each(data, function (i, tagRepoType) {
            var group = $("<optgroup\>").attr("label", i.replace("_", " "));
            $.each(tagRepoType, function (i, tagRepoName) {
                group.append($("<option\>").text(tagRepoName));
            });
            $("#tagRepositoryList").append(group);
        });
    });

    // $("#filePlaceholder").append(elemIMG);
    // $("#filePlaceholder").append(elemVIDEO);
    // $("#filePlaceholder").append(elemAUDIO);
    // $("#filePlaceholder").append(elemP);

    var isResizingSidebar = false;
    $("#leftSidebarDraggable").on("mousedown", function () {
        isResizingSidebar = true;
    });
    $(document).on("mouseup", function () {
        isResizingSidebar = false;

        var sidebarLheight = parseInt($('#leftSidebarMenu').css("height"));
        var sidebarLwidth = parseInt($('.leftSidebar').css("width"));

        if (sidebarLheight > window.innerHeight - 15) {
            $('#leftSidebarMenu').css("height", window.innerHeight - 15 + 'px');
        } else if (sidebarLheight < 15) {
            $('#leftSidebarMenu').css("height", 15 + 'px');
        }

        if (sidebarLwidth < 15) {
            $('.leftSidebar').css("width", 15 + 'px');
        } else if (sidebarLwidth > window.innerWidth - 15) {
            $('.leftSidebar').css("width", window.innerWidth - 15 + 'px');
        }
    });

    $(document).on("mousemove", function (e) {
        if (!isResizingSidebar) {
            return;
        }
        if (isResizingSidebar) {
            if (e.clientX < (window.innerWidth * 0.8)) {
                $('.leftSidebar').css("width", event.clientX + 'px');
            }
        }
    });

    var menuTimeout;
    $("#leftHover").on("mouseover", function () {
        $(".leftSidebar").show();
        clearTimeout(menuTimeout);
    });
    $(".leftSidebar").on("mouseenter", function () {
        clearTimeout(menuTimeout);
    });
    //disabled for dev
    // $(".leftSidebar").on("mouseleave", function (e) {
    //     menuTimeout = setTimeout(function () {
    //         $(".leftSidebar").hide()
    //     }, 2000);
    // });

    $(".menu-submenu").on("click", function (e) {
        var popout = $(e.target).parent().find(".div-popout");
        if (popout.is(":visible")) { popout.hide(); } else { popout.show(); }
    });

    $("#clientKey").keyup(function (event) {
        $.ajaxSetup({
            headers: { "Hydrus-Client-API-Access-Key": $(event.target).val() }
        });
        localStorage.setItem("clientKey", $(event.target).val());
        testClient();
    });

    $("#clientURL").keyup(function (event) {
        var url = $(event.target).val();
        if (url[url.length - 1] == "/") {
            url = url.slice(0, url.length - 1);
        }
        clientURL = url;
        localStorage.setItem("clientURL", url);
        testClient();
    });

    $("#command").keyup(function (event) {
        localStorage.setItem("command", $(event.target).val());
    });
    testClient();

    $("#submitButton").click(function () {
        var tags = $("#command").val().split("\n");
        var urls = [];
        $.each(tags, function (index, value) {
            value = value.replace(/,/g, `","`);
            urls.push(value);
        });
        cleanTags(urls);
    });
});

function testClient() {
    $.ajax({
        url: clientURL + `/verify_access_key`,
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }).done(function () {
        $("#clientStatus").text("Success").css("color", "lime");
    }).fail(function () {
        $("#clientStatus").text("Fail").css("color", "red");
    });
    return;
}


//clean tags from array of tag searches
function cleanTags(urls, response) {
    if (urls.length == 0) {
        getFiles(response);
        return;
    }
    $.ajax({
        url: clientURL + `/add_tags/clean_tags?tags=` + encodeURIComponent(`["` + urls[0] + `"]`),
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
        // console.log(response);
        getFileMetaData(response);
        return;
    }
    $.ajax({
        url: clientURL + `/get_files/search_files?tags=` + encodeURIComponent(`["` + tags[0]["tags"].toString().replace(/,/g, `","`) + `"]`),
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }).done(function (data) {
        if (response == undefined) { response = []; }
        response.push(data["file_ids"]);
        tags.shift();
        getFiles(tags, response);
    });
}

function getFileMetaData(arrayFileIDs, response) {
    if (arrayFileIDs.length == 0) {
        // console.log(response);
        endFetchTags(response);
        return;
    }
    $.ajax({
        url: clientURL + `/get_files/file_metadata?file_ids=[${arrayFileIDs[0].splice(0, 50)}]`,
        dataType: 'json',
        crossDomain: true,
        type: "GET"
    }).done(function (data) { /* console.log(data); */
        if (typeof response == "undefined") { response = [[]]; }
        response[response.length - 1] = response[response.length - 1].concat(data["metadata"])
        if (arrayFileIDs[0].length == 0) {
            arrayFileIDs.shift();
            if (arrayFileIDs.length > 0) {
                response.push([]);
            }
        }
        getFileMetaData(arrayFileIDs, response);
    });
}
function endFetchTags(fileMetadata) {
    clientFiles = fileMetadata;

    //check if all of the searches have any results. if not: error. If there is: find the first file and load it.
    var numberOfFiles = 0;
    currentPos = { "x": -1, "y": -1 }
    clientFiles.forEach((yVal, yIndex) => {
        if (yVal.length > 0 && currentPos.y < 0) {
            currentPos = { "x": 0, "y": yIndex }
        }
        numberOfFiles += yVal.length;
    });
    if (numberOfFiles == 0) {
        $("#filePlaceholder").append(createElem("p", "No files found!").show());
        return;
    }

    console.log(clientFiles);
    $("#filePlaceholder *").remove();
    $("#filePlaceholder").append(loadFile(navFile(-2, true)));
    $("#filePlaceholder").append(loadFile(navFile(-1, true)));
    $("#filePlaceholder").append(loadFile(navFile(0, true)));
    $("#filePlaceholder").append(loadFile(navFile(1, true)));
    $("#filePlaceholder").append(loadFile(navFile(2, true)));
    $("#filePlaceholder *:eq(2)").show();
}
/*  DONE: what is currentPos if we're keeping an array of fileIDs in order?
    clientFiles[0][0] is the first (currentPos = 0), but it can go up to clientFiles[0][x] horizontally, AND vertically clientFiles[x][0]!
    
    how the shit do I keep track of that? I think I need a new function that detects when the currentPos reaches the end of x and y - clientFiles.length (y) & clientFiles[x].length (x), then go backwards into the previous and forwards into the next set as needed.
    
    in the end - ditch the linear 0-x currentPos var, navigate using an x,y of the currentFiles array of fileIDs.
    CURRENT ATTEMPT: Using json of x and y to store current position because my dumb brain cannot bother to remember that 0 = x and 1 = y in terms of array index against key-value pairs.
 */

function loadFileTags(fileMetadata) {
    var pendingTags, petitionedtags, currentTags;
    if ($("#displayTagToggle :selected").text() == "Siblinged & Parents") {
        try {
            pendingTags = fileMetadata["service_names_to_statuses_to_display_tags"][$("#tagRepositoryList :selected").text()][1];
            if (typeof pendingTags == "undefined") { pendingTags = []; }
        } catch { pendingTags = []; }
        try {
            currentTags = fileMetadata["service_names_to_statuses_to_display_tags"][$("#tagRepositoryList :selected").text()][0];
            if (typeof currentTags == "undefined") { currentTags = []; }
        } catch { currentTags = []; }
        try {
            petitionedtags = fileMetadata["service_names_to_statuses_to_display_tags"][$("#tagRepositoryList :selected").text()][3];
            if (typeof petitionedtags == "undefined") { petitionedtags = []; }
        } catch { petitionedtags = []; }

        $("#taglist").val(pendingTags.concat(petitionedtags, currentTags).join('\n'));
    }
    if ($("#displayTagToggle :selected").text() == "Actual Tags") {
        try {
            pendingTags = fileMetadata["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][1];
            if (typeof pendingTags == "undefined") { pendingTags = []; }
        } catch { pendingTags = []; }
        try {
            currentTags = fileMetadata["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][0];
            if (typeof currentTags == "undefined") { currentTags = []; }
        } catch { currentTags = []; }
        try {
            petitionedtags = fileMetadata["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][3];
            if (typeof petitionedtags == "undefined") { petitionedtags = []; }
        } catch { petitionedtags = []; }

        $("#taglist").val(pendingTags.concat(petitionedtags, currentTags).join('\n'));
    }
    return;
}

function loadFile(fileMetadata) {
    switch (fileMetadata.mime) {
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
            return createElem("img", fileMetadata);
        case 'video/mp4':
        case 'video/webm':
            return createElem("video", fileMetadata);
        case 'audio/mp3':
            return createElem("audio", fileMetadata);
        //TO BE ADDED & HAS OR DOESNT HAVE THUMBNAIL
        case 'application/x-photoshop':
        case 'application/pdf':
        case 'video/x-matroska': // VIDEO_MKV
        case 'application/zip':
        default:
            return createElem("p", `The file could not be loaded. (type: ${fileMetadata.mime})`);
    }
}

//fill information and show element - instead of destroying and creating a new one on the fly for memory saving (reflows).
//bug: when navigating from elemX to elemY, the file can take a bit to load - while still showing the previous file.
//fix DONE: remove src before hiding so that while it loads user does not see anything. Added loading CSS for inbetween files
//TODO: implement preloading system to load files ahead of time so that it shows as soon as user navs to it. (navRandomFile excluded - for that clear the preload and preload those next / prev to it. Repeat each time navRandomFile is called.)
//for preload maybe use an array of elemX where the currently viewing file is in the middle? eg. elemP = [<p>,<p>,<p>,<p>,<p>]
//Preloading is definitely needed, issue lies in the browser rendering the image: https://i.imgur.com/pJxzDFB.png
//definitely need metadata to handle preloading of different file types instead of doing it one by one
//preload next image while user is looking at current image.

function createElem(type, content) {
    var url = clientURL + "/get_files/file?Hydrus-Client-API-Access-Key=" + clientKey + "&file_id=" + content["file_id"];
    switch (type) {
        case "p":
            return $('<p/>', {
                'style': 'display:none;'
            }).text(content);
        case "img":
            return $('<img/>', {
                'src': url,
                'style': 'display:none;'
            });
        case "video": case "audio":
            return $(`<${type}/>`, {
                'controls': '',
                'src': url,
                'style': 'display:none;'
            });
    }
}

//FIXME: when navFile is triggered fast enough in succession, files can be shown at the same time over on top each other!
function navFile(increment, requireReturn) {
    var x = currentPos.x, y = currentPos.y, incr = increment;
    if (clientFiles[y][x + increment] == undefined) {
        if (increment > 0) {
            while (clientFiles[y][x + increment] == undefined) {
                increment -= (clientFiles[y].length - x);
                y++;
                if (clientFiles[y] == undefined) { y = 0; }
                x = 0;
            }
            x += increment;
        }
        if (increment < 0) {
            while (clientFiles[y][x + increment] == undefined) {
                increment += x + 1;
                y--;
                if (clientFiles[y] == undefined) { y = clientFiles.length - 1; }
                x = clientFiles[y].length - 1;
            }
            x += increment;
        }
    } else { x += increment; }

    if (requireReturn) {
        return clientFiles[y][x];
    } else {
        currentPos.y = y, currentPos.x = x;
        loadFileTags(clientFiles[currentPos.y][currentPos.x]);
        if (incr > 0) {
            $("#filePlaceholder *").hide();
            $("#filePlaceholder *:first").remove();
            $("#filePlaceholder").append(loadFile(navFile(2, true)));
            $("#filePlaceholder *:eq(2)").show();
        } else if (incr < 0) {
            $("#filePlaceholder *").hide();
            $("#filePlaceholder *:last").remove();
            $("#filePlaceholder").prepend(loadFile(navFile(-2, true)));
            $("#filePlaceholder *:eq(2)").show();
        }
    }
}

function navRandomFile() {
    try {
        currentPos.y = Math.floor(Math.random() * clientFiles.length);
        currentPos.x = Math.floor(Math.random() * clientFiles[currentPos.y].length);
        loadFile(clientFiles[currentPos.y][currentPos.x]);
        //preloadFile(clientFiles[currentPos.y][currentPos.x+1]);
    } catch { }
}

//keyboard nav
$(document).keyup((event) => {
    if ($(".leftSidebar").find(event.target)[0]) { return; }
    // console.log(event.target);
    if (event.which == 37) { //left
        navFile(-1);
    }
    else if (event.which == 39) { //right
        navFile(1);
    }
});

//scroll nav
$(document).bind('mousewheel', function (event) {
    if ($(".leftSidebar").find(event.target)[0]) { return; }
    // console.log(event.target);

    if (event.originalEvent.wheelDelta / 120 > 0) {//scroll up
        navFile(-1);
    }
    else { //scroll down
        navFile(1);
    }
});

