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
            var cartogratree_mid_layer = [new ol.layer.Tile({opacity: 0.8}), new ol.layer.Tile({opacity: 0.8}), new ol.layer.Tile({opacity: 0.8}), new ol.layer.Tile({opacity: 0.8})];
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
            })

            for (var i = 0; i < cartogratree_map.length; i++) {
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
                    /** if the source of the middle layer is set to null
                     * then set hit to false
                     * otherwise use ol to determine if the tree layer
                     * has a color value at a pixel on the viewport
                     */
                    var hit = e.map.getLayers().a[1].getSource() ?
                            e.map.forEachLayerAtPixel(pixel, function (layer) {
                                return layer == cartogratree_trees_layer;
                            }) : false;
                    e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
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
                    $('html, body').css({overflow: 'hidden'});
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
                            }
                        }
                        $('#cartogratree_shown_layers').attr('value', prev_shown_layers.join());
                    }
                    else {
                        // max is 4, unselect the last one
                        $("#cartogratree_popup").show();
                        var fifth;
                        for (var i = 0; i < selected; i++) {
                            if (prev_shown_layers.indexOf($select[0].selectedOptions[i].index.toString()) == -1) {
                                fifth = $select[0].selectedOptions[i].index;
                            }
                        }
                        $select.find('option:selected')[fifth].selected = false;
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
                        }
                        else {
                            if (cartogratree_mid_layer[i].getProperties().source.ec != "LAYERS-".concat($select[0][parseInt(prev_shown_layers[i])].value)) {
                                var value = $select.val()[i];
                                var attr = " &copy; <a href=\"".concat($select.find('option:selected')[i].text, "\">", $select.find('option:selected')[i].label, "</a>");
                                cartogratree_mid_layer[prev_shown_layers.length - 1].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
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
                }
            });
            
            // hide the message box when the user clicks the OK button
            $("#cartogratree_popup_close").click(function() {
                $("#cartogratree_popup").hide();
            });
        },
    };
}(jQuery));
