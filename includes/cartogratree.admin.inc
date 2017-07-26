<?php

/**
 * @file
 * Administration for this module.
 */

/**
 * Provide a landing page for this module's admin settings by listing Layers.
 * URL suffix: ?q=admin/cartogratree/settings
 */
function cartogratree_admin_list() {
    $output = '';

    $output .= '<p>This module provides a form so users can manage GIS server settings, and layers.</p>';

    // ==============================================================================================================
    // servers
    $output .= '<h1>Servers</h1>';
    $gis = variable_get('cartogratree_gis', FALSE);
    $api = variable_get('cartogratree_api', FALSE);
    if ($gis == FALSE || $api == FALSE) {
        $output .= '<p>The URL for the GIS server and the API server must be provided. ';
        $output .= l('Add', 'admin/cartogratree/settings/servers/add');
        $output .= ' GIS and API servers.</p>';
    }
    else {
        $output .= '<p><strong>GIS server:</strong> ' . $gis . ', <strong>API server:</strong> ' . $api . '. ';
        $output .= l('Update', 'admin/cartogratree/settings/servers/edit');
        $output .= ' GIS and API servers.</p>';
    }

    // ==============================================================================================================
    // groups
    $output .= '<h1>Groups</h1>';
    $output .= '<p>In order to make a layer available to users, it must first be included below. Layers are organized in the side navigation menu into groups and optionally subgroups.</p>';
    $output .= l('Add group', 'admin/cartogratree/settings/group/add');
    $table = array(
      'header' => array('Group Name', 'Group Rank', 'Operations'),
      'rows' => array(),
    );
    $results = db_query('SELECT * FROM {cartogratree_groups} order by group_rank');
    foreach ($results as $r) {
        $table['rows'][] = array(
          'group_name' => $r->group_name,
          'group_rank' => $r->group_rank,
          l('edit', 'admin/cartogratree/settings/group/edit/' . $r->group_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/group/delete/' . $r->group_id) . ' | '
          . l('subgroups', 'admin/cartogratree/settings/group/' . $r->group_id . '/subgroups')
        );
    }
    // If there are no groups yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 3));
    }
    $output .= theme('table', $table);

    // ==============================================================================================================
    //subgroups
    $output .= '<h2>Subgroups</h2>';
    $output .= l('Add subgroup', 'admin/cartogratree/settings/subgroup/add');
    $table = array(
      'header' => array('Subgroup Name', 'Operations'),
      'rows' => array(),
    );
    $results = db_query('SELECT * FROM {cartogratree_subgroups}');
    foreach ($results as $r) {
        $table['rows'][] = array(
          'subgroup_name' => $r->subgroup_name,
          l('edit', 'admin/cartogratree/settings/subgroup/edit/' . $r->subgroup_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/subgroup/delete/' . $r->subgroup_id)
        );
    }
    // If there are no subgroups yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 2));
    }
    $output .= theme('table', $table);

    // ==============================================================================================================
    // layers
    $output .= '<h3>Layers</h3>';
    $output .= l('Add layer', 'admin/cartogratree/settings/layer/add');
    $table = array(
      'header' => array('Human-readable Name', 'Name used with the GIS server', 'URL for the layer provider', 'Operations'),
      'rows' => array(),
    );
    $results = db_query('SELECT * FROM {cartogratree_layers}');
    foreach ($results as $r) {
        $table['rows'][] = array(
          'name' => $r->title,
          'machine_name' => $r->name,
          'url' => $r->url,
          l('edit', 'admin/cartogratree/settings/layer/edit/' . $r->layer_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/layer/delete/' . $r->layer_id) . ' | '
          . l('access', 'admin/cartogratree/settings/layer/access/' . $r->layer_id)
        );
    }
    // If there are no layers yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 4));
    }
    $output .= theme('table', $table);

    return $output;
}

/**
 * Group admin form.
 * URL suffix: ?q=admin/cartogratree/settings/group/[add|edit|delete][/<group id>]
 */
