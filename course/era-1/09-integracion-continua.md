# 09 · Integración continua

> ¿Qué se comprueba en cada cambio?

## El recorrido de un cambio

```
TU MÁQUINA
  git commit ──► pre-commit:  secretlint → oxlint --fix → prettier   (solo ficheros del commit)
             └─► commit-msg:  commitlint
  git push   ──► pre-push:    no push a main → pnpm check            (todo el repo)
                    │
                    ▼
PULL REQUEST ──► ci.yml            Check · Audit · Image (sin publicar)
                 pull-request.yml  PR title · API breaking changes
                    │   los 5 obligatorios en verde
                    ▼
SQUASH MERGE ──► push a main ──► ci.yml otra vez: Check · Audit · Image (+ publica sha-…)
                                                                  │
                                                                  ▼
                                                     ghcr.io/<owner>/dropr-api:sha-…
```

## Los workflows

### `ci.yml`

| Disparador          | Para qué                                                                        |
| ------------------- | ------------------------------------------------------------------------------- |
| `pull_request`      | Validar el cambio antes del merge                                               |
| `push` a `main`     | Validar lo fusionado y publicar la imagen                                       |
| `schedule`, lunes   | Detectar problemas nuevos sin cambios: CVEs en dependencias y en la imagen base |
| `workflow_dispatch` | Lanzarlo a mano                                                                 |

| Job   | Qué hace                                                                                   |
| ----- | ------------------------------------------------------------------------------------------ |
| Check | `pnpm check`: oxlint, Prettier, secretlint, knip, tsc, tests con umbrales, contrato al día |
| Audit | `pnpm audit --audit-level high`                                                            |
| Image | hadolint → build → test de la imagen → Trivy → publicar (solo en `main`)                   |

### `pull-request.yml`

| Job                  | Qué hace                                                                             |
| -------------------- | ------------------------------------------------------------------------------------ |
| PR title             | commitlint sobre el título, que será el commit de `main`                             |
| API breaking changes | oasdiff compara el contrato con el de `main`; falla si rompe, salvo `!` en el título |

## Detalles que importan

- **¿Por qué corre otra vez tras el merge?** El squash crea un commit nuevo en `main`, distinto de lo que se probó en el PR (puede combinar cambios que entraron entretanto). El CI valida ese commit y es el que se publica.
- **Permisos mínimos**: el workflow tiene `contents: read`; solo el job Image tiene además `packages: write`.
- **`concurrency` con `cancel-in-progress`**: un push nuevo cancela la ejecución anterior de la misma rama. Bien para comprobar; peligroso para desplegar (→ paso 4).
- **`LEFTHOOK: 0`**: los hooks de Git no corren en el CI.
- **El contrato base** para oasdiff se obtiene con `git fetch --depth=1 origin <rama base>` y `git show`.
- **Acciones fijadas por SHA** (→ [Publicación de la imagen](12-publicacion-de-la-imagen.md)).

## Requisitos en GitHub

- Ruleset de `main` con los 5 checks obligatorios. Hoy, como código (→ [Infraestructura como código](14-infraestructura-como-codigo.md)).
- Para hacer push de workflows con un token fine-grained, el permiso **Workflows**.

## Pendiente

- La "D" de CI/CD: desplegar en staging en cada merge y en producción en cada release.
- Notificaciones cuando `main` o la ejecución de los lunes fallan.
- Métricas del propio CI: duración, fallos, tests inestables (→ [Lo que vendrá](18-lo-que-vendra.md)).
