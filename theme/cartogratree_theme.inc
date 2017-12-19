<?php

/*
 * Implements template_preprocess_page().
 */
function cartogratree_preprocess_page(&$variables) {
    if (current_path() == 'cartogratree') {
        global $user;
        // Grab the roles and user id of the current user.
        $uid = $user->uid;
        $rids = is_array($user->roles) ? array_keys($user->roles) : array();
        // Only grab layers that the current user has permission to see.
        $records = db_query('
            SELECT l.layer_id, l.title, l.name, l.url, l.layer_rank, l.trees_layer, l.layer_type, g.group_name, s.subgroup_name, g.group_rank, gs.subgroup_rank
            FROM {cartogratree_layer_permissions} p
            JOIN {cartogratree_layers} l ON l.layer_id=p.layer_id
            JOIN {cartogratree_groups} g ON g.group_id = l.group_id
            JOIN {cartogratree_subgroups} s ON s.subgroup_id = l.subgroup_id
            JOIN {cartogratree_groups_subgroups} gs ON g.group_id = gs.group_id AND s.subgroup_id = gs.subgroup_id
            WHERE p.uid=:uid OR p.rid IN (:rids)
            ORDER BY g.group_rank, gs.subgroup_rank, l.layer_rank', array(':uid' => $uid, ':rids' => $rids));
        $groups = array(); $layers = array(); $layer_ids = array();
        foreach ($records as $record) {
            $groups[$record->group_rank]['group_name'] = $record->group_name;
            $groups[$record->group_rank]['group_rank'] = $record->group_rank;
            if ($record->subgroup_name != '[No subgroup]') {
                $groups[$record->group_rank]['has_subgroups'] = TRUE;
            }
            else {
                $groups[$record->group_rank]['has_subgroups'] = FALSE;
            }
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['subgroup_name'] = $record->subgroup_name;
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['layer_id'] = $record->layer_id;
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['layer_title'] = $record->title;
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['layer_name'] = $record->name;
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['layer_url'] = $record->url;
//        $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['layer_rank'] = $record->layer_rank;
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['trees_layer'] = $record->trees_layer;
            $groups[$record->group_rank]['subgroups'][$record->subgroup_rank]['layers'][$record->layer_id]['layer_type'] = $record->layer_type;
            $layers["cartogratree_layer_" . $record->layer_id]['name'] = $record->name;
            $layers["cartogratree_layer_" . $record->layer_id]['title'] = $record->title;
            $layers["cartogratree_layer_" . $record->layer_id]['url'] = $record->url;
            $layers["cartogratree_layer_" . $record->layer_id]['trees_layer'] = $record->trees_layer;
            $layers["cartogratree_layer_" . $record->layer_id]['layer_type'] = $record->layer_type;
            $layers["cartogratree_layer_" . $record->layer_id]['filters'] = 0;
            array_push($layer_ids, $record->layer_id);
        }
        $variables['cartogratree_layers'] = $groups;

        $fields = array();
        $records = db_query('
            SELECT f.*, l.title, l.name
            FROM {cartogratree_fields} f
            JOIN {cartogratree_layers} l ON l.layer_id=f.layer_id
            WHERE f.layer_id in (:ids)', array(':ids' => $layer_ids));
        foreach ($records as $record) {
            //$fields['Machine name for the layer']['Field name returned by layer'] = $record->name;
            $fields[$record->name]['Human-readable name for the layer'] = $record->title;
            $fields[$record->name]['Layer ID'] = $record->layer_id;

            $fields[$record->name][$record->field_name]['Field ID'] = $record->field_id;
            $fields[$record->name][$record->field_name]['Field name shown to user'] = $record->display_name;
            $fields[$record->name][$record->field_name]['Filter data by this field'] = $record->filter;
            $fields[$record->name][$record->field_name]['Type of filter'] = $record->filter_type;
            $fields[$record->name][$record->field_name]['Values'] = $record->field_values;
            $fields[$record->name][$record->field_name]['Precision used with range values'] = $record->precision;
            $fields[$record->name][$record->field_name]['Value returned by layer that should be masked'] = $record->mask_value;
            $fields[$record->name][$record->field_name]['Text shown to user for masked values'] = $record->mask_display;
            $fields[$record->name][$record->field_name]['Show this field in maps pop-up'] = $record->pop_up;
            $fields[$record->name][$record->field_name]['Show this field in data table'] = $record->data_table;
            if ($record->filter == '1') { $layers["cartogratree_layer_" . $record->layer_id]['filters']++; }
        }
        
        // ======= temp code for data collections testing =======
        $dc = array(1 => 'first_id');
//        $dc = array();
//        $records = db_query('select id, value from {some_table}');
//        foreach ($records as $record) {
//            $dc[$record->id] = $record->value;
//        }
        // ======= temp code for data collections testing =======
        
        libraries_load('openlayers');
        foreach (['dialog', 'tabs', 'accordion', 'button', 'slider'] as $ui) {
            drupal_add_library('system', 'ui.' . $ui);
        }
        drupal_add_js(drupal_get_path('module', 'cartogratree') . '/cartogratree.js');
        drupal_add_css(drupal_get_path('module', 'cartogratree') . '/cartogratree.css');

        $settings = array(
          'cartogratree' => array(
            'gis' => variable_get('cartogratree_gis'),
            'api' => variable_get('cartogratree_api'),
          ),
          'layers' => $layers,
          'fields' => $fields,
          'data_collections_records' => $dc,
        );
        drupal_add_js($settings, 'setting');
    }
}
