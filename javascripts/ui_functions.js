import * as file from './file_functions.js';
import * as tag from './tag_functions.js';
import * as ui from './ui_functions.js';
import * as g from './main.js';

export const num_files_preload = 20;
let job_id = 0;
let SEARCH_THRESHOLD = 5000;
var pushProgressBarStatus_interval = null;

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
    async function next() {
        if (getFileMetaData_job_id != job_id) { return; } //abort if there is another getFileMetaData going on. 

        if (i < searches.length) {
            if (searches[i].length === 0) {
                i++;
                $('.progress-bar').css('width', `${(i / (searches.length - 1)) * 100}%`);

                //recurse with the next search
                next();
            }
            const data = {
                'tags': JSON.stringify(searches[i]),
                'file_sort_type': order_type,
            };
            if (order != undefined) { data['file_sort_asc'] = order; }
            const status = `Getting search: ${g.client_named_Searches[i]}`;
            //console.debug(status)
            pushProgressBarStatus(status);

            $.ajax({
                crossDomain: true,
                method: 'GET',
                url: `${g.clientURL}/get_files/search_files`,
                data: data,
                dataType: 'json'
            }).done(function (response) {
                if (getFileMetaData_job_id != job_id) { return; } //abort if there is another getFileMetaData going on. 
                //warn if search is greater than SEARCH_THRESHOLD, as the search may not be made correctly.
                if (response.file_ids.length > SEARCH_THRESHOLD) {
                    if (!(window.confirm(`Search "${g.client_named_Searches[i]}" has found more than ${SEARCH_THRESHOLD} files. This search may have produced more files than expected. \nContinue?`))) {
                        job_id++;
                        g.loading_error();
                        pushProgressBarStatus('Search cancelled.');
                        return;
                    }
                }
                if (response.file_ids.length === 0) {
                    // discard search if there are no results.
                    searches[i] = [];
                    i++;
                    $('.progress-bar').css('width', `${(i / (searches.length - 1)) * 100}%`);

                    //recurse with the next search
                    next();

                } else {
                    $.ajax({
                        crossDomain: true,
                        method: 'GET',
                        url: g.clientURL + `/get_files/file_metadata`,
                        data: {
                            'file_ids': JSON.stringify(response.file_ids),
                            'include_notes': true
                        },
                        dataType: 'json'
                    }).done(function (response) {
                        if (getFileMetaData_job_id != job_id) { return; } //abort if there is another getFileMetaData going on. 

                        searches[i] = response.metadata;

                        i++;
                        $('.progress-bar').css('width', `${(i / (searches.length - 1)) * 100}%`);

                        //recurse with the next search
                        next();
                    }).fail((err) => {
                        g.loading_error();
                        g.error_textInput($('#command'), `Error on search '${g.client_named_Searches[i]}': ${err.responseText}`);
                    });
                }
            }).fail((err) => {
                g.loading_error();
                g.error_textInput($('#command'), `Error on search '${g.client_named_Searches[i]}': ${err.responseText}`);
            });
        } else {
            try {

                $('.progress-bar').css('width', `${(i / (searches.length - 1)) * 100}%`);

                // last one done, process the metadatas for each search
                let result = searches;
                if (doNamespaceSort) {
                    for (let index = 0; index < result.length; index++) {
                        result[index] = tag.sortFiles_namespace(result[index], $('#custom_namespace').val());
                        if (order) { result[index].reverse(); }
                    }
                }

                let numberOfFiles = 0;
                for (let index = 0; index < result.length; index++) {
                    numberOfFiles += result[index].length;
                    if (result[index].length === 0) { result[index] = [{ 'mime': 'no_file' }] }
                }

                console.info(`${numberOfFiles} files found across ${result.length} searches!`, result);

                g.set_clientFiles(result);
                preload_files();
                tag.loadFiles();
            } catch (e) {
                //make loading bar red
                //console.error(e);
                g.loading_error();
            }
            return;
        }
    }

    // kick off the first one
    next();

    return searches
}

