# 11 · Preparación para producción

> ¿Qué necesita una plataforma de un servicio?

Tres piezas, en este orden porque cada una usa la anterior: **configuración → health checks → apagado ordenado**. Decisión: [ADR-0015](../../dropr/docs/adr/0015-health-probes-and-graceful-shutdown.md).

## 1. Configuración por entorno

- **La misma imagen en todos los entornos**; lo que cambia es la configuración, por variables de entorno (_Twelve-Factor App_). Una imagen por entorno significaría que lo probado en staging no es lo desplegado en producción.
- **`APP_ENV` frente a `NODE_ENV`**:
  - `NODE_ENV=production` dice a las **librerías** cómo comportarse. Vale `production` en staging y en producción.
  - `APP_ENV` dice **dónde** está: `local`, `staging` o `production`. Etiqueta logs y métricas.
- **Fallar al arrancar**: un valor inválido (`APP_ENV=prod`) para la API al arrancar, no a las 3 de la mañana.
- **Valores por defecto para local**: `pnpm dev` funciona sin configurar nada. El riesgo es olvidar `APP_ENV` en producción; lo cubrirá el smoke test.
- Solo `src/shared/config.ts` lee `process.env` (una regla de oxlint lo impone).

| Variable                    | Por defecto                                 |
| --------------------------- | ------------------------------------------- |
| `PORT`                      | `3000`                                      |
| `APP_ENV`                   | `local`                                     |
| `LOG_LEVEL`                 | `info`                                      |
| `APP_VERSION`, `APP_COMMIT` | `0.0.0-dev`, `unknown` (los pone la imagen) |
| `SHUTDOWN_DRAIN_MS`         | `0`                                         |
| `SHUTDOWN_TIMEOUT_MS`       | `8000`                                      |

## 2. Liveness y readiness

La plataforma hace **dos preguntas distintas**, y cada respuesta provoca una acción distinta:

|                    | Liveness: ¿estás vivo?                   | Readiness: ¿puedes recibir tráfico?                           |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------- |
| Si dice que no     | La plataforma **reinicia** el contenedor | La plataforma **deja de enviarle tráfico**                    |
| Cuándo dice que no | El proceso está colgado                  | Se está apagando; en la Era 2, si no llega a la base de datos |
| Qué comprueba      | **Nada externo**                         | Su estado y, más adelante, sus dependencias                   |

**El error clásico: comprobar la base de datos en liveness.** Si la base de datos cae, todos los contenedores fallan la liveness, se reinician todos, y reiniciar no arregla la base de datos. Una caída parcial se convierte en total.

Detalles:

- **Fuera de `/v1` y del contrato** (`hide: true`): son para la plataforma.
- **Sin un log por petición** (`logLevel: 'warn'`): se llaman cada pocos segundos.
- **Devuelven versión, commit y entorno**: el test de la imagen y el smoke test comprueban que corre lo esperado.
- El `503` de readiness **no es Problem Details**: no es un error, es un "no".
- No hay _startup probe_: la API arranca en milisegundos y solo escucha cuando todo está registrado.

## 3. Apagado ordenado

Al parar un contenedor, la plataforma envía SIGTERM y casi a la vez le dice al balanceador que deje de mandarle tráfico. Si la API cierra en el instante, las peticiones que el balanceador aún envía fallan.

```
SIGTERM
  ├─ 1. readiness → 503             "no me mandéis más"
  ├─ 2. drenaje (SHUTDOWN_DRAIN_MS)  sigo atendiendo mientras el balanceador se entera
  ├─ 3. app.close()                  no acepto conexiones nuevas, termino las que están en curso
  └─ 4. sale con código 0
         └─ si tarda más de SHUTDOWN_TIMEOUT_MS → log de error y sale con código 1
```

> **Regla: drenaje + tiempo máximo < grace period de la plataforma.** Así somos nosotros quienes cortamos, y queda en los logs, en lugar de un SIGKILL mudo.

- Drenaje `0` en local (no hay balanceador); se ajusta por plataforma en el paso 4.
- Tiempo máximo `8000` ms, por debajo de los 10 s de Docker.
- `Promise.race` entre el cierre y el temporizador, que va con `ref: false` para no mantener vivo el proceso.
- La lógica vive en `src/shared/shutdown.ts` para poder probarla; `server.ts` es solo pegamento.

## Cómo comprobarlo

```bash
# Terminal 1
APP_ENV=staging APP_VERSION=1.0.0 SHUTDOWN_DRAIN_MS=5000 pnpm start
# Terminal 2
curl -s localhost:3000/health/ready                              # 200, ok, staging
# Ctrl+C en la terminal 1, y rápido:
curl -s -w ' %{http_code}\n' localhost:3000/health/ready         # 503 shutting_down
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/v1/zones # 200: sigue atendiendo
```

## Tests

`health.http.test.ts` comprueba cada idea: liveness con lo que corre, ready hasta que empieza el apagado, "no listo no es muerto", valores por defecto, que durante el drenaje se sigue atendiendo, y que el tiempo máximo corta un cierre colgado.

## Pendiente

- Límites de CPU y memoria (con la plataforma).
- Comprobar dependencias en readiness (Era 2).
