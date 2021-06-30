#!/usr/bin/env bash

set -e

if ! [[ $DEPLOY_ENV = "xsmallh" ]] && ! [[ $DEPLOY_ENV = "mainnet" ]]; then
  echo "Which deployment environment? Set DEPLOY_ENV to 'xsmallh' or 'mainnet'"
	exit 1
fi

set -x

# build typescript code
(cd frontend/ts && ./build.sh)

# build the flutter app
cd frontend/dart || exit
if [[ $DEPLOY_ENV = "mainnet" ]]; then
  flutter build web --web-renderer canvaskit --release --no-sound-null-safety --pwa-strategy=none
else
  # For all networks that are not main net, build with the staging config
  flutter build web --web-renderer canvaskit --release --no-sound-null-safety --pwa-strategy=none --dart-define=DEPLOY_ENV=staging
fi
sed -i -e 's/flutter_service_worker.js?v=[0-9]*/flutter_service_worker.js/' build/web/index.html

# Bundle into a tight tarball
# On macOS you need to install gtar + xz
# brew install gnu-tar
# brew install xz

cd build/web/ || exit
tar cJv --mtime='2021-05-07 17:00+00' --sort=name --exclude .last_build_id -f ../../../assets.tar.xz . || \
gtar cJv --mtime='2021-05-07 17:00+00' --sort=name --exclude .last_build_id -f ../../../assets.tar.xz .
cd ../../.. || exit
ls -sh assets.tar.xz
sha256sum assets.tar.xz

echo Compiling rust package
if [[ $DEPLOY_ENV = "mainnet" ]]; then
  cargo build --target wasm32-unknown-unknown --release --package nns_ui
else
  cargo build --target wasm32-unknown-unknown --release --package nns_ui --features mock_conversion_rate
fi

echo Optimising wasm
wasm-opt target/wasm32-unknown-unknown/release/nns_ui.wasm --strip-debug -Oz -o target/wasm32-unknown-unknown/release/nns_ui-opt.wasm

sha256sum target/wasm32-unknown-unknown/release/nns_ui-opt.wasm
