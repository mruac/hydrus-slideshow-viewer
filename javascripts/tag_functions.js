import * as file from './file_functions.js';
import * as tag from './tag_functions.js';
import * as ui from './ui_functions.js';
import * as g from './main.js';

export function commitTags() {
    const selected_service_key = $('#tagRepositoryList').val();
    const old_tags = file.navFile(0, true)?.tags?.[selected_service_key]?.storage_tags['0'];
    const new_tags = $('#taglist').val().split('\n').filter(search => search.trim().length > 0);
    const commit_tags = $(new_tags).not(old_tags).toArray();
    const delete_tags = $(old_tags).not(new_tags).toArray();

    const data = {};
    const hash = g.clientFiles[file.currentPos.y][file.currentPos.x]?.['hash'];
    if (hash === undefined) {
        g.error_textInput(g.$('#committags'),
            `Metadata is undefined! No tags committed. CurrentPos is ${JSON.stringify(currentPos)}`)
    }
    data['hash'] = hash;
    data['service_keys_to_actions_to_tags'] = {};
    data['service_keys_to_actions_to_tags'][selected_service_key] = { '0': commit_tags, '1': delete_tags };

    $.ajax({
        method: 'POST',
        url: g.clientURL + `/add_tags/add_tags`,
        data: JSON.stringify(data),
        contentType: 'application/json'
    }).done(function () {
        //refetch and redisplay tags
        $.ajax({
            url: g.clientURL + `/get_files/file_metadata`,
            data: {
                'hash': g.clientFiles[file.currentPos.y][file.currentPos.x]?.['hash'],
                'include_notes': true
            },
            dataType: 'json',
            crossDomain: true,
            method: 'GET'

        }).done(function (response) {
            let metadata = response['metadata'][0];
            metadata['elem'] = ui.loadFile(metadata);
            metadata['panzoom'] = ui.createPanzoom(metadata);
            g.clientFiles[file.currentPos.y][file.currentPos.x] = metadata;
            ui.loadFileTags(response['metadata'][0]);
            $('#committags').css('background-color', 'lime');
            setTimeout(() => {
                $('#committags').css('background-color', '')
            }, 2000);
        });
    }).fail(function () {
        g.error_textInput($('#committags'))
    });
}

export function loadFiles() {
    ui.update_currentPos_display();
    ui.update_file_numbers();

    $('.filePlaceholder').remove();

    $('#progress_bar').hide();

    const object_file = file.navFile(0, true);

    ui.loadFileTags(object_file);
    ui.loadFileNotes(object_file);
    ui.loadFileMetadata(object_file);
    const numberOfFiles = g.clientFiles.reduce((acc, val) => {
        return acc + val.length;
    }, 0);
    const file_placeholder = $('#filePlaceholder');

    file_placeholder.find('div').remove();

    if (numberOfFiles < 3) {
        for (let index = 0; index < numberOfFiles; index++) {
            const elem = $('<div/>', { id: `filePlaceholder${index}`, class: 'filePlaceholder' });
            const obj_file = file.navFile(index, true);
            elem.append(obj_file['elem']);
            if (index != 0) { elem.addClass('hidden'); }
            file_placeholder.append(elem);
            if (index === 0) {
                elem.addClass('visible');
                ui.autofitpz(obj_file, g.fit_type);
                obj_file['elem'].children('audio, video').trigger('play');
            }
        }
    } else {
        for (let index = 0; index < 3; index++) {
            const elem = $('<div/>', { id: `filePlaceholder${index}`, class: 'filePlaceholder' });
            const obj_file = file.navFile(index - 1, true);
            elem.append(obj_file['elem']);
            if (index - 1 != 0) { elem.addClass('hidden'); }
            file_placeholder.append(elem);
            if (index - 1 === 0) {
                elem.addClass('visible');
                ui.autofitpz(obj_file, g.fit_type);
                obj_file['elem'].children('audio, video').trigger('play');
            }
        }
    }
}

export function sortFiles_namespace(metadatas, sortOption) {
    //'series-creator-title-volume-chapter-page'
    sortOption = sortOption.toLowerCase().split('-').reverse();
    //loop through all files, sorting them based on the first matching tag with the selected namespace, for each namespace
    const tag_services = metadatas[0]?.tags;
    if (tag_services === undefined) { return metadatas; }
    const all_known_tags = Object.keys(tag_services).find((v) => { return metadatas[0].tags[v].type === 10 });
    const collator = new Intl.Collator(undefined, {
        numeric: true, //required for unnamespaced tags with numbers only, eg ['20','100']
        sensitivity: 'variant'
    });

    sortOption.forEach(namespace => {
        metadatas.sort((a, b) => {
            //uses the first matching tag that has the namespace
            try {
                a = a.tags[all_known_tags].display_tags?.['0'].find((tag) => { return tag.startsWith(`${namespace}:`) });
                b = b.tags[all_known_tags].display_tags?.['0'].find((tag) => { return tag.startsWith(`${namespace}:`) });

                if (typeof (a) != 'string') { a = ''; }
                if (typeof (b) != 'string') { b = ''; }
            } catch { }
            return collator.compare(a, b); //to include non-ascii characters
        });
    });

    return metadatas;
}