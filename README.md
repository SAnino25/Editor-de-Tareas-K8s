# editor_tareas_k8

Migración de [task-editor-docker](https://github.com/SAnino25/task-editor-docker) a Kubernetes.

## Estado: Commit A — Clúster sin Deployments (app en Docker)

### Dónde se crea el clúster
El clúster se crea en el archivo `createCluster.sh`, en el bloque:

```bash
# ── Crear el clúster ───────────────────────────────────────
kind create cluster --config kind-config.yaml
```

`kind-config.yaml` es generado por el propio script y configura el mirror
del registry local (`localhost:5000`) para que el clúster pueda tirar de
las imágenes construidas con `imagesEnRegistry.sh`.
```

## 🚀 Levantar todo (cluster + imágenes + app)

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