# 04 · Guardrails de calidad

> ¿Qué impide que entre código malo?

## La idea

Un guardrail es una comprobación automática. La pregunta no es solo **qué** comprobar, sino **cuándo**: cuanto antes falle algo, más barato es arreglarlo.

```
editor ──► pre-commit ──► pre-push ──► CI (PR) ──► CI (main)
inmediato   segundos       ~15 s        minutos      después del merge
```

## Tipologías

| #   | Tipología         | Pregunta                                            | Herramienta                                                                       |
| --- | ----------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | Formato           | ¿Está escrito igual en todas partes?                | Prettier                                                                          |
| 2   | Lint              | ¿Hay patrones peligrosos o bugs evidentes?          | oxlint con reglas de tipos                                                        |
| 3   | Tipos             | ¿Encajan los tipos?                                 | `tsc`                                                                             |
| 4   | Tests y cobertura | ¿Hace lo que debe?                                  | Vitest + V8 (→ [Testing](07-testing.md))                                          |
| 5   | Código muerto     | ¿Sobra algo? Ficheros, exports, dependencias        | knip                                                                              |
| 6   | Secretos          | ¿Se cuela una clave?                                | secretlint                                                                        |
| 7   | Mensajes          | ¿El historial se entiende?                          | commitlint                                                                        |
| 8   | Contrato          | ¿El contrato está al día? ¿Rompe a los clientes?    | Redocly, oasdiff                                                                  |
| 9   | Dependencias      | ¿Hay vulnerabilidades?                              | `pnpm audit`, Dependabot (→ [Salud de dependencias](08-salud-de-dependencias.md)) |
| 10  | Imagen            | ¿El Dockerfile y la imagen son correctos y seguros? | hadolint, Trivy (→ [Publicación](12-publicacion-de-la-imagen.md))                 |

## La matriz: qué corre dónde

|                   | Editor        | Pre-commit              | Pre-push | CI                      |
| ----------------- | ------------- | ----------------------- | -------- | ----------------------- |
| Formato           | ✏️ Al guardar | ✏️ Arregla              | 🛑       | 🛑                      |
| Lint              | ⚠️ En vivo    | ✏️ Arregla lo que puede | 🛑       | 🛑                      |
| Tipos             | ⚠️ En vivo    | —                       | 🛑       | 🛑                      |
| Tests y cobertura | —             | —                       | 🛑       | 🛑                      |
| Código muerto     | —             | —                       | 🛑       | 🛑                      |
| Secretos          | —             | 🛑                      | 🛑       | 🛑                      |
| Mensajes          | —             | 🛑 (commit-msg)         | —        | 🛑 (título del PR)      |
| Contrato          | —             | —                       | 🛑       | 🛑 + cambios que rompen |
| Dependencias      | —             | —                       | —        | 🛑                      |
| Imagen            | —             | —                       | —        | 🛑                      |

✏️ arregla solo · ⚠️ avisa · 🛑 bloquea

## Herramientas y decisiones

- **oxlint + Prettier** ([ADR-0007](../../dropr/docs/adr/0007-oxlint-and-prettier.md)): ESLint con reglas de tipos no soportaba TypeScript 7. oxlint con `oxlint-tsgolint` sí, y es muchísimo más rápido. La configuración está en la raíz porque `typeAware` solo se admite ahí.
- **lefthook** ([ADR-0008](../../dropr/docs/adr/0008-git-hooks-with-lefthook.md)): un solo fichero para todos los hooks, frente a Husky + lint-staged.
- **Pre-commit solo sobre los ficheros del commit**, en orden: secretos → lint con `--fix` → formato. Los ficheros arreglados se vuelven a añadir al commit.
- **Pre-push con el check completo** (`pnpm check`) y sin push a `main`. El check completo en el pre-commit bloqueaba commits por ficheros a medias que no tenían nada que ver.
- **`pnpm check` es el mismo en local y en el CI**: si pasa en tu máquina, pasa en el CI.

## Comandos del día a día

| Comando       | Qué hace                                              |
| ------------- | ----------------------------------------------------- |
| `pnpm format` | Arregla lo que se puede arreglar solo y formatea todo |
| `pnpm check`  | Todo lo que comprueba el CI                           |

`pnpm format` se para en el primer error de oxlint que no se arregla solo (por el `&&`), y entonces Prettier no llega a ejecutarse. Arregla el error y repite.

## El editor

- `.vscode/settings.json`: formatear al guardar con Prettier y `source.fixAll.oxc` explícito.
- `.vscode/extensions.json`: Prettier, oxc, EditorConfig y TypeScript nativo.
- `.editorconfig`: lo básico (finales de línea, indentación) para cualquier editor.

## Lo que salió mal

- `options.typeAware` en un `.oxlintrc.json` que no estaba en la raíz: oxlint lo rechaza. Se movió a la raíz.
- `prettier.prettierPath` en el editor cargaba un fichero equivocado: se quitó.
- Faltaba instalar `oxlint-tsgolint`: sin él, las reglas de tipos no corren.
- El pre-push se "saltaba" con _no matching push files_: hay que forzar el job con `lefthook run pre-push --force` para probarlo.
- La extensión de oxc fallaba con `Operation not permitted`: VS Code apuntaba a una carpeta que ya no existía (se había reemplazado). Recargar la ventana lo arregla; si no, permisos de privacidad de macOS.
