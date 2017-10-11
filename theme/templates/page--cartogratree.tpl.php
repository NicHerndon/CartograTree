<?php
/**
 * @file
 * Theme implementation to display the CartograTree page.
 */
?>

<?php
    if ($breadcrumb) {
        print $breadcrumb;
    }
    if (!user_access('use cartogratree')) {
        return;
    }
    print $messages;
?>

<div id="cartogratree_page">
    <!-- hamburger button -->
    <span class="cartogratree_navbtn">&#9776;</span> 
    <!-- side navigation menu -->
    <div id="cartogratree_sidenav"> 
        <!-- navigation tabs -->
        <div id="cartogratree_steps"> 
            <ul> 
                <li><a href="#cartogratree_step_1">Layers</a></li> 
                <li><a href="#cartogratree_step_2">Distribution Filters</a></li> 
                <li><a href="#cartogratree_step_3">View</a></li> 
            </ul> 
            <!-- 'Layers' tab content -->
            <div id="cartogratree_step_1"> 
                ENVIRONMENTAL LAYERS Shown: <span id="cartogratree_layers_shown">0</span>/4 Used: <span id="cartogratree_layers_used">0</span> 
                <div id="cartogratree_accordion_groups">
                    <?php
                        foreach($variables['cartogratree_layers'] as $group) {
                            echo '<h3>' . $group['group_name'] . '</h3>';
                            echo '<div>';
                            if ($group['has_subgroups']) {
                                echo '<div id="cartogratree_accordion_group_' . $group['group_rank'] . '">';
                            }
                            foreach ($group['subgroups'] as $subgroup) {
                                if ($subgroup['subgroup_name'] != '[No subgroup]') {
                                    echo '<h4>' . $subgroup['subgroup_name'] .'</h4>';
                                    echo '<div>';
                                }
                                foreach($subgroup['layers'] as $layer) {
                                    echo '<div id="cartogratree_layer_' . $layer['layer_id'] . '">';
                                    if (!$layer['trees_layer']) {
                                        echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio1" name="cartogratree_layer_'
                                            . $layer['layer_id'] . '_radio"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio1">show</label>';
                                    }
                                    echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio2" name="cartogratree_layer_'
                                        . $layer['layer_id'] . '_radio"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio2">use</label>';
                                    echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio3" name="cartogratree_layer_'
                                        . $layer['layer_id'] . '_radio" checked="checked"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio3">skip</label>&emsp;';
                                    echo $layer['layer_title'];
                                    echo '</div>';
                                }
                                if ($subgroup['subgroup_name'] != '[No subgroup]') {
                                    echo "</div>";
                                }
                            }
                            if ($group['has_subgroups']) {
                                echo '</div>';
                            }
                            echo '</div>';
                        }
                    ?>
                </div>
            <!-- End of 'Layers' tab content -->
            </div>
            <!-- 'Filters' tab content -->
            <div id="cartogratree_step_2">
            <!-- End of 'Filters' tab content -->
            </div>
            <!-- 'View' tab content -->
            <div id="cartogratree_step_3">
                <div id="cartogratree_view_data_radio">
                    <input type="radio" id="cartogratree_view_data_radio1" name="cartogratree_view_data_radio" checked="checked"><label for="cartogratree_view_data_radio1">Maps</label>
                    <input type="radio" id="cartogratree_view_data_radio2" name="cartogratree_view_data_radio" disabled="true"><label for="cartogratree_view_data_radio2">Table</label>
                    <input type="radio" id="cartogratree_view_data_radio3" name="cartogratree_view_data_radio" disabled="true"><label for="cartogratree_view_data_radio3">Results</label>
                </div> 
            <!-- End of 'View' tab content -->
            </div>
        <!-- End of navigation tabs -->
        </div> 
    <!-- End of side navigation menu -->
    </div> 

    <!-- four maps -->
    <div id="cartogratree_squares">
        <table>
            <tr>
                <td><div class="cartogratree_left" id="cartogratree_top_left"></div></td>
                <td><div class="cartogratree_right" id="cartogratree_top_right"></div></td>
            </tr>
            <tr>
                <td><div class="cartogratree_left" id="cartogratree_bottom_left"></div></td>
                <td><div class="cartogratree_right" id="cartogratree_bottom_right"></div></td>
            </tr>
        </table>
    </div>
    <!-- pop-up window shown when the user tries to select more than four layers to show -->
    <div id="cartogratree_popup" title="Layers">
        Only four layers can be shown!<br/>Deselect one of the shown layers and try again.
    </div>
    <!-- pop-up window shown when the user clicks on one of the four maps -->
    <div id="cartogratree_ol_popup" class="cartogratree_ol_popup">
        <a href="#" id="cartogratree_ol_popup_closer" class="cartogratree_ol_popup_closer"></a>
        <div id="cartogratree_ol_popup_content"></div>
    </div>
</div>
