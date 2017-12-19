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
//    dpm($variables);
?>

<div id="cartogratree_page">
    <!-- side navigation menu -->
    <div id="cartogratree_sidenav"> 
        <!-- navigation tabs -->
        <div id="cartogratree_steps" style="height: 100%"> 
            <ul> 
                <li><a href="#cartogratree_step_1">Search Trees</a></li> 
                <li><a href="#cartogratree_step_2">Display Layers</a></li> 
                <li><a href="#cartogratree_step_3">Analyze</a></li> 
            </ul> 
            <!-- 'Search Trees' tab content -->
            <div id="cartogratree_step_1"> 
                <div id="cartogratree_trees_layers">
                    <?php
                    foreach ($variables['cartogratree_layers'] as $group) {
                        if ($group['group_name'] == 'Trees') {
                            echo '<div>';
                            if ($group['has_subgroups']) {
                                echo '<div id="cartogratree_accordion_group_' . $group['group_rank'] . '">';
                            }
                            foreach ($group['subgroups'] as $subgroup) {
                                if ($subgroup['subgroup_name'] != '[No subgroup]') {
                                    echo '<h4>' . $subgroup['subgroup_name'] . '</h4>';
                                    echo '<div>';
                                }
                                foreach ($subgroup['layers'] as $layer) {
                                    echo '<div id="cartogratree_layer_' . $layer['layer_id'] . '">';
                                    echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio1" name="cartogratree_layer_'
                                    . $layer['layer_id'] . '_radio"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio1">use</label>';
                                    echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio2" name="cartogratree_layer_'
                                    . $layer['layer_id'] . '_radio" checked="checked"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio2">skip</label>&emsp;';
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
                    }
                    ?>
                </div>
            </div>
            <!-- End of 'Search Trees' tab content -->

            <!-- 'Display Layers' tab content -->
            <div id="cartogratree_step_2">
                <div id="cartogratree_accordion_environmental">
                    <?php
                    foreach ($variables['cartogratree_layers'] as $group) {
                        if ($group['group_name'] != 'Trees') {
                            echo '<h3>' . $group['group_name'] . '</h3>';
                            echo '<div>';
                            if ($group['has_subgroups']) {
                                echo '<div id="cartogratree_accordion_group_' . $group['group_rank'] . '">';
                            }
                            foreach ($group['subgroups'] as $subgroup) {
                                if ($subgroup['subgroup_name'] != '[No subgroup]') {
                                    echo '<h4>' . $subgroup['subgroup_name'] . '</h4>';
                                    echo '<div>';
                                }
                                foreach ($subgroup['layers'] as $layer) {
                                    echo '<div id="cartogratree_layer_' . $layer['layer_id'] . '">';
                                    echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio1" name="cartogratree_layer_'
                                    . $layer['layer_id'] . '_radio"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio1">use</label>';
                                    echo '<input type="radio" id="cartogratree_layer_' . $layer['layer_id'] . '_radio2" name="cartogratree_layer_'
                                    . $layer['layer_id'] . '_radio" checked="checked"><label for="cartogratree_layer_' . $layer['layer_id'] . '_radio2">skip</label>&emsp;';
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
                    }
                    ?>
                </div>
            </div>
            <!-- End of 'Display Layers' tab content -->

            <!-- 'Analyze' tab content -->
            <div id="cartogratree_step_3">
                <form name="cartogratree_data_collection_form" action="cartogratree_data_collection" method="POST">
                    <input type="hidden" id="cartogratree_data_collection_individual_ids" name="cartogratree_data_collection_individual_ids" value="" />
                    <input type="hidden" id="cartogratree_data_collection_layer_ids" name="cartogratree_data_collection_layer_ids" value="" />
                    <input type="submit" value="Create data collection" id="cartogratree_create_data_collection" />
                </form>
            </div> 
            <!-- End of 'Analyze' tab content -->
        </div> 
        <!-- End of navigation tabs -->
    </div> 
    <!-- End of side navigation menu -->

    <!--map and info-->
    <div id="cartogratree_map_and_info">
        <!--map-->
        <div id="cartogratree_map"></div>
        <!--End of map-->

        <!--info-->
        <div id="cartogratree_info_tabs">
            <ul>
                <li><a href="#cartogratree_info_tab"><span>Info</span></a></li>
                <li><a href="#cartogratree_about_tab"><span>About CartograTree</span></a></li>
                <!--<li><a href="#cartogratree_get_started_tab"><span>Get Started Guide</span></a></li>-->
                <li><a href="#cartogratree_treegenes_tab"><span>TreeGenes Database</span></a></li>
                <li><a href="#cartogratree_cite_tab"><span>Cite</span></a></li>
            </ul>
            <div id="cartogratree_info_tab">
                <div id="cartogratree_info_tab_content">
                    <p>Welcome to CartograTree - <a href="http://treegenesdb.org/Drupal/user">Log in</a> to get started!</p>
                    <p>23,860 trees from 36 species.</p>
                </div>
            </div>
            <div id="cartogratree_about_tab">
                <h1><small>Introduction</small></h1>
                <p>The original concept of CartograTree was envisioned by a group of forest tree biology researchers that represented traditionally separate research areas including physiology, ecology, genomics, and systematics. Guided by the NSF-funded iPlant Cyberinfrastructure, the focus was to enable interdisciplinary forest tree biology research through geo-referenced data with an application that could be easily deployed, expanded, and used by members of all disciplines. CartograTree is a web-based application that allows researchers to identify, filter, compare, and visualize geo-referenced biotic and abiotic data. Its goal is to support numerous multi-disciplinary research endeavors including: phylogenetics, population structure, and association studies.</p>
                <br>
                <h1><small>Development Team</small></h1>
                <table>
                    <tr><th>Member</th><th>Institution</th><th>Position</th></tr>
                    <tr><td>Nic Herndon</td><td>University of Connecticut</td><td>Programmer</td></tr>
                    <tr><td>Emily Grau</td><td>University of Connecticut</td><td>TreeGenes Lead Database Administrator</td></tr>
                    <tr><td>Taylor Falk</td><td>University of Connecticut</td><td>Bioinformatics Developer</td></tr>
                    <tr><td>Damian Gessler</td><td>Semantic Options, LLC</td><td>Programmer</td></tr>
                    <tr><td>Jill Wegrzyn</td><td>University of Connecticut</td><td>Principal Investigator</td></tr>
                </table>
                <h1><small>Forest Tree Biology Advisory Panel</small></h1>
                <table>
                    <tr><th>Member</th><th>Institution</th></tr>
                    <tr><td>David Neale</td><td>University of California, Davis</td></tr>
                    <tr><td>Missy Holbrook</td><td>Harvard University</td></tr>
                    <tr><td>Daniel Kliebenstein</td><td>University of California, Davis</td></tr>
                    <tr><td>Michael Dietze</td><td>University of Illinois</td></tr>
                    <tr><td>Ram Oren</td><td>Duke University</td></tr>
                    <tr><td>Ross Whetten</td><td>North Carolina State University</td></tr>
                    <tr><td>Sally Aitken</td><td>University of British Columbia</td></tr>
                    <tr><td>Sarah Mathews</td><td>Harvard University</td></tr>
                </table>
            </div>
            <!--<div id="cartogratree_get_started_tab"></div>-->
            <div id="cartogratree_treegenes_tab">
                <p>The <a href="http://treegenesdb.org">TreeGenes</a> database provides custom informatics tools to manage the flood of information resulting from high-throughput genomics projects in forest trees from sample collection to downstream analysis. This resource is enhanced with systems that are well connected with federated databases, automated data flows, machine learning analysis, standardized annotations and quality control processes. The database itself contains several curated modules that support the storage of data and provide the foundation for web-based searches and visualization tools.</p>
            </div>
            <div id="cartogratree_cite_tab">
                <p>Herndon, N., Grau, E. S., Batra, I., Demurjian Jr., S. A., Vasquez-Gross, H. A., Staton, M. E., and Wegrzyn, J. L. (2016) <a href="https://peerj.com/preprints/2345v4.pdf">CartograTree: Enabling Landscape Genomics for Forest Trees</a>. In <i>Proceedings of the Open Source Geospatial Research & Education Symposium</i> (OGRS 2016), Perugia, Italy.</p>
                <p>Vasquez-Gross H.A., Yu J.J., Figueroa B., Gessler D.D.G., Neale D.B., and Wegrzyn J.L. (2013) <a href="http://onlinelibrary.wiley.com/doi/10.1111/1755-0998.12067/full">CartograTree: connecting tree genomes, phenotypes, and environment</a><i>Molecular Ecology Resources, 13</i>(3), 528-537</p>
            </div>
        </div>
        <!--End of info-->
    </div>
    <!--End of map and info-->

    <!-- pop-up window shown when the user clicks on one of the four maps -->
    <div id="cartogratree_ol_popup" class="cartogratree_ol_popup">
        <a href="#" id="cartogratree_ol_popup_closer" class="cartogratree_ol_popup_closer"></a>
        <div id="cartogratree_ol_popup_content"></div>
    </div>
</div>
