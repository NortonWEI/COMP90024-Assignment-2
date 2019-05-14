# COMP90024 Assignment 2
Team 8, 2019 SM2

### Links
* A demo video can be found via this link: <br>
https://youtu.be/B0FLGuGgstA​.
* A deployment demonstration video can be found via this link:<br>
https://youtu.be/bzVq8gKeJBY
* A working demonstration can be visited via this link: <br>
http://172.26.38.73

### System Deployment
#### 1. Environment Deployment
The project applies Ansible automation and Jinja2 templating language for large-scale deployment. First, you need to install packages for Ansible and Jinja2.<br>
For Linux users:
```
$ sudo apt-get update
$ sudo apt-get install software-properties-common
$sudo apt-add-repository --yes --update ppa:ansible/ansible
$ sudo apt-get install ansible
$ pip install jinja2
```
For Mac users:
```
$ brew install ansible
$ pip install jinja2
```
The automatic deployment scripts are located under the directory named “nectar”. Then, you need to change the directory to “nectar” and source your own openrc.sh file from NeCTAR. Simply run (in our case, please change to your own openrc.sh):
```
$ source ./group-8-openrc.sh
```
Note that you need to ensure that the openrc.sh and run.sh are both executable to the current user’s privilege. Next, just run:
```
$ ./run.sh
```
Wait several minutes to complete the entire process. Now 4 instances have been established with all the environment and dependencies of our application configured, including Docker, and clustered CouchDB operated in Docker containers.

#### 2.Application Deployment:
As shown in Figure 7, the IP Addresses of the recently built instances can be found from the output of Ansible scripts, or you can login to your cloud dashboard to check under Compute -> Instances

ssh to the master node, namely “COMP90024-CCC-1” with the private key given in the directory named “group-8.pem”:
```
$ ssh -i ./group-8.pem
```
Clone the git repository to a directory (in our case, /home/ubuntu):
```
$ git clone https://github.com/NortonWEI/COMP90024-Assignment-2.git
```
Change directory to “COMP90024-Assignment-2” and run:
```
$ docker-compose up
```
Now the web server is established and waits for data to populate in.

#### 3. Data Import:
The data is under the folder “./db/data”.<br>
The sh file “./db/couchdb_dataimport.sh” is used to import the data from AURIN;<br>
Modify master_node, user and password.<br>
Required npm model: couchimport@1.1.2
Run the command:
```
$ sh ./db/couchdb_dataimport.sh
```

#### 4.View Build:
Grunt is used to automatically compile views in CouchDB.<br>
The javascript files of map-reduce functions is under the folder “./db/couchdb”.<br>
The grunt file “./db/Gruntfile.js” is used to configure tasks;<br>
Modify user, password and ip address of couchdb.<br>

Required npm model: grunt@1.0.4, grunt-couch@1.5.1, grunt-cli@1.3.2.<br>
Run the command:<br>
```
$grunt couch-compile
$grunt couch-push
```
