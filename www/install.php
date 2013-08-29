<?php

/*
 * A simple install script for Datawrapper.
 *
 * It will do the following things:
 *
 * - check if server config is sufficient (PHP version, etc)
 * - prompt database name, user and password
 * - create the database config from template
 * - prompt domain setup and create the main config.yaml from template
 * - create the database tables using schema.sql
 * - fix directory permissions (or ask user to do it)
 * - create an admin user
 * - install the core plugins
 */

function prompt_database_config() {
    ?>
    <h2>Database configuration</h2>
    <form class="form form-vertical">
        <fieldset>
            <div class="control-group">
                <label class="control-label" for="db-name">Database name</label>
                <div class="controls">
                  <input type="text" id="db-name" placeholder="datawrapper">
                </div>
            </div>
            <div class="control-group">
                <label class="control-label" for="db-name">Database user</label>
                <div class="controls">
                  <input type="text" id="db-user" placeholder="user">
                </div>
            </div>
            <div class="control-group">
                <label class="control-label" for="db-name">Database password</label>
                <div class="controls">
                  <input type="text" id="db-password" placeholder="secret">
                </div>
            </div>
            <div class="control-group">
                <div class="controls">
                    <button type="submit" class="btn">Submit</button>
                </div>
            </div>
        </fieldset>
    </form>
    <?php
}

function init_database_config() {
    if (file_exists("lib/core/build/conf/datawrapper-conf.php")) return false;
    $dbconf_master = file_get_contents("lib/core/build/conf/datawrapper-conf.php.master");
    $dbconf = str_replace(
        array('%DB_NAME%', '%DB_USER%', '%DB_PASSWORD%'),
        array($_POST['db-name'], $_POST['db-user'], $_POST['db-password']),
        $dbconf_master
    );
    file_put_contents("lib/core/build/conf/datawrapper-conf.php", $dbconf);
    return true;
}

function install_html_head($progress) {
    ?><!DOCTYPE html><html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Datawrapper Installation</title>
        <link href="/static/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">
        <link href="/static/vendor/bootstrap/css/bootstrap-responsive.min.css" rel="stylesheet">
        <style type="text/css">
body { background: url(/static/img/bg/wavegrid.png);}
h1 { font-weight: 300; font-size: 32px;}
h2 { font-weight: 300; margin-bottom: 20px; font-size: 28px; }
.sidebar { float: left; width: 200px; margin-right: 20px; }
.content { float: left; width: 450px; }
        </style>
    </head>
    <body>
        <div class="modal" style="border:0;box-shadow:0 0 30px rgba(0,0,80,.2); width: 700px; margin-left:-350px">
            <div class="modal-header">
                <h1>Datawrapper Installation</h1>
                <p>Welcome to the Datawrapper Installation Script. You have completed step 1 of 5.</p>
                <div class="progress progress-striped" style=" height:10px">
                  <div class="bar" style="width: <?php echo $progress * 100 ?>%;"></div>
                </div>
            </div>
          <div class="modal-body">
            <div class="sidebar">
                Progress
                <ul class="nav nav-tabs nav-stacked">
                  <li class="active"><a>Database</a></li>
                  <li class="disabled"><a>Database</a></li>
                  <li class="disabled"><a>Database</a></li>
                </ul>
            </div>
            <div class="content">
        <?php
}

function install_html_foot() {
    ?></div></div>
    </div></body></html><?php
}

function run() {
    install_html_head(0.2);
    prompt_database_config();
    install_html_foot();
}

run();
