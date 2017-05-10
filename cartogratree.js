(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            var gis = Drupal.settings.cartogratree.gis;
            var common_view = new ol.View({
                center: ol.proj.fromLonLat([10, 20]),
                zoom: 2
            });
            var osm_layer = new ol.layer.Tile({
                source: new ol.source.OSM()
            });
            var trees_layer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: gis,
                    params: {LAYERS: 'ct:sample'}
                })
            })
            new ol.Map({
                view: common_view,
                layers: [
                    // 'background' map
                    osm_layer,
                    // min temperature - raster
                    tmin_layer = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: gis,
                            attributions: "Minimum temperature (°C) for January averaged over 1970-2000, at 10' spatial resolution, &copy; <a href=\"http://worldclim.org/version2\">WorldClim_v2</a>.",
                            params: {LAYERS: 'ct:wc2.0_10m_tmin_01'},
                        }),
                        opacity: 0.5,
                    }),
                    // trees - vector
                    trees_layer,
                ],
                target: 'cartogratree_top_left'
            });

            new ol.Map({
                view: common_view,
                layers: [
                    // 'background' map
                    osm_layer,
                    // precipitation - raster
                    treesLyr = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: gis,
                            attributions: "Water vapor pressure (kPa) for January averaged over 1970-2000, at 10' spatial resolution, &copy; <a href=\"http://worldclim.org/version2\">WorldClim_v2</a>.",
                            params: {LAYERS: 'ct:wc2.0_10m_prec_01'},
                        }),
                        opacity: 0.5,
                    }),
                    // trees - vector
                    trees_layer,
                ],
                target: 'cartogratree_top_right'
            });

            new ol.Map({
                view: common_view,
                layers: [
                    // 'background' map
                    osm_layer,
                    // wind speed - raster
                    treesLyr = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: gis,
                            attributions: "Wind speed (m s-1) for January averaged over 1970-2000, at 10' spatial resolution, &copy; <a href=\"http://worldclim.org/version2\">WorldClim_v2</a>.",
                            params: {LAYERS: 'ct:wc2.0_10m_wind_01'},
                        }),
                        opacity: 0.5,
                    }),
                    // trees - vector
                    trees_layer,
                ],
                target: 'cartogratree_bottom_left'
            });

            new ol.Map({
                view: common_view,
                layers: [
                    // 'background' map
                    osm_layer,
                    // soils - polygon
                    treesLyr = new ol.layer.Tile({
                        source: new ol.source.TileWMS({
                            url: gis,
                            attributions: "Harmonized World Soil Dataset - Major Soil Groups (Data Basin Dataset), &copy; <a href=\"https://databasin.org\">Data Basin</a>.",
                            params: {LAYERS: 'ct:global_soils_merge_psql'},
                        }),
                        opacity: 0.5,
                    }),
                    // trees - vector
                    trees_layer,
                ],
                target: 'cartogratree_bottom_right'
            });
        }
    };
}(jQuery));

/* Show/hide the side navigation, and enable/disable page scrolling */
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

/* Show/hide list of layers */
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