function cartogratree_admin_settings_group_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_groups}
            WHERE group_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['group_id'] = array(
      '#type' => 'hidden',
      '#value' => (isset($obj->group_id)) ? $obj->group_id : NULL,
    );

    if ($form_state['build_info']['args'][0] == 'delete') {

        $table = array(
          'header' => NULL,
          'rows' => array(
            array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
            array(array('data' => 'Group rank', 'header' => TRUE), $obj->group_rank),
          ),
        );
        $form['info'] = array(
          '#type' => 'markup',
          '#markup' => '<p>Would you like to delete the following group?</p>'
          . theme('table', $table)
        );

        $form['group_name'] = array(
          '#type' => 'hidden',
          '#value' => $obj->group_name,
        );

        $form['delete'] = array(
          '#type' => 'submit',
          '#value' => 'Delete',
          '#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );

        return $form;
    }
    else {
        $form['group_name'] = array(
          '#type' => 'textfield',
          '#title' => 'Group name',
          '#description' => 'Accordion group name for side navigation menu.',
          '#default_value' => (isset($obj->group_name)) ? $obj->group_name : '',
        );

        $form['group_rank'] = array(
          '#type' => 'textfield',
          '#title' => 'Group rank',
          '#description' => 'Rank of the group (the lower the rank the higher is displayed in the accordion.',
          '#default_value' => (isset($obj->group_rank)) ? $obj->group_rank : '',
        );

        $op = ucwords($form_state['build_info']['args'][0]);
        $form['submit'] = array(
          '#type' => 'submit',
          '#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );

        return $form;
    }
}

/**
 * Group admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/group/[add|edit|delete][/<group id>]
 */
function cartogratree_admin_settings_group_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_groups} WHERE group_id=:id', array(':id' => $form_state['values']['group_id']));
        db_query('DELETE FROM {cartogratree_groups_subgroups} WHERE group_id=:id', array(':id' => $form_state['values']['group_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['group_name'] . '</em>.');
    }
    else {
        $record = array(
          'group_name' => $form_state['values']['group_name'],
          'group_rank' => $form_state['values']['group_rank'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('cartogratree_groups', $record);
        }
        else {
            $record['group_id'] = $form_state['values']['group_id'];
            drupal_write_record('cartogratree_groups', $record, 'group_id');
        }
    }
}

/**
 * Group management form.
 * URL suffix: ?q=admin/cartogratree/settings/group/subgroups/<group id>
 */
function cartogratree_admin_group_management_form($form, &$form_state) {
//    drupal_set_message($form_state['build_info']['args'][0]);
    
    $obj = NULL;
    if (isset($form_state['build_info']['args'][0])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_groups}
            WHERE group_id=:id', array(':id' => $form_state['build_info']['args'][0]))->fetchObject();
    }

    $form['#attached']['css'][] = array(
      'data' => '
      table caption {
        margin-top: 50px;
        font-weight: bold;
        font-size: 1.2em;
        text-align: left;
      }
      th.name, td.name {
        width: 300px;
      }
      input[type=text] {
        width: 250px;
      }
      td.add {
        background-color: #e1e2dc;
        border-top: 1px solid #bebfb9;
      }
      td.add input[type=submit] {
        margin-top: 10px;
        margin-bottom: 0px;
      }
    ',
      'type' => 'inline',
    );

    $form['group_id'] = array(
      '#type' => 'hidden',
      '#value' => (isset($obj->group_id)) ? $obj->group_id : NULL,
    );

    $form['info'] = array(
      '#type' => 'markup',
      '#theme' => 'table',
      '#header' => NULL,
      '#rows' => array(
        array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
        array(array('data' => 'Group rank', 'header' => TRUE), $obj->group_rank),
      ),
    );

    // SUBGROUPS:
    //---------------
    $form['subgroup'] = array(
      '#type' => 'markup',
      '#tree' => TRUE,
      '#title' => 'Subgroups',
      '#caption' => 'The following subgroups are children of <em>' . $obj->group_name . '</em>.',
      '#theme' => 'cartogratree_admin_form_group_mgmt_table',
    );

    $count = 0; $subgroup_ids = array();
    $resource = db_query('
        SELECT s.subgroup_id, s.subgroup_name, gs.subgroup_rank
        FROM {cartogratree_subgroups} s
        JOIN {cartogratree_groups_subgroups} gs ON gs.subgroup_id = s.subgroup_id
        WHERE gs.group_id=:id
        ORDER BY gs.subgroup_rank', array(':id' => $obj->group_id));
    foreach ($resource as $r) {
        $count++;
        array_push($subgroup_ids, $r->subgroup_id);

        $form['subgroup'][$r->subgroup_id]['id'] = array(
          '#type' => 'item',
          '#value' => $r->subgroup_id,
        );

        $form['subgroup'][$r->subgroup_id]['name'] = array(
          '#type' => 'item',
          '#value' => $r->subgroup_name,
        );

        $form['subgroup'][$r->subgroup_id]['rank'] = array(
          '#type' => 'item',
          '#value' => $r->subgroup_rank,
        );

        $form['subgroup'][$r->subgroup_id]['remove_url'] = array(
          '#type' => 'item',
          '#value' => 'admin/cartogratree/settings/group/' . $obj->group_id . '/remove-subgroup/' . $r->subgroup_id,
        );
    }
    if (!$count) {
        $form['subgroup']['none']['name'] = array(
          '#type' => 'item',
          '#value' => 'None.',
        );
    }

    $options = array();
    $exclude_list = count($subgroup_ids) ?  'WHERE subgroup_id NOT IN (' . implode(',', $subgroup_ids) . ')' : '';
    $resource = db_query('SELECT * FROM {cartogratree_subgroups} ' . $exclude_list);
    foreach ($resource as $r) {
        $options[$r->subgroup_id] = $r->subgroup_name;
    }
    $form['subgroup']['add']['select'] = array(
      '#type' => 'select',
      '#title' => 'Subgroup to add',
      '#options' => $options,
      '#empty_value' => 'None',
    );

    $form['subgroup']['add']['text'] = array(
      '#type' => 'textfield',
      '#title' => 'Subgroup rank',
    );

    $form['subgroup']['add']['submit'] = array(
      '#type' => 'submit',
      '#value' => 'Add subgroup',
    );

    return $form;
}

/**
 * Group management form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/group/subgroups/<group id>
 */
function cartogratree_admin_group_management_form_submit($form, &$form_state) {
    if ($form_state['values']['subgroup']['add']['select'] == 'None') return;
    
    $record = array(
      'group_id' => $form_state['values']['group_id'],
      'subgroup_id' => form_get_options($form['subgroup']['add']['select'], $form_state['values']['subgroup']['add']['select'])[0],
      'subgroup_rank' => $form_state['values']['subgroup']['add']['text'],
    );
    drupal_write_record('cartogratree_groups_subgroups', $record);
}

/**
 * Subgroup admin form.
 * URL suffix: ?q=admin/cartogratree/settings/subgroup/[add|edit|delete][/<subgroup id>]
 */
function cartogratree_admin_settings_subgroup_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_subgroups}
            WHERE subgroup_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['subgroup_id'] = array(
      '#type' => 'hidden',
      '#value' => (isset($obj->subgroup_id)) ? $obj->subgroup_id : NULL,
    );

    if ($form_state['build_info']['args'][0] == 'delete') {

        $table = array(
          'header' => NULL,
          'rows' => array(
            array(array('data' => 'Subgroup name', 'header' => TRUE), $obj->subgroup_name),
          ),
        );
        $form['info'] = array(
          '#type' => 'markup',
          '#markup' => '<p>Would you like to delete the following subgroup?</p>'
          . theme('table', $table)
        );

        $form['subgroup_name'] = array(
          '#type' => 'hidden',
          '#value' => $obj->subgroup_name,
        );

        $form['delete'] = array(
          '#type' => 'submit',
          '#value' => 'Delete',
          '#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );

        return $form;
    }
    else {
        $form['subgroup_name'] = array(
          '#type' => 'textfield',
          '#title' => 'Subgroup name',
          '#description' => 'Accordion subgroup name for side navigation menu.',
          '#default_value' => (isset($obj->subgroup_name)) ? $obj->subgroup_name : '',
        );

        $op = ucwords($form_state['build_info']['args'][0]);
        $form['submit'] = array(
          '#type' => 'submit',
          '#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );

        return $form;
    }
}

/**
 * Subgroup admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/subgroup/[add|edit|delete][/<subgroup id>]
 */
function cartogratree_admin_settings_subgroup_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_subgroups} WHERE subgroup_id=:id', array(':id' => $form_state['values']['subgroup_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['subgroup_name'] . '</em>.');
    }
    else {
        $record = array(
          'subgroup_name' => $form_state['values']['subgroup_name'],
          'subgroup_rank' => $form_state['values']['subgroup_rank'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('cartogratree_subgroups', $record);
        }
        else {
            $record['subgroup_id'] = $form_state['values']['subgroup_id'];
            drupal_write_record('cartogratree_subgroups', $record, 'subgroup_id');
        }
    }
}

