<?php

class DatawrapperPlugin_VisualizationLineChart extends DatawrapperPlugin_Visualization {

    public function getMeta(){
        $meta = array(
            "title" => __("Line Chart", $this->getName()),
            "id" => "line-chart",
            "extends" => "raphael-chart",
            "dimensions" => 2,
            "order" => 40,
            "axes" => array(
                "x" => array(
                    "title" => __("Horizontal (x)"),
                    "accepts" => array("text", "date"),
                ),
                "y1" => array(
                    "title" => __("Vertical (y)"),
                    "accepts" => array("number"),
                    "multiple" => true
                ),
                "y2" => array(
                    "title" => __("2nd vertical (y2)"),
                    "accepts" => array("number"),
                    "multiple" => true,
                    "optional" => true
                )
            ),
            "options" => $this->getOptions(),
            "locale" => array(
                "tooManyLinesToLabel" => __("Your chart contains <b>more lines than we can label</b>, so automatic labeling is turned off. To fix this <ul><li>filter some columns in the data table in the previous step, or</li><li>use direct labeling and the highlight feature to label the lines that are important to your story.</li></ul>"),
                "useLogarithmicScale" => __("Use logarithmic scale")
            ),
            "annotations" => array(
                array('type' => 'axis-range', 'axis' => 'x'),
                array('type' => 'axis-point', 'axis' => 'x'),
                array('type' => 'axis-range', 'axis' => 'y'),
                array('type' => 'axis-point', 'axis' => 'y'),
                array('type' => 'data-point')
            )
        );
        return $meta;
    }

    public function getOptions(){
        $options = array(
            "sep-labeling" => array(
                "type" => "separator",
                "label" => __("Customize labeling"),
                "depends-on" => array(
                    "chart.min_columns[y1]" => 2,
                )
            ),
            "direct-labeling" => array(
                "type" => "checkbox",
                "label" => __("Direct labeling"),
                "default" => false,
                "depends-on" => array(
                    "chart.min_columns[y1]" => 2,
                    "chart.max_columns[y2]" => 0  // direct labeling not possible with second axis
                ),
                "help" => __("Show the labels right nearby the line ends instead of a separate legend")
            ),
            "legend-position" => array(
                "type" => "select",
                "label" => __("Legend position"),
                "default" => "right",
                "depends-on" => array(
                    "direct-labeling" => false,
                    "chart.min_columns[y1]" => 2
                ),
                "options" => array(
                    array(
                        "value" => "right",
                        "label" => __("right")
                    ),
                    array(
                        "value" => "top",
                        "label" => __("top"),
                    ),
                    array(
                        "value" => "inside",
                        "label" => __("inside left"),
                    ),
                    array(
                        "value" => "inside-right",
                        "label" => __("inside right"),
                    )
                )
            ),

            "sep-lines" => array(
                "type" => "separator",
                "label" => __("Customize lines")
            ),
            "force-banking" => array(
                "type" => "checkbox",
                "hidden" => true,
                "label" => __("Bank the lines to 45 degrees")
            ),
            "show-grid" => array(
                "type" => "checkbox",
                "hidden" => true,
                "label" => __("Show grid"),
                "default" => false
            ),
            "connect-missing-values" => array(
                "type" => "checkbox",
                "label" => __("Connect lines between missing values"),
            ),
            "fill-between" => array(
                "type" => "checkbox",
                "label" => __("Fill area between lines"),
                "default" => false,
                "depends-on" => array(
                    "chart.min_columns[y1]" => 2,
                    "chart.max_columns[y1]" => 2,
                    "chart.max_columns[y2]" => 0  // direct labeling not possible with second axis
                )
            ),
            "fill-below" => array(
                "type" => "checkbox",
                "label" => __("Fill area below line"),
                "defaut" => false,
                "depends-on" => array(
                    "chart.max_columns[y1]" => 1,
                    "chart.max_columns[y2]" => 0
                )
            ),
            "line-mode" => array(
                "type" => "select",
                "label" => __("Line interpolation"),
                "options" => array(
                    array("label" => __("Straight"), "value" => "straight"),
                    array("label" => __("Curved"), "value" => "curved"),
                    array("label" => __("Stepped"), "value" => "stepped")
                ),
                "default" => "straight"
            ),
            "sep-y-axis" => array(
                "type" => "separator",
                "label" => __("Customize y-Axis")
            ),
            "baseline-zero" => array(
                "type" => "checkbox",
                "label" => __("Extend to zero"),
            ),
            "extend-range" => array(
                "type" => "checkbox",
                "label" => __("Extend to nice ticks"),
                "help" => __("Extend the y-axis range to nice, rounded values instead of the default range from the minimum to maximum value.")
            ),
            "invert-y-axis" => array(
                "type" => "checkbox",
                "label" => __("Invert direction"),
                "default" => false
            ),
            "scale-y1" => array(
                "type" => "select",
                "label" => __("Scale (y-axis)"),
                "options" => array(
                    array("label" => __("linear"), "value" => "linear"),
                    array("label" => __("logarithmic"), "value" => "log")
                ),
                "default" => "linear",
                "depends-on" => array(
                    "chart.min_value[y1]" => ">0",
                    "chart.magnitude_range[y1]" => ">3"
                )
            ),
            "user-change-scale" => array(
                "type" => "checkbox",
                "label" => __("Let user change scale"),
                "default" => false,
                // same dependencies as scale b/c otherwise there is nothing to change
                "depends-on" => array(
                    "chart.min_value[y1]" => ">0",
                    "chart.magnitude_range[y1]" => ">3"
                )
            )
        );
        return $options;
    }

}
