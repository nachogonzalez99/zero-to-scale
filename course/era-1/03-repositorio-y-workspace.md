# 03 · Repositorio y workspace

> ¿Cómo se organiza el código?

## Estructura

```
zero-to-scale/
├─ dropr/            la empresa
│  ├─ api/           el servicio
│  ├─ docs/          documentación de empresa
│  └─ infra/         infraestructura como código
├─ course/           este curso
└─ lab/              herramientas del curso (no son de Dropr)
```

Un solo repositorio (monorepo) mientras haya una persona y un servicio. Separar repos tiene sentido cuando hay equipos con ritmos distintos, no antes.

## El workspace de pnpm

La raíz es un **workspace de pnpm** ([ADR-0009](../../dropr/docs/adr/0009-repository-as-pnpm-workspace.md)). La regla para decidir dónde va cada cosa:

| Va en la raíz                                                                                      | Va en el paquete (`dropr/api`)                                                      |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Lo que aplica a **todos** los ficheros del repo                                                    | Lo específico de ese paquete                                                        |
| Versiones de Node y pnpm, editor, Prettier, oxlint, secretlint, knip, commitlint, hooks de Git, CI | `tsconfig.json`, `vitest.config.ts`, las dependencias del servicio, su `Dockerfile` |

¿Por qué no todo dentro de `dropr/api`? Porque cada herramienta nueva necesitaría un apaño (rutas en el editor, en los hooks…), y los ficheros fuera del paquete (docs, workflows, infraestructura) se quedarían sin proteger.

## Versiones fijadas

- **Node.js 26** en `.nvmrc` (`nvm use` lo lee) y exigido por `devEngines.runtime` con `onFail: error` ([ADR-0001](../../dropr/docs/adr/0001-typescript-on-nodejs-26.md)).
- **pnpm** con versión **exacta** en `devEngines.packageManager` ([ADR-0002](../../dropr/docs/adr/0002-pnpm-pinned-version-and-build-script-allowlist.md)). pnpm descarga y usa esa versión solo. Corepack ya no hace falta y Node 25+ no lo incluye.
- `npm run …` falla con `EBADDEVENGINES`: es lo esperado. El proyecto se usa con pnpm.

## TypeScript sin compilar

TypeScript 7 en modo estricto, **ejecutado directamente por Node** (type stripping):

- Solo sintaxis que se puede borrar (`erasableSyntaxOnly`): nada de `enum`, `namespace` ni _parameter properties_ en constructores.
- Imports con extensión `.ts` (`allowImportingTsExtensions`).
- `tsc` solo comprueba tipos; no genera nada. Lo que se ejecuta en producción es exactamente lo que ejecutan los tests.

## Scripts de instalación bloqueados

Las dependencias pueden ejecutar scripts al instalarse, y es una vía clásica de ataque. pnpm los bloquea salvo los aprobados explícitamente en `pnpm-workspace.yaml` (`allowBuilds`). Hoy solo lefthook.

## El lockfile

`pnpm-lock.yaml` se commitea siempre y nunca se edita a mano. Garantiza que todos (tú, el CI, la imagen) instalan exactamente lo mismo. En el CI se instala con el lockfile congelado: si no cuadra con los `package.json`, falla.

## Lo que salió mal

- `packageManager` con `^`: pnpm exige versión exacta.
- `.npmrc` con `engine-strict`: pnpm 11 lo ignora. La solución fue `devEngines`.
- El schema remoto de knip daba "untrusted": los ficheros de configuración JSON apuntan al schema de `node_modules`, nunca a una URL.
