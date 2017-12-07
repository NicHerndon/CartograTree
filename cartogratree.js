/**
 * @file
 * Implements the dynamic functionality of the CartograTree app (i.e., ?q=cartogratree).
 */
'use strict';
var cartogratree_mid_layer, cartogratree_mid_layer_cql_filter = {}, cartogratree_trees_layer, cartogratree_trees_layer_cql_filter = {};

(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            var shown_layers = [], used_layers = [], layers = {};

            // Attach the maps to the four squares on the app page.
            var cartogratree_gis = Drupal.settings.cartogratree.gis;
            cartogratree_mid_layer = [new ol.layer.Tile({opacity: 0.8, visible: false}), new ol.layer.Tile({opacity: 0.8, visible: false}), new ol.layer.Tile({opacity: 0.8, visible: false}), new ol.layer.Tile({opacity: 0.8, visible: false})];
            var cartogratree_map = new Array(4);
            var target = ['cartogratree_top_left', 'cartogratree_top_right', 'cartogratree_bottom_left', 'cartogratree_bottom_right'];
//            var cartogratree_common_view = new ol.View({
//                projection: 'EPSG:4326',
//                center: [-72.256167,41.8103637],//ol.proj.fromLonLat([10, 20]),
//                zoom: 3,
//                minZoom: 3,
//                maxZoom: 9,
//            });
            var cartogratree_osm_layer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });
