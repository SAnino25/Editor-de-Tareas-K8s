# Editor-tareas-k8s

Migración de [task-editor-docker](https://github.com/SAnino25/task-editor-docker)
a Kubernetes con autoescalado HPA.

Stack: **React/Vite** (frontend) · **Node.js/Express** (backend) · **PostgreSQL 15** (db)

---

## 🚀 Levantar la aplicación

```bash
chmod +x start.sh
./start.sh
```

Una vez arrancado:

- **Frontend** → [http://localhost:5173](http://localhost:5173)

### Tiempo estimado
| Situación | Tiempo |
|---|---|
| Primera vez | 4–6 min |
| Posteriores | 2–3 min |


---

## 🏗 Estructura del proyecto

---

## Estado: Commit B — Clúster + Deployments sin HPA

### Archivos donde se definen los Deployments

Los Deployments están en el directorio `k8s/`:

| Archivo | Contenido |
| --- | --- |
| `k8s/db-deployment.yml` | PVC + Deployment + Service de **PostgreSQL 15** |
| `k8s/backend-deployment.yml` | Deployment + Service del **backend Node/Express** (puerto 3001) |
| `k8s/frontend-deployment.yml` | Deployment + Service del **frontend React/Vite** (puerto 5173) |

### Dónde se crea el clúster

El clúster se crea en `start.sh`, bloque 4, con la instrucción:

```bash
kind create cluster --config kind-config.yaml
```

`kind-config.yaml` es generado por el propio script y configura el mirror
del registry local (`localhost:5000`) para que el clúster pueda tirar de
las imágenes construidas en el bloque 2.

---

## 🔍 Comandos útiles

```bash
chmod +x  start.sh

./start.sh
```
## Acceso a la app

- Frontend → http://localhost:5173


### Para apagar la app (modo Docker, provisional)
```bash
docker compose down -v
```