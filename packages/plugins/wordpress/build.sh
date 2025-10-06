#!/bin/bash
rm -rf lovarank lovarank.zip && \
mkdir -p lovarank && \
cp -r css images includes libs pages script image-functions.php index.php lovarank.php LICENSE readme.txt uploads.ini lovarank && \
zip -r lovarank.zip lovarank && \
rm -rf lovarank