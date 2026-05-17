#!/bin/bash
set -e

# ── 1. Instalar kind ──────────────────────────────────────────
echo "==> Verificando kind..."
if ! command -v kind &>/dev/null; then
  curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
  chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind
  echo "    kind instalado."
else
  echo "    kind ya instalado."
fi

# ── 2. Instalar kubectl ───────────────────────────────────────
echo "==> Verificando kubectl..."
if ! command -v kubectl &>/dev/null; then
  curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl
  echo "    kubectl instalado."
else
  echo "    kubectl ya instalado."
fi

# ── 3. Generar kind-config.yaml ───────────────────────────────
echo "==> Generando kind-config.yaml..."
cat <<KINDEOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://registry:5000"]
KINDEOF

# ── 4. Crear el clúster ───────────────────────────────────────
echo "==> Creando clúster kind..."
if kind get clusters 2>/dev/null | grep -q "^kind$"; then
  echo "    El clúster 'kind' ya existe, omitiendo."
else
  kind create cluster --config kind-config.yaml
fi

# ── 5. Conectar registry a la red kind ───────────────────────
echo "==> Conectando registry a la red kind..."
docker network connect kind registry 2>/dev/null || echo "    Ya estaba conectado."

# ── 6. Instalar metrics-server ────────────────────────────────
echo "==> Instalando metrics-server..."
if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
  echo "    metrics-server ya existe."
else
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
  kubectl patch deployment metrics-server -n kube-system \
    --type='json' \
    -p='[
      {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"},
      {"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--metric-resolution=5s"}
    ]'
  echo "    Esperando que metrics-server esté listo..."
  kubectl rollout status deployment/metrics-server -n kube-system --timeout=90s
fi

# ── 7. Configurar HPA sync period ────────────────────────────
echo "==> Configurando HPA sync period en controller manager..."
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
echo "✅ Clúster listo."
kubectl get nodes
