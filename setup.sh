#!/usr/bin/env bash

mysql.server status &>/dev/null
if [[ $? -ne 0 ]]; then
    #mysql server not started
    mysql.server start
fi

echo 'SELECT User FROM mysql.user;' | mysql -u root &>/dev/null
if [[ $? -ne 0 ]]; then
    #mysql server not started
    echo 'Error connecting to mysql'
    exit 1
fi

# if table exists sql will not create new one
mysql -u root < sql/setup_sql.sql &>/dev/null

echo 'setup successfull'
