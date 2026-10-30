# 08 · Salud de dependencias

> ¿Cómo vigilamos el código de terceros?

## El problema

La mayor parte del código que ejecuta Dropr no lo hemos escrito nosotros. Las vulnerabilidades y las versiones maliciosas aparecen **sin que cambiemos nada**. Hay que vigilar de forma continua, no solo cuando tocamos el código.

## Las piezas

| Pieza                                   | Qué hace                                                 | Cuándo                          |
| --------------------------------------- | -------------------------------------------------------- | ------------------------------- |
| `pnpm audit --audit-level high`         | Falla si hay vulnerabilidades altas o críticas conocidas | Cada PR, cada merge, cada lunes |
| Dependabot (versiones)                  | Abre PRs de actualización                                | Cada semana                     |
| Dependabot (alertas y security updates) | Avisa de vulnerabilidades y abre el PR que las arregla   | Cuando se publican              |
| Trivy                                   | Lo mismo, dentro de la imagen: Debian y paquetes de Node | Cada PR, cada merge, cada lunes |
| Lockfile congelado                      | Se instala exactamente lo revisado                       | Siempre                         |

Decisión: [ADR-0011](../../dropr/docs/adr/0011-dependency-health-in-ci.md).

## Dependabot

Tres ecosistemas:

| Ecosistema       | Qué actualiza                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `npm`            | Dependencias de pnpm. Menores y parches agrupados en un PR; mayores una a una                     |
| `github-actions` | Los SHA de las acciones, con su comentario de versión                                             |
| `docker`         | El digest de la imagen base. Nunca una versión mayor de Node: eso es una decisión (`.nvmrc`, ADR) |

### Cooldown

Dependabot espera **3 días** desde que se publica una versión (14 para las mayores) antes de proponerla. Muchas versiones maliciosas se detectan y retiran en horas o días; esperar un poco evita instalarlas. Es la misma idea que `minimumReleaseAge` de pnpm.

### Un PR de Dependabot es un PR más

Pasa por el mismo CI que los tuyos. Si los checks pasan, se fusiona; si no, se investiga.

## Política de severidad

Se bloquea con **HIGH o CRITICAL**. Bloquear con _moderate_ genera tanto ruido que acaba empujando a ignorar avisos en bloque. En la imagen, además, solo si **existe un arreglo**: una vulnerabilidad sin parche no la puedes resolver tú; la ejecución de los lunes la volverá a mirar cuando salga.

## La cadena de suministro

- **Lockfile** commiteado y congelado en el CI.
- **Scripts de instalación** bloqueados salvo lista blanca.
- **Acciones de GitHub fijadas por SHA** (→ [Publicación de la imagen](12-publicacion-de-la-imagen.md)).
- **Imagen base fijada por digest**.
- **Cooldown** en todas las actualizaciones.

## Lo que salió mal

- El primer `pnpm audit` encontró 3 vulnerabilidades altas **en la propia versión de pnpm** fijada. Se actualizó a una versión que respetara el cooldown de 3 días, en un PR aparte.
- El primer escaneo de Trivy encontró 6 HIGH, todas en el **npm que trae la imagen base**, que no usamos. Se borró npm de la imagen final.

## Pendiente

- Plazos para corregir por severidad (CRITICAL en 48 h, HIGH en 7 días) y medir su cumplimiento.
- Vigilar la antigüedad de los PRs de Dependabot.