/**
 * Layer admin form.
 * URL suffix: ?q=admin/cartogratree/settings/layer/[add|edit|delete][/<layer id>]
 */
function cartogratree_admin_settings_layer_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_layers} l
            LEFT JOIN {cartogratree_groups} g ON g.group_id = l.group_id
            LEFT JOIN {cartogratree_subgroups} s ON s.subgroup_id = l.subgroup_id
            WHERE layer_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['layer_id'] = array(
      '#type' => 'hidden',
      '#value' => (isset($obj->layer_id)) ? $obj->layer_id : NULL,
    );

    if ($form_state['build_info']['args'][0] == 'delete') {

        $table = array(
          'header' => NULL,
          'rows' => array(
            array(array('data' => 'Human-readable name', 'header' => TRUE), $obj->title),
            array(array('data' => 'Name used with the GIS server', 'header' => TRUE), $obj->name),
            array(array('data' => 'URL for the layer provider', 'header' => TRUE), $obj->url),
            array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
            array(array('data' => 'Subgroup name', 'header' => TRUE), $obj->subgroup_name),
            array(array('data' => 'Layer rank', 'header' => TRUE), $obj->layer_rank),
          ),
        );
        $form['info'] = array(
          '#type' => 'markup',
          '#markup' => '<p>Would you like to delete the following layer?</p>'
          . theme('table', $table)
          . '<p><strong>Description:</strong> ' . $obj->title . '</p>',
        );

        $form['name'] = array(
          '#type' => 'hidden',
          '#value' => $obj->name,
        );

        $form['delete'] = array(
          '#type' => 'submit',
          '#value' => 'Delete',
          '#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );

        return $form;
    }
    else {
        $form['name'] = array(
          '#type' => 'textfield',
          '#title' => 'Human-readable name',
          '#description' => 'This is the name shown to the CartograTree users. Make sure it is descriptive and uniquely identifies the layer.',
          '#default_value' => (isset($obj->title)) ? $obj->title : '',
          '#required' => TRUE,
        );

        $form['machine_name'] = array(
          '#type' => 'textfield',
          '#title' => 'Machine name',
          '#description' => 'Name used with the GIS server.',
          '#default_value' => (isset($obj->name)) ? $obj->name : '',
          '#required' => TRUE,
        );

        $form['url'] = array(
          '#type' => 'textfield',
          '#title' => 'URL',
          '#description' => 'The URL for the provider of the layer.',
          '#default_value' => (isset($obj->url)) ? $obj->url : '',
          '#required' => TRUE,
        );

        $options = array();
        $resource = db_query('SELECT * FROM {cartogratree_groups} ORDER BY group_rank');
        foreach ($resource as $r) {
            $options[$r->group_id] = $r->group_name;
        }
        $form['group_name'] = array(
          '#type' => 'select',
          '#title' => 'Group name',
          '#description' => 'Accordion group name for side navigation menu.',
          '#id' => 'cartogratree_group_name',
          '#options' => $options,
          '#default_value' => (isset($obj->group_id)) ? $obj->group_id : 0,
          '#empty_value' => 'None',
          '#ajax' => array(
            'callback' => 'cartogratree_admin_settings_layer_form_update_subgroup_name',
            'wrapper' => 'cartogratree_subgroup_name_div',
          ),
        );

        $options = array();
        if (isset($obj->group_id)) {
            $resource = db_query('SELECT s.subgroup_id, s.subgroup_name, gs.subgroup_rank
                FROM {cartogratree_groups_subgroups} gs
                JOIN {cartogratree_subgroups} s on gs.subgroup_id = s.subgroup_id
                WHERE gs.group_id=' . $obj->group_id . ' ORDER BY gs.subgroup_rank');
            foreach ($resource as $r) {
                $options[$r->subgroup_id] = $r->subgroup_name;
            }
        }
        $form['subgroup_name'] = array(
          '#type' => 'select',
          '#title' => 'Subgroup name',
          '#description' => 'Accordion subgroup name for side navigation menu.',
          '#id' => 'cartogratree_subgroup_name',
          '#options' => $options,
          '#default_value' => (isset($obj->subgroup_id)) ? $obj->subgroup_id : 0,
          '#empty_value' => 'None',
          '#prefix' => '<div id="cartogratree_subgroup_name_div">',
          '#suffix' => '</div>',
        );

        $form['layer_rank'] = array(
          '#type' => 'textfield',
          '#title' => 'Layer rank',
          '#description' => 'Layer rank for side navigation menu.',
          '#default_value' => (isset($obj->layer_rank)) ? $obj->layer_rank : '',
        );

        $op = ucwords($form_state['build_info']['args'][0]);
        $form['submit'] = array(
          '#type' => 'submit',
          '#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );

        return $form;
    }
}

/**
 * Layer admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/layer/[add|edit|delete][/<layer id>]
 */
function cartogratree_admin_settings_layer_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_layers} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        db_query('DELETE FROM {cartogratree_layer_permissions} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['name'] . '</em>.');
    }
    else {
        $record = array(
          'title' => $form_state['values']['name'],
          'name' => $form_state['values']['machine_name'],
          'url' => $form_state['values']['url'],
          'group_id' => form_get_options($form['group_name'], $form_state['values']['group_name'])[0],
          'subgroup_id' => form_get_options($form['subgroup_name'], $form_state['values']['subgroup_name'])[0],
          'layer_rank' => $form_state['values']['layer_rank'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('cartogratree_layers', $record);
        }
        else {
            $record['layer_id'] = $form_state['values']['layer_id'];
            drupal_write_record('cartogratree_layers', $record, 'layer_id');
        }
    }
}

/**
 * Layer admin form: Update subgroup_name select when group_name changes.
 * URL suffix: ?q=admin/cartogratree/settings/layer/[add|edit|delete][/<layer id>]
 */
function cartogratree_admin_settings_layer_form_update_subgroup_name($form, $form_state) {
    $options = array();
    $group_id = $form_state['values']['group_name'];
    if ($group_id != 'None') {
        $resource = db_query('SELECT s.subgroup_id, s.subgroup_name, gs.subgroup_rank
            FROM {cartogratree_groups_subgroups} gs
            JOIN {cartogratree_subgroups} s on gs.subgroup_id = s.subgroup_id
            WHERE gs.group_id=' . $group_id . ' ORDER BY gs.subgroup_rank');
    }
    foreach ($resource as $r) {
        $options[$r->subgroup_id] = $r->subgroup_name;
    }
    $form['subgroup_name'] = array(
      '#type' => 'select',
      '#title' => 'Subgroup name',
      '#description' => 'Accordion subgroup name for side navigation menu.',
      '#id' => 'cartogratree_subgroup_name',
      '#options' => $options,
      '#default_value' => 0,
      '#empty_value' => 'None',
      '#prefix' => '<div id="cartogratree_subgroup_name_div">',
      '#suffix' => '</div>',
    );
    return $form['subgroup_name'];
}

/**
 * Servers admin form.
 * URL suffix: ?q=admin/cartogratree/settings/servers/[add|edit]
 */
function cartogratree_admin_settings_servers_form($form, &$form_state) {
    $form['gis'] = array(
      '#type' => 'textfield',
      '#title' => 'GIS server',
      '#description' => 'This is the URL prefix used to request layers from the GIS server.',
      '#default_value' => variable_get('cartogratree_gis'),
    );

    $form['api'] = array(
      '#type' => 'textfield',
      '#title' => 'API',
      '#description' => 'This is the URL prefix used to request data from the API server.',
      '#default_value' => variable_get('cartogratree_api'),
    );

    $op = ucwords($form_state['build_info']['args'][0]);
    $form['submit'] = array(
      '#type' => 'submit',
      '#value' => ($op == 'Edit') ? 'Save Changes' : $op,
    );

    return $form;
}

/**
 * Servers admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/servers/[add|edit]
 */
function cartogratree_admin_settings_servers_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    variable_set('cartogratree_gis', $form_state['values']['gis']);
    variable_set('cartogratree_api', $form_state['values']['api']);
}

/**
 * Layer permissions form.
 * URL suffix: ?q=admin/cartogratree/settings/layer/access/<layer id>
 */
function cartogratree_admin_layer_permissions_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_layers} l
            JOIN {cartogratree_groups} g ON g.group_id = l.group_id
            JOIN {cartogratree_subgroups} s ON s.subgroup_id = l.subgroup_id
            WHERE layer_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['#attached']['css'][] = array(
      'data' => '
      table caption {
        margin-top: 50px;
        font-weight: bold;
        font-size: 1.2em;
        text-align: left;
      }
      th.name, td.name {
        width: 300px;
      }
      input[type=text] {
        width: 250px;
      }
      td.add {
        background-color: #e1e2dc;
        border-top: 1px solid #bebfb9;
      }
      td.add input[type=submit] {
        margin-top: 10px;
        margin-bottom: 0px;
      }
    ',
      'type' => 'inline',
    );

    $form['layer_id'] = array(
      '#type' => 'hidden',
      '#value' => (isset($obj->layer_id)) ? $obj->layer_id : NULL,
    );

    $form['info'] = array(
      '#type' => 'markup',
      '#theme' => 'table',
      '#header' => NULL,
      '#rows' => array(
        array(array('data' => 'Human-readable name', 'header' => TRUE), $obj->title),
        array(array('data' => 'Name used with the GIS server', 'header' => TRUE), $obj->name),
        array(array('data' => 'URL for the layer provider', 'header' => TRUE), $obj->url),
        array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
        array(array('data' => 'Subgroup name', 'header' => TRUE), $obj->subgroup_name),
        array(array('data' => 'Layer rank', 'header' => TRUE), $obj->layer_rank),
      ),
    );

    // ROLES:
    //---------------
    $form['role'] = array(
      '#type' => 'markup',
      '#tree' => TRUE,
      '#title' => 'Role Permissions',
      '#caption' => 'All users with the following roles have access to <em>' . $obj->name . '</em>.',
      '#theme' => 'cartogratree_admin_form_permission_table',
    );

    $count = 0;
    $resource = db_query('
    SELECT r.rid, r.name
    FROM {cartogratree_layer_permissions} perm
    LEFT JOIN {role} r ON r.rid=perm.rid
    WHERE perm.rid IS NOT NULL AND layer_id=:id', array(':id' => $obj->layer_id));
    foreach ($resource as $r) {
        $count++;

        $form['role'][$r->rid]['id'] = array(
          '#type' => 'item',
          '#value' => $r->rid,
        );

        $form['role'][$r->rid]['name'] = array(
          '#type' => 'item',
          '#value' => $r->name,
        );

        $form['role'][$r->rid]['remove_url'] = array(
          '#type' => 'item',
          '#value' => 'admin/cartogratree/settings/layer/access/' . $obj->layer_id . '/remove-role/' . $r->rid,
        );
    }
    if (!$count) {
        $form['role']['none']['name'] = array(
          '#type' => 'item',
          '#value' => 'None.',
        );
    }

    $options = array();
    $resource = db_query('SELECT rid, name FROM {role}');
    foreach ($resource as $r) {
        $options[$r->rid] = $r->name;
    }
    $form['role']['add']['form_element'] = array(
      '#type' => 'select',
      '#title' => 'Role to give permission to',
      '#options' => $options,
      '#empty_value' => 'None',
    );

    $form['role']['add']['submit'] = array(
      '#type' => 'submit',
      '#value' => 'Add Role',
    );

    // USER:
    //---------------
    $form['user'] = array(
      '#type' => 'markup',
      '#tree' => TRUE,
      '#title' => 'User Permissions',
      '#caption' => 'The following users have access to <em>' . $obj->name . '</em>.',
      '#theme' => 'cartogratree_admin_form_permission_table',
    );

    $count = 0;
    $resource = db_query('
    SELECT u.uid, u.name
    FROM {cartogratree_layer_permissions} perm
    LEFT JOIN {users} u ON u.uid=perm.uid
    WHERE perm.uid IS NOT NULL AND layer_id=:id', array(':id' => $obj->layer_id));
    foreach ($resource as $r) {
        $count++;

        $form['user'][$r->uid]['id'] = array(
          '#type' => 'item',
          '#value' => $r->uid,
        );

        $form['user'][$r->uid]['name'] = array(
          '#type' => 'item',
          '#value' => $r->name,
        );

        $form['user'][$r->uid]['remove_url'] = array(
          '#type' => 'item',
          '#value' => 'admin/cartogratree/settings/layer/access/' . $obj->layer_id . '/remove-user/' . $r->uid,
        );
    }
    if (!$count) {
        $form['user']['none']['name'] = array(
          '#type' => 'item',
          '#value' => 'None.',
        );
    }

    $form['user']['add']['form_element'] = array(
      '#type' => 'textfield',
      '#title' => 'User to give permission to',
      '#autocomplete_path' => 'user/autocomplete',
    );

    $form['user']['add']['submit'] = array(
      '#type' => 'submit',
      '#value' => 'Add User',
    );

    return $form;
}

/**
 * Layer permissions form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/layer/access/<layer id>
 */
function cartogratree_admin_layer_permissions_form_submit($form, &$form_state) {

    if ($form_state['clicked_button']['#value'] == 'Add Role') {
        $record = array(
          'layer_id' => $form_state['values']['layer_id'],
          'rid' => $form_state['values']['role']['add']['form_element'],
        );
        drupal_write_record('cartogratree_layer_permissions', $record);
    }
    elseif ($form_state['clicked_button']['#value'] == 'Add User') {
        $uid = db_query('SELECT uid FROM {users} WHERE name=:name', array(':name' => $form_state['values']['user']['add']['form_element']))->fetchField();
        if ($uid) {
            $record = array(
              'layer_id' => $form_state['values']['layer_id'],
              'uid' => $uid,
            );
            drupal_write_record('cartogratree_layer_permissions', $record);
        }
    }
}

/**
 * Callback to remove permissions (both user or role).
 * Invoked from ?q=admin/cartogratree/settings/layer/access/<layer id>.
 * URL suffix: ?q=admin/cartogratree/settings/layer/access/%/%/%
 *      e.g., ?q=admin/cartogratree/settings/layer/access/2/remove-role/2
 *
 * NOTE: There is no display or confirmation for removing users/roles. This callback will
 * redirect to the access page when done.
 *
 * @param $layer_id
 *   The pkey of the Layer we are removing permissions from.
 * @param $action
 *   Either 'remove-role' OR 'remove-user' based on which type of permission we need to remove.
 * @param $id
 *   The pkey of the role or user to remove permission to. If $action is remove-role then
 *   this is the rid; if it's remove-user then this is the uid.
 */
function cartogratree_admin_layer_permission_remove_callback($layer_id, $action, $id) {

    if ($action == 'remove-role') {

        $num_deleted = db_delete('cartogratree_layer_permissions')
            ->condition('layer_id', $layer_id)
            ->condition('rid', $id)
            ->execute();
        if ($num_deleted) {
            drupal_set_message('Successfully removed permission to role.');
        }
    }
    elseif ($action == 'remove-user') {

        $num_deleted = db_delete('cartogratree_layer_permissions')
            ->condition('layer_id', $layer_id)
            ->condition('uid', $id)
            ->execute();
        if ($num_deleted) {
            drupal_set_message('Successfully removed permission to user.');
        }
    }

    // Redirect to access page.
    drupal_goto('admin/cartogratree/settings/layer/access/' . $layer_id);
}

/**
 * Callback to remove subgroup from group.
 * Invoked from ?q=admin/cartogratree/settings/group/<group id>/subgroups.
 * URL suffix: ?q=admin/cartogratree/settings/group/%/remove-subgroup/%
 *      e.g., ?q=admin/cartogratree/settings/group/1/remove-subgroup/3
 *
 * NOTE: There is no display or confirmation for removing subgroups. This callback will
 * redirect to the group management page when done.
 *
 * @param $group_id
 *   The pkey of the group we are removing the subgroup from.
\ * @param $subgroup_id
 *   The pkey of the subgroup to be removed from group.
 */
function cartogratree_admin_group_remove_subgroup($group_id, $subgroup_id) {
    $num_deleted = db_delete('cartogratree_groups_subgroups')
        ->condition('group_id', $group_id)
        ->condition('subgroup_id', $subgroup_id)
        ->execute();
    if ($num_deleted) {
        drupal_set_message('Successfully removed subgroup from group.');
    }

    // Redirect to group management page.
    drupal_goto('admin/cartogratree/settings/group/' . $group_id . '/subgroups');
}

/**
 * Theme both permissions tables on ?q=admin/cartogratree/settings/layer/access/<layer id>.
 */
function cartogratree_admin_form_permission_table($vars) {
    $element = $vars['element'];
    $output = '';

    $table = array(
      'caption' => $element['#title'] . ': ' . $element['#caption'],
      'header' => array('Name', 'Operations'),
      'rows' => array(),
    );

    foreach (element_children($element) as $key) {

        if ($key == 'add') {
            $table['rows'][] = array(
              array('data' => render($element[$key]['form_element']), 'class' => array('name', 'add')),
              array('data' => render($element[$key]['submit']), 'class' => array('op', 'add')),
            );
        }
        else {
            $remove_link = '';
            if (isset($element[$key]['remove_url'])) {
                $remove_link = l('remove', $element[$key]['remove_url']['#value']);
            }

            $table['rows'][] = array(
              array('data' => $element[$key]['name']['#value'], 'class' => array('name')),
              array('data' => $remove_link, 'class' => array('op')),
            );
        }
    }

    return theme('table', $table);
}

/**
 * Theme group management table on ?q=admin/cartogratree/settings/group/subgroups/<group id>,
 */
function cartogratree_admin_form_group_mgmt_table($vars) {
    $element = $vars['element'];
    $output = '';

    $table = array(
      'caption' => $element['#title'] . ': ' . $element['#caption'],
      'header' => array('Name', 'Subgroup Rank', 'Operations'),
      'rows' => array(),
    );

    foreach (element_children($element) as $key) {

        if ($key == 'add') {
            $table['rows'][] = array(
              array('data' => render($element[$key]['select']), 'class' => array('name', 'add')),
              array('data' => render($element[$key]['text']), 'class' => array('rank', 'add')),
              array('data' => render($element[$key]['submit']), 'class' => array('op', 'add')),
            );
        }
        else {
            $remove_link = '';
            if (isset($element[$key]['remove_url'])) {
                $remove_link = l('remove', $element[$key]['remove_url']['#value']);
            }

            if (isset($element[$key]['rank']['#value'])) {
                $table['rows'][] = array(
                  array('data' => $element[$key]['name']['#value'], 'class' => array('name')),
                  array('data' => $element[$key]['rank']['#value'], 'class' => array('rank')),
                  array('data' => $remove_link, 'class' => array('op')),
                );
            }
        }
    }

    return theme('table', $table);
}
