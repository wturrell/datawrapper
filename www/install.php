<?php

/*
 * A simple install script for Datawrapper.
 *
 * It will do the following things:
 *
 * - prompt for database name, user and password
 * - copy the db config master to the config file
 * - create the database tables using schema.sql
 * - create an admin user
 * - activate the core plugins
 */

function prompt_database_config() {
    ?>
    <form class="form-horizontal">
        <fieldset>
            <legend>Database configuration</legend>
            <div class="control-group">
                <label class="control-label" for="db-name">Database name</label>
                <div class="controls">
                  <input type="text" id="db-name" placeholder="datawrapper">
                </div>
            </div>
            <div class="control-group">
                <label class="control-label" for="db-name">Database user</label>
                <div class="controls">
                  <input type="text" id="db-user" placeholder="datawrapper">
                </div>
            </div>
            <div class="control-group">
                <label class="control-label" for="db-name">Database password</label>
                <div class="controls">
                  <input type="text" id="db-password" placeholder="datawrapper">
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

function install_html_head() {
    ?><html>
    <head>
        <title>Datawrapper Installation</title>
        <link href="/static/vendor/bootstrap/css/bootstrap.css" rel="stylesheet">
    </head>
    <body>
        <div class="container">
            <div class="span6 offset3">
        <?php
}

function install_html_foot() {
    ?></div></div></body></html><?php
}

function run() {
    install_html_head();
    prompt_database_config();
    install_html_foot();
}

run();