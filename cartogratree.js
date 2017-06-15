/**
 * @file
 * Implements the dynamic functionality of the CartograTree app (i.e., ?q=cartogratree/app).
 */

(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            'use strict';

            // Attach the maps to the four squares on the app page.
            var cartogratree_gis = Drupal.settings.cartogratree.gis;
            var cartogratree_mid_layer = [new ol.layer.Tile({opacity: 0.8, visible: false}), new ol.layer.Tile({opacity: 0.8, visible: false}), new ol.layer.Tile({opacity: 0.8, visible: false}), new ol.layer.Tile({opacity: 0.8, visible: false})];
            var cartogratree_map = new Array(4);
            var target = ['cartogratree_top_left', 'cartogratree_top_right', 'cartogratree_bottom_left', 'cartogratree_bottom_right'];
            var cartogratree_common_view = new ol.View({
                center: ol.proj.fromLonLat([10, 20]),
                zoom: 2
            });
            var cartogratree_osm_layer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });
            var cartogratree_trees_layer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: cartogratree_gis,
                    params: {LAYERS: 'ct:sample'}
                })
            });

            /**
             * Create an overlay to anchor the popup to the map.
             */
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
                    view: cartogratree_common_view,
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
                    if (e.dragging) return;

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
                cartogratree_map[i].on('singleclick', function(e) {
                    for (var i = 0; i < cartogratree_map.length; i++) {
                        cartogratree_map[i].removeOverlay(overlay);
                    }
                    e.map.addOverlay(overlay);
                    var coordinate = e.coordinate, tree = '';
                    var latlon = 'lat/lon: ' + ol.proj.toLonLat(coordinate)[1].toFixed(3) + '/' + ol.proj.toLonLat(coordinate)[0].toFixed(3) + '<br/>';
                    var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'));
                    $('#cartogratree_ol_popup_content').html('Coordinates:<br/><code>' + latlon + hdms + '</code>');
                    var trees_url = cartogratree_trees_layer.getSource().getGetFeatureInfoUrl(
                            e.coordinate, e.map.getView().getResolution(), e.map.getView().getProjection(),
                            {'INFO_FORMAT': 'text/javascript'});
                    if (e.map.getLayers().a[1].getVisible()) {
                        var mid_url = e.map.getLayers().a[1].getSource().getGetFeatureInfoUrl(
                                e.coordinate, e.map.getView().getResolution(), e.map.getView().getProjection(),
                                {'INFO_FORMAT': 'text/javascript'});
                        // get mid-layer info - update this section to display details about the layer (instead of "Mid layer:")
                        $.ajax({
                            url : mid_url,
                            dataType : 'text',
                            success: function(data, textStatus, jqXHR){
                                var response = JSON.parse(data.substring('parseResponse('.length, data.length - 1)).features[0];
                                var mid = '';
                                Object.keys(response.properties).forEach(function(key) {
                                    mid += key + ': ' + response.properties[key] + '<br>';
                                });
                                $('#cartogratree_ol_popup_content').append('<p>Mid layer:<br><code>' + mid + '</code></p>');
                            }
                        });
                    }
                    // get tree(s) info - update this section to display only some info, not all of it
                    $.ajax({
                        url : trees_url,
                        dataType : 'text',
                        success: function(data, textStatus, jqXHR){
                            var response = JSON.parse(data.substring('parseResponse('.length, data.length - 1)).features[0];
                            if (response) {
                                tree =  response.properties.species + ' (' + response.id + ')<br>';
//                                tree = 'ID: ' + response.id + '<br>';
//                                Object.keys(response.properties).forEach(function(key) {
//                                    tree += key + ': ' + response.properties[key] + '<br>';
//                                });
                                $('#cartogratree_ol_popup_content').append('<p>Tree details:<br><code>' + tree + '</code></p>');
                            }
                        }
                    });
                    overlay.setPosition(coordinate);
                    
                    // hide the ol message box when the user clicks the x button
                    $('#cartogratree_ol_popup_closer').click(function() {
                        e.map.removeOverlay(overlay);
                        overlay.setPosition(undefined);
                        $('#cartogratree_ol_popup_closer').blur();
                        return false;
                    });
                });
            }

            // Show/hide the side navigation, and enable/disable page scrolling.
            $(".cartogratree_navbtn").click(function() {
                if ($("#cartogratree_sidenav").width() == 500) {
                    // close navigation
                    $("#cartogratree_sidenav").width("0px");
                    // enable page scrolling
                    $('html, body').css({overflow: 'auto'});
                } else {
                    // set navigation position
                    var top = $('#cartogratree_top_left')[0].getBoundingClientRect().top;
                    var left = $('#cartogratree_top_left')[0].getBoundingClientRect().left;
                    var height = $('#cartogratree_bottom_left')[0].getBoundingClientRect().bottom - top;
                    $("#cartogratree_sidenav").css({ top: top + 'px', left: left + 'px', height: height + 'px'});
                    // open navigation
                    $("#cartogratree_sidenav").width("500px");
                    // disable page scrolling
                    $('html, body').css({overflow: 'hidden', position: 'fixed'});
                }
            });
            
            // Set side navigation height when resizing the window.
            $(window).resize(function() {
                if ($("#cartogratree_sidenav").width() == 500) {
                    // set navigation height
                    var top = $('#cartogratree_top_left')[0].getBoundingClientRect().top;
                    var height = $('#cartogratree_bottom_left')[0].getBoundingClientRect().bottom - top;
                    $("#cartogratree_sidenav").height(height + 'px');
                }
            });
            
            // Show/hide list of layers.
            $("#cartogratree_layers_arrow").click(function() {
                var $list = $('#cartogratree_layers_select');
                if ($list.css("display") == "none") {
                    $list.show();
                    $("#cartogratree_layers_arrow").html("&#9650;");
                } else {
                    $list.hide();
                    $("#cartogratree_layers_arrow").html("&#9660;");
                }
            });
            
            // Show/hide filters
            $("#cartogratree_filter_arrow").click(function() {
                var $list = $('#cartogratree_filter');
                if ($list.css("display") == "none") {
                    $list.show();
                    $("#cartogratree_filter_arrow").html("&#9650;");
                } else {
                    $list.hide();
                    $("#cartogratree_filter_arrow").html("&#9660;");
                }
            });
            
            /**
             * Update the layers shown based on user's selection. The layers are mapped to the
             * squares/maps in the order they were selected. The first layer selected is mapped
             * on the top-left square, the second one to the top-right square, the third one on
             * the bottom-left square, and the last one on the bottom-right square.
             */
            $("#cartogratree_layers_show_select").change(function() {
                var $select = $("#cartogratree_layers_show_select");
                var selected = ($select.val()) ? $select.val().length : 0;
                var shown_layers = $('#cartogratree_shown_layers').attr('value');
                var prev_shown_layers = (shown_layers == "") ? [] : shown_layers.split(',');

                if (prev_shown_layers.length < selected) {
                    // there are more entries than previously
                    if (selected < 5) {
                        // add layer to shown layers
                        for (var i = 0; i < selected; i++) {
                            if (prev_shown_layers.indexOf($select[0].selectedOptions[i].index.toString()) == -1) {
                                prev_shown_layers.push($select[0].selectedOptions[i].index.toString());
                                // add layer to map
                                var value = $select.val()[i];
                                var attr = " &copy; <a href=\"".concat($select.find('option:selected')[i].text, "\">", $select.find('option:selected')[i].label, "</a>");
                                cartogratree_mid_layer[prev_shown_layers.length - 1].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
                                cartogratree_mid_layer[prev_shown_layers.length - 1].setVisible(true);
                            }
                        }
                        $('#cartogratree_shown_layers').attr('value', prev_shown_layers.join());
                    }
                    else {
                        // max is 4, unselect the last one
                        $("#cartogratree_popup").dialog({modal: true});
                        var fifth = [];
                        for (var i = 0; i < selected; i++) {
                            if (prev_shown_layers.indexOf($select[0].selectedOptions[i].index.toString()) == -1) {
                                fifth.push($select[0].selectedOptions[i].index);
                            }
                        }
                        for (var i = 0; i < fifth.length; i++) {
                            $select[0].options[fifth[i]].selected = false;
                        }
                    }
                }
                else if (prev_shown_layers.length > selected) {
                    // there are less entries than previously
                    // get the indexes of the selected layers
                    var sel_indexes = [];
                    for (var i = 0; i < selected; i++) {
                        sel_indexes.push($select[0].selectedOptions[i].index.toString());
                    }
                    // make a copy of prev_shown_layers
                    var cp_prev_shown_layers = prev_shown_layers.slice();
                    // remove previously selected indexes, not currently selected
                    for (i in cp_prev_shown_layers) {
                        if (sel_indexes.indexOf(cp_prev_shown_layers[i]) == -1) {
                            prev_shown_layers.splice(prev_shown_layers.indexOf(cp_prev_shown_layers[i]), 1);
                        }
                    }
                    // if needed, add currently selected indexes to previously selected indexes
                    for (var i = 0; i < selected; i++) {
                        if (prev_shown_layers.indexOf($select[0].selectedOptions[i].index.toString()) == -1) {
                            prev_shown_layers.push($select[0].selectedOptions[i].index.toString());
                        }
                    }
                    $('#cartogratree_shown_layers').attr('value', prev_shown_layers.join());
                    // update the maps
                    for (var i = 0; i < 4; i++) {
                        if (prev_shown_layers[i] === undefined) {
                            cartogratree_mid_layer[i].setSource(null);
                            cartogratree_mid_layer[i].setVisible(false);
                        }
                        else {
                            if (cartogratree_mid_layer[i].getProperties().source.ec != "LAYERS-".concat($select[0][parseInt(prev_shown_layers[i])].value)) {
                                var value = $select.val()[i];
                                var attr = " &copy; <a href=\"".concat($select.find('option:selected')[i].text, "\">", $select.find('option:selected')[i].label, "</a>");
                                cartogratree_mid_layer[prev_shown_layers.length - 1].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
                                cartogratree_mid_layer[prev_shown_layers.length - 1].setVisible(true);
                            }
                        }
                    }
                }
                else {
                    // there are the same number of entries as previously (i.e., one)
                    $('#cartogratree_shown_layers').attr('value', $select[0].selectedOptions[0].index.toString());
                    // update the layer of the first map
                    var value = $select.val()[0];
                    var attr = " &copy; <a href=\"".concat($select.find('option:selected')[0].text, "\">", $select.find('option:selected')[0].label, "</a>");
                    cartogratree_mid_layer[0].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
                    cartogratree_mid_layer[0].setVisible(true);
                }
            });
            
            $("#cartogratree_trees_select").change(function() {
                var filter = $("#cartogratree_trees_select").val() ?
                    "species in ('" + $("#cartogratree_trees_select").val().join("','") + "')" :
                    "species in ('empty')";
                cartogratree_trees_layer.getSource().updateParams({"CQL_FILTER": filter});
            });
        },
    };
}(jQuery));
