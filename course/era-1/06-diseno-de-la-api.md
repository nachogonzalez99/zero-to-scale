# 06 · Diseño de la API

> ¿Cómo se diseña y se documenta la API?

Cómo se diseña la API de Dropr: de dónde sale el contrato, qué convenciones sigue, cómo se comunican los errores y qué cuenta como romperla.

## Enfoques: ¿cuál es la fuente de verdad?

| Enfoque                                    | Fuente de verdad             | Se genera                           | Encaja con                                                   |
| ------------------------------------------ | ---------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| **1. Code-first**                          | Código                       | Contrato                            | Cuando validación, tipos y docs salen de los mismos esquemas |
| **2. Contract-first, solo tipos**          | OpenAPI                      | Tipos; validación con el contrato   | Un servicio, equipo pequeño                                  |
| **3. Contract-first, generación completa** | OpenAPI                      | Tipos, stubs, clientes, docs, mocks | Varios servicios y equipos                                   |
| **4. Schema-first con DSL**                | TypeSpec / Smithy / Protobuf | OpenAPI y todo lo demás             | Muchas APIs, equipos de plataforma                           |

Preguntas que todo enfoque debe responder: ¿fuente de verdad? ¿qué se genera? ¿se commitea lo generado? ¿cómo se detectan los cambios que rompen? ¿hay mock para consumidores?

## Decisión de Dropr: code-first con Zod

Cada ruta declara **esquemas Zod** para su entrada y para cada respuesta. Ese mismo esquema **valida** la petición, **tipa** el handler, **serializa** la respuesta (los campos que no están en el esquema no salen) y **documenta** la API.

**Historia**: empezamos con contract-first. El generador de tipos no soportaba TypeScript 7; pasamos a code-first. TypeSpec se descartó porque su generador de servidor para Node seguía en alpha. → [ADR-0004](../../dropr/docs/adr/0004-contract-first-api-design.md) (superseded), [ADR-0005](../../dropr/docs/adr/0005-code-first-api-with-zod-schemas.md). Fastify porque tiene esquemas por ruta de serie → [ADR-0006](../../dropr/docs/adr/0006-fastify-as-http-framework.md).

**Lo bueno de contract-first, recuperado**: el contrato se commitea (cada cambio de API aparece en el diff), se comprueba que está al día, y diseñar primero es norma del equipo.

## Convenciones

- Rutas **versionadas y en plural**: `/v1/quotes`.
- Cada ruta tiene `operationId` (camelCase), `tags` con su módulo y **una descripción por respuesta**.
- Los esquemas Zod se llaman `<Nombre>Schema`; su `.meta({ id })` es el nombre en el contrato. Los de entrada salen en el contrato con sufijo `Input` (`QuoteRequestInput`): es como la librería distingue entrada y salida.
- **La entrada rechaza campos desconocidos** (`z.strictObject`): una errata como `orderAmount` falla en vez de ignorarse en silencio.
- Importes en **céntimos enteros**, distancias en **metros enteros**, fechas de salida en **UTC**; las de entrada, con zona horaria obligatoria.
- `POST /v1/quotes` devuelve **200**, no 201: no se crea nada que se pueda recuperar.
- Código de negocio en **módulos** (`src/modules/<módulo>/`). Un módulo solo importa el fichero de dominio de otro, nunca sus rutas ni esquemas.
- **El dominio es puro**: recibe la hora como parámetro y lanza errores con código. Solo las rutas leen el reloj o generan identificadores.

## Errores: Problem Details (RFC 9457)

Todos los errores salen igual, desde un único manejador central, como `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "code": "ZONE_NOT_COVERED",
  "detail": "The dropoff location is outside the Madrid delivery zone."
}
```

- **`code`** es lo que usan los clientes para decidir qué hacer: estable, en `SCREAMING_SNAKE_CASE`. Nunca se parsea `detail`.
- **`type` siempre `about:blank`** y `title` es la frase del código HTTP. El RFC permite una URI por tipo de error, pero exigiría publicar una página por error; `code` da la misma información.
- **Validación** (`400 VALIDATION_ERROR`): lista todos los campos inválidos en `errors`, con rutas como `body.pickup.lat`.
- **Reglas de negocio**: el dominio lanza `DomainError` con un código; la capa HTTP decide el estado (`422` para reglas, `404` para recursos que no existen). El dominio no sabe nada de HTTP.
- **Errores inesperados** (`500 INTERNAL_ERROR`): mensaje genérico. El detalle va al log, nunca a la respuesta.

| Estado | `code`                                                             | Cuándo                           |
| ------ | ------------------------------------------------------------------ | -------------------------------- |
| 400    | `VALIDATION_ERROR`                                                 | La petición no cumple su esquema |
| 400    | `MALFORMED_REQUEST`                                                | El cuerpo no es JSON válido      |
| 404    | `NOT_FOUND` · `ZONE_NOT_FOUND`                                     | Ruta o zona inexistente          |
| 415    | `UNSUPPORTED_MEDIA_TYPE`                                           | El cuerpo no es JSON             |
| 422    | `ZONE_NOT_COVERED` · `DISTANCE_EXCEEDED` · `INVALID_DELIVERY_TIME` | Reglas de negocio                |
| 500    | `INTERNAL_ERROR`                                                   | Error inesperado                 |

→ [ADR-0013](../../dropr/docs/adr/0013-error-responses-as-problem-details.md).

## Cambios que rompen

Un cambio **rompe** si un consumidor que funcionaba deja de hacerlo sin cambiar nada por su parte: quitar un campo de respuesta o un endpoint, añadir un campo de entrada obligatorio, cambiar un tipo o restringir valores.

**No rompe**: añadir un campo opcional de entrada, un campo nuevo en la respuesta, un endpoint nuevo o una respuesta de error nueva.

Ejemplo real: añadir `timeZone` y las tarifas al esquema `Zone` no rompió nada (oasdiff lo confirmó). Cambiar las zonas de `centro` a `madrid` es un cambio de **datos**, no de contrato: oasdiff no lo ve, y con consumidores reales habría que avisarles.

Si un cambio rompe y es intencionado, se declara con `!` en el título del PR; si no, el CI lo bloquea (→ [Integración continua](09-integracion-continua.md)).

## La excepción: los health probes

`/health/live` y `/health/ready` no siguen estas reglas, a propósito: son para la plataforma, no para los clientes. Sin versión, fuera del contrato, sin API key, sin un log por petición, y su `503` no es un Problem sino la respuesta "no" a "¿estás listo?". → [Preparación para producción](11-preparacion-para-produccion.md).

## Pendiente

- **Versionado**: cuándo se crea `/v2` y cuánto convive con `/v1`.
- **Convenciones restantes**: paginación, idempotencia.
- **Autenticación**: aplicar la API key declarada, antes del primer cliente real (→ [deuda técnica](../../dropr/docs/tech-debt.md)).
- **`requestId`** en los errores, para correlacionar con los logs (paso 6, observabilidad).