export function pushProgressBarStatus(msg) {
    clearInterval(pushProgressBarStatus_interval);
    //append message at top
    const msg_el = $(`<span>${msg}<br/></span>`);
    $('#progress_bar_status').prepend(msg_el).css({ top: `-${msg_el.height()}px` }).animate({ top: '0px' }, 250);

    //if messages exceed limit, fadeout and remove the exceeding.
    if ($('#progress_bar_status span').length > 6) {
        $('#progress_bar_status span').slice(6).fadeOut({ duration: 250, done: (e) => { $(e.elem).remove() } })
    }

    //if no recent message pushes, fade them out after timeout
    pushProgressBarStatus_interval = setInterval(() => {
        $('#progress_bar_status span:last').fadeOut({
            duration: 250,
            done: (e) => {
                $(e.elem).remove();
                if ($('#progress_bar_status span').length < 2) {
                    clearInterval(pushProgressBarStatus_interval);
                }
            }
        })
    }, g.menuTimeout_delay);
}

export function preload_files() {
    for (let index = -(num_files_preload); index <= num_files_preload; index++) {
        const metadata = file.navFile(index, true);
        if (!metadata.hasOwnProperty('elem') && !metadata.hasOwnProperty('panzoom')) {
            metadata.elem = loadFile(metadata);
            metadata.panzoom = createPanzoom(metadata);
        }
    }
    return;
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
        case 'image/avif':
        case 'image/gif':
        case 'image/bmp':
        case 'image/webp':
        case 'image/tiff':
        case 'image/x-icon':
        case 'image/vnd.microsoft.icon':
        case 'image':
        case 'image/svg+xml':
            return file.createElem('img', fileMetadata);
        case 'video/mp4':
        case 'video/webm':
            return file.createElem('video', fileMetadata);
        case 'audio/mp3':
            return file.createElem('audio', fileMetadata);
        case 'no_file':
            return file.createElem('p', 'No file found.');
        //TO BE ADDED & HAS OR DOESNT HAVE THUMBNAIL
        case 'application/x-photoshop':
        case 'application/pdf':
        case 'video/x-matroska': // VIDEO_MKV
        case 'application/zip':
        default:
            return file.createElem('p', `The file could not be loaded. (type: ${fileMetadata.mime})`);
    }
}

export function createPanzoom(metadata) {
    const elem = metadata['elem'];
    //makes the elem visible to the dom but invisible to the user, so that its dimensions can be measured.
    // elem.css({ opacity: 1 });
    $('#filePlaceholder').append(elem);
    const pz = panzoom(elem.children()[0], {
        panX: true,
        panY: true,
        transformOrigin: { x: 0.5, y: 0.5, relative: true },
        boundsPadding: 0.4, //don't exceed the half of container (0.5) to prevent zoom issues
        boundsDisabledForZoom: true
        // bounds: {
        //     top: 0,
        //     left: 0,
        //     bottom: $('body').height(),
        //     right: $('body').width()
        // },
        // boundsContain: true
    });
    pz.pause(); //prevent user pan/zoom
    elem.detach();
    return pz;
}

