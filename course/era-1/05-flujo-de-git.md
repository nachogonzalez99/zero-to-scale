# 05 · Flujo de Git

> ¿Cómo llega un cambio a `main`?

## Trunk-based

Una sola rama permanente, `main`, que **siempre se puede desplegar**. Cada cambio vive en una rama corta (horas o pocos días) y entra por pull request.

```bash
git switch main && git pull
git switch -c feat/short-description
# commits…
git push -u origin feat/short-description
# PR → checks en verde → squash merge
```

Frente a **ramas por entorno** (Git Flow, GitLab Flow: `develop` → `staging` → `main`): las ramas largas divergen, los merges entre ellas se complican y cada entorno acaba ejecutando un build distinto. En trunk-based, los entornos se alimentan de la **misma imagen** (→ [Entornos y entrega](13-entornos-y-entrega.md)).

## Ramas

`tipo/descripcion-corta`: `feat/delivery-quotes`, `ci/publish-image`, `build/api-container`.

## Conventional Commits

```
tipo(ámbito)!: descripción en minúscula e imperativo
```

| Tipo                               | Para                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `feat`                             | Comportamiento nuevo                                     |
| `fix`                              | Arreglo                                                  |
| `docs`                             | Solo documentación                                       |
| `refactor`                         | Cambio sin efecto visible                                |
| `test`                             | Solo tests                                               |
| `build`                            | Cómo se construye o empaqueta (dependencias, Dockerfile) |
| `ci`                               | Workflows, configuración del CI                          |
| `perf`, `style`, `chore`, `revert` | Lo que dicen                                             |

- `!` marca un cambio que **rompe** (por ejemplo, el contrato de la API).
- Son la base del CHANGELOG y del versionado automático (release-please).
- commitlint lo comprueba en `commit-msg` y en el título del PR.

## `main` protegida

Un ruleset de GitHub ([ADR-0010](../../dropr/docs/adr/0010-pull-requests-and-protected-main.md)), hoy gestionado como código (→ [Infraestructura como código](14-infraestructura-como-codigo.md)):

- Solo por PR, sin force push ni borrado, historial lineal.
- Checks obligatorios: Check, Audit, Image, PR title, API breaking changes.
- La rama tiene que estar al día con `main`.
- 0 aprobaciones mientras haya una persona; 1 cuando llegue la segunda.
- Nadie en la lista de bypass.

Que un check **se ejecute** lo decide el workflow; que **bloquee el merge** lo decide el ruleset. Un check que no está en el ruleset se ve, pero no impide fusionar.

## Squash merge

Todos los commits del PR se convierten en **uno** en `main`, con el título del PR como mensaje. Por eso el título sigue Conventional Commits.

- Historial de `main` limpio: un commit por cambio, fácil de leer y de revertir.
- Los commits intermedios ("wip", "fix typo") no llegan a `main`.
- El squash crea un commit **nuevo**: el CI vuelve a ejecutarse en `main` sobre ese commit, y es el que se publica y despliega.

## Revert frente a fix-forward

Cuando algo roto llega a producción, primero se hace **rollback** (redesplegar la imagen anterior, → [Entornos y entrega](13-entornos-y-entrega.md)). Después, para arreglar `main`:

|           | Revert                                                         | Fix-forward                                     |
| --------- | -------------------------------------------------------------- | ----------------------------------------------- |
| Qué es    | `git revert` del commit: un commit nuevo que deshace el cambio | Un commit nuevo que corrige el fallo            |
| A favor   | Rápido, mecánico, sin pensar bajo presión                      | Mantiene el resto del cambio                    |
| En contra | Hay que volver a hacer el cambio bien                          | Bajo presión, el arreglo puede traer otro fallo |

Por defecto, **revert**; fix-forward solo si el arreglo es trivial. Siempre con un **test de regresión**.

## Reglas

- Nunca se commitea en `main` en local. Si pasa: comprobar qué hay, `git reset --hard origin/main`, y `git config pull.ff only` para que no vuelva a pasar.
- Un PR por cambio, aunque trabajes solo.

## Lo que salió mal

- Título de PR `ci : add ci workflows` (espacio antes de los dos puntos): commitlint lo rechaza.
- Ramas divergentes por commitear en `main` en local.
- "Update branch" en GitHub añade un commit en remoto: luego hay que traerlo (`git pull --no-rebase`) antes de volver a hacer push.
- El push de workflows fallaba: el token fine-grained necesitaba el permiso **Workflows**.
