# 02 · Documentación

> ¿Dónde se escribe cada cosa?

## Dos audiencias, dos sitios

| Qué                                                                                          | Dónde                                                            | Idioma  |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------- |
| Lo que la empresa necesita para trabajar: convenciones, decisiones, seguridad, cómo se opera | [`dropr/docs/`](../../dropr/docs/) y el `docs/` de cada servicio | Inglés  |
| Lo que explica el curso: conceptos, alternativas, por qué                                    | [`course/`](../)                                                 | Español |

La documentación de la empresa es la que tendría Dropr de verdad. La del curso explica cómo se llegó a ella.

## Documentación como código

La documentación de la empresa vive en el repo, en Markdown, junto a lo que describe ([ADR-0003](../../dropr/docs/adr/0003-documentation-as-code.md)):

- Se versiona con el código: cada cambio de comportamiento lleva su cambio de documentación **en el mismo PR**.
- Se revisa igual que el código.
- No se desfasa en silencio: si el código cambia y la doc no, se ve en el diff.

## Qué documentos hay

| Documento                             | Para qué                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `README.md` (raíz y de cada servicio) | Cómo empezar y el día a día. La prueba: alguien nuevo puede arrancar sin preguntar |
| `conventions.md`                      | Las reglas que todos siguen, cada una enlazada a su decisión                       |
| ADRs                                  | Por qué se decidió cada cosa                                                       |
| `tech-debt.md`                        | Atajos conscientes: por qué se aceptaron, qué riesgo tienen y cuándo revisarlos    |
| `security/`                           | Inventario de secretos y de accesos. Nunca los valores                             |
| `environments.md`, `ci-cd.md`         | Cómo funciona la entrega                                                           |
| `spec.md` de cada servicio            | Las reglas de negocio, con ejemplos que son tests                                  |

## ADRs (Architecture Decision Records)

Un ADR registra **una decisión**: contexto, decisión, alternativas consideradas y consecuencias.

- Se numeran (`NNNN-titulo.md`) y los números no se reutilizan.
- Una decisión que cambia **no se edita**: se escribe un ADR nuevo y el viejo se marca como _Superseded by_. El historial de por qué cambiamos de opinión es tan valioso como la decisión. Ejemplo real: ADR-0004 (contract-first) fue sustituido por ADR-0005 (code-first).
- Estados: _Proposed_, _Accepted_, _Superseded_.
- Las alternativas descartadas son la parte más útil: evitan volver a discutir lo mismo dentro de un año.

## Reglas

- Solo se crean ficheros cuando tienen contenido real.
- Nunca un secreto en la documentación: se documenta **dónde vive**, nunca su valor.
- Los ejemplos de la especificación son tests: si cambia una regla, cambian la spec y el test en el mismo PR.
