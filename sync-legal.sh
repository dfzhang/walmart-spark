#!/bin/bash
rsync -av --delete ~/legal-review-app/ ~/walmart-spark/legal-review-app/ --exclude node_modules --exclude .sanity
echo "✅ Synced to repo"
