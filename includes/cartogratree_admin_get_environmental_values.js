/**
 * @file
 * Implements the dynamic functionality for getting environmental values (i.e., ?q=admin/cartogratree/settings/get_environmental_values/<layer id>).
 */
'use strict';
var urls = {}, number_of_locations, start, successes = 0, errors = 0;

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
                
                $('#cartogratree_output_details').val('Unique locations: ' + number_of_locations);

                start = new Date();
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
                            try {
                                var response = JSON.parse(data).features[0].properties;
                                for (var key in response) {
                                    $('#cartogratree_output_data').append(urls[this.url] + '\t' + key + '\t' + response[key] + '\n');
                                }
                                successes++;
                                update_details();
                            }
                            catch (e) {
                                $('#cartogratree_output_errors').append(urls[this.url] + "\tERROR: did not receive environmental data.\n");
                                errors++;
                                update_details();
                            }
                        }
                    });
                }
            }).bind(this);
        }
    }
    
    function update_details() {
        var stop = new Date();
        var content = 'Unique locations: ' + number_of_locations + '\n';
        content += "Successes: " + successes + '\n';
        content += "Errors: " + errors + '\n';
        if (successes + errors === number_of_locations) {
            content += 'Time elapsed: ' + (stop.getTime() - start.getTime()) / 1000.0 + ' seconds\n';
        }
        $('#cartogratree_output_details').val(content);
    }
}(jQuery));