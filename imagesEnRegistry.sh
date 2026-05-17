#!/bin/bash
set -e

echo "==> Levantando registry local en puerto 5000..."
if docker ps -a --format '{{.Names}}' | grep -q "^registry$"; then
  docker start registry 2>/dev/null || true
  echo "    Registry ya existía, arrancado."
else
  docker run -d --name registry --restart=always -p 5000:5000 registry:2
  echo "    Registry creado."
fi

echo "==> Construyendo imágenes..."
docker build -t localhost:5000/task-backend:1.0  ./backend
docker build -t localhost:5000/task-frontend:1.0 ./frontend

echo "==> Subiendo imágenes al registry local..."
docker push localhost:5000/task-backend:1.0
docker push localhost:5000/task-frontend:1.0

echo ""
echo "✅ Imágenes disponibles:"
echo "   localhost:5000/task-backend:1.0"
echo "   localhost:5000/task-frontend:1.0"
