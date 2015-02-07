#!/bin/sh

cd dialect/wierd-jnc && make $* && cd ../..
cd dialect/wierd-mvh && make $* && cd ../..

if [ "x$MAKE_BIN_COMPAT_ALIASES" != "x" ]; then
    ln -s wierd-jnc dialect/wierd-jnc/bin/wierd
    ln -s wierd-mvh dialect/wierd-mvh/bin/wierd-milo
fi