//zoom to fit
export function autofitpz(obj, fit_type = 'auto') {
    const pz = obj.panzoom;
    const container = $('body');
    const el = $(obj.elem.children()[0]);
    //FIXME: When navving back and forth fast enough while the pan animation is still occuring, autofitpz() does not execute.
    //pan to edge fast enough to cause the smooth pan animation, nav file by exceeding the edge, then nav back fast enough.
    // if(pz.getTransform().moveByAnimation){pz.getTransform().moveByAnimation.cancel();}
    // window.cancelAnimationFrame(pz.getTransform().frameAnimation);

    if (['P', 'AUDIO', 'VIDEO'].indexOf(el[0].nodeName) > -1) {
        //just only center the element
        centerpz(obj);
        return;
    }

    const el_dims = { width: 0, height: 0 };
    if (obj.hasOwnProperty('hash')) { //if hydrus metadata
        el_dims.width = obj.width;
        el_dims.height = obj.height;
    } else {
        el_dims.width = el.width();
        el_dims.height = el.height();
    }
    const container_dims = {
        width: container.width(),
        height: container.height()
    };

    const tf = pz.getTransform();
    const fit_to_width = container_dims.width / el_dims.width;
    const fit_to_height = container_dims.height / el_dims.height;
    //console.log(JSON.stringify({ container: container_dims, el_dims: el_dims, calc_fit: { width: fit_to_width, height: fit_to_height } }));
    var scale = 0;
    if (isNaN(tf.x) || isNaN(tf.y)) { console.error('Unable to get panzoom pos, aborting autofitpz.', obj); return; };

    switch (fit_type) {
        case 'width':
            scale = fit_to_width; //fit to width
            pz.setOptions({ panX: false, panY: true });
            break;
        case 'height':
            scale = fit_to_height; //fit to height
            pz.setOptions({ panX: true, panY: false });
            break;
        case 'auto-shrink': //shrink to fit container
            pz.setOptions({ panX: true, panY: true });
            scale = 1;
            if (el_dims.width > container_dims.width || el_dims.height > container_dims.height) {
                if ((el_dims.height * fit_to_width) > container_dims.height) {
                    scale = fit_to_height; //fit to height
                } else {
                    scale = fit_to_width; //fit to width
                }
            }
            break;
        case 'auto': //shrink and expand to fit container
        default:
            pz.setOptions({ panX: true, panY: true });
            //if fit to width, will the el's height exceed the container height?
            if ((el_dims.height * fit_to_width) > container_dims.height) {
                scale = fit_to_height; //fit to height
            } else {
                scale = fit_to_width; //fit to width
            }
            break;
    }

    el.css('visibility', 'hidden');
    pz.zoomAbs(tf.x, tf.y, scale);
    centerpz(obj);
    el.css('visibility', '');
    return;
}

//center panzoom_elem
//requires el to be visible / loaded into dom
//FIXME: does not center when switching fit_type modes while panzoom is active.
export function centerpz(obj) {
    const container = $('#filePlaceholder');
    const el = $(obj.elem.children()[0]);
    const pz = obj.panzoom;
    //wait until file has dimensions to work with
    if (!el[0].complete || (el.width() === 0 && el.height() === 0)) {
        el.on('load', function () {
            centerpz(obj);
            return;
        });
    }

    el.css('visibility', 'hidden');
    const el_dims = { width: 0, height: 0 };
    el_dims.width = el.width();
    el_dims.height = el.height();
    const container_dims = { width: container.width(), height: container.height() };
    const tf = pz.getTransform();
    const pan = {
        x: (container_dims.width / 2) - ((el_dims.width * tf.scale) / 2),
        y: (container_dims.height / 2) - ((el_dims.height * tf.scale) / 2)
    };

    if (isNaN(pan.x) || isNaN(pan.y)) {
        console.error(`Unable to calculate center pos, aborting centerpz.`, {
            el_dims: el_dims,
            container_dims: container_dims,
            pz_transform: tf,
            pan: pan,
        }, obj);
        obj.elem.css('visibility', '');
        return;
    };
    pz.setOptions({ bounds: false });
    pz.moveTo(pan.x, pan.y);
    pz.setOptions({ bounds: true });
    el.css('visibility', '');
    return;
}

export function update_currentPos_display() {
    $('#file_length').text(g.clientFiles[file.currentPos.y].length);
    $('#search_no').text(g.client_named_Searches[file.currentPos.y]);
    $('#jump_to_search_name').prop('value', file.currentPos.y);
    $('#jump_to_search_number').prop('value', file.currentPos.y + 1);
    $('#jump_to_file_number').prop('value', file.currentPos.x + 1);
    $('#file_length').text(`of ${g.clientFiles[file.currentPos.y].length} files`);
}

export function update_file_numbers() {
    $('#jump_to_file_number').prop('max', g.clientFiles[file.currentPos.y].length)
}

