#!/bin/bash
# Build CoHUI_Server.jar
# Usage: bash build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Cleaning bin directory..."
rm -rf bin
mkdir -p bin

echo "Compiling Java sources..."
# Skip module-info.java to avoid module issues
javac -d bin \
  src/CoHUIClass_CaiTien/Dataset.java \
  src/CoHUIClass_CaiTien/Transaction.java \
  src/CoHUIClass_CaiTien/ItemSet.java \
  src/CoHUIClass_CaiTien/ItemSets.java \
  src/CoHUIClass_CaiTien/CoHUI_Algo_NEW.java \
  src/CoHUIClass_CaiTien/CoHUI_Algo_RU_LA_KUL.java \
  src/MainTest_CaiTien/CoHUI_Server.java

echo "Creating JAR..."
jar cfe CoHUI_Server.jar MainTest_CaiTien.CoHUI_Server -C bin .

echo "Build complete: CoHUI_Server.jar"
echo ""
echo "Test with:"
echo "  java -jar CoHUI_Server.jar Data/mushroom_utility.txt 99999 50000 0.4"
