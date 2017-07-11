/**
 * @file
 * Implements the dynamic functionality of the CartograTree layer settings (i.e., ?q=admin/cartogratree/settings/layer).
 */
'use strict';

(function ($) {
    Drupal.behaviors.cartogratree = {
        attach: function (context, settings) {
            
            // Update options in cartogratree_subgroup_name based on cartogratree_group_name selection
            $('#cartogratree_group_name').change(function () {
                // get selected text in cartogratree_group_name
                var group = jQuery('#cartogratree_group_name :selected').text();
                // remove all options in cartogratree_subgroup_name, except the default one
                jQuery('#cartogratree_subgroup_name').empty().append('<option value="None" selected="selected">- None -</option>');
                // add options in cartogratree_subgroup_name
                if (Drupal.settings.cartogratree[group]) {
                    for (var key in Drupal.settings.cartogratree[group]) {
                        jQuery('#cartogratree_subgroup_name')
                                .append('<option value="' + key + '">' + Drupal.settings.cartogratree[group][key] + '</option>');
                    }
                }
            });
            
        }
    }
}(jQuery));
