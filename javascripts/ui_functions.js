import * as file from './file_functions.js';
import * as tag from './tag_functions.js';
import * as ui from './ui_functions.js';
import * as g from './main.js';

export const num_files_preload = 20;
let job_id = 0;
let SEARCH_THRESHOLD = 5000;

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
            $('#progress_bar_status').text(status);

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
                        $('#progress_bar_status').text('Search cancelled.');
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

                        //FIXME: when it errors, the error is actually for the previous search.
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

                //console.info(`${numberOfFiles} files found across ${result.length} searches!`)
                //console.debug({ 'fileMetadatas': result });

                g.set_clientFiles(result);
                preload_files();
                setTimeout(() => {
                    tag.loadFiles();
                }, 5000);
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

function preload_files() {
    for (let index = -(num_files_preload); index <= num_files_preload; index++) {
        const metadata = file.navFile(index, true);
        if (!metadata.hasOwnProperty('elem') && !metadata.hasOwnProperty('panzoom')) {
            //console.log('hash: ' + metadata.hash);
            metadata['elem'] = loadFile(metadata);
            metadata['panzoom'] = createPanzoom(metadata);
            autofitpz(metadata);
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
        case 'image/gif':
        case 'image/bmp':
        case 'image/webp':
        case 'image/tiff':
        case 'image/x-icon':
        case 'image/vnd.microsoft.icon':
        case 'image':
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
        bounds: true, //TODO: turn this back on when finished processing files - the keepTransformInsideBounds() method creates unnecessary offsets in centerpz()
        panX: false,
        panY: false,
        transformOrigin: { x: 0.5, y: 0.5 },
    });
    pz.pause(); //prevent user pan/zoom
    elem.detach();
    return pz;
}

//zoom to fit
export async function autofitpz(obj, fit_type = 'auto') {
    const pz = obj.panzoom;
    const container = $('body');

    if (['P', 'AUDIO', 'VIDEO'].indexOf(obj['elem'].children()[0].nodeName) > -1) {
        //just only center the element
        centerpz(obj);
        return;
    }

    const el_dims = { width: 0, height: 0 };
    if (obj.hasOwnProperty('hash')) { //if hydrus metadata
        el_dims.width = obj.width;
        el_dims.height = obj.height;
        // //console.log('autofitting hash: ' + obj.hash);
    }
    // else if (obj instanceof HTMLElement) { //if non-hydrus file, e.g. no file <p>
    //     el_dims.width = obj.clientWidth;
    //     el_dims.height = obj.clientHeight;
    //     // //console.log('autofitting el: ' + obj.outerHTML);
    // } else {
    //     //console.error('Could not identify file / element dimensions. Something might go wrong!');
    // }
    const container_dims = {
        width: container.width(),
        height: container.height()
    };
    // if(container_dims.width != 1023 || container_dims.height != 680) {//console.error('dims mismatch! ' + JSON.stringify(container_dims));}

    const tf = pz.getTransform();
    const fit_to_width = container_dims.width / el_dims.width;
    const fit_to_height = container_dims.height / el_dims.height;
    //console.log(JSON.stringify({ container: container_dims, el_dims: el_dims, calc_fit: { width: fit_to_width, height: fit_to_height } }));
    var scale = 0;

    switch (fit_type) {
        case 'width':
            scale = fit_to_width; //fit to width
            break;
        case 'height':
            scale = fit_to_height; //fit to height
            break;
        case 'auto': //fit to container
        default:
            //if fit to width, will the el's height exceed the container height?
            if ((el_dims.height * fit_to_width) > container_dims.height) {
                scale = fit_to_height; //fit to height
            } else {
                scale = fit_to_width; //fit to width
            }
            break;
    }
    //console.warn(`scale: ${scale}; hash: ${obj.hash}`);
    //error here if scale is Infinity

    // pz.on('zoom', ()=>{
    //     pz.off();
    //         //console.log(pz.getTransform());
    //     centerpz(obj, container);
    //   });              

    // //console.log(pz.getTransform());
    // waitForElm(obj['elem'][0]).then(() => {
    //     pz.zoomAbs(tf.x, tf.y, scale);
    //     obj['elem'].detach();
    //     centerpz(obj, container);
    // });
    //console.log('a');
    // container.append(obj['elem'].css('visibility', 'hidden'));
    setTimeout(() => {
        //console.log('b');
        pz.zoomAbs(tf.x, tf.y, scale);
        // obj['elem'].detach().css('visibility', '');
        //console.warn(pz.getTransform(), obj);

        setTimeout(() => {
            //console.log('c');


            centerpz(obj);
            setTimeout(() => {

                //console.warn(pz.getTransform(), obj);
                //console.log('d');
            }, 1000);
        }, 1000);
    }, 1000);



    // });
    // obj['elem'].detach();;


    // //console.log(pz.getTransform());
    return;

    /* 
    $('#filePlaceholder').append(obj['elem']);
    setTimeout(() => {
        pz.zoomAbs(tf.x, tf.y, scale);
        obj['elem'].detach();
        centerpz(obj, container);
    }, 100);

        $('#filePlaceholder').append(obj['elem'])
    await waitForElm(obj['elem'][0]);
        pz.zoomAbs(tf.x, tf.y, scale);

    */
}

