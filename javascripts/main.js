import * as file from './file_functions.js';
import * as tag from './tag_functions.js';
import * as ui from './ui_functions.js';

export let clientKey = '',
    clientURL = '',
    clientFiles = [],
    client_named_Searches = [],
    menuTimeout, cursor_timeout,
    menuTimeout_delay = 3000,
    nav_increment = 1,
    panzoom_persist = false,
    floating_notes_persist = false,
    fit_type = 'auto';

var touch_start;

let is_fullscreenchange_event = true;

const offcanvasElementList = document.querySelectorAll('.offcanvas');
const offcanvasList = [...offcanvasElementList].map(offcanvasEl => new bootstrap.Offcanvas(offcanvasEl));

const MAX_TIMER_INT = 2147483647;
var SWIPE_THRESHOLD = 100;
const sort_val_to_sort_int = {
    '0': [0, true],
    '1': [0, false],
    '2': [1, true],
    '3': [1, false],
    '4': [2, true],
    '5': [2, false], //api default
    '6': [3, false],
    '7': [4, false],
    '8': [5, true],
    '9': [5, false],
    '10': [6, true],
    '11': [6, false],
    '12': [7, true],
    '13': [7, false],
    '14': [8, true],
    '15': [8, false],
    '16': [9, true],
    '17': [9, false],
    '18': [10, true],
    '19': [10, false],
    '20': [11, true],
    '21': [11, false],
    '22': [12, true],
    '23': [12, false],
    '24': [13, true],
    '25': [13, false],
    '26': [14, true],
    '27': [14, false],
    '28': [15, true],
    '29': [15, false],
    '30': [16, true],
    '31': [16, false],
    '32': [18, true],
    '33': [18, false],
    '34': [19, true],
    '35': [19, false],
    '36': [20, false],
    '37': [100, false],
    '38': [100, true]
};
const floating_notes_styles = {
    'text shadow outline_BH': `
    .custom-body {
        text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;
        backdrop-filter: blur(2px);
    }

    .custom-header {
        font-weight: bold; 
   }`,

    'text shadow outline': `
    .custom-body {
        text-shadow: 0 0 0.5em black, 0 0 0.5em black, 0 0 0.5em black;
        backdrop-filter: blur(2px);
    }`,

    'dark transclucent_BH': `
    .custom-body {
        background: #0000006b;
        box-shadow: 0 0 0.5em 0.5em #0000006b;
        backdrop-filter: blur(2px);
    }

    .custom-header {
         font-weight: bold; 
    }`,

    'dark transclucent': `
    .custom-body {
        background: #0000006b;
        box-shadow: 0 0 0.5em 0.5em #0000006b;
        backdrop-filter: blur(2px);
    }`,

    'what': `
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

clientKey = localStorage['clientKey'];
clientURL = localStorage['clientURL'];
$.ajaxSetup({
    headers: { 'Hydrus-Client-API-Access-Key': localStorage['clientKey'] },
    error: function (err) { console.error(err) },
    success: function (res) { console.debug(res) }
});

if (localStorage['command'] != undefined) { try { $('#command').val(JSON.stringify(JSON.parse(localStorage['command']), null, 4)); } catch { } }
if (localStorage['clientKey'] != undefined) { $('#clientKey').val(localStorage['clientKey']); }
if (localStorage['clientURL'] != undefined) { $('#clientURL').val(localStorage['clientURL']); }
if (localStorage['custom_namespace'] != undefined) { $('#custom_namespace').val(localStorage['custom_namespace']); }
if (localStorage['sort_order'] != undefined) { $('#sort_order').val(localStorage['sort_order']); }
if (localStorage['jump_files_by'] != undefined) { $('#jump_files_by').val(localStorage['jump_files_by']); nav_increment = parseInt(localStorage['jump_files_by']); }
if (localStorage['floating_notes_css'] != undefined) { $('#floating_notes_css').val(localStorage['floating_notes_css']); $('#notesCSS').html(floating_notes_styles[localStorage['floating_notes_css']]); }
if (localStorage['floating_notes_checkbox'] != undefined) {
    floating_notes_persist = localStorage['floating_notes_checkbox'] === 'true' ? true : false;
    $('#floating_notes_checkbox').prop('checked', floating_notes_persist);

}

if (localStorage['hideSidebarDelay'] != undefined) {
    $('#sidebarDelay').val(localStorage['hideSidebarDelay']);
    menuTimeout_delay = localStorage['hideSidebarDelay'];
} else {
    $('#sidebarDelay').val('2000');
    menuTimeout_delay = 2000;
}
if (localStorage['swipeThreshold'] != undefined) {
    $('#swipeThreshold').val(localStorage['swipeThreshold']);
    SWIPE_THRESHOLD = localStorage['swipeThreshold'];
} else {
    $('#swipeThreshold').val('100');
    SWIPE_THRESHOLD = 100;
}

$('#sidebarDelay').on('keyup', function (event) {
    localStorage.setItem('hideSidebarDelay', $(event.target).val());
    menuTimeout_delay = $(event.target).val();
});
$('#swipeThreshold').on('keyup', function (event) {
    localStorage.setItem('swipeThreshold', $(event.target).val());
    SWIPE_THRESHOLD = $(event.target).val();
});

$('#custom_namespace').on('keyup', function (event) {
    localStorage.setItem('custom_namespace', $(event.target).val());
});

$('#floating_notes_css').on('change', function (event) {

    localStorage.setItem('floating_notes_css', $(event.target).val());
    $('#notesCSS').html(floating_notes_styles[$(event.target).val()]);
});

$(document).on('keydown', (e) => {
    if (e.repeat) return;

    if (e.key === 'Control') {
        file.navFile(0, true)['panzoom'].resume();
        $('[for=\'zoomToggle\']').addClass('active');

    }
});

$(document).on('keyup', (e) => {

    if (e.key === 'Control') {
        file.navFile(0, true)['panzoom'].pause();
        $('[for=\'zoomToggle\']').removeClass('active');
        resetZoom(file.navFile(0, true));
    }
});

$('.popup select').on('change', function (e) {
    const notes = file.navFile(0, true)?.notes;
    if (Object.keys(notes).length === 0 || notes === undefined) { return; }
    const keys = Object.keys(notes);
    $('.popup-header span').text(keys[parseInt($(e.target).val())]);
    $('.popup-content p').text(notes[keys[parseInt($(e.target).val())]]);

});

$('#zoomToggle').on('change', (e) => {
    if ($(e.target).is(':checked')) {
        file.navFile(0, true)['panzoom'].resume();
    } else {
        file.navFile(0, true)['panzoom'].pause();
        resetZoom(file.navFile(0, true));
    }
});

$('#window_fitToggle').on('click', () => {
    const el = $('#window_fitToggle');
    const el_visible = el.find('svg:not(.hidden)');
    const file_metadata = file.navFile(0, true);

    el_visible.addClass('hidden');
    $('#fileCanvas .visible *').css('position', '');

    switch (true) {
        //fit width
        case el_visible.hasClass('bi-arrows-fullscreen'):
            el.find('.bi-arrows').removeClass('hidden');
            fit_type = 'width';
            break;

        //fit height
        case el_visible.hasClass('bi-arrows'):
            el.find('.bi-arrows-vertical').removeClass('hidden');
            fit_type = 'height';
            break;

        //shrink to fit / original size
        case el_visible.hasClass('bi-arrows-vertical'):
            el.find('.bi-aspect-ratio').removeClass('hidden');
            fit_type = 'auto-shrink';
            break;

        //shrink/expand to fit (default)
        case el_visible.hasClass('bi-aspect-ratio'):
            el.find('.bi-arrows-fullscreen').removeClass('hidden');
            fit_type = 'auto';
            break;
    }
    ui.autofitpz(file_metadata, fit_type);
});

$('#panzoom_persist').on('change', (e) => {
    if ($(e.target).prop('checked')) {
        panzoom_persist = true;
    } else {
        panzoom_persist = false;
    }
});

$('#floating_notes_checkbox').on('change', (e) => {
    if ($(e.target).prop('checked')) {
        floating_notes_persist = true;
        localStorage.setItem('floating_notes_checkbox', $(e.target).prop('checked'));
        ui.loadFileNotes(file.navFile(0, true));
    } else {
        floating_notes_persist = false;
        localStorage.setItem('floating_notes_checkbox', $(e.target).prop('checked'));
        ui.loadFileNotes(file.navFile(0, true));
        $('.popup').addClass('d-none');
    }
});

$('#committags').on('click', function () { tag.commitTags(); });

$('#tagRepositoryList , #displayTagToggle').each(function (i, v) {
    $(v).on('change', function (e) {
        ui.loadFileTags(file.navFile(0, true));
    });
});

$('#fileCanvas').on('click', function (e) {
    offcanvasList.forEach((v) => { v.hide(); });
    //prevents media from playing upon mouse swipe
    if (['VIDEO', 'AUDIO'].indexOf(e.target.nodeName) > -1) {
        e.preventDefault();
    }
})

var pointer_start = null;

$('#fileCanvas').on('mousedown', function (e) {
    pointer_start = e;
});

var prev_pointer;
$('#fileCanvas').on('mousemove', function (e) {
    if (prev_pointer === null) { return; }
    prev_pointer = e;
});

$('#fileCanvas').on('mouseup ', function (e) {

    if (clientFiles.length === 0 || pointer_start === null) { return; }
    //TODO: check if exceed swipeable region of pan and filenav in that direction. aka "force swipe"
    //maybe? shift the file to the opposite side of the exceeded side to "simulate" a page turn - so that the next/prev file is not centered if exceeded pan swipe
    //also consider when in fit to width / vertical swipe mode.
    let pointer_end = e;
    const directionX = pointer_end.clientX - pointer_start.clientX;
    const directionY = pointer_end.clientY - pointer_start.clientY;
    pointer_start = null;
    const curr_file = file.navFile(0, true);

    //don't nav while zooming, but allow toggleUI()
    if (
        //within horizontal and vertical threshold
        (Math.abs(directionX) < SWIPE_THRESHOLD) &&
        (Math.abs(directionY) < SWIPE_THRESHOLD)
    ) {
        //normal click
        toggleUI();
        if (['VIDEO'].indexOf(e.target.nodeName) > -1) {
            e.target[e.target.paused ? 'play' : 'pause'](); //simulates click on HTML5 video player
        }
    } else {
        //if within vertical threshold, and is swiping horizontally
        //filenav when either panzoom is off, or when file is at x boundsPadding when panzoom is on
        if (
            Math.abs(directionY) < SWIPE_THRESHOLD /*  && fit_type != 'width' */
        ) {
            if ( //+, swipe left
                directionX < -(SWIPE_THRESHOLD) &&
                //if panzoom is off or;
                curr_file.panzoom.isPaused() ||
                //if panzoom is at edge of boundsPadding
                (!curr_file.panzoom.isPaused() && (
                    //x left: if right of file at the left of boundsPadding
                    Math.trunc(curr_file.elem.width() * curr_file.panzoom.getTransform().boundsPadding) === Math.abs(Math.trunc(curr_file.panzoom.getTransform().x + (curr_file.width * curr_file.panzoom.getTransform().scale)))
                ))
            ) {
                navNextFile();
            }
            else if ( //-, swipe right
                directionX > SWIPE_THRESHOLD &&
                //if panzoom is off or;
                curr_file.panzoom.isPaused() ||
                //if panzoom is at edge of boundsPadding
                (!curr_file.panzoom.isPaused() && (
                    //x right: if left of file at the right of boundsPadding
                    Math.abs(Math.trunc(curr_file.elem.width() * (1 - curr_file.panzoom.getTransform().boundsPadding))) === Math.abs(Math.trunc(curr_file.panzoom.getTransform().x))
                ))
            ) {
                navPrevFile();
            }
        }
        //now the other way! - but only when vertical pan is enabled (fit to width)
        //if within horizontal threshold, and is swiping vertically
        //filenav when either panzoom is off, or when file is at y boundsPadding when panzoom is on
        if (Math.abs(directionX) < SWIPE_THRESHOLD && fit_type === 'width') {

            if ( //+, swipe up
                directionY < -(SWIPE_THRESHOLD) &&
                curr_file.panzoom.isPaused() ||
                (!curr_file.panzoom.isPaused() && (
                    //y top: if bottom of file at the top of boundsPadding
                    Math.trunc(curr_file.elem.height() * curr_file.panzoom.getTransform().boundsPadding) === Math.abs(Math.trunc(curr_file.panzoom.getTransform().y + (curr_file.height * curr_file.panzoom.getTransform().scale)))
                ))
            ) {
                navNextFile();
            }
            else if ( //-, swipe down
                directionY > SWIPE_THRESHOLD &&
                curr_file.panzoom.isPaused() ||
                (!curr_file.panzoom.isPaused() && (
                    //y bottom: if top of file at the bottom of boundsPadding
                    Math.abs(Math.trunc(curr_file.elem.height() * (1 - curr_file.panzoom.getTransform().boundsPadding))) === Math.abs(Math.trunc(curr_file.panzoom.getTransform().y))
                ))
            ) {
                navPrevFile();
            }
        }
    }
});

function navPrevFile() {
    // const curr_file = file.navFile(0, true);
    // if (panzoom_persist && $('#zoomToggle').prop('checked')) {
    //     curr_file.panzoom.resume();
    // } else if (!panzoom_persist && !curr_file.panzoom.isPaused()) {
    //     curr_file.panzoom.pause();
    //     $('#zoomToggle').prop('checked', false);
    // }
    file.navFile(-1);
}

function navNextFile() {
    // const curr_file = file.navFile(0, true);
    // if (panzoom_persist && $('#zoomToggle').prop('checked')) {
    //     curr_file.panzoom.resume();
    // } else if (!panzoom_persist && !curr_file.panzoom.isPaused()) {
    //     curr_file.panzoom.pause();
    //     $('#zoomToggle').prop('checked', false);
    // }
    file.navFile(1);
}

$('#fileCanvas').on('touchstart', function (e) {
    //set starting pos of touch
    if ($(e.target).parents('#fileCanvas')[0]) {//swipe nav
        touch_start = e;
    }
});

$('#fileCanvas').on('touchmove', function (e) {
});

$('#fileCanvas').on('touchend', function (e) {
    //swiping on fileCanvas
    if ($(e.target).parents('#fileCanvas')[0] || $(e.target).is('#fileCanvas')) {
        if (e.touches.length === 0) {
            var touch_end = e.changedTouches[0];
        } else {
            var touch_end = e.touches[0];
        }
        const pointer_start_last = touch_start.touches[touch_start.touches.length - 1];
        const directionX = touch_end.clientX - pointer_start_last.clientX;
        const directionY = touch_end.clientY - pointer_start_last.clientY;
        //show UI on tap (within threshold) or while panzooming
        if (
            (
                (Math.abs(directionX) < SWIPE_THRESHOLD) &&
                (Math.abs(directionY) < SWIPE_THRESHOLD) &&
                file.navFile(0, true)['panzoom'].isPaused()
            )
            || !file.navFile(0, true)['panzoom'].isPaused()
        ) {
            toggleUI();
        } else {
            //filenav
            if (
                (Math.abs(directionY) < SWIPE_THRESHOLD) &&
                file.navFile(0, true)['panzoom'].isPaused() &&
                touch_start.touches.length === 1
            ) {
                if ( //+, swipe left
                    directionX < -(SWIPE_THRESHOLD) &&
                    Math.round($('#filePlaceholder').scrollLeft()) >= ($('#filePlaceholder')[0].scrollWidth - $('#filePlaceholder')[0].clientWidth)
                ) {
                    file.navFile(-1);
                }
                else if ( //-, swipe right
                    directionX > SWIPE_THRESHOLD &&
                    $('#filePlaceholder').scrollLeft() === 0
                ) {
                    file.navFile(1);
                }
            }

            if (touch_start.touches.length === 2) {
                if ( //+, swipe left
                    directionX < -(SWIPE_THRESHOLD)
                ) {
                    file.navFile(-1);
                }
                else if ( //-, swipe right
                    directionX > SWIPE_THRESHOLD
                ) {
                    file.navFile(1);
                }
            }

        }

    }
});

$('#rightSidebar').on('shown.bs.offcanvas', () => {
    bootstrap.ScrollSpy.getInstance($('#file_info_notefield')).refresh();
});

$('.menu-submenu').on('click', function (e) {
    const popout = $(e.target).parent().find('.div-popout');
    if (popout.is(':visible')) {
        popout.hide();
    } else {
        popout.show();
    }
});

export function loading_error() {
    $('.progress').show().removeClass('border-secondary').addClass('border-danger');
    $('.progress-bar').removeClass('bg-secondary').addClass('bg-danger')

    setTimeout(() => {
        $('#progress_bar').hide();
        $('#progress_bar_status span').remove();
    }, 10000);
    return;
}

$('#uploadButton').on('change', async (e) => {
    const file = await e.target.files[0].text();
    try {
        $('#command').val(JSON.stringify(JSON.parse(file), null, 4));
    } catch (e) {
        console.error(e);
        if (e instanceof SyntaxError) {
            error_textInput($('#command'), 'JSON Syntax error. Check your input.');
        } else {
            error_textInput($('#command'), e);
        }

        return;
    }
});

$('#submitButton').on('click', async function () {
    if (clientURL.length === 0 || clientKey.length === 0) {
        error_textInput($('#command'), 'Client URL and/or Key not set. Please set them in Settings.');
        return;
    }
    $('#progress_bar').show();
    $('#progress_bar_status span').remove();
    $('.progress').removeClass('border-danger').addClass('border-secondary');
    $('.progress-bar').removeClass('bg-danger').addClass('bg-secondary')
    $('.progress-bar').css('width', `0%`);
    $('.popup').addClass('d-none');
    $('#zoomToggle').prop('checked', false);

    $('#filePlaceholder *').remove();
    $('#filePlaceholder *').removeClass('visible').addClass('hidden');
    file.currentPos.x = 0;
    file.currentPos.y = 0;
    clientFiles = [];
    client_named_Searches = [];
    const order = sort_val_to_sort_int[$('#sort_order').val()]

    try {
        var input = JSON.parse($('#command').val());
        $('#command').val(JSON.stringify(input, null, 4));

        try {
            localStorage.setItem('command', JSON.stringify(input));
        } catch (err) {
            if (
                err instanceof DOMException &&
                // everything except Firefox
                err.name === 'QuotaExceededError' ||
                // Firefox
                err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                alert(`Search query too large to save.\nYou must enter your search query again the next time you visit HSV.`);
            }
        }

        const map = new Map(Object.entries(input));

        let searches = [];
        $('#jump_to_search_name option').remove();
        $('#jump_to_search_number').prop('max', map.size);


        for (const search_name of map.keys()) {
            searches.push(map.get(search_name));

            let index = client_named_Searches.push(search_name) - 1;
            $('#jump_to_search_name').append(
                $('<option/>', { 'value': index }).text(search_name)
            );
        }

        ui.getFileMetaData(searches, order[0], order[1]);

    } catch (e) {
        console.error(e);
        if (e instanceof SyntaxError) {
            error_textInput($('#command'), 'Search error: JSON Syntax error. Check your search input.');
        } else {
            error_textInput($('#command'), e);
        }

        return;
    }

});

testClient();

export function set_clientFiles(files) {
    clientFiles = files;
}

function testClient() {
    clientKey = $('#clientKey').val();
    clientURL = $('#clientURL').val().replace(/(http(|s):\/\/.*(|:.*?))(\/)$/gm, `$1`);

    if (clientURL.length === 0 || clientKey.length === 0) {
        return;
    }

    $('#clientStatus').text('Testing...').css('color', '');

    $.ajaxSetup({
        headers: { 'Hydrus-Client-API-Access-Key': clientKey }
    });

    $.ajax({
        // url: clientURL + `/get_services`,
        url: clientURL + `/verify_access_key`,
        dataType: 'json',
        crossDomain: true,
        method: 'GET'
    }).done(function () {
        $('#clientStatus').text('Success').css('color', 'lime');
        localStorage.setItem('clientKey', clientKey);
        localStorage.setItem('clientURL', clientURL);

        $.ajax({
            url: clientURL + `/get_services`,
            dataType: 'json',
            crossDomain: true,
            method: 'GET'
        }).done((data) => {
            const tag_repos_elem = $('#tagRepositoryList');
            tag_repos_elem.find('*').remove();
            const all_known_tags = data['all_known_tags'][0];
            const remote_tag_services = data['tag_repositories'];
            const local_tag_services = data['local_tags'];
            const local_tags_elem = $('<optgroup/>', { 'label': 'local tag services' });
            const remote_tags_elem = $('<optgroup/>', { 'label': 'remote tag services' });

            for (const service of local_tag_services) {
                local_tags_elem.append(
                    $('<option/>', { 'value': service.service_key }).text(service.name)
                );
            }

            for (const service of remote_tag_services) {
                remote_tags_elem.append(
                    $('<option/>', { 'value': service.service_key }).text(service.name)
                );
            }

            tag_repos_elem.append($('<option/>', { 'value': all_known_tags.service_key }).text(all_known_tags.name));
            tag_repos_elem.append(local_tags_elem);
            tag_repos_elem.append(remote_tags_elem);
        });
    }).fail(function (jqXHR) {
        var status = jqXHR.status === 0 ? 'No response / Blocked' : jqXHR.status;
        $('#clientStatus').text(`Fail (${status})`).css('color', 'red');
        clientKey = '';
        clientURL = '';
        localStorage.setItem('clientKey', clientKey);
        localStorage.setItem('clientURL', clientURL);
    });
    return;
}

$('#client_test').on('click', (e) => {
    testClient();
});

//keyboard nav
$(document).on('keyup', (event) => {
    if ($('.leftSidebar').find(event.target)[0]) {//if leftSidebar
        return;
    }

    if ($('.rightSidebar').find(event.target)[0]) {
        event.preventDefault();

        return;
    }

    if (event.key === 'ArrowLeft') { //left
        event.preventDefault();
        if (clientFiles.length === 0) { return; }
        if (event.shiftKey) {
            file.navFile(-(nav_increment));
        } else {
            file.navFile(-1);
        }
    }
    else if (event.key === 'ArrowRight') { //right
        event.preventDefault();
        if (clientFiles.length === 0) { return; }
        if (event.shiftKey) {
            file.navFile(nav_increment);
        } else {
            file.navFile(1);
        }
    } else if (event.key === 'R' || event.key === 'r') {
        event.preventDefault();
        if (clientFiles.length === 0) { return; }
        file.navRandomFile();
    } else if (event.key === 'F' || event.key === 'f') {
        event.preventDefault();
        toggleFullscreen();
    }

});

$('#fullscreen_mode').on('change', (e) => {
    if (is_fullscreenchange_event) {
        toggleFullscreen();
    }
});

function toggleFullscreen() {
    is_fullscreenchange_event = false;
    if (document.fullscreenElement === null) {
        document.body.requestFullscreen();
        $('#fullscreen_mode').prop('checked', true);
    } else {
        document.exitFullscreen();
        $('#fullscreen_mode').prop('checked', false);
    }
    is_fullscreenchange_event = true;
    return;
}

$('#jump_files_by').on('change', (e) => {
    nav_increment = parseInt($(e.target).val());
    localStorage.setItem('jump_files_by', $(e.target).val());
});

$('#sort_order').on('change', (event) => {
    localStorage.setItem('sort_order', $(event.target).val());
});

$('#file_next').on('click', () => {
    file.navFile(1);
});
$('#file_previous').on('click', () => {
    file.navFile(-1);
});
$('#file_random').on('click', () => {
    file.navRandomFile();
});

$('#jump_to_search_number').on('input', (e) => {
    $($('#jump_to_search_name').children('option')[parseInt($(e.target).val()) - 1]).prop('selected', true);
});
$('#jump_to_search_name').on('change', (e) => {
    $('#jump_to_search_number').val(parseInt($(e.target).val()) + 1);

    let length = clientFiles[parseInt($(e.target).val())].length;
    $('#file_length').text(`of ${length} files`);
    if (parseInt($('#jump_to_file_number').val()) > length) { $('#jump_to_file_number').val(length); }
});

$('#jump_to_file_first').on('click', () => { $('#jump_to_file_number').val(1); });
$('#jump_to_file_last').on('click', () => { $('#jump_to_file_number').val(clientFiles[parseInt($('#jump_to_search_name').val())].length); });

$('#submit_jump').on('click', () => {
    const x = $('#jump_to_file_number');
    const y = $('#jump_to_search_number');
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

$('#file_jump_next').on('click', () => {
    file.navFile(nav_increment);
});

$('#file_jump_previous').on('click', () => {
    file.navFile(-(nav_increment));
});

new bootstrap.ScrollSpy($('#file_info_notefield'), {
    target: $('#file_info_notes')
});

$('#file_info_notefield').on('activate.bs.scrollspy', function (e) {
    const active_note = $('#file_info_notes li .active').text();
    const note_button_label = $('#file_info_notes span');
    note_button_label.text(active_note).prop('title', active_note);
});

$('#fileCanvas').on('wheel', function (event) {
    if (clientFiles.length === 0) { return; }
    if (event.ctrlKey) { event.preventDefault(); } //prevent ctrl zoom for panzoom shortcut

    if (file.navFile(0, true)['panzoom'].isPaused()) {
        event.preventDefault(); //prevent default wheel event (scrolling)

        //file scroll (shift+wheel)
        if (false/* event.shiftKey */) {
            // //it is scrollable, and shift key is held
            // const fit_button = $('#window_fitToggle svg:not(.hidden)');
            // if (fit_button.hasClass('bi-arrows')) {
            //     //if fit to width, do vertical scroll
            //     $('#filePlaceholder').scrollTop($('#filePlaceholder').scrollTop() + event.originalEvent.deltaY);
            // } else if (fit_button.hasClass('bi-arrows-vertical')) {
            //     //if fit to height, do horizontal scroll
            //     $('#filePlaceholder').scrollLeft($('#filePlaceholder').scrollLeft() + event.originalEvent.deltaY);
            // }
        } else {
            //file nav
            if (event.originalEvent.deltaY < 0) {//scroll up
                file.navFile(-1);
            }
            else { //scroll down
                file.navFile(1);
            }
        }
    }
});

export function error_textInput(input_elem, error_msg) {
    const elem = $(input_elem);
    elem.css('background-color', 'red');
    setTimeout(() => {
        elem.css('background-color', '');
        $('#progress_bar').hide();
    }, 10000);

    if (error_msg) {
        console.error(error_msg);
        ui.pushProgressBarStatus(error_msg);
    }

    return;
}

function resetZoom(obj) {
    if (clientFiles.length === 0) { return; }
    ui.autofitpz(obj, fit_type);
}

$(window).on('resize', () => {
    if (clientFiles.length === 0) { return; }
    ui.autofitpz(file.navFile(0, true), fit_type);
});

function toggleUI() {
    clearTimeout(menuTimeout);
    $('[for=zoomToggle], #window_fitToggle, #leftSidebarToggle, #rightSidebarToggle').fadeIn(400);

    menuTimeout = setTimeout(() => {
        $('[for=zoomToggle], #window_fitToggle, #leftSidebarToggle, #rightSidebarToggle').fadeOut(400);
    }, menuTimeout_delay);
}

function initDragElement() { //https://stackoverflow.com/a/72293914/5791312
    //TODO: add resizer elems back (maybe on top and left side as well?)
    //TODO: figure out how to keep floating div in viewport on window resize
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    var popups = document.getElementsByClassName('popup');
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
        $(document).on('pointerup', closeDragElement);
        // call a function whenever the cursor moves:
        $(document).on('pointermove', elementDrag);
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
        elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
        elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
    }

    function closeDragElement() {
        /* stop moving when mouse button is released:*/
        $(document).off('pointerup', closeDragElement);
        $(document).off('pointermove', elementDrag);
    }

    function getHeader(element) {
        var headerItems = element.getElementsByClassName('popup-header');
        if (headerItems.length === 1) {
            return headerItems[0];
        }

        return null;
    }
}

$(document).ready(function () {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            navigator.serviceWorker.register('./service-worker.js').then((registration) => {
                console.debug('Service Worker registered with scope:',
                    registration.scope);
            }).catch((err) => {
                console.error('Service worker registration failed:', err);
            });
        });
    } else { console.error('does not support service worker!'); }

    initDragElement();
});



