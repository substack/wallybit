#!/bin/bash

dirname=$(dirname "`readlink -f "$0"`")
pw=$(</dev/urandom head -c 64 | base64 -w0)

bitcoind -rpcbind=127.0.0.1 \
  -rpcuser=default \
  -rpcpassword="$pw" \
  -testnet &
node $dirname/../server.js "$pwd"
