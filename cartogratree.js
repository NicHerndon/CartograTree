/**
 * @file
 * Implements the dynamic functionality of the CartograTree app (i.e., ?q=cartogratree/app).
 */

var cartogratree_mid_layer = [new ol.layer.Tile({opacity: 0.8}), new ol.layer.Tile({opacity: 0.8}), new ol.layer.Tile({opacity: 0.8}), new ol.layer.Tile({opacity: 0.8})];
var cartogratree_gis;

/**
 * Attach the maps to the four squares on the app page.
 */
(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            cartogratree_gis = Drupal.settings.cartogratree.gis;
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

            new ol.Map({
                view: cartogratree_common_view,
                layers: [
                    // 'background' map
                    cartogratree_osm_layer,
                    // middle layer
                    cartogratree_mid_layer[0],
                    // trees - vector
                    cartogratree_trees_layer,
                ],
                controls: [new ol.control.ScaleLine(), new ol.control.Attribution()],
                target: 'cartogratree_top_left'
            });

            new ol.Map({
                view: cartogratree_common_view,
                layers: [
                    // 'background' map
                    cartogratree_osm_layer,
                    // middle layer
                    cartogratree_mid_layer[1],
                    // trees - vector
                    cartogratree_trees_layer,
                ],
                controls: [new ol.control.ScaleLine(), new ol.control.Attribution()],
                target: 'cartogratree_top_right'
            });

            new ol.Map({
                view: cartogratree_common_view,
                layers: [
                    // 'background' map
                    cartogratree_osm_layer,
                    // middle layer
                    cartogratree_mid_layer[2],
                    // trees - vector
                    cartogratree_trees_layer,
                ],
                controls: [new ol.control.ScaleLine(), new ol.control.Attribution()],
                target: 'cartogratree_bottom_left'
            });

            new ol.Map({
                view: cartogratree_common_view,
                layers: [
                    // 'background' map
                    cartogratree_osm_layer,
                    // middle layer
                    cartogratree_mid_layer[3],
                    // trees - vector
                    cartogratree_trees_layer,
                ],
                controls: [new ol.control.ScaleLine(), new ol.control.Attribution()],
                target: 'cartogratree_bottom_right'
            });
        }
    };
}(jQuery));

/**
 * Show/hide the side navigation, and enable/disable page scrolling.
 */
function cartogratree_nav() {
    if (document.getElementById("cartogratree_sidenav").style.width == "250px") {
        // close navigation
        document.getElementById("cartogratree_sidenav").style.width = "0px";
        // enable page scrolling
        document.body.style.overflow = "";
    }
    else {
        // set navigation position
        var top = document.getElementById('cartogratree_top_left').getBoundingClientRect().top;
        var left = document.getElementById('cartogratree_top_left').getBoundingClientRect().left;
        var height = document.getElementById('cartogratree_bottom_left').getBoundingClientRect().bottom - top;
        document.getElementById("cartogratree_sidenav").style.top = top + 'px';
        document.getElementById("cartogratree_sidenav").style.left = left + 'px';
        document.getElementById("cartogratree_sidenav").style.height = height + 'px';
        // open navigation
        document.getElementById("cartogratree_sidenav").style.width = "250px";
        // disable page scrolling
        document.body.style.overflow = "hidden";
    }
}

/**
 * Show/hide list of layers.
 */
function cartogratree_layers () {
    var list = document.getElementById('cartogratree_layers_select');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        document.getElementById("cartogratree_layers_arrow").innerHTML = "&#9650;";
    }
    else {
        list.style.display = 'none';
        document.getElementById("cartogratree_layers_arrow").innerHTML = "&#9660;";
    }
}

/**
 * Update the layers shown based on user's selection. The layers are mapped to the
 * squares/maps in the order they were selected. The first layer selected is mapped
 * on the top-left square, the second one to the top-right square, the third one to
 * the bottom-left square, and the last one to the bottom-right square.
 */
function cartogratree_layers_show_select_changed () {
    var selected = document.getElementById("cartogratree_layers_show_select");
    var shown_layers = document.getElementsByName('cartogratree_shown_layers')[0].value;
    var prev_shown_layers = (shown_layers == "") ? [] : shown_layers.split(',');
    
    if (prev_shown_layers.length < selected.selectedOptions.length) {
        // there are more entries than previously
        if (selected.selectedOptions.length < 5) {
            // add layer to shown layers
            for (var i = 0; i < selected.selectedOptions.length; i++) {
                if (prev_shown_layers.indexOf(selected.selectedOptions[i].index.toString()) == -1) {
                    prev_shown_layers.push(selected.selectedOptions[i].index);
                    // add layer to map
                    var value = selected.selectedOptions[i].value;
                    var attr = " &copy; <a href=\"".concat(selected.selectedOptions[i].text, "\">", selected.selectedOptions[i].label, "</a>.");
                    cartogratree_mid_layer[prev_shown_layers.length - 1].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
                }
            }
            document.getElementsByName('cartogratree_shown_layers')[0].value = prev_shown_layers.join();
        }
        else {
            // max is 4, unselect the last one
            alert("Only four layers can be shown! Unselect another shown layer and try again.");
            for (var i = 0; i < selected.selectedOptions.length; i++) {
                if (prev_shown_layers.indexOf(selected.selectedOptions[i].index.toString()) == -1) {
                    selected.selectedOptions[i].selected = false;
                }
            }
        }
    }
    else if (prev_shown_layers.length > selected.selectedOptions.length) {
        // there are less entries than previously
        // get the indexes of the selected layers
        var sel_indexes = [];
        for (var i = 0; i < selected.selectedOptions.length; i++) {
            sel_indexes.push(selected.selectedOptions[i].index.toString());
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
        for (var i = 0; i < selected.selectedOptions.length; i++) {
                if (prev_shown_layers.indexOf(selected.selectedOptions[i].index.toString()) == -1) {
                    prev_shown_layers.push(selected.selectedOptions[i].index);
                }
        }
        document.getElementsByName('cartogratree_shown_layers')[0].value = prev_shown_layers.join();
        // update the maps
        for (var i = 0; i < 4; i++) {
            if (prev_shown_layers[i] === undefined) {
                cartogratree_mid_layer[i].setSource(null); 
            }
            else {
                if (cartogratree_mid_layer[i].getProperties().source.ec != "LAYERS-".concat(selected[prev_shown_layers[i]].value)) {
                    var value = selected[prev_shown_layers[i]].value;
                    var attr = " &copy; <a href=\"".concat(selected.selectedOptions[i].text, "\">", selected.selectedOptions[i].label, "</a>.");
                    cartogratree_mid_layer[prev_shown_layers.length - 1].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
                }
            }
        }
    }
    else {
        // there are the same number of entries as previously (i.e., one)
        document.getElementsByName('cartogratree_shown_layers')[0].value = selected.selectedOptions[0].index;
        // update the layer of the first map
        var value = selected.selectedOptions[0].value;
        var attr = " &copy; <a href=\"".concat(selected.selectedOptions[0].text, "\">", selected.selectedOptions[0].label, "</a>.");
        cartogratree_mid_layer[0].setSource(new ol.source.TileWMS({url: cartogratree_gis, attributions: attr, params: {LAYERS: value}}));
    }
}
