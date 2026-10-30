# 18 · Lo que vendrá

> ¿Qué no vemos todavía y hará falta cuando todo esté montado?

## Métricas de entrega: DORA

| Métrica               | Qué mide                                       |
| --------------------- | ---------------------------------------------- |
| Lead time for changes | Del commit a producción                        |
| Deployment frequency  | Cada cuánto llega algo a producción            |
| Change failure rate   | Qué porcentaje de despliegues provoca un fallo |
| Time to restore       | Cuánto se tarda en recuperarse                 |

Lo valioso es **desglosar el lead time**: desarrollo → revisión → merge → staging → espera de release → producción. Con una persona, la espera de release puede ser de días sin que te des cuenta. Fuente de datos: los despliegues que registran los GitHub Environments.

## Salud del pipeline

- Duración de cada job (p50, p95): un CI lento empuja a agrupar cambios grandes.
- `main` en rojo: nadie puede desplegar.
- **Fallos del cron de los lunes: hoy nadie se enteraría.**
- Tests inestables: enseñan a ignorar el rojo.
- Caché de GitHub Actions (unos 10 GB por repo): cuando falla, todo se vuelve lento sin avisar.

## Seguridad continua

- Una CVE en una imagen **ya desplegada**: plazos por severidad y quién reconstruye y redespliega.
- Antigüedad de los PRs de Dependabot.
- **Firma y provenance**: que lo desplegado sea lo que construyó nuestro CI.
- **SBOM**: ante la próxima CVE grave, saber al momento qué imágenes están afectadas.
- Rotación de secretos.

## El artefacto con el tiempo

- Retención en GHCR, sin borrar candidatos a rollback.
- Tamaño de la imagen, tiempo de arranque, antigüedad de la base.

## Unir entrega y operación

- Marcas de despliegue en los dashboards.
- Métricas por versión: errores y latencia de la 1.4.0 frente a la 1.3.2.
- Rollback automático cuando un despliegue empeora el SLO.
- Política de error budget: si se agota, solo se despliegan arreglos.

## Compatibilidad

- Migraciones compatibles con rollback (_expand/contract_).
- Deriva de configuración entre staging y producción.
- Probes expuestos a internet.
- Deprecación de la API.

## Personas y proceso

- ¿Adónde van las alertas? CI en rojo, despliegue fallido, CVE nueva, SLO en riesgo.
- Runbooks también para el CI.
- Registro de quién desplegó qué.
- Documentación que se desfasa.

## Dónde encaja

| Cuándo | Qué                                                                                 |
| ------ | ----------------------------------------------------------------------------------- |
| Paso 4 | GitHub Environments (fuente de las DORA), probes públicos, configuración comparable |
| Paso 5 | Retención en GHCR, firma, provenance, SBOM                                          |
| Paso 6 | Marcas de despliegue, métricas por versión, dashboards DORA y del CI                |
| Paso 7 | Plazos para las CVEs, política de error budget                                      |
| Era 2  | Migraciones compatibles, rollback automático                                        |