//            var cartogratree_trees_layer = new ol.layer.Tile({
//                source: new ol.source.TileWMS({
//                    url: cartogratree_gis,
//                    params: {LAYERS: ''}
//                })
//            });
            cartogratree_trees_layer = new ol.layer.Tile({visible: false});

            // Create an overlay to anchor the popup to the map.
            var overlay = new ol.Overlay(({
                element: $('#cartogratree_ol_popup')[0],
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                }
            }));

            // create the maps and add the event handlers
            for (var i = 0; i < cartogratree_map.length; i++) {
                // create the maps
                cartogratree_map[i] = new ol.Map({
//                    view: cartogratree_common_view, // shared view
                    // independent views
                    view: new ol.View({
                        projection: 'EPSG:4326',
                        center: [-72.256167, 41.8103637], //ol.proj.fromLonLat([10, 20]),
                        zoom: 3,
//                        minZoom: 3,
//                        maxZoom: 9,
                    }),
                    layers: [
                        // 'background' map
                        cartogratree_osm_layer,
                        // middle layer
                        cartogratree_mid_layer[i],
                        // trees - vector
                        cartogratree_trees_layer,
                    ],
                    controls: [new ol.control.Zoom(), new ol.control.ZoomSlider(), new ol.control.ScaleLine(), new ol.control.Attribution()],
                    target: target[i],
                });

                // change cursor to pointer when going over a tree location
                cartogratree_map[i].on('pointermove', function (e) {
                    if (e.dragging)
                        return;

                    var pixel = e.map.getEventPixel(e.originalEvent);
                    /** use ol to determine if the tree layer
                     * has a color value at a pixel on the viewport
                     */
                    var hit = e.map.forEachLayerAtPixel(pixel, function (layer) {
                        return layer == cartogratree_trees_layer;
                    });
                    e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
                });

                // Add a click handler to the map to render the popup.
                cartogratree_map[i].on('singleclick', function (e) {
                    for (var i = 0; i < cartogratree_map.length; i++) {
                        cartogratree_map[i].removeOverlay(overlay);
                    }
                    e.map.addOverlay(overlay);
                    var coordinate = e.coordinate, tree = '';
                    var latlon = 'lat/lon: ' + e.coordinate[1].toFixed(3) + '/' + e.coordinate[0].toFixed(3) + '<br/>';
                    var hdms = ol.coordinate.toStringHDMS(e.coordinate);
                    $('#cartogratree_ol_popup_content').html('Coordinates:<br/><code>' + latlon + hdms + '</code>');
                    // if the middle layer is visible (an environmental layer is selected for this map)
                    if (e.map.getLayers().a[1].getVisible()) {
                        var layer_name = e.map.getLayers().a[1].getSource().i.LAYERS;
                        var mid_url = e.map.getLayers().a[1].getSource().getGetFeatureInfoUrl(
                                e.coordinate, e.map.getView().getResolution(), e.map.getView().getProjection(),
                                {'INFO_FORMAT': 'application/json'});
                        // get mid-layer info
                        $.ajax({
                            url: mid_url,
                            dataType: 'text',
                            success: function (data, textStatus, jqXHR) {
                                var response = JSON.parse(data).features[0];
                                var mid = '';
                                if (typeof (response) !== 'undefined') {
                                    for (var key in response.properties) {
                                        // should this field be shown in the pop-up
                                        if (Drupal.settings.fields[layer_name] !== undefined && Drupal.settings.fields[layer_name][key] !== undefined && Drupal.settings.fields[layer_name][key]['Show this field in maps pop-up'] === '1') {
                                            // should this value be masked
                                            if (Drupal.settings.fields[layer_name][key]['Value returned by layer that should be masked'] == response.properties[key]) {
                                                mid += Drupal.settings.fields[layer_name][key]['Field name shown to user'] + ': ' + Drupal.settings.fields[layer_name][key]['Text shown to user for masked values'] + '<br>';
                                            } else {
                                                // type of value: continuous or discrete
                                                if (Drupal.settings.fields[layer_name][key]['Type of filter'] === 'slider') {
                                                    mid += Drupal.settings.fields[layer_name][key]['Field name shown to user'] + ': ' + response.properties[key].toFixed(Drupal.settings.fields[layer_name][key]['Precision used with range values']) + '<br>';
                                                } else {
                                                    mid += Drupal.settings.fields[layer_name][key]['Field name shown to user'] + ': ' + response.properties[key] + '<br>';
                                                }
                                            }
                                        }
                                    }
                                }
                                if (mid !== '') {
                                    $('#cartogratree_ol_popup_content').append('<p>' + Drupal.settings.fields[layer_name]["Human-readable name for the layer"] + ':<br><code>' + mid + '</code></p>');
                                }
                            }
                        });
                    }
                    // get tree(s) info - update this section to display only some info, not all of it
                    var trees_layers = (e.map.getLayers().a[2].getSource() !== null) ? e.map.getLayers().a[2].getSource().i.LAYERS.split(',') : [];
                    var trees_popup_fields = 0;
                    var trees_url = [];
                    for (var l = 0; l < trees_layers.length; l++) {
                        for (var key in Drupal.settings.fields[trees_layers[l]]) {
                            if (key !== 'Human-readable name for the layer' && key !== 'Layer ID') {
                                trees_popup_fields += parseInt(Drupal.settings.fields[trees_layers[l]][key]['Show this field in maps pop-up']);
                            }
                        }
                        if (trees_popup_fields) {
                            var trees_layer = new ol.layer.Tile({
                                source: new ol.source.TileWMS({
                                    url: cartogratree_gis,
                                    params: {LAYERS: trees_layers[l]},
                                })
                            });
                            trees_url[l] = trees_layer.getSource().getGetFeatureInfoUrl(
                                    e.coordinate, e.map.getView().getResolution(), e.map.getView().getProjection(),
                                    // supported formats are [text/plain, application/vnd.ogc.gml, text/xml, application/vnd.ogc.gml/3.1.1, text/xml; subtype=gml/3.1.1, text/html, application/json]
                                            {'INFO_FORMAT': 'application/json'});
                                    $.ajax({
                                        url: trees_url[l],
                                        dataType: 'text',
                                        success: function (data, textStatus, jqXHR) {
                                            var response = JSON.parse(data).features[0];
                                            if (response) {
                                                var mid = '';
//                                        var query_strings = jqXHR.responseURL.split('&');
                                                var query_strings = this.url.split('&');
                                                var layer_id = query_strings.find(function (query_string) {
                                                    return query_string.startsWith('QUERY_LAYERS');
                                                });
                                                layer_id = layer_id.split('=')[1].replace('%3A', ':');
                                                for (var key in response.properties) {
                                                    // should this field be shown in the pop-up
                                                    if (Drupal.settings.fields[layer_id] !== undefined && Drupal.settings.fields[layer_id][key] !== undefined && Drupal.settings.fields[layer_id][key]['Show this field in maps pop-up'] === '1') {
                                                        // should this value be masked
                                                        if (Drupal.settings.fields[layer_id][key]['Value returned by layer that should be masked'] == response.properties[key]) {
                                                            mid += Drupal.settings.fields[layer_id][key]['Field name shown to user'] + ': ' + Drupal.settings.fields[layer_id][key]['Text shown to user for masked values'] + '<br>';
                                                        } else {
                                                            // type of value: continuous or discrete
                                                            if (Drupal.settings.fields[layer_id][key]['Type of filter'] === 'slider') {
                                                                mid += Drupal.settings.fields[layer_id][key]['Field name shown to user'] + ': ' + response.properties[key].toFixed(Drupal.settings.fields[layer_id][key]['Precision used with range values']) + '<br>';
                                                            } else {
                                                                mid += Drupal.settings.fields[layer_id][key]['Field name shown to user'] + ': ' + response.properties[key] + '<br>';
                                                            }
                                                        }
                                                    }
                                                }
                                                if (mid !== '') {
                                                    $('#cartogratree_ol_popup_content').append('<p>' + Drupal.settings.fields[layer_id]["Human-readable name for the layer"] + ':<br><code>' + mid + '</code></p>');
                                                }
                                            }
                                        }
                                    });
                                }
                        trees_popup_fields = 0; // reset it for the next trees layer
                    }
                    overlay.setPosition(coordinate);

                    // hide the ol message box when the user clicks the x button
                    $('#cartogratree_ol_popup_closer').click(function () {
                        e.map.removeOverlay(overlay);
                        overlay.setPosition(undefined);
                        $('#cartogratree_ol_popup_closer').blur();
                        return false;
                    });
                });
            }

            // Show/hide the side navigation, and enable/disable page scrolling.
            $(".cartogratree_navbtn").click(function () {
                if ($("#cartogratree_sidenav").width() == 500) {
                    // close navigation
                    $("#cartogratree_sidenav").width("0px");
                    // enable page scrolling
                    $('html, body').css({overflow: 'auto'});
                } else {
                    // set navigation position
//                    $('body').scrollTop($("#main-menu").offset().top);
                    $('body').scrollTop(0);
                    // position and open navigation
                    $("#cartogratree_sidenav").css({height: '800px', width: '500px'});
                }
            });

            // jQuery UI tabs for sidenav
            $('#cartogratree_steps').tabs();
            // jQuery UI accordions for sidenav
            $('[id^=cartogratree_accordion]').accordion({
                collapsible: true,
                icons: {"header": "ui-icon-triangle-1-e", "headerSelected": "ui-icon-triangle-1-s"}
            });
            // jQuery UI radio-buttons for sidenav
            $('[id^=cartogratree_layer], #cartogratree_view_data_radio').buttonset();

            // change listeners for layers' radio-buttons (show, use, skip)
            for (var id in Drupal.settings.layers) {
                layers[id] = 'skip';
                // add listener/callback
                $('#' + id).change(function (e) {
                    // this.id is the layer key in layers
                    switch (e.target.id.substr(e.target.name.length)) {
                        case '1':   // show
                            if (shown_layers.length < 4) {
                                // add layer to map
                                cartogratree_mid_layer[shown_layers.length].setSource(new ol.source.TileWMS({
                                    url: cartogratree_gis,
                                    attributions: " &copy; <a href=\"" + Drupal.settings.layers[this.id].url + "\">" + Drupal.settings.layers[this.id].title + "</a>",
                                    params: {LAYERS: Drupal.settings.layers[this.id].name, 'TILED': true}
                                }));
                                cartogratree_mid_layer[shown_layers.length].setVisible(true);
                                // add layer to shown array
                                shown_layers.push(this.id);
                                // update shown layers count
                                $('#cartogratree_layers_shown').text(parseInt($('#cartogratree_layers_shown').text()) + 1);
                                // if radio-button was previously set to 'use' then remove layer from 'used' list and update the used layers count
                                var j = used_layers.indexOf(this.id);
                                if (j !== -1) {
                                    used_layers.splice(j, 1);
                                    $('#cartogratree_layers_used').text(parseInt($('#cartogratree_layers_used').text()) - 1);
                                }
                                // add filter(s) for this layer
                                if (layers[this.id] === 'skip' && Drupal.settings.layers[this.id]['filters']) {
                                    add_filters(this.id);
                                }
                                layers[this.id] = 'show';
                            } else {
                                $("#cartogratree_popup").dialog({modal: true});
                                // uncheck the 'show' radio-button
                                $('#' + e.target.id).attr('checked', false).toggleClass('ui-state-active', false).button('refresh')
                                // if radio-button was previously set to 'use' then set it again to 'use'
                                if (used_layers.indexOf(this.id) !== -1) {
                                    $('#' + e.target.name + '2').attr('checked', true).toggleClass('ui-state-active', true).button('refresh')
                                }
                                // if radio-button was previously set to 'skip' then set it again to 'skip'
                                else {
                                    $('#' + e.target.name + '3').attr('checked', true).toggleClass('ui-state-active', true).button('refresh')
                                }
                            }
                            break;
                        case '2':   // use
                            if (Drupal.settings.layers[this.id]['trees_layer'] === '1') {
                                // add layer to maps
                                if (cartogratree_trees_layer.getSource() === null) {
                                    cartogratree_trees_layer.setSource(new ol.source.TileWMS({
                                        url: cartogratree_gis,
                                        params: {LAYERS: Drupal.settings.layers[this.id]['name']}
                                    }));
                                    cartogratree_trees_layer.setVisible(true);
                                } else {
                                    var current_trees_layers = cartogratree_trees_layer.getSource()['i']['LAYERS'];
                                    cartogratree_trees_layer.setSource(new ol.source.TileWMS({
                                        url: cartogratree_gis,
                                        params: {LAYERS: current_trees_layers + ',' + Drupal.settings.layers[this.id]['name']}
                                    }));
                                }
                            } else {
                                // add layer to used array
                                used_layers.push(this.id);
                                // update used layers count
                                $('#cartogratree_layers_used').text(parseInt($('#cartogratree_layers_used').text()) + 1);
                                // if radio-button was previously set to 'show' then remove layer from 'shown' list and update the shown layers count
                                var j = shown_layers.indexOf(this.id);
                                if (j != -1) {
                                    // remove layer from map
                                    for (var k = j; k < shown_layers.length; k++) {
                                        if (k + 1 < 4 && cartogratree_mid_layer[k + 1].getSource()) {
                                            cartogratree_mid_layer[k].setSource(cartogratree_mid_layer[k + 1].getSource());
                                        } else {
                                            cartogratree_mid_layer[k].setSource(null);
                                            cartogratree_mid_layer[k].setVisible(false);
                                        }
                                    }
                                    shown_layers.splice(j, 1);
                                    $('#cartogratree_layers_shown').text(parseInt($('#cartogratree_layers_shown').text()) - 1);
                                }
                            }
                            // add filter(s) for this layer
                            if (layers[this.id] === 'skip' && Drupal.settings.layers[this.id]['filters']) {
                                add_filters(this.id);
                            }
                            layers[this.id] = 'use';
                            break;
                        case '3':   // skip
                            // if radio-button was previously set to 'show' then remove layer from 'shown' list and update the shown layers count
                            var j = shown_layers.indexOf(this.id);
                            if (j != -1) {
                                // remove layer from map
                                for (var k = j; k < shown_layers.length; k++) {
                                    if (k + 1 < 4 && cartogratree_mid_layer[k + 1].getSource()) {
                                        cartogratree_mid_layer[k].setSource(cartogratree_mid_layer[k + 1].getSource());
                                    } else {
                                        cartogratree_mid_layer[k].setSource(null);
                                        cartogratree_mid_layer[k].setVisible(false);
                                    }
                                }
                                shown_layers.splice(j, 1);
                                $('#cartogratree_layers_shown').text(parseInt($('#cartogratree_layers_shown').text()) - 1);
                            } else {
                                // if radio-button was previously set to 'use' then remove layer from 'used' list and update the used layers count
                                j = used_layers.indexOf(this.id);
                                if (j != -1) {
                                    used_layers.splice(j, 1);
                                    $('#cartogratree_layers_used').text(parseInt($('#cartogratree_layers_used').text()) - 1);
                                }
                            }
                            layers[this.id] = 'skip';
                            // remove filter(s) for this layer
                            remove_filters(this.id + '_accordion', cartogratree_gis);
                            break;
                    }
                }).bind(this);
            }

            // ======= Pass tree IDs and layer IDs to data collections form =======
            $('#cartogratree_create_data_collection').bind("click", function () {
                $('#cartogratree_data_collection_individual_ids').val('1,2,3');
                $('#cartogratree_data_collection_layer_ids').val('a,b,c,d');
            }).bind(this);
            // ======= End of: Pass tree IDs and layer IDs to data collections form =======
        },
    };

    function add_filters(id) {
        // add accordion wrapper
        var filters = Drupal.settings.layers[id]['filters'] === 1 ? 'Filter' : 'Filters';
        var html_content = '<div id="' + id + '_accordion">\n\
                            <h3><a href="#">' + filters + ' from ' + Drupal.settings.layers[id].title + '</a></h3>\n\
                            <div id="' + id + '_accordion_filters"></div>\n\
                        </div>\n';
        $('#' + id).append(html_content);
        $('#' + id + '_accordion').accordion({collapsible: true});
        // add filter(s) to accordion wrapper
        var layer_name = Drupal.settings.layers[id].name;
        for (var key in Drupal.settings.fields[layer_name]) {
            if (key !== 'Human-readable name for the layer' && key !== 'Layer ID' && Drupal.settings.fields[layer_name][key]['Filter data by this field'] === '1') {
                var display_name = Drupal.settings.fields[layer_name][key]['Field name shown to user'];
                var Values = Drupal.settings.fields[layer_name][key]['Values'];
                switch (Drupal.settings.fields[layer_name][key]['Type of filter']) {
                    case 'slider':
                        var div_id = id + '_slider_filter_' + Drupal.settings.fields[layer_name][key]['Field ID'];
                        var values = Values.split("..");
                        html_content = '<div id="' + div_id + '_caption">' + display_name + ': ' + Values + '</div>\n';
                        html_content += '<div id="' + div_id + '"></div>\n';
                        $('#' + id + '_accordion_filters').append(html_content);
                        $('#' + div_id).slider({
                            range: true,
                            min: parseInt(values[0]),
                            max: parseInt(values[1]),
                            values: [parseInt(values[0]), parseInt(values[1])],
                            slide: function (event, ui) {
                                $('#' + div_id + '_caption').text(display_name + ': ' + ui.values[0] + '..' + ui.values[1]);
                            },
                            change: function (event, ui) {
                                // update maps here based on new ui.values
                                filter_layers(this.id);
                            }
                        });
                        break;
                    case 'checkbox':
                        var div_id = id + '_checkbox_filter_' + Drupal.settings.fields[layer_name][key]['Field ID'];
                        var values = Values.split(";");
                        html_content = '<div id="' + div_id + '">\n';
                        html_content += '<fieldset>\n';
                        html_content += '<legend>' + display_name + '</legend>\n';
                        for (var i = 0; i < values.length; i++) {
                            html_content += '<input type="checkbox" id="' + div_id + '_' + i +
                                    '" name="' + div_id + '" value="' + values[i] + '"><label for="' + div_id + '_' + i + '">' + values[i] + '</label>';
                        }
                        html_content += '</fieldset>\n';
                        html_content += '</div>\n';
                        $('#' + id + '_accordion_filters').append(html_content);
                        $('#' + div_id).buttonset();
                        $('#' + div_id).change(function (e) {
                            // update maps here based on e.target.value
                            filter_layers(this.id);
                        });
                        break;
                    case 'radio':
                        var div_id = id + '_radio_filter_' + Drupal.settings.fields[layer_name][key]['Field ID'];
                        var values = Values.split(";");
                        html_content = '<div id="' + div_id + '">\n';
                        html_content += '<fieldset>\n';
                        html_content += '<legend>' + display_name + '</legend>\n';
                        for (var i = 0; i < values.length; i++) {
                            html_content += '<input type="radio" id="' + div_id + '_' + i +
                                    '" name="radio" value="' + values[i] + '"><label for="' + div_id + '_' + i + '">' + values[i] + '</label>';
                        }
                        html_content += '</fieldset>\n';
                        html_content += '</div>\n';
                        $('#' + id + '_accordion_filters').append(html_content);
                        $('#' + div_id).buttonset();
                        $('#' + div_id).change(function (e) {
                            // update maps here based on e.target.value
                            filter_layers(this.id);
                        });
                        break;
                }
            }
        }
    }

    function remove_filters(id, cartogratree_gis) {
        var layer_id = id.replace('_accordion', '');
        // remove filters for this layer
        cartogratree_trees_layer_cql_filter[layer_id] = {};
        // update maps
        if (Drupal.settings.layers[layer_id]['trees_layer'] === '1') {
            // remove layer from maps
            var current_trees_layers = cartogratree_trees_layer.getSource()['i']['LAYERS'].split(',');
            var index = current_trees_layers.indexOf(Drupal.settings.layers[layer_id]['name']);
            current_trees_layers.splice(index, 1);
            if (current_trees_layers.length === 0) {
                cartogratree_trees_layer.setSource(null);
                cartogratree_trees_layer.setVisible(false);
            } else {
                cartogratree_trees_layer.setSource(new ol.source.TileWMS({
                    url: cartogratree_gis,
                    params: {LAYERS: current_trees_layers.join(',')}
                }));
            }
        }
        // update DOM
        $('#' + id).remove();
    }

    function filter_layers(id) {
        var id_tokens = id.split('_'), layer = {}, filter = {};
        // get layer details
        layer['id'] = id_tokens.slice(0, 3).join('_');
        layer['type'] = Drupal.settings.layers[layer['id']].layer_type;     // vector or raster
        layer['name'] = Drupal.settings.layers[layer['id']].name;           // key for Drupal.settings.fields
        layer['trees'] = Drupal.settings.layers[layer['id']].trees_layer;   // yes(1) or no(0)
        // get filter details
        filter['type'] = id_tokens[3];                                      // checkbox, radio, or slider
        filter['id'] = id_tokens[5];
        for (var key in Drupal.settings.fields[layer['name']]) {
            if (typeof (Drupal.settings.fields[layer['name']][key]["Field ID"]) !== 'undefined' &&
                    Drupal.settings.fields[layer['name']][key]["Field ID"] === filter['id']) {
                filter['name'] = key;
            }
        }
        switch (filter['type']) {
            case 'checkbox':
                filter['values'] = Array();
                var x = $("input[type='checkbox'][name=" + id + "]:checked").serializeArray();
                $.each(x, function (i, field) {
                    filter['values'].push(field.value);
                });
                break;
            case 'radio':
                filter['values'] = Array();
                var x = $("#" + id + " input[type='radio']:checked").serializeArray();
                $.each(x, function (i, field) {
                    filter['values'].push(field.value);
                });
                break;
            case 'slider':
                filter['values'] = $('#' + id).slider('values');
                break;
        }
        // create filter
        if (typeof (cartogratree_trees_layer_cql_filter[layer['id']]) === 'undefined') {
            cartogratree_trees_layer_cql_filter[layer['id']] = {};
        }
        cartogratree_trees_layer_cql_filter[layer['id']][filter['name']] = filter['values'];
        var cql_filters = Array();
        for (var key in cartogratree_trees_layer_cql_filter[layer['id']]) {
            var cql_filter = cartogratree_trees_layer_cql_filter[layer['id']][key].length > 0 ?
                    key + " in ('" + cartogratree_trees_layer_cql_filter[layer['id']][key].join("','") + "')" : '';
            if (cql_filter)
                cql_filters.push(cql_filter);
        }
        // apply single layer filter; need to implement cross-layers filters
        if (layer['trees']) {
            cartogratree_trees_layer.getSource().updateParams({"CQL_FILTER": cql_filters.join(' and ')});
        } else {
            for (var i = 0; i < cartogratree_mid_layer.length; i++) {
                if (cartogratree_mid_layer[i].getVisible() && cartogratree_mid_layer[i].getSource()['i']['LAYERS'] === layer['name']) {
                    cartogratree_mid_layer[i].getSource().updateParams({"CQL_FILTER": cql_filters.join(' and ')});
                }
            }
        }
    }

}(jQuery));
