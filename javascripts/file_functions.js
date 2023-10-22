import * as file from './file_functions.js';
import * as tag from './tag_functions.js';
import * as ui from './ui_functions.js';
import * as g from './main.js';

export var currentPos = { 'x': 0, 'y': 0 };



export function createElem(type, content) {
    const url = `${g.clientURL}/get_files/file?Hydrus-Client-API-Access-Key=${g.clientKey}&file_id=${content['file_id']}`;
    const container_div = $('<div/>', { class: 'container-div' });
    switch (type) {
        case 'p':
            container_div.append($('<p/>', {}).text(content));
            break;
        case 'img':
            container_div.append($('<img/>', { 'src': url, 'role': 'img' }));
            break;
        case 'object':
            container_div.append($(`<object data="${url}"/>`));
            break;
        case 'video':
        case 'audio':
            let elem = $(`<${type}/>`, {
                'controls': '',
                'loop': '',
                'src': url
            });
            elem[0].volume = 0.5;
            container_div.append(elem);
            break;
    }
    return container_div;
}

export function navFile(increment, requireReturn = false) {
    let x = currentPos.x, y = currentPos.y;
    // console.log(`loading [${y}][${x}]`)

    if (increment != 0) {
        //sets x,y to the new position when factoring the increment in
        let tmpincrement = increment;
        if (increment > 0) { //+
            while (!((x + tmpincrement) > -1 && (x + tmpincrement) < g.clientFiles[y].length)) { //NOT (while X is LESS THAN the length of Y) - tests whether X is NOT within the boundaries of Y
                tmpincrement = tmpincrement - (g.clientFiles[y].length - x);
                if (y >= (g.clientFiles.length - 1)) { y = 0; } else { y++; }
                x = 0;
            } //sets X to next forward possible file, looping around if X is greater than the current search (Y)'s number of files
        } else {//-
            while (!((x + tmpincrement) > -1 && (x + tmpincrement) < g.clientFiles[y].length)) { //NOT (while X is GREATHER THAN 0) - tests whether X is NOT less than Y
                tmpincrement = tmpincrement + (x + 1);

                if (y <= 0) { y = g.clientFiles.length - 1; } else { y--; }
                // debugger;
                x = g.clientFiles[y].length - 1;
            } //sets X to next previous possible file, looping around if X is goes less than current search (Y)'s number of files
        }

        x = x + tmpincrement;
    }

    if (g.clientFiles?.[y]?.[x] === undefined) {
        console.error(`Something went wrong while returning navFile(${increment}, ${requireReturn}), where the currentPos is ${JSON.stringify(currentPos)}`, g.clientFiles);
        return;
    }

    if (requireReturn) {
        return g.clientFiles[y][x];
    } else {
        currentPos.y = y, currentPos.x = x;
        const file_metadata = file.navFile(0, true);
        ui.loadFileTags(file_metadata);
        ui.loadFileNotes(file_metadata);
        ui.loadFileMetadata(file_metadata);
        ui.update_currentPos_display();
        ui.update_file_numbers();
        const is_tall_and_fit_width = $('#window_fitToggle svg:not(.hidden)').hasClass('bi-arrows') &&
            ((file_metadata.height * (window.innerWidth / file_metadata.width)) > window.innerHeight);

        const filePlaceholder = $('#filePlaceholder').children();
        //filePlaceholder[i] = find the one that is hidden
        let i = $('.visible').index();
        ui.preload_files();

        if (g.panzoom_persist && $('#zoomToggle').prop('checked')) {
            file_metadata.panzoom.resume();
        } else if (!g.panzoom_persist || !$('#zoomToggle').prop('checked')) {
            file_metadata.panzoom.pause();
            $('#zoomToggle').prop('checked', false);
        }

        //hide filePlaceholder[i], show next file in the next elem, load the file after in the elem after.
        if (increment === 1) {//+1
            $(filePlaceholder[i]).removeClass('visible').addClass('hidden');
            $(filePlaceholder[i]).find('audio, video').trigger('pause');

            if ((i + 1) >= filePlaceholder.length) { i = 0; } else { i += 1 };
            $(filePlaceholder[i]).removeClass('hidden').addClass('visible');
            ui.autofitpz(file_metadata, g.fit_type);
            $(filePlaceholder[i]).find('audio, video').trigger('play');

            if ((i + 1) >= filePlaceholder.length) { i = 0; } else { i += 1 };
            $(filePlaceholder[i].children[0]).remove();
            $(filePlaceholder[i]).append(navFile(1, true)['elem']);
        } else if (increment === -1) {//-1
            $(filePlaceholder[i]).removeClass('visible').addClass('hidden');
            $(filePlaceholder[i]).find('audio, video').trigger('pause');

            if ((i - 1) < 0) { i = filePlaceholder.length - 1; } else { i -= 1 };
            $(filePlaceholder[i]).removeClass('hidden').addClass('visible');
            ui.autofitpz(file_metadata, g.fit_type);
            $(filePlaceholder[i]).find('audio, video').trigger('play');

            if ((i - 1) < 0) { i = filePlaceholder.length - 1; } else { i -= 1 };
            $(filePlaceholder[i].children[0]).remove();
            $(filePlaceholder[i]).append(navFile(-1, true)['elem']);
        } else {
            jumpToFile(currentPos.y, currentPos.x);
        }
    }
}

export function navRandomFile() {
    currentPos.y = Math.floor(Math.random() * g.clientFiles.length);
    currentPos.x = Math.floor(Math.random() * g.clientFiles[currentPos.y].length);
    ui.preload_files();
    tag.loadFiles();
}

export function jumpToFile(search_number = 0, file_number = 0) {
    if (search_number > g.clientFiles.length) { search_number = g.clientFiles.length - 1 }
    if (file_number > g.clientFiles[search_number].length) { file_number = g.clientFiles[search_number].length - 1 }
    currentPos.x = file_number;
    currentPos.y = search_number;
    ui.preload_files();
    tag.loadFiles();
}