//center panzoom_elem
//requires el to be visible / loaded into dom
export async function centerpz(obj) {
    const container = $('#filePlaceholder');
    const el = $(obj.elem.children()[0]);
    const pz = obj.panzoom;
    setTimeout(() => {
        //console.log('e');

        const el_dims = { width: 0, height: 0 };
        if (['P', 'AUDIO', 'VIDEO'].indexOf(el[0].nodeName) > -1) { //if non-hydrus file, e.g. no file <p>
            container.append(obj.elem.css('visibility', 'hidden'));
            el_dims.width = el.width();
            el_dims.height = el.height();
            obj.elem.detach().css('visibility', '');
            // //console.log('centerpz hash: ' + obj.hash);
        } else if (obj.hasOwnProperty('hash')) {//if hydrus metadata
            el_dims.width = obj.width;
            el_dims.height = obj.height;
            // //console.log('centerpz el: ' + obj.outerHTML);
        } else {
            //console.error('Could not identify file / element dimensions. Something might go wrong!', obj);
        }
        console.log(obj.file_id + ' - ' + JSON.stringify(el_dims), obj);
        // if (obj.hasOwnProperty('hash')) { //if hydrus metadata
        //     el_dims.width = obj.width;
        //     el_dims.height = obj.height;
        //     // //console.log('centerpz hash: ' + obj.hash);
        // } else if (obj instanceof HTMLElement) { //if non-hydrus file, e.g. no file <p>
        //     el_dims.width = obj.clientWidth;
        //     el_dims.height = obj.clientHeight;
        //     // //console.log('centerpz el: ' + obj.outerHTML);
        // } else {
        //     //console.error('Could not identify file / element dimensions. Something might go wrong!');
        // }
        const container_dims = { width: container.width(), height: container.height() };
        // if(container_dims.width != 1023 || container_dims.height != 680) {//console.error('dims mismatch! ' + JSON.stringify(container_dims));}
        // let el_rect = el.getBoundingClientRect();
        const tf = pz.getTransform();
        const pan = {
            x: (container_dims.width / 2) - ((el_dims.width * tf.scale) / 2),
            y: (container_dims.height / 2) - ((el_dims.height * tf.scale) / 2)
        };
        console.log(pan, obj);

        //error here if pan.x || pan.y === NaN;
        // setTimeout(() => {
        if (obj['elem'][0].nodeName != 'VIDEO') { //FIXME: video offsets for some reason? this has been excepted as video is already full width.
            pz.setOptions({ bounds: undefined });
            setTimeout(() => {
                pz.moveTo(pan.x, pan.y);
                setTimeout(() => {
                    pz.setOptions({ bounds: true });
                }, 1000);
            }, 1000);
        }

        // }, 1000);

    }, 1000);
    return;
}

function waitForElm(el) {
    return new Promise(resolve => {
        if (document.contains(el)) { return resolve(el); }

        const observer = new MutationObserver(() => {
            if (document.contains(el)) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
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