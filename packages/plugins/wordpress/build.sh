#!/bin/bash
rm -f lovarank.zip
zip -r lovarank.zip . -x "*.git*" "*.DS_Store" "lovarank.zip" "docker-compose.yml" "build.sh"