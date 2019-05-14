#!/bin/bash

echo "== Set variables =="
export node=172.26.38.179
export user=admin
export password=admin

echo "== Start the containers =="
docker run -d -p 5984:5984 -p 5986:5986 -p 4369:4369 -p 9100:9100 --name=subcouchdb-1 couchdb:2.3.0
sleep 3

docker exec subcouchdb-1 bash -c "echo \"-setcookie couchdb_cluster\" >> /opt/couchdb/etc/vm.args"
docker exec subcouchdb-1 bash -c "echo \"-name couchdb@${node}\" >> /opt/couchdb/etc/vm.args"

docker restart subcouchdb-1
sleep 3
