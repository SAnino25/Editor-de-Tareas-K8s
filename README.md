# Editor-tareas-k8s

Migración de [task-editor-docker](https://github.com/SAnino25/task-editor-docker) a Kubernetes con Kind y despliegue local.

Stack: **React/Vite** (frontend) · **Node.js/Express** (backend) · **PostgreSQL 15** (db)

> Nota: el proyecto incluye despliegue Kubernetes y también un `docker-compose.yml` para ejecutar la app de forma local sin Kind.

---

## 🚀 Qué hace este repositorio

- Levanta un registry Docker local en `localhost:5000`
- Construye imágenes para frontend y backend
- Crea un clúster Kind con soporte para el mirror de `localhost:5000`
- Aplica los manifiestos de `k8s/`
- Crea el secreto de PostgreSQL en Kubernetes
- Hace `port-forward` para exponer frontend en `localhost:5173` y backend en `localhost:3001`

---

## ✅ Requisitos

- Docker instalado y en ejecución
- Bash compatible (`bash`, WSL, Git Bash, etc.)
- `curl` disponible
- `sudo` para instalar `kind` y `kubectl` si no están presentes

> En Windows, usa WSL o Git Bash. `start.sh` no se ejecuta directamente en PowerShell sin un entorno Bash.

---

## 🚀 Levantar la aplicación en Kubernetes

```bash
chmod +x start.sh
./start.sh
```

Después de arrancar:

- **Frontend** → http://localhost:5173
- **Backend** → http://localhost:3001

### Tiempo estimado

| Situación | Tiempo |
|---|---|
| Primera vez | 4–6 min |
| Posteriores | 2–3 min |

---

## 🛠️ Alternativa local con Docker Compose

Si no quieres usar Kubernetes, puedes ejecutar el stack local con Docker Compose:

```bash
docker compose up --build
```

Esto crea:

- `db`: PostgreSQL 15
- `backend`: Node/Express en `localhost:3001`
- `frontend`: React/Vite en `localhost:5173`

---

## 📁 Estructura del proyecto

- `backend/` — API Express y conexión a PostgreSQL
- `frontend/` — UI React/Vite con proxy `/api` hacia el backend
- `k8s/` — manifiestos de Kubernetes
- `docker-compose.yml` — stack local con Docker Compose
- `start.sh` — script de arranque para Kind + registry local
- `kind-config.yaml` — generado por `start.sh` para configurar el mirror del registry

---

## 📌 Detalles de Kubernetes

### Manifiestos principales

| Archivo | Contenido |
|---|---|
| `k8s/db-deployment.yml` | PVC + Deployment + Service de PostgreSQL 15 |
| `k8s/backend-deployment.yml` | Deployment + Service del backend Node/Express en el puerto 3001 |
| `k8s/frontend-deployment.yml` | Deployment + Service del frontend Vite en el puerto 5173 |

### Estado actual

- El clúster se crea en `start.sh` con `kind create cluster --config kind-config.yaml`
- No hay HPA configurado en los manifiestos actuales
- El frontend usa proxy Vite `/api` para conectar con el backend

---

## 🔍 Comandos útiles

```bash
# Ver todos los pods
kubectl get pods

# Ver servicios
kubectl get svc

# Ver logs del backend
kubectl logs -l app=backend --tail=50

# Ver logs de la base de datos
kubectl logs -l app=db --tail=50

# Borrar el clúster Kind
kind delete cluster
```

---

## 🔐 Nota de seguridad

La contraseña de PostgreSQL (`taskpass`) se pasa en texto plano desde `start.sh` al secreto `db-secret`.
En producción debe gestionarse con un gestor de secretos seguro (Vault, AWS Secrets Manager, etc.).

---

## 💡 Observaciones

- El frontend container ejecuta `npm run dev` y expone Vite en `5173`
- El backend escucha en `3001` y expone `/health` para readiness
- Si el clúster Kind ya existe, `start.sh` no lo recrea
