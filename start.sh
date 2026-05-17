#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> 1. Crear el clúster Kubernetes"
bash ./createCluster.sh

echo "==> 2. Construir las imágenes y subirlas al registro local"
bash ./imagesEnRegistry.sh

echo "==> 3. Iniciar la aplicación con Docker Compose"
bash docker-compose up --build
