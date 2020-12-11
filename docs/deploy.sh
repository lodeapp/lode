#!/usr/bin/env sh

set -e
yarn run clean
yarn run build
cd dist

git init
git add -A
git commit -m 'Deploy Lode website'

git push -f git@github.com:lodeapp/lode.git master:gh-pages
