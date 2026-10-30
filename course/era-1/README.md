# Era 1 · El fundador solo

Somos el CTO de Dropr, una startup de reparto a domicilio de una sola persona. La primera API calcula **presupuestos de envío**: cuánto cuesta un envío antes de confirmar el pedido. No tiene base de datos ni dependencias.

El objetivo de la era no es la API, que es pequeña a propósito, sino **todo lo que la rodea**: cómo se trabaja, cómo se protege la calidad, cómo se empaqueta, despliega, observa y opera. Simple, pero sin atajos que luego cueste deshacer.

## Temas

| #   | Tema                                                             | Pregunta                                     |
| --- | ---------------------------------------------------------------- | -------------------------------------------- |
| 01  | [La empresa y las eras](01-la-empresa-y-las-eras.md)             | ¿Qué estamos construyendo y por qué así?     |
| 02  | [Documentación](02-documentacion.md)                             | ¿Dónde se escribe cada cosa?                 |
| 03  | [Repositorio y workspace](03-repositorio-y-workspace.md)         | ¿Cómo se organiza el código?                 |
| 04  | [Guardrails de calidad](04-guardrails-de-calidad.md)             | ¿Qué impide que entre código malo?           |
| 05  | [Flujo de Git](05-flujo-de-git.md)                               | ¿Cómo llega un cambio a `main`?              |
| 06  | [Diseño de la API](06-diseno-de-la-api.md)                       | ¿Cómo se diseña y se documenta la API?       |
| 07  | [Testing](07-testing.md)                                         | ¿Cómo comprobamos que funciona?              |
| 08  | [Salud de dependencias](08-salud-de-dependencias.md)             | ¿Cómo vigilamos el código de terceros?       |
| 09  | [Integración continua](09-integracion-continua.md)               | ¿Qué se comprueba en cada cambio?            |
| 10  | [Empaquetado](10-empaquetado.md)                                 | ¿Cómo se convierte la API en un artefacto?   |
| 11  | [Preparación para producción](11-preparacion-para-produccion.md) | ¿Qué necesita una plataforma de un servicio? |
| 12  | [Publicación de la imagen](12-publicacion-de-la-imagen.md)       | ¿Cómo sale el artefacto del CI?              |
| 13  | [Entornos y entrega](13-entornos-y-entrega.md)                   | ¿Cómo llega un cambio a producción?          |
| 14  | [Infraestructura como código](14-infraestructura-como-codigo.md) | ¿Cómo se versiona lo que antes eran clics?   |
| 15  | [Secretos](15-secretos.md)                                       | ¿Dónde vive cada secreto?                    |
| 16  | [Identidad y accesos](16-identidad-y-accesos.md)                 | ¿Quién puede entrar dónde, y cómo se revoca? |
| 17  | [Hosting](17-hosting.md)                                         | ¿Dónde vive la API, sin pagar?               |
| 18  | [Lo que vendrá](18-lo-que-vendra.md)                             | ¿Qué no vemos todavía y hará falta?          |

## Hoja de ruta

| Paso | Qué                                                                         | Estado                                  |
| ---- | --------------------------------------------------------------------------- | --------------------------------------- |
| 0    | API de presupuestos, guardrails, CI, documentación                          | ✅                                      |
| 1    | Contenedor                                                                  | ✅                                      |
| 2    | Preparación para producción: configuración, probes, apagado ordenado        | ✅                                      |
| 3    | Publicación de la imagen en el CI                                           | ✅                                      |
| 3b   | GitHub como código, secretos, identidad y accesos                           | 🟡 Configuración lista, falta aplicarla |
| 4    | Staging: proveedor, deploy reutilizable, CD, smoke tests, rollback ensayado | ⏭️                                      |
| 5    | Producción: release-please, versiones, promoción, rollback                  |                                         |
| 6    | Observabilidad: logs, métricas, trazas, OpenTelemetry, Grafana              |                                         |
| 7    | Fiabilidad: línea base de rendimiento, SLIs, SLOs, error budget, alertas    |                                         |
| 8    | Operación: runbooks, guardia, incidentes, postmortems                       |                                         |
| 9    | Lab: tráfico realista e inyección de fallos                                 |                                         |
| 10   | Game days: el examen de salida de la era                                    |                                         |

## Criterio de salida de la era

1. Se inyecta un fallo sin avisar: detectarlo por una alerta, diagnosticarlo con el runbook y resolverlo en un tiempo objetivo.
2. Un despliegue defectuoso: detectarlo y hacer rollback antes de agotar el error budget.
3. Un consumidor reporta un error: encontrar la causa exacta.
4. Alguien nuevo despliega usando solo el README.
