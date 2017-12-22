/**
 * @file
 * Implements the dynamic functionality for getting environmental values (i.e., ?q=admin/cartogratree/settings/get_environmental_values/<layer id>).
 */
'use strict';
var urls = {}, number_of_locations, debug = {};

(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            number_of_locations = Object.keys(Drupal.settings.locations).length;
            
            $("#cartogratree_get_env_vals").click(function () {
                var view = new ol.View({
                    projection: 'EPSG:4326',
                    center: [0,0],
                    zoom: 20,
                });
                
                var layer = new ol.layer.Tile({
                    source: new ol.source.TileWMS({
                        url: Drupal.settings.gis,
                        params: {LAYERS: Drupal.settings.layers[$('#cartogratree_layer_select').val()].gis_name}
                    }),
                });

                for (var long_lat in Drupal.settings.locations) {
                    var url = layer.getSource().getGetFeatureInfoUrl(
                            long_lat.split(','), view.getResolution(), view.getProjection(),
                            {'INFO_FORMAT': 'application/json'});
                    urls[url] = long_lat;
                    // get environmental value
                    $.ajax({
                        url: url,
                        dataType: 'text',
                        success: function (data, textStatus, jqXHR) {
                            var response = JSON.parse(data).features[0].properties;
                            for (var key in response) {
                                Drupal.settings.locations[urls[this.url]]['env_value'] = response[key];
                                debug[urls[this.url]] = response[key];
                                if (--number_of_locations === 0) {
                                    // got all values
                                    this;
                                }
                            }
                        }
                    });
                }
            }).bind(this);
        }
    }
}(jQuery));