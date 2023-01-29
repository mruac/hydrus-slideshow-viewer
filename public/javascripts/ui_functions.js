import * as file from "./file_functions.js";
import * as tag from "./tag_functions.js";
import * as ui from "./ui_functions.js";
import * as g from "./main.js";

export const num_files_preload = 20;
let job_id = 0;

//get fileIDs from a tag search
export function getFileMetaData(searches, order_type = 2, order = false) {
    job_id++;
    const getFileMetaData_job_id = job_id;
    let doNamespaceSort = false;

    if (order_type === 100) {
        doNamespaceSort = true;
        order_type = 2;
    }

    let i = 0;
    function next() {
        if (getFileMetaData_job_id != job_id) { return; } //abort if there is another getFileMetaData going on. 

        if (i < searches.length) {
            const data = {
                "tags": JSON.stringify(searches[i]),
                "file_sort_type": order_type,
            };
            if (order != undefined) { data["file_sort_asc"] = order; }
            $.ajax({
                crossDomain: true,
                method: "GET",
                url: `${g.clientURL}/get_files/search_files`,
                data: data,
                dataType: 'json'
            }).done(function (response) {
                if (getFileMetaData_job_id != job_id) { return; } //abort if there is another getFileMetaData going on. 
                $.ajax({
                    crossDomain: true,
                    method: "GET",
                    url: g.clientURL + `/get_files/file_metadata`,
                    data: {
                        "file_ids": JSON.stringify(response.file_ids),
                        "include_notes": true
                    },
                    dataType: 'json'
                }).done(function (response) {
                    if (getFileMetaData_job_id != job_id) { return; } //abort if there is another getFileMetaData going on. 

                    searches[i] = response.metadata;

                    i++;
                    $("#progress_bar").css("width", `${(i / (searches.length - 1)) * 100}%`);

                    //recurse with the next search
                    next();
                }).fail(() => {
                    g.loading_error();
                    g.error_textInput($("#command"));
                });
            }).fail(() => {
                g.loading_error();
                g.error_textInput($("#command"));
            });
        } else {
            try {

                $("#progress_bar").css("width", `${(i / (searches.length - 1)) * 100}%`);

                // last one done, process the metadatas for each search
                let result = searches;
                if (doNamespaceSort) {
                    for (let index = 0; index < result.length; index++) {
                        result[index] = tag.sortFiles_namespace(result[index], $("#custom_namespace").val());
                    }
                    if (order) { result[index].reverse(); }
                }

                let numberOfFiles = 0;
                for (let index = 0; index < result.length; index++) {
                    numberOfFiles += result[index].length;
                    if (result[index].length === 0) { result[index] = [{ "mime": "no_file" }] }
                }

                console.info(`${numberOfFiles} files found across ${result.length} searches!`)
                console.debug({ "fileMetadatas": result });

                g.set_clientFiles(result);
                for (let index = -(num_files_preload); index <= num_files_preload; index++) {
                    const metadata = file.navFile(index, true);
                    metadata["elem"] = loadFile(metadata)
                }

                tag.loadFiles();
            } catch (e) {
                //make loading bar red
                console.error(e);
                g.loading_error();
            }
            return;
        }
    }

    // kick off the first one
    next();

    return searches
}

export function loadFile(fileMetadata) {
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
            return file.createElem("img", fileMetadata);
        case 'video/mp4':
        case 'video/webm':
            return file.createElem("video", fileMetadata);
        case 'audio/mp3':
            return file.createElem("audio", fileMetadata);
        case 'no_file':
            return file.createElem("p", "No file found.");
        //TO BE ADDED & HAS OR DOESNT HAVE THUMBNAIL
        case 'application/x-photoshop':
        case 'application/pdf':
        case 'video/x-matroska': // VIDEO_MKV
        case 'application/zip':
        default:
            return file.createElem("p", `The file could not be loaded. (type: ${fileMetadata.mime})`);
    }
}

export function update_currentPos_display() {
    $("#file_no").text(file.currentPos.x + 1);
    $("#file_length").text(g.clientFiles[file.currentPos.y].length);
    $("#search_no").text(g.client_named_Searches[file.currentPos.y]);
}

export function update_file_numbers() {
    $("#jump_to_file_number").prop("max", g.clientFiles[file.currentPos.y].length)
}

export function loadFileTags(metadata) {
    //switch tag services
    const service_keys = metadata?.tags;
    const selected_service_key = $("#tagRepositoryList").val();
    $("#taglist").val("");
    if (service_keys === undefined) {
        const err_msg = `No tags found for [${file.currentPos.y}][${file.currentPos.x}]`;
        console.error(err_msg);
        $("#taglist").val(err_msg);
        return;
    }

    const selected_tag_display_type = $("#displayTagToggle").val();
    const tags = service_keys[selected_service_key];

    const is_AKT_or_RTS = Object.keys(service_keys).reduce(function (acc, val) {
        if (
            (service_keys[val].type === 10 && val === selected_service_key) ||
            (service_keys[val].type === 0 && val === selected_service_key)
        ) { acc = true };
        return acc;
    }, false);

    //if selected tag service is "all known tags" or any remote tag services such as "public tag repository"
    if (is_AKT_or_RTS || selected_tag_display_type === "display") {
        $("#committags").hide();
        $("#taglist").attr("readonly", "");

    } else {
        $("#committags").show();
        $("#taglist").removeAttr("readonly");
    }

    //switch tag display between "Display" and "Storage"
    if (selected_tag_display_type === "display") { //display tags
        const current = tags.display_tags["0"];
        if (current != undefined) { $("#taglist").val(current.join('\n')); }
    } else { //Storage tags
        const current = tags.storage_tags["0"];
        if (current != undefined) { $("#taglist").val(current.join('\n')); }
    }

}

export function loadFileNotes(metadata) {
    const notes = metadata?.notes;
    if (notes === undefined) { return; }
    const note_options = $("#file_info_notes");
    const note_field = $("#file_info_notefield");

    note_options.find("option").remove();
    const keys = Object.keys(notes);
    note_field.text(notes[keys[0]]);
    for (let index = 0; index < keys.length; index++) {
        note_options.append($("<option/>").text(keys[index]));
    }
}

export function loadFileMetadata(metadata) {
    if (metadata?.hash === undefined) { return; }

    const elem_hash = $("#file_info_hash");
    const elem_urls = $("#file_info_urls");
    elem_hash.text("");
    elem_hash.text(metadata.hash);

    elem_urls.find("*").remove();
    metadata.known_urls.forEach(url => {
        elem_urls.append(
            $(`<span>${url}</span><br/>`)
        );
    });


}

export function loadNote(metadata, note_name) {
    const notes = metadata?.notes;
    if (notes === undefined || note_name === undefined) { return; }
    const note_field = $("#file_info_notefield");
    note_field.text(notes[note_name]);
}