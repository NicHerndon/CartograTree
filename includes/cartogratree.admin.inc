<?php

/**
 * @file
 * Administration for this module.
 */

/**
 * Provide a landing page for this module by listing Layers.
 */
function cartogratree_admin_list() {
    $output = '';

    $output .= '<p>This module provides a form so users can manage GIS server settings, and layers.</p>';
    
    // servers
    $output .= '<p>The URL for the GIS server and the API server must be provided.</p>';

    $table = array(
      'header' => array('GIS server', 'API server', 'Operations'),
      'rows' => array(),
    );

    $results = db_query('SELECT * FROM {servers}');
    foreach ($results as $r) {
        $table['rows'][] = array(
          'gis' => $r->gis,
          'api' => $r->api,
          l('edit', 'admin/cartogratree/settings/server/edit/' . $r->server_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/server/delete/' . $r->server_id)
        );
    }
    // If there are no servers yet, then tell the admin this.
    if (empty($table['rows'])) {
        $output .= l('Add', 'admin/cartogratree/settings/server/add');
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 3));
    }

    $output .= theme('table', $table);

    // layers
    $output .= '<p>In order to make a layer available to users, it must first be included below.</p>';

    $output .= l('Add', 'admin/cartogratree/settings/layer/add');

    $table = array(
      'header' => array('Human-readable Name', 'Name used with the GIS server', 'URL for the layer provider', 'Operations'),
      'rows' => array(),
    );

    $results = db_query('SELECT * FROM {layers}');
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
    // If there are no Layers yet, then tell the admin this.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 4));
    }

    $output .= theme('table', $table);

    return $output;
}

/**
 * Form API Definition for layer admin form.
 */
function cartogratree_admin_layer_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('SELECT * FROM {layers} WHERE layer_id=:id',
            array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
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

    $form['name'] = array(
      '#type' => 'textfield',
      '#title' => 'Human-readable name',
      '#description' => 'This is the name shown to the CartograTree users. Make sure it is descriptive and uniquely identifies the layer.',
      '#default_value' => (isset($obj->title)) ? $obj->title : '',
    );

    $form['machine_name'] = array(
      '#type' => 'textfield',
      '#title' => 'Machine name',
      '#description' => 'Name used with the GIS server.',
      '#default_value' => (isset($obj->name)) ? $obj->name : '',
    );

    $form['url'] = array(
      '#type' => 'textfield',
      '#title' => 'URL',
      '#description' => 'The URL for the provider of the layer.',
      '#default_value' => (isset($obj->url)) ? $obj->url : '',
    );

    $op = ucwords($form_state['build_info']['args'][0]);
    $form['submit'] = array(
      '#type' => 'submit',
      '#value' => ($op == 'Edit') ? 'Save Changes' : $op,
    );

    return $form;
}

/**
 * Layer admin form: Submission.
 */
function cartogratree_admin_layer_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {layers} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        db_query('DELETE FROM {layer_permissions} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['name'] . '</em>');
    }
    else {
        $record = array(
          'title' => $form_state['values']['name'],
          'name' => $form_state['values']['machine_name'],
          'url' => $form_state['values']['url'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('layers', $record);
        }
        else {
            $record['layer_id'] = $form_state['values']['layer_id'];
            drupal_write_record('layers', $record, 'layer_id');
        }
    }
}

/**
 * Form API Definition for Layer Permissions form.
 */
function cartogratree_admin_layer_permissions_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('SELECT * FROM {layers} WHERE layer_id=:id',
            array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
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
    FROM {layer_permissions} perm
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
    FROM {layer_permissions} perm
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
 * Layer Permissions form: Submission.
 */
function cartogratree_admin_layer_permissions_form_submit($form, &$form_state) {

    if ($form_state['clicked_button']['#value'] == 'Add Role') {
        $record = array(
          'layer_id' => $form_state['values']['layer_id'],
          'rid' => $form_state['values']['role']['add']['form_element'],
        );
        drupal_write_record('layer_permissions', $record);
    }
    elseif ($form_state['clicked_button']['#value'] == 'Add User') {
        $uid = db_query('SELECT uid FROM {users} WHERE name=:name',
            array(':name' => $form_state['values']['user']['add']['form_element']))->fetchField();
        if ($uid) {
            $record = array(
              'layer_id' => $form_state['values']['layer_id'],
              'uid' => $uid,
            );
            drupal_write_record('layer_permissions', $record);
        }
    }
}

/**
 * Callback to remove permissions (both user or role).
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

        $num_deleted = db_delete('layer_permissions')
            ->condition('layer_id', $layer_id)
            ->condition('rid', $id)
            ->execute();
        if ($num_deleted) {
            drupal_set_message('Successfully removed permission to role.');
        }
    }
    elseif ($action == 'remove-user') {

        $num_deleted = db_delete('layer_permissions')
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
 * Theme both permissions tables.
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
