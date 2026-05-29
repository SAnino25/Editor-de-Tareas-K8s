#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     Editor de tareas — arranque K8s          ║"
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
echo "▶ [2/5] Construyendo y publicando imágenes..."
docker build -t localhost:5000/task-backend:1.0  ./backend
docker build -t localhost:5000/task-frontend:1.0 ./frontend
docker push localhost:5000/task-backend:1.0
docker push localhost:5000/task-frontend:1.0
echo "    ✔ localhost:5000/task-backend:1.0"
echo "    ✔ localhost:5000/task-frontend:1.0"

# ═══════════════════════════════════════════════════
#  BLOQUE 3 — INSTALAR KIND Y KUBECTL
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [3/5] Verificando kind y kubectl..."
if ! command -v kind &>/dev/null; then
  echo "    Instalando kind..."
  curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
  chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind
  echo "    ✔ kind instalado."
else
  echo "    ✔ kind ya instalado: $(kind version)"
fi


if ! command -v kubectl &>/dev/null; then
  echo "    Instalando kubectl..."
  curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl
  echo "    ✔ kubectl instalado."
else
  echo "    ✔ kubectl ya instalado."
fi

# ═══════════════════════════════════════════════════
#  BLOQUE 4 — CREAR CLÚSTER KIND
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [4/5] Creando clúster kind..."

cat <<KINDEOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:5000"]
    endpoint = ["http://registry:5000"]
KINDEOF

if kind get clusters 2>/dev/null | grep -q "^kind$"; then
  echo "    Clúster 'kind' ya existe, omitiendo creación."
else
  kind create cluster --config kind-config.yaml
  echo "    ✔ Clúster creado."
fi

echo "    Conectando registry a la red kind..."
docker network connect kind registry 2>/dev/null \
  && echo "    ✔ Registry conectado." \
  || echo "    ✔ Registry ya estaba conectado."

####
# Sincronizar kubeconfig con el puerto actual de Kind
kind export kubeconfig --name kind
####

# ═══════════════════════════════════════════════════
#  BLOQUE 5 — DESPLEGAR EN KUBERNETES
# ═══════════════════════════════════════════════════
echo ""
echo "▶ [5/5] Desplegando aplicación en Kubernetes..."

# VULNERABILIDAD CONOCIDA: contraseña en texto plano.
# Pendiente de corrección con gestor de secretos externo.
kubectl create secret generic db-secret \
  --from-literal=password='taskpass' \
  --dry-run=client -o yaml | kubectl apply -f -
echo "    ✔ Secret db-secret aplicado."

kubectl apply -f k8s/
echo "    ✔ Manifiestos aplicados."

# Esperar a que Kubernetes registre los pods
echo "    Esperando a que los pods aparezcan..."
WAITED=0
until kubectl get pods 2>/dev/null | grep -qE "Running|Pending|Init|ContainerCreating"; do
  sleep 3
  WAITED=$((WAITED+3))
  if [ $WAITED -gt 60 ]; then
    echo "    ⚠ Los pods tardan más de lo esperado. Estado actual:"
    kubectl get pods
    break
  fi
done

echo "    Esperando a que todos los pods estén Ready (máx. 3 min)..."
kubectl wait --for=condition=ready pod --all --timeout=180s

echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│           Pods en ejecución                  │"
echo "└─────────────────────────────────────────────┘"
kubectl get pods

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ App lista — abriendo port-forwards...    ║"
echo "║                                              ║"
echo "║  Frontend → http://localhost:5173            ║"
echo "║  Backend  → http://localhost:3001            ║"
echo "║                                              ║"
echo "║  Ctrl+C para cerrar los port-forwards        ║"
echo "╚══════════════════════════════════════════════╝"

# Backend en background, frontend en primer plano
kubectl port-forward svc/backend  3001:3001 &
kubectl port-forward svc/frontend 5173:5173
