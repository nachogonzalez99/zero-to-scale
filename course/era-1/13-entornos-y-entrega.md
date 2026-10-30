# 13 · Entornos y entrega

> ¿Cómo llega un cambio a producción, y cómo se vuelve atrás?

Decisión: [ADR-0016](../../dropr/docs/adr/0016-environments-and-delivery-flow.md). Documento de empresa: [`environments.md`](../../dropr/docs/environments.md).

## ¿Qué entornos hacen falta?

| Entorno                 | Para qué                                         | ¿En Dropr? |
| ----------------------- | ------------------------------------------------ | ---------- |
| Local                   | Desarrollar y depurar                            | ✅         |
| Desarrollo (compartido) | Integrar trabajo de varios antes de staging      | ❌         |
| Staging                 | Comprobar en un entorno real antes de producción | ✅         |
| Producción              | Clientes                                         | ✅         |

**¿Por qué no un entorno de desarrollo?** Solo compensa cuando hay consumidores que desarrollan contra la API (otro equipo, una app móvil), varios servicios interdependientes que no se pueden levantar en local, o entornos de preview demasiado caros. Nada de eso existe aún, y un entorno más es más coste, más deriva y una imagen más que mantener al día.

## El flujo

```
LOCAL        pnpm dev (o la imagen)
  │ PR
CI           checks de cada PR
  │ squash merge
STAGING      automático en cada merge: imagen sha-xxx → deploy → smoke test
  │ merge del PR de release (release-please)
PRODUCCIÓN   etiqueta vX.Y.Z → misma imagen → deploy → smoke test
```

### ¿Cómo sabe el CD a dónde desplegar?

Por el **evento**:

| Evento                                             | Destino                 |
| -------------------------------------------------- | ----------------------- |
| `push` a `main` (un merge)                         | Staging                 |
| Release publicada (merge del PR de release)        | Producción              |
| `workflow_dispatch` (a mano, con entorno + imagen) | Rollback o redespliegue |

### release-please

Mantiene abierto un **PR de release** con el CHANGELOG (sacado de los Conventional Commits) y la siguiente versión SemVer: `feat` sube la menor, `fix` el parche, `!` la mayor. Fusionarlo es la decisión de "esto va a producción": crea la etiqueta `vX.Y.Z` y la release.

### Un workflow de deploy reutilizable

Recibe **entorno** e **imagen**. Lo llama el CD y se puede lanzar a mano. Despliega, espera a que esté sano y pasa el smoke test.

## Rollback

**Rollback = redesplegar la imagen anterior**, con el workflow de deploy a mano. No reconstruye nada, así que es rápido. Después se arregla `main` con `git revert` (por defecto) o fix-forward, siempre con test de regresión (→ [Flujo de Git](05-flujo-de-git.md)).

El rollback deja de ser trivial cuando hay **datos**: si la versión nueva cambió el esquema de la base de datos, la anterior puede no funcionar. En la Era 2, migraciones _expand/contract_, siempre compatibles con la versión anterior.

## Desarrollos en paralelo

En trunk-based, todo lo fusionado llega a staging. Lo que no está terminado se protege con:

- **Feature flags**: el código está desplegado, pero apagado. Se enciende cuando está listo, incluso por cliente.
- **Entornos de preview**: un entorno efímero por PR. Útiles con varios equipos; caros para una persona.

Las dos sirven también con ramas por entorno: no son exclusivas de trunk-based.

## Qué se prueba en cada sitio

| Prueba                 | Dónde                                    | Necesita                                                             |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Unitarios, integración | CI                                       | Nada desplegado; integración con dependencias vacías en contenedores |
| Test de la imagen      | CI                                       | La imagen                                                            |
| Smoke                  | Tras cada despliegue, contra ese entorno | El entorno                                                           |
| E2E                    | Entorno efímero en el CI, o staging      | Datos controlados: un entorno limpio                                 |
| Rendimiento, estrés    | Entorno dedicado, bajo demanda           | Tamaño parecido a producción, sin afectar a nadie                    |

## Dependencias en la Era 2: local y entornos

| Dependencia                | Local                                                         | CI                                             | Staging / producción                            |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| Base de datos (gestionada) | Docker Compose                                                | Real y vacía en cada ejecución                 | La suya, por entorno                            |
| Tercero (no gestionada)    | Simulador local por defecto; sandbox **propio** si hace falta | Simulado (MSW, WireMock). **Nunca** el sandbox | Sandbox dedicado en staging; real en producción |
| Servicio propio            | Simulado, o su imagen                                         | Tests de contrato (Pact)                       | El real de ese entorno                          |

- **Puertos y adaptadores**: el dominio habla con una interfaz; qué implementación se usa (real, sandbox, simulador) lo decide la configuración.
- **Sandboxes compartidos colisionan**: datos que se pisan, webhooks que llegan a otro desarrollador, límites de uso compartidos. Por eso uno por desarrollador (o datos aislados con prefijos), reenvío de webhooks a tu máquina, y uno dedicado por entorno.

## Pendiente

Todo el paso 4 (staging) y el 5 (producción). El orden: proveedor, aplicación en el proveedor, cómo descarga la imagen, GitHub Environments, workflow de deploy, CD a staging, ajustar el apagado al proveedor y ensayar un rollback.
