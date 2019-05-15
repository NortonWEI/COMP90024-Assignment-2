#!/bin/bash

./group-8-openrc.sh; ansible-playbook --ask-become-pass ./create-instance.yaml

ansible-playbook -i inventory.ini -u ubuntu --key-file=./group-8.pem ./set-proxy.yaml

ansible-playbook -i inventory.ini -u ubuntu --key-file=./group-8.pem ./build-docker.yaml

ansible-playbook -i inventory.ini -u ubuntu --key-file=./group-8.pem ./cluster-couchdb.yaml

