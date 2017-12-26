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
            
            $().ready(function () {
                // change input type so the form is not submitted when user clicks on 'Get environmental values' button
                $('#cartogratree_get_env_vals').clone().attr('type','button').insertAfter('#cartogratree_get_env_vals').prev().remove();
                // disable the submit button
                $('#cartogratree_submit_env_vals').attr('disabled', true);
            });
            
            $('#cartogratree_layer_select').change(function () {
                if ($('#cartogratree_output_data').val().length) {
                    // disable the submit button
                    $('#cartogratree_submit_env_vals').attr('disabled', true);
                }
            });
            
            $('#cartogratree_get_env_vals').click(function () {
                $('#cartogratree_output_details').val('Unique locations: ' + number_of_locations);
                // disable controls
                $('#cartogratree_get_env_vals, #cartogratree_layer_select').attr('disabled', true);

                // get environmental data
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
                                $('#cartogratree_output_errors').append(urls[this.url] + "\n");
                                errors++;
                                update_details();
                            }
                        }
                    });
                }
            }).bind(this);
        }
    };
    
    function update_details() {
        var content = 'Unique locations: ' + number_of_locations + '.\n';
        content += "Successes: " + successes + '.\n';
        content += "Errors: " + errors + '.\n';
        if (successes + errors === number_of_locations) {
            var stop = new Date();
            content += 'Time elapsed: ' + (stop.getTime() - start.getTime()) / 1000.0 + ' seconds.\n';
            // enable controls
            $('#cartogratree_layer_select, #cartogratree_submit_env_vals').attr('disabled', false);
        }
        $('#cartogratree_output_details').val(content);
    }
}(jQuery));