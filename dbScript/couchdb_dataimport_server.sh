echo "== Set variables =="
declare -a nodes=(172.26.37.208 172.26.37.176 172.26.37.224 172.26.37.236)
declare -a ports=(5984 5984 5984 5984)
export master_node=172.26.37.208
export master_port=5984
export size=${#nodes[@]}
export user=admin
export pass=admin

curl -X PUT "http://${user}:${pass}@${master_node}:${master_port}/tweets_sample"
cat ../import/tweets.json | couchimport --url http://${user}:${pass}@${master_node}:${master_port} --database tweets_sample --type jsonl
