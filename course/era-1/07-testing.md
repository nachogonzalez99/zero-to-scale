# 07 · Testing

> ¿Cómo comprobamos que funciona?

Cómo comprobamos que Dropr hace lo correcto. Las definiciones siguen a Vladimir Khorikov, _Unit Testing: Principles, Practices, and Patterns_.

## Tipos

| Tipo            | Definición                                                                     | Dependencias                                 |
| --------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| **Unitario**    | Verifica una unidad de comportamiento, es rápido y está aislado de otros tests | Ninguna fuera del proceso                    |
| **Integración** | Toca dependencias fuera del proceso                                            | Gestionadas reales; no gestionadas mockeadas |
| **End-to-end**  | Todas las dependencias reales, contra el sistema desplegado                    | Todas reales                                 |

- **Gestionada**: solo tu aplicación accede a ella (tu base de datos). Se usa real.
- **No gestionada**: la ven otros sistemas (pasarela de pago, email). Se mockea.
- **Escuela clásica**: el aislamiento es entre tests, no entre piezas de código. No se mockean colaboradores internos.

## Cómo se aplica en Dropr

| Fichero                   | Qué prueba                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `<módulo>.domain.test.ts` | Reglas de negocio llamando al dominio. La mayoría de tests                         |
| `<módulo>.http.test.ts`   | La API vía `app.inject`: camino feliz, validación, errores, formato de respuesta   |
| `errors.http.test.ts`     | El manejador central: rutas inexistentes, errores inesperados sin filtrar detalles |
| `health.http.test.ts`     | Liveness, readiness y el apagado: drenaje y tiempo máximo                          |
| `fixtures.ts`             | Lugares y hora fija compartidos                                                    |

- **Todo ejemplo y caso límite de la especificación es un test.** Si cambia una regla, cambian la spec y el test en el mismo PR.
- **La hora es fija en los tests**: el dominio la recibe como parámetro y la app acepta un reloj inyectado. Por eso el test de hora punta funciona igual a las 3 de la mañana que a mediodía.
- Hoy todos los tests son **unitarios** (no hay dependencias). Con la base de datos, los tests HTTP pasarán a ser de integración sin cambiar.

## Buenas prácticas

- Probar comportamiento, no implementación.
- El tiempo y lo aleatorio se inyectan.
- Deterministas y rápidos: los 64 tests tardan unos segundos.
- Los casos límite se prueban **a ambos lados**: 13:00 es hora punta y 12:59 no; 8.000 m se permite y 8.002 m no.
- Un test debe poder fallar: al cambiar la forma de comprobar los errores, se verificó que esperar el código equivocado hace fallar el test.

## Coverage

- `pnpm test` mide la cobertura en cada ejecución (Vitest con V8). Informe en `coverage/index.html`.
- **Umbrales**:
  - **100 %** en `src/modules`: toda la lógica de negocio, cada línea y cada rama.
  - **95 %** sentencias, funciones y líneas, y **90 %** ramas, en todo el servicio.
- Dos umbrales en lugar de uno porque, con uno global, el código de negocio podría perder cobertura mientras otro código lo compensa.
- Las ramas defensivas del código compartido (valores por defecto ante datos inesperados) no se fuerzan al 100 %: forzarlas sería probar el framework.
- **Si no se cumple un umbral, `pnpm test` falla** aunque todos los tests pasen, y con él el pre-push y el CI. El informe dice qué fichero y qué líneas faltan.
- **Es una pista, no un objetivo**: dice dónde no ha mirado ningún test, no si los tests comprueban algo.
- **Código difícil de probar es una señal de diseño**: la configuración leía `process.env` al importarse; se separó en `parseEnv` (puro, probado) y la lectura.

## Las capas, de principio a fin

Cada capa detecta lo que la anterior no puede ver, y lo más pronto posible.

| Capa                  | Qué ejecuta                                                       | Qué comprueba                                 | Dónde                                   |
| --------------------- | ----------------------------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| Unitarios             | Vitest + código                                                   | Reglas de negocio                             | Pre-push y CI                           |
| Integración (Era 2)   | Vitest + código + dependencias gestionadas reales en contenedores | Que el código habla bien con sus dependencias | CI                                      |
| **Test de la imagen** | La imagen construida                                              | Que el **empaquetado** está bien              | CI                                      |
| **Smoke test**        | La versión desplegada                                             | Que **el entorno** funciona                   | Tras cada despliegue                    |
| End-to-end            | El sistema desplegado completo                                    | Flujos completos                              | Entorno efímero o staging, más adelante |

### Test de la imagen frente a smoke test

Se parecen (los dos llaman a `/health`), pero responden preguntas distintas:

|          | Test de la imagen                                                                                                                      | Smoke test                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Pregunta | ¿El **artefacto** está bien hecho?                                                                                                     | ¿**Este entorno** funciona con esta versión?                                       |
| Contra   | La imagen recién construida, en el runner del CI                                                                                       | La URL real de staging o producción                                                |
| Detecta  | Dependencia en `devDependencies` por error, fichero fuera de `files`, permisos de `USER`, señales mal manejadas, metadatos mal pasados | Configuración del entorno, secretos que faltan, red, DNS, TLS, dependencias caídas |
| Si falla | La imagen no se publica                                                                                                                | Rollback                                                                           |

Todos los tests de Vitest pasan aunque la imagen esté rota: Vitest ejecuta el código desde el repo, con todos los `node_modules`, sin Docker. El test de la imagen cuesta segundos y lo detecta en el PR, antes de romper un entorno compartido. Se mantiene **mínimo**: nunca se convierte en tests de lógica.

### Con dependencias (Era 2)

Los tests de integración **no usan la imagen**: Vitest ejecuta nuestro código contra una base de datos real y vacía en un contenedor (Testcontainers o un servicio del CI). Los terceros se simulan (MSW, WireMock); nunca se usa el sandbox de un tercero desde el CI. Cuando `/health/ready` compruebe la base de datos, el test de la imagen dejará de exigir readiness o levantará la base de datos junto a la imagen.

## No funcionales

| Tipo                      | Pregunta                             | Cuándo                     |
| ------------------------- | ------------------------------------ | -------------------------- |
| Línea base de rendimiento | ¿Cuánto aguanta una instancia?       | Antes de desplegar         |
| Carga                     | ¿Aguanta el tráfico esperado?        | Tras desplegar, con el Lab |
| Estrés                    | ¿Dónde y cómo se rompe?              | Tras desplegar             |
| Picos                     | ¿Y si el tráfico se multiplica?      | Tras desplegar             |
| Resistencia (soak)        | ¿Se degrada con las horas?           | Tras desplegar             |
| Caos                      | ¿Cómo se comporta cuando algo falla? | Lab y game days            |

## Dónde se ejecutan

Los tests y los umbrales corren en el pre-push y en el CI, dentro de `pnpm check` (→ [Guardrails de calidad](04-guardrails-de-calidad.md)). → [ADR-0012](../../dropr/docs/adr/0012-testing-strategy.md).

## Pendiente

- Integración (Era 2), smoke tests (con el CD, paso 4), línea base de rendimiento (paso 7).
