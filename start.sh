#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         Editor de Tareas — arranque               ║"
echo "╚══════════════════════════════════════════════╝"

# ═══════════════════════════════════════════════════
#  BLOQUE 1 — REGISTRY LOCAL
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [1/5] Levantando registry local en puerto 5000..."
if docker ps -a --format '{{.Names}}' | grep -q "^registry$"; then
  docker start registry 2>/dev/null || true
  echo "    Registry ya existía, arrancado."
else
  docker run -d --name registry --restart=always -p 5000:5000 registry:2
  echo "    Registry creado."
fi

# ═══════════════════════════════════════════════════
#  BLOQUE 2 — CONSTRUIR Y PUBLICAR IMÁGENES
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [2/5] Construyendo y publicando imágenes en registry local..."
docker build -t localhost:5000/task-backend:1.0  ./backend
docker build -t localhost:5000/task-frontend:1.0 ./frontend

docker push localhost:5000/task-backend:1.0
docker push localhost:5000/task-frontend:1.0

echo "    ✔ localhost:5000/task-backend:1.0"
echo "    ✔ localhost:5000/task-frontend:1.0"

# ═══════════════════════════════════════════════════
#  BLOQUE 3 — INSTALAR KIND
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [3/5] Verificando kind..."
if ! command -v kind &>/dev/null; then
  echo "    Instalando kind..."
  curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
  chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind
  echo "    kind instalado."
else
  echo "    kind ya instalado: $(kind version)"
fi

# ═══════════════════════════════════════════════════
#  BLOQUE 4 — INSTALAR KUBECTL
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [4/5] Verificando kubectl..."
if ! command -v kubectl &>/dev/null; then
  echo "    Instalando kubectl..."
  curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl
  echo "    kubectl instalado."
else
  echo "    kubectl ya instalado: $(kubectl version --client 2>/dev/null | head -1 || true)"
fi

# ═══════════════════════════════════════════════════
#  BLOQUE 5 — CREAR CLÚSTER KIND
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [5/5] Creando clúster kind..."

cat <<KINDEOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://registry:5000"]
KINDEOF

if kind get clusters 2>/dev/null | grep -q "^kind$"; then
  echo "    El clúster 'kind' ya existe, omitiendo creación."
else
  kind create cluster --config kind-config.yaml
  echo "    Clúster creado."
fi

# Conectar registry a la red kind
echo "    Conectando registry a la red kind..."
docker network connect kind registry 2>/dev/null || echo "    Registry ya estaba conectado."

# ── Metrics-server: parchear el YAML ANTES de aplicarlo ──────
echo "    Instalando metrics-server..."
if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
  echo "    metrics-server ya existe."
else
  curl -sL https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml \
  | sed '/- --metric-resolution/a\        - --kubelet-insecure-tls\n        - --kubelet-preferred-address-types=InternalIP' \
  > /tmp/metrics-server.yaml

  kubectl apply -f /tmp/metrics-server.yaml

  echo "    Esperando que metrics-server esté listo (120s)..."
  kubectl rollout status deployment/metrics-server -n kube-system --timeout=120s
fi

# Configurar HPA sync period
echo "    Configurando HPA sync period..."
if docker exec kind-control-plane grep -q "horizontal-pod-autoscaler-sync-period" \
   /etc/kubernetes/manifests/kube-controller-manager.yaml 2>/dev/null; then
  docker exec kind-control-plane sed -i \
    's/--horizontal-pod-autoscaler-sync-period=.*/--horizontal-pod-autoscaler-sync-period=10s/' \
    /etc/kubernetes/manifests/kube-controller-manager.yaml
else
  docker exec kind-control-plane sed -i \
    '/- kube-controller-manager/a\    - --horizontal-pod-autoscaler-sync-period=10s' \
    /etc/kubernetes/manifests/kube-controller-manager.yaml
fi
echo "    Esperando reinicio del controller manager (15s)..."
sleep 15

echo ""
kubectl get nodes

# ═══════════════════════════════════════════════════
#  BLOQUE 6 — LEVANTAR LA APP CON DOCKER COMPOSE
# ═══════════════════════════════════════════════════
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Clúster listo — levantando app Docker    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

docker compose down --remove-orphans 2>/dev/null || true
docker compose up --build -d

echo ""
echo "    Esperando que los servicios estén listos..."
sleep 5

echo ""
docker compose ps

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  App disponible en:                          ║"
echo "║  Frontend → http://localhost:5173            ║"
echo "║  Backend  → http://localhost:3001            ║"
echo "║                                              ║"
echo "║  Clúster K8s creado y listo (sin Deployments)║"
echo "║  Usa 'kubectl get nodes' para verificarlo    ║"
echo "║                                              ║"
echo "║  'docker compose logs -f' para ver logs      ║"
echo "║  'docker compose down' para detener          ║"
echo "╚══════════════════════════════════════════════╝"
