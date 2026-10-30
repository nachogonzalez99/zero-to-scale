# 12 · Publicación de la imagen

> ¿Cómo sale el artefacto del CI, listo para desplegar?

Decisión: [ADR-0017](../../dropr/docs/adr/0017-image-publishing.md).

## Conceptos

### Registro de imágenes

El "npm de las imágenes": un almacén del que cualquier servidor las descarga. Dropr usa **GHCR** (GitHub Container Registry): vive junto al repo, sin otra cuenta, y el CI publica con el `GITHUB_TOKEN` de cada ejecución, sin secretos que guardar ni rotar.

### Etiquetas

- **`sha-<commit corto>`**: una por commit, nunca se reutiliza. **Es la que se despliega.**
- **`latest`**: móvil. Dos servidores con "la misma" etiqueta podrían ejecutar código distinto, y un rollback a `latest` no significa nada. **Nunca se despliega**, y ni siquiera se publica.
- **`vX.Y.Z`** (paso 5): apuntará a la **misma** imagen que ya tiene su `sha-…`.

### Construir una vez, publicar lo probado

El job construye **una vez**, prueba esa imagen y publica **esos mismos bytes** (`docker tag` + `docker push`), sin reconstruir.

## Qué pasa en cada evento

| Evento         | Lint + build + test de la imagen + escaneo | Publicar   |
| -------------- | ------------------------------------------ | ---------- |
| PR             | ✅ Un Dockerfile roto no llega a `main`    | ❌         |
| Merge a `main` | ✅                                         | ✅ `sha-…` |
| Lunes          | ✅ CVEs nuevas en la base sin cambiar nada | ❌         |

Los pasos de publicar tienen `if: github.event_name == 'push'`: en un PR aparecen como _skipped_.

## Los pasos del job `Image`

1. **hadolint**: linter del Dockerfile. La acción usa `failure-threshold: info`, así que incluso un aviso informativo rompe: obliga a decidir cada uno.
2. **Buildx** + **metadata-action**: nombre (en minúsculas, como exigen los registros), etiqueta `sha-…` y etiquetas OCI (origen, commit, fecha).
3. **Build** para `linux/amd64`, con `load: true` (la imagen queda en el runner para probarla) y caché de capas en GitHub Actions (`type=gha,mode=max`): cada ejecución empieza en una máquina limpia.
4. **Test de la imagen** (→ [Testing](07-testing.md)): arranca, `/health/ready` devuelve **el commit construido**, sirve `/v1/zones` y, tras `docker stop`, sale con **0** (137 significaría SIGKILL: señales rotas).
5. **Trivy**: falla con HIGH o CRITICAL **con arreglo** disponible.
6. **Login** en GHCR y **publicar**, solo en `main`.

## Acciones fijadas por SHA: la lección de Trivy

En marzo de 2026, unos atacantes comprometieron Trivy y **forzaron 76 de las 77 etiquetas** de `trivy-action` para que apuntaran a código que robaba los secretos del runner. Quien usaba `@v0.34.0` ejecutó el código del atacante sin cambiar ni una línea: una etiqueta se puede mover, un SHA de commit no.

**Regla: toda acción se fija por SHA completo**, con la versión en un comentario:

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
```

Dependabot entiende ese formato y actualiza SHA y comentario.

## Lo que salió mal

- **DL3066** (hadolint): `USER node` → `USER 1000:1000`.
- **6 HIGH en Trivy**, todas en el npm de la imagen base → npm fuera de la imagen final.
- El job corría pero no bloqueaba: faltaba añadirlo al **ruleset**.
- Al principio se llamó _smoke test_ a lo que es un test de la imagen. Son cosas distintas (→ [Testing](07-testing.md)).

## Cómo comprobarlo

- PR: todo en verde salvo _Log in_ y _Publish_, que salen _skipped_.
- Rompe a propósito: quita el manejo de señales → el test de la imagen falla con 137.
- Tras el merge: el resumen de la ejecución muestra la etiqueta publicada; la imagen aparece en _Packages_, privada por defecto.
- Descárgala: `docker pull ghcr.io/<owner>/dropr-api:sha-<commit>` (con un token con `read:packages`) y mira sus etiquetas con `docker inspect`.

## Pendiente

- Política de retención en GHCR (sin borrar nunca un candidato a rollback).
- Firma (cosign), provenance (SLSA) y SBOM.