export function loadFileTags(metadata) {
    if (metadata.mime === 'no_file') {
        $('#committags').hide();
        $('#taglist').val('');
        $('#taglist').attr('readonly', '');
        return;
    }
    //switch tag services
    const service_keys = metadata?.tags;
    const selected_service_key = $('#tagRepositoryList').val();
    $('#taglist').val('');
    if (service_keys === undefined && metadata.mime != 'no_file') {
        const err_msg = `No tags found for [${file.currentPos.y}][${file.currentPos.x}]`;
        //console.error(err_msg);
        $('#taglist').val(err_msg);
        return;
    }

    const selected_tag_display_type = $('#displayTagToggle').val();
    const tags = service_keys[selected_service_key];

    const is_AKT_or_RTS = Object.keys(service_keys).reduce(function (acc, val) {
        if (
            (service_keys[val].type === 10 && val === selected_service_key) ||
            (service_keys[val].type === 0 && val === selected_service_key)
        ) { acc = true };
        return acc;
    }, false);

    //if selected tag service is 'all known tags' or any remote tag services such as 'public tag repository'
    if (is_AKT_or_RTS || selected_tag_display_type === 'display') {
        $('#committags').hide();
        $('#taglist').attr('readonly', '');

    } else {
        $('#committags').show();
        $('#taglist').removeAttr('readonly');
    }

    //switch tag display between 'Display' and 'Storage'
    if (selected_tag_display_type === 'display') { //display tags
        const current = tags.display_tags['0'];
        if (current != undefined) { $('#taglist').val(current.join('\n')); }
    } else { //Storage tags
        const current = tags.storage_tags['0'];
        if (current != undefined) { $('#taglist').val(current.join('\n')); }
    }

}

export function loadFileNotes(metadata) {

    const notes = metadata?.notes;
    const note_button_options = $('#file_info_notes .dropdown-menu');
    const note_field = $('#file_info_notefield');

    if (metadata.mime === 'no_file') {
        $('.popup').addClass('d-none');
        $('.popup-header span').text('');
        $('.popup-content p').text('');
        note_button_options.find('li').remove();
        note_field.find('div').remove();
        $('.popup select').children('option').remove();
        $('#file_info_notes span').text('No notes!');
        return;
    }

    $('.popup').addClass('d-none');
    $('.popup-header span').text('');
    $('.popup-content p').text('');
    note_button_options.find('li').remove();
    note_field.find('div').remove();
    $('.popup select').children('option').remove();

    if (Object.keys(notes).length === 0 || notes === undefined) {

        $('#file_info_notes span').text('No notes!');
        return;
    } else { if (g.floating_notes_persist) { $('.popup').removeClass('d-none'); } }


    const keys = Object.keys(notes);

    for (let index = 0; index < keys.length; index++) {

        note_button_options.append(
            $('<li/>').append(
                $('<a/>', { 'class': 'dropdown-item', 'href': `#note${index}` })
                    .on('click', () => {
                        $('#file_info_notes .dropdown-menu .active').removeClass('active');
                        $(`[href='#note${index}']`).addClass('active');
                        $('#file_info_notes span').text(keys[index]).prop('title', keys[index]);
                    })
                    .text(keys[index])
            ));

        $('.popup select').append(
            $('<option/>', { 'value': index }).text(keys[index])
        );
        const note_name = $('<h5/>', { 'id': `note${index}` }).text(keys[index]);
        note_field.append($('<div/>').append(
            note_name
        ).append(
            $('<p/>').text(notes[keys[index]])
        ).append($('<br/>'))
        );

    }

    //floating notes viewer
    if (keys.length > 1) {
        $('.popup select').show();
    } else {
        $('.popup select').hide();
    }
    $($('.popup select').children('option')[0]).prop('selected', true);
    $('.popup-header span').text(keys[0]);
    $('.popup-content p').text(notes[keys[0]]);

    $('#file_info_notes span').text(keys[0]).prop('title', keys[0]);
    $(`[href='#note0']`).addClass('active');
    bootstrap.ScrollSpy.getInstance($('#file_info_notefield')).refresh();
}

export function loadFileMetadata(metadata) {
    if (metadata?.hash === undefined) { return; }

    const elem_hash = $('#file_info_hash');
    const elem_urls = $('#file_info_urls');
    elem_hash.text('');
    elem_hash.text(metadata.hash);

    elem_urls.find('*').remove();
    metadata.known_urls.forEach(url => {
        elem_urls.append(
            $(`<span>${url}</span><br/>`)
        );
    });
    elem_urls.append($('<br/>'));


}

export function loadNote(metadata, note_name) {
    const notes = metadata?.notes;
    if (notes === undefined || note_name === undefined) { return; }
    const note_field = $('#file_info_notefield');
    note_field.text(notes[note_name]);
}