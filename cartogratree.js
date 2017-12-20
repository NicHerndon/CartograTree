/**
 * @file
 * Implements the dynamic functionality of the CartograTree app (i.e., ?q=cartogratree).
 */
'use strict';
var cartogratree_map, cartogratree_mid_layer = {}, cartogratree_trees_layer, cartogratree_trees_layer_cql_filter = {};

(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            // Attach the map to the map square on the app page.
            var cartogratree_gis = Drupal.settings.cartogratree.gis;
            var target = 'cartogratree_map';
            var cartogratree_osm_layer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });
            cartogratree_trees_layer = new ol.layer.Tile({visible: false, zIndex: 1000});

            // Create an overlay to anchor the popup to the map.
            var overlay = new ol.Overlay(({
                element: $('#cartogratree_ol_popup')[0],
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                }
            }));

            // create the map
            cartogratree_map = new ol.Map({
                view: new ol.View({
                    projection: 'EPSG:4326',
                    center: [-72.256167, 41.8103637], //ol.proj.fromLonLat([10, 20]),
                    zoom: 3,
                }),
                layers: [
                    // 'background' map
                    cartogratree_osm_layer,
                    // trees - vector
                    cartogratree_trees_layer,
                ],
                controls: [new ol.control.Zoom(), new ol.control.ZoomSlider(), new ol.control.ScaleLine(), new ol.control.Attribution()],
                target: target,
            });

            // change cursor to pointer when going over a tree location
            cartogratree_map.on('pointermove', function (e) {
                if (e.dragging)
                    return;

                var pixel = e.map.getEventPixel(e.originalEvent);
                // use ol to determine if the tree layer has a color value at a pixel on the viewport
                var hit = e.map.forEachLayerAtPixel(pixel, function (layer) {
                    return layer == cartogratree_trees_layer;
                });
                e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
            });

            // Add a click handler to the map to render the popup.
            cartogratree_map.on('singleclick', function (e) {
                cartogratree_map.removeOverlay(overlay);
                e.map.addOverlay(overlay);
                var coordinate = e.coordinate, tree = '';
                var latlon = 'lat/lon: ' + e.coordinate[1].toFixed(3) + '/' + e.coordinate[0].toFixed(3) + '<br/>';

                $('#cartogratree_ol_popup_content').html('');   // wipe-out popup content
                // add location to popup content
                var html_content = '<h4>Location</h4>\n';
                html_content += '<table><tr><td>Latitude</td><td>' + e.coordinate[1].toFixed(3) + '</td></tr>\n';
                html_content += '<tr><td>Longitude</td><td>' + e.coordinate[0].toFixed(3) + '</td></tr></table>';
                $('#cartogratree_ol_popup_content').append(html_content);

                var hdms = ol.coordinate.toStringHDMS(e.coordinate);
                // for each environmental layer used
                for (var layer_id in cartogratree_mid_layer) {
                    var layer_name = cartogratree_mid_layer[layer_id].getSource().i.LAYERS;
                    var mid_url = cartogratree_mid_layer[layer_id].getSource().getGetFeatureInfoUrl(
                            e.coordinate, e.map.getView().getResolution(), e.map.getView().getProjection(),
                            {'INFO_FORMAT': 'application/json'});
                    // get layer info
                    $.ajax({
                        url: mid_url,
                        dataType: 'text',
                        success: function (data, textStatus, jqXHR) {
                            var response = JSON.parse(data).features[0];
                            layer_name = get_layer_names(this.url)[0];
                            var table = '<table>';
                            if (typeof (response) !== 'undefined') {
                                for (var key in response.properties) {
                                    // should this field be shown in the pop-up
                                    if (Drupal.settings.fields[layer_name] !== undefined && Drupal.settings.fields[layer_name][key] !== undefined && Drupal.settings.fields[layer_name][key]['Show this field in maps pop-up'] === '1') {
                                        // should this value be masked
                                        if (Drupal.settings.fields[layer_name][key]['Value returned by layer that should be masked'] == response.properties[key]) {
                                            table += '<tr><td>' + Drupal.settings.fields[layer_name][key]['Field name shown to user'] + '</td><td>' + Drupal.settings.fields[layer_name][key]['Text shown to user for masked values'] + '</td></tr>';
                                        } else {
                                            // type of value: continuous or discrete
                                            if (Drupal.settings.fields[layer_name][key]['Type of filter'] === 'slider') {
                                                table += '<tr><td>' + Drupal.settings.fields[layer_name][key]['Field name shown to user'] + '</td><td>' + response.properties[key].toFixed(Drupal.settings.fields[layer_name][key]['Precision used with range values']) + '</td></tr>';
                                            } else {
                                                table += '<tr><td>' + Drupal.settings.fields[layer_name][key]['Field name shown to user'] + '</td><td>' + response.properties[key] + '</td></tr>';
                                            }
                                        }
                                    }
                                }
                            }
                            table += '</table>';
                            if (table !== '<table></table>') {
                                html_content = '<h4>' + Drupal.settings.fields[layer_name]["Human-readable name for the layer"] + '</h4>' + table;
                                $('#cartogratree_ol_popup_content').append(html_content);
                            }
                        }
                    });
                }
                // get tree(s) info - update this section to display only some info, not all of it
                var trees_layers = (cartogratree_trees_layer.getSource() !== null) ? cartogratree_trees_layer.getSource().i.LAYERS.split(',') : [];
                var trees_popup_fields = 0;
                var trees_url = [];
                for (var l = 0; l < trees_layers.length; l++) {
                    for (var key in Drupal.settings.fields[trees_layers[l]]) {
                        if (key !== 'Human-readable name for the layer' && key !== 'Layer ID') {
                            trees_popup_fields += parseInt(Drupal.settings.fields[trees_layers[l]][key]['Show this field in maps pop-up']);
                        }
                    }
                }
                if (trees_popup_fields) {
                    var trees_layer = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: cartogratree_gis,
                            params: {LAYERS: trees_layers},
                        })
                    });
                    trees_url = trees_layer.getSource().getGetFeatureInfoUrl(
                            e.coordinate, e.map.getView().getResolution(), e.map.getView().getProjection(),
                            // supported formats are [text/plain, application/vnd.ogc.gml, text/xml, application/vnd.ogc.gml/3.1.1, text/xml; subtype=gml/3.1.1, text/html, application/json]
                                    {'INFO_FORMAT': 'application/json'});
                            $.ajax({
                                url: trees_url,
                                dataType: 'text',
                                success: function (data, textStatus, jqXHR) {
                                    var response = JSON.parse(data).features[0];
                                    if (response) {
                                        var layer_names = get_layer_names(this.url);
                                        for (var l = 0; l < layer_names.length; l++) {
                                            var table = '<table>';
                                            for (var key in response.properties) {
                                                // should this field be shown in the pop-up
                                                if (Drupal.settings.fields[layer_names[l]] !== undefined && Drupal.settings.fields[layer_names[l]][key] !== undefined && Drupal.settings.fields[layer_names[l]][key]['Show this field in maps pop-up'] === '1') {
                                                    // should this value be masked
                                                    if (Drupal.settings.fields[layer_names[l]][key]['Value returned by layer that should be masked'] == response.properties[key]) {
                                                        table += '<tr><td>' + Drupal.settings.fields[layer_names[l]][key]['Field name shown to user'] + '</td><td>' + Drupal.settings.fields[layer_names[l]][key]['Text shown to user for masked values'] + '</td></tr>';
                                                    } else {
                                                        // type of value: continuous or discrete
                                                        if (Drupal.settings.fields[layer_names[l]][key]['Type of filter'] === 'slider') {
                                                            table += '<tr><td>' + Drupal.settings.fields[layer_names[l]][key]['Field name shown to user'] + '</td><td>' + response.properties[key].toFixed(Drupal.settings.fields[layer_names[l]][key]['Precision used with range values']) + '</td></tr>';
                                                        } else {
                                                            table += '<tr><td>' + Drupal.settings.fields[layer_names[l]][key]['Field name shown to user'] + '</td><td>' + response.properties[key] + '</td></tr>';
                                                        }
                                                    }
                                                }
                                            }
                                            table += '</table>';
                                            if (table !== '<table></table>') {
                                                html_content = '<h4>' + Drupal.settings.fields[layer_names[l]]["Human-readable name for the layer"] + '</h4>' + table;
                                                $('#cartogratree_ol_popup_content').append(html_content);
                                            }
                                        }
                                    }
                                }
                            });
                        }
                trees_popup_fields = 0; // reset it for the next trees layer
                overlay.setPosition(coordinate);

                // hide the ol message box when the user clicks the x button
                $('#cartogratree_ol_popup_closer').click(function () {
                    e.map.removeOverlay(overlay);
                    overlay.setPosition(undefined);
                    $('#cartogratree_ol_popup_closer').blur();
                    return false;
                });
            });

            // jQuery UI tabs
            // side tabs
            $("#cartogratree_steps").tabs({
                activate: function (event, ui) {
                    if ($("#cartogratree_steps").tabs('option').active === 2) {
                        if (cartogratree_trees_layer.getSource() === null) {
                            $('#cartogratree_create_data_collection').val('No data selected');
                        }
                        else {
                            $('#cartogratree_create_data_collection').val('Collecting data from map. Please wait');
                            $('#cartogratree_create_data_collection').prop('disabled', true);
                            // === update in background #cartogratree_data_collection_individual_ids ===
                            var cql_filter = (cartogratree_trees_layer.getSource().getParams().CQL_FILTER) ?
                                '&cql_filter=' + cartogratree_trees_layer.getSource().getParams().CQL_FILTER : '';
                            $.ajax({
                                url: Drupal.settings.cartogratree.gis.replace(
                                        '/wms',
                                        '/ows?service=WFS&version=2.0&request=GetFeature&typeName=' + cartogratree_trees_layer.getSource().getParams().LAYERS + '&outputFormat=application/json&format_options=callback:getJson&SrsName=EPSG:4326' + cql_filter),
                                dataType: 'text',
                                success: function (data, textStatus, jqXHR) {
                                    var response = JSON.parse(data).features;
                                    if (typeof (response) !== 'undefined') {
                                        var ids = Array();
                                        for (var feature_id in response) {
                                            ids.push(response[feature_id].properties.uniquename);
                                        }
                                        $('#cartogratree_data_collection_individual_ids').val(ids.join(','));
                                        $('#cartogratree_create_data_collection').val('Confirm data for analysis/proceed to table view');
                                        $('#cartogratree_create_data_collection').prop('disabled', false);
                                    }
                                }
                            });
                            // === End of: update in background #cartogratree_data_collection_individual_ids ===
                        }
                    }
                }
            }).bind(this);
            // bottom tabs
            $('#cartogratree_info_tabs').tabs();
            // jQuery UI accordions for sidenav
            $('[id^=cartogratree_accordion]').accordion({
                collapsible: true,
                icons: {"header": "ui-icon-triangle-1-e", "headerSelected": "ui-icon-triangle-1-s"}
            });
            // jQuery UI radio-buttons for sidenav
            $('[id^=cartogratree_layer], #cartogratree_view_data_radio').buttonset();

            // change listeners for layers' radio-buttons (use, skip)
            for (var id in Drupal.settings.layers) {
                // add listener/callback
                $('#' + id).change(function (e) {
                    // this.id is the layer key in layers
                    switch (e.target.id.substr(e.target.name.length)) {
                        case '1':   // use
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
                                // add layer to map
                                cartogratree_mid_layer[this.id] = new ol.layer.Tile({
                                    opacity: 0.8,
                                    visible: true,
                                    source: new ol.source.TileWMS({
                                        url: cartogratree_gis,
                                        params: {LAYERS: Drupal.settings.layers[this.id]['name']}
                                    }),
                                });
                                cartogratree_map.addLayer(cartogratree_mid_layer[this.id]);
                            }
                            // add filter(s) for this layer
                            if (Drupal.settings.layers[this.id]['filters']) {
                                add_filters(this.id);
                            }
                            break;
                        case '2':   // skip
                            // remove layer from map
                            cartogratree_map.removeLayer(cartogratree_mid_layer[this.id]);
                            // remove layer from associative array
                            delete cartogratree_mid_layer[this.id];
                            // remove filter(s) for this layer
                            remove_filters(this.id + '_accordion', cartogratree_gis);
                            break;
                    }
                }).bind(this);
            }

            // ======= Pass tree IDs and layer IDs to data collections form =======
            $('#cartogratree_create_data_collection').bind("click", function () {
                $('#cartogratree_data_collection_individual_ids').val('1,2,3');
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
        if (Drupal.settings.layers[id]['trees_layer'] !== '1') {
            // add opacity slider
            html_content = '<div id="' + id + '_opacity_caption">Layer opacity: 80%</div>\n' +
                    '<div id="' + id + '_opacity_slider"></div>';
            $('#' + id + '_accordion_filters').append(html_content);
            $('#' + id + '_opacity_slider').slider({
                range: false,
                min: 0,
                max: 100,
                value: 80,
                slide: function (event, ui) {
                    $('#' + id + '_opacity_caption').text('Layer opacity: ' + ui.value + '%');
                },
                change: function (event, ui) {
                    // update layer's opacity here based on new ui.value
                    cartogratree_mid_layer[this.id.split('_').slice(0, 3).join('_')].setOpacity(ui.value / 100.0);
                }
            });
        }
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
            cartogratree_mid_layer[layer['id']].getSource().updateParams({"CQL_FILTER": cql_filters.join(' and ')});
        }
    }
    
    function get_layer_names(url) {
        var query_strings = url.split('&');
        var layer_name = query_strings.find(function (query_string) {
            return query_string.startsWith('LAYERS=');
        });
        layer_name = layer_name.split('=')[1].replace('%3A', ':').split('%2C');
        return layer_name;
    }

}(jQuery));
