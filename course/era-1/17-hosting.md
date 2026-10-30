# 17 · Hosting

> ¿Dónde vive la API, siempre encendida y sin pagar?

Decisión (propuesta): [ADR-0021](../../dropr/docs/adr/0021-hosting.md).

## Requisitos, por lo que ya tenemos montado

| Requisito                                          | Por qué                                                               |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| Desplegar una imagen ya construida por su etiqueta | Construir una vez                                                     |
| Siempre encendido                                  | Observabilidad y SLOs no tienen sentido con un servicio que se duerme |
| Health checks HTTP                                 | Usar `/health/live` y `/health/ready`                                 |
| SIGTERM y grace period configurable                | El apagado ordenado                                                   |
| Configuración como código y CLI o API              | Desplegar desde el CI                                                 |
| Región en Europa                                   | Los clientes están en España                                          |
| Gratis                                             | Dos entornos siempre encendidos                                       |

## El mercado en 2026

| Proveedor                       | ¿Siempre encendido gratis? | Nota                                                                                  |
| ------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Fly.io                          | ❌                         | Encaja técnicamente (unos 2 $/mes por entorno), sin capa gratis desde octubre de 2024 |
| Render                          | ❌                         | Se duerme a los 15 minutos sin tráfico                                                |
| Koyeb                           | ❌                         | Capa gratis cerrada a usuarios nuevos tras su compra en 2026                          |
| Cloud Run, Azure Container Apps | ❌                         | Escalan a cero                                                                        |
| Railway                         | Casi                       | 1 $/mes de crédito: no da para un mes encendido                                       |
| Oracle Cloud Always Free        | ✅ VM                      | Tú la administras, es ARM, y recupera instancias con poco uso                         |
| **Northflank (Sandbox)**        | ✅                         | 2 servicios siempre encendidos, Europa, probes, imágenes externas, API                |

**Northflank** encaja: dos servicios gratis, staging y producción. Límites: exactamente dos servicios (el Lab tendrá que vivir en otro sitio), un proyecto, sin SLA. Lección incluida: **depender de un proveedor sin SLA limita lo que puedes prometer**.

## Base de datos (Era 2)

| Opción                      | Nota                                                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Neon**                    | Hasta 100 proyectos gratis, 1 GB cada uno; uno por entorno, aislados. Se duerme a los 5 minutos: el arranque en frío se verá en la latencia. Sus _branches_ sirven para tests y previews |
| Base de datos de Northflank | Una sola: staging y producción compartirían servidor                                                                                                                                     |

## ¿Y AWS?

Desde julio de 2025, las cuentas nuevas tienen hasta **200 $ de créditos durante un máximo de 6 meses**; después la cuenta se suspende y, sin pasar a pago, se borra a los 90 días. Y la arquitectura objetivo (balanceador, Fargate, RDS, IPs públicas) cuesta del orden de 50 $/mes. AWS encaja como **misión con fecha** dentro de los créditos, no como hogar gratis.

## Cambiar de proveedor

| No cambia                          | Cambia                                |
| ---------------------------------- | ------------------------------------- |
| La imagen y el Dockerfile          | El paso de deploy del workflow        |
| GHCR y las etiquetas               | La configuración del proveedor        |
| Probes, apagado, configuración     | El token de despliegue                |
| El smoke test (solo cambia la URL) | Los valores de drenaje y grace period |

Lo que es **nuestro** está separado de lo que es **del proveedor**. Por eso la migración a AWS será pequeña.
