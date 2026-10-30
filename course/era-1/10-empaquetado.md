# 10 · Empaquetado

> ¿Cómo se convierte la API en un artefacto que corre igual en cualquier sitio?

## Conceptos

- **Imagen y contenedor**: la imagen es la receta congelada (sistema, Node, código y dependencias); el contenedor es esa imagen en marcha. Se construye **una vez** y la misma imagen se ejecuta en local, en el CI, en staging y en producción. Solo cambia la configuración.
- **Capas y caché**: cada instrucción del Dockerfile crea una capa. Si una capa no cambia, se reutiliza; **si cambia, se rehacen todas las siguientes**. Regla: lo que cambia poco arriba (dependencias), lo que cambia mucho abajo (código).
- **Contexto de build**: los ficheros que se envían a Docker. En el monorepo, el lockfile y el workspace están en la raíz, así que el contexto es la raíz: `docker build -f dropr/api/Dockerfile .`
- **Tamaños**: _content size_ son las capas comprimidas (lo que se sube y se descarga al desplegar); _disk usage_, descomprimidas.

## Cómo se construyó, paso a paso

Se empezó por una versión **ingenua** y se midió. Cada problema medido fue el siguiente paso.

| Experimento con la versión ingenua                     | Problema                                 | Solución                         |
| ------------------------------------------------------ | ---------------------------------------- | -------------------------------- |
| Ctrl+C no para el contenedor; `docker stop` tarda 10 s | PID 1 sin manejador de señales           | La app maneja SIGTERM y SIGINT   |
| 1,13 GB en disco                                       | Lleva todo el tooling de desarrollo      | Multi-stage                      |
| La capa de `pnpm install` es la más pesada             | Dependencias de desarrollo               | `fetch --prod` + `deploy --prod` |
| `whoami` → `root`                                      | Si alguien explota la API, es root       | `USER 1000:1000`                 |
| Vitest, tsc, oxlint dentro                             | Herramientas de desarrollo en producción | Multi-stage                      |
| Cambias una línea y se reinstala todo                  | Caché mal aprovechada                    | Lockfile primero, código después |

### 1. `.dockerignore`

Decide qué entra en el contexto. Lo más importante: **el `node_modules` de tu Mac no sirve en Linux** (binarios nativos como los de oxlint). Siempre se instala dentro de la imagen. Tampoco entran `.git`, la documentación, la infraestructura ni ningún `.env`.

### 2. Caché con `pnpm fetch`

En un workspace habría que copiar cada `package.json` antes de instalar. `pnpm fetch` descarga las dependencias **leyendo solo el lockfile**, así que esa capa solo se rehace cuando cambia el lockfile. Después, `--offline` garantiza que no se descarga nada más.

### 3. Multi-stage y `pnpm deploy`

La imagen final es solo la última etapa. La de build prepara; la final copia lo necesario y descarta el resto.

- `pnpm --filter @dropr/api deploy --prod --offline /app` saca el paquete a una carpeta autónoma con un `node_modules` de solo producción.
- El campo **`files`** del `package.json` es la **lista blanca** de lo que se distribuye: `["src"]`. Sin él se copiarían tests, docs y configuración.
- **No se compila TypeScript**: no hay etapa de `tsc` ni `dist/`.
- Resultado: de 1,13 GB a la base más unos 35 MB.

### 4. Usuario sin privilegios

`USER 1000:1000`, el usuario `node` de la imagen oficial, con **número** y no con nombre: algunas plataformas (Kubernetes con `runAsNonRoot`) no pueden verificar que un nombre no sea root y se niegan a arrancar. El código pertenece a root: la app lo lee, pero no puede reescribirlo. Puerto 3000: por encima de 1024 no hace falta root.

### 5. Señales y PID 1

Al parar un contenedor, la plataforma envía **SIGTERM**, espera un tiempo (_grace period_) y después **SIGKILL**. Dentro del contenedor, Node es el **PID 1**, y Linux no aplica la acción por defecto de las señales al PID 1: **sin un manejador, ignora SIGTERM**.

- `CMD ["node", "src/server.ts"]` en **forma exec**: sin shell ni gestor de paquetes en medio que no reenvíe las señales.
- La app maneja SIGTERM y cierra con orden (→ [Preparación para producción](11-preparacion-para-produccion.md)).
- `docker run --init` (tini) existe como red de seguridad, pero depende de cada plataforma.

### 6. Imagen base fijada por digest

`node:26-slim` es una etiqueta móvil. El **digest** (`@sha256:…`) identifica una imagen concreta. Se usa el digest del **índice multiplataforma** (`docker buildx imagetools inspect node:26-slim`), no el de una arquitectura. Dependabot (`docker`) propone las actualizaciones; un salto de versión mayor de Node no, porque es una decisión.

| Base               | Tamaño  | Notas                                                                      |
| ------------------ | ------- | -------------------------------------------------------------------------- |
| `node:26`          | ~1 GB   | Lo trae todo                                                               |
| **`node:26-slim`** | ~200 MB | Debian mínima (glibc). La elegida                                          |
| `node:26-alpine`   | ~150 MB | musl: sorpresas con módulos nativos                                        |
| Distroless         | ~100 MB | Sin shell ni npm. El siguiente paso si los hallazgos en la base se repiten |

### 7. Metadatos: qué está corriendo

La imagen lleva **dentro** de qué commit sale:

```dockerfile
ARG VERSION=0.0.0-dev     # acepto que me pasen un valor; si no, este
ARG COMMIT=unknown
ENV APP_VERSION=$VERSION \
    APP_COMMIT=$COMMIT    # lo guardo dentro: la API lo lee
```

- `--build-arg COMMIT=…` **entrega** el valor, `ARG` lo **recibe** (solo existe durante el build) y `ENV` lo **guarda** dentro de la imagen.
- Va **al final**: el commit cambia en cada build, e invalidaría la caché de todo lo que hubiera debajo.
- `/health` lo devuelve. Con la API desplegada, un `curl` dice qué código está corriendo.
- La **versión** llega con release-please (paso 5); hasta entonces dice `0.0.0-dev` y el commit identifica la imagen. El **entorno** no viene de la imagen: lo pone la plataforma.
- Las etiquetas OCI (`LABEL`, fuera de la imagen) las añade el CI.

### 8. Sin npm en la imagen final

El primer escaneo encontró 6 vulnerabilidades HIGH, **todas en el npm que trae la imagen base**. En la imagen final no se usa, así que se borra. Matiz: borrar en una capa posterior no reduce el tamaño (los ficheros siguen en la capa base, ocultos), pero dentro del contenedor ya no existen.

## Decisión

[ADR-0014](../../dropr/docs/adr/0014-container-image.md). El Dockerfile: [`dropr/api/Dockerfile`](../../dropr/api/Dockerfile).

## Docker en local

- Docker Desktop, OrbStack o Colima en macOS.
- El día a día sigue en `pnpm dev`. La imagen sirve para comprobar el artefacto. Docker Compose llega en la Era 2, con la base de datos.
- En Apple Silicon se construye `arm64`; los servidores son `amd64`. En el CI se construye para la plataforma de destino.

## Trucos

- `docker history <imagen>`: el peso de cada capa.
- `docker build --target build …`: parar en una etapa para inspeccionarla.
- `docker run --rm <imagen> id`: con qué usuario corre.
