import * as file from "./file_functions.js";
import * as tag from "./tag_functions.js";
import * as ui from "./ui_functions.js";
import * as g from "./main.js";

export function commitTags() {
    const selected_service_key = $("#tagRepositoryList").val();
    const old_tags = file.navFile(0, true)?.tags?.[selected_service_key]?.storage_tags["0"];
    const new_tags = $("#taglist").val().split("\n").filter(search => search.trim().length > 0);
    const commit_tags = $(new_tags).not(old_tags).toArray();
    const delete_tags = $(old_tags).not(new_tags).toArray();

    const data = {};
    const hash = g.clientFiles[file.currentPos.y][file.currentPos.x]?.["hash"];
    if (hash === undefined) {
        g.error_textInput(g.$("#committags"),
            `Metadata is undefined! No tags committed. CurrentPos is ${JSON.stringify(currentPos)}`)
    }
    data["hash"] = hash;
    data["service_keys_to_actions_to_tags"] = {};
    data["service_keys_to_actions_to_tags"][selected_service_key] = { "0": commit_tags, "1": delete_tags };

    /*     //old remote tag service client api pend/petition commands
        if ($("#tagRepositoryList :selected").parent().attr("label") == "tag repositories") {
            //testme: test these situations if there are existing pending tags or not. Does it break the client?
            //testme: data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = [[]];
            //testme: data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = [""];
            //testme: data["service_names_to_actions_to_tags"][destTagRepo.text()]["3"] = ["",[""],[]];
            toPend = [];
            toPetition = [];
            toRescindPetition = [];
            $.each(delete_tags, function (i, v) { //not possible to "undelete" a tag via API.
                //check if tag status is "pending"
                if (g.clientFiles[file.currentPos.y][file.currentPos.x]["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][1].indexOf(v) > -1) {
                    toPend.push(v);
                }
                //check if tag status is "current"
                if (g.clientFiles[file.currentPos.y][file.currentPos.x]["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][0].indexOf(v) > -1) {
                    toPetition.push(v);
                }
                //check if tag status is "petitioned"
                if (g.clientFiles[file.currentPos.y][file.currentPos.x]["service_names_to_statuses_to_tags"][$("#tagRepositoryList :selected").text()][3].indexOf(v) > -1) {
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
                data["service_names_to_actions_to_tags"][selected_service_key.text()]["4"] = toDelwithReason;
                $("#commitmsg input").remove();
     
            } else if (toPetition.length > 0 && $("#commitmsg input").length == 0) {
                $("#commitmsg span").text(selected_service_key.text());
                $.each(delete_tags, function (i, v) {
                    $("#commitmsg").append($("<input\>").attr("type", "text").attr("placeholder", v));
                });
                $("#commitmsg").show();
                return;
            }
     
            data["service_names_to_actions_to_tags"][selected_service_key.text()]["2"] = commit_tags; //pend new tag
            data["service_names_to_actions_to_tags"][selected_service_key.text()]["3"] = toPend; //rescind pending tag
            data["service_names_to_actions_to_tags"][selected_service_key.text()]["5"] = toRescindPetition; //rescind petitioned tag
        } */

    $.ajax({
        method: "POST",
        url: g.clientURL + `/add_tags/add_tags`,
        data: JSON.stringify(data),
        contentType: "application/json"
    }).done(function () {
        //refetch and redisplay tags
        $.ajax({
            url: g.clientURL + `/get_files/file_metadata`,
            data: {
                "hash": g.clientFiles[file.currentPos.y][file.currentPos.x]?.["hash"],
                "include_notes": true
            },
            dataType: 'json',
            crossDomain: true,
            method: "GET"

        }).done(function (response) {
            g.clientFiles[file.currentPos.y][file.currentPos.x] = response["metadata"][0];
            ui.loadFileTags(response["metadata"][0]);
            $("#committags").css("background-color", "lime");
            setTimeout(() => {
                $("#committags").css("background-color", "")
            }, 2000);
        });
    }).fail(function () {
        g.error_textInput($("#committags"))
    });
}

export function loadFiles() {
    ui.update_currentPos_display();

    $("#filePlaceholder div *").remove();

    $(".dot-flashing").hide();

    ui.loadFileTags(file.navFile(0, true));
    ui.loadFileNotes(file.navFile(0, true));
    ui.loadFileMetadata(file.navFile(0, true));

    const numberOfFiles = g.clientFiles.reduce((acc, val) => { return acc + val.length; }, 0);
    const file_placeholder = $("#filePlaceholder");
    file_placeholder.find("div").remove();

    if (numberOfFiles < 3) {
        for (let index = 0; index < numberOfFiles; index++) {
            const elem = $("<div/>", { "id": `filePlaceholder${index}`, "class":"swiper-slide" });
            elem.append(file.navFile(index, true)["elem"]);
            if (index === 0) { elem.addClass("visible"); } else { elem.addClass("hidden"); }
            file_placeholder.append(elem);
        }
    } else {
        for (let index = 0; index < 3; index++) {
            const elem = $("<div/>", { "id": `filePlaceholder${index}`, "class":"swiper-slide" });
            elem.append(file.navFile(index - 1, true)["elem"]);
            if (index - 1 === 0) { elem.addClass("visible"); } else { elem.addClass("hidden"); }
            file_placeholder.append(elem);
        }
    }
}

export function sortFiles_namespace(metadatas, sortOption) {
    //"series-creator-title-volume-chapter-page"
    sortOption = sortOption.split("-").reverse();
    //loop through all files, sorting them based on the first matching tag with the selected namespace, for each namespace
    const all_known_tags = Object.keys(metadatas[0].tags).find((v) => { return metadatas[0].tags[v].type === 10 });
    const collator = new Intl.Collator(undefined,{
        numeric: true, //required for unnamespaced tags with numbers only, eg ["20","100"]
        sensitivity: "variant"
    });

    sortOption.forEach(namespace => {
        metadatas.sort((a, b) => {
            //uses the first matching tag that has the namespace
            a = a.tags[all_known_tags].display_tags?.["0"].find((tag) => { return tag.startsWith(`${namespace}:`) });
            b = b.tags[all_known_tags].display_tags?.["0"].find((tag) => { return tag.startsWith(`${namespace}:`) });
            if (typeof (a) != "string") { a = ""; }
            if (typeof (b) != "string") { b = ""; }
            return collator.compare(a, b); //to include non-ascii characters
        });
    });

    return metadatas;
}