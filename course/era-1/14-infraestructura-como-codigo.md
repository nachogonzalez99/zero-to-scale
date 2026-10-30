# 14 · Infraestructura como código

> ¿Cómo se versiona lo que antes eran clics?

## El problema

El ruleset, los checks obligatorios, los ajustes de merge… se configuraron a mano. Nadie sabe quién cambió qué, y si migras a otra cuenta hay que repetir cada clic de memoria. Con la infraestructura pasa lo mismo, a mayor escala.

## Conceptos

- **Declarativo**: describes **cómo quieres que esté**, no los pasos. La herramienta calcula la diferencia con la realidad.
- **Provider**: el plugin que sabe hablar con un servicio (GitHub, AWS, Grafana, Cloudflare…). El motor es el mismo para todos.
- **Estado** (`terraform.tfstate`): la memoria de la herramienta. Relaciona cada bloque del código con el objeto real.
- **`plan` → `apply`**: `plan` enseña qué haría, sin tocar nada; `apply` lo hace. **Nunca se aplica sin leer el plan.**
- **`import`**: adopta algo que ya existe, en lugar de crear un duplicado.
- **Deriva** (_drift_): alguien cambió algo a mano. El siguiente `plan` lo muestra.

## OpenTofu, Terraform o Pulumi

```
               ┌─ provider github   → repo, ruleset, environments
OpenTofu ──────┼─ provider aws      → ECS, red, balanceadores (más adelante)
(un motor,     ├─ provider grafana  → dashboards, alertas
 un lenguaje)  └─ …
```

|           | OpenTofu / Terraform                          | Pulumi                                       |
| --------- | --------------------------------------------- | -------------------------------------------- |
| Lenguaje  | HCL, declarativo                              | TypeScript, Python, Go…                      |
| Providers | El ecosistema más grande                      | Muchos son los de Terraform, adaptados       |
| Estado    | Lo gestionas tú; OpenTofu además lo cifra     | Pulumi Cloud o propio                        |
| Comunidad | El estándar del sector                        | Bastante menor                               |
| A favor   | El plan se lee fácil; poco "código ingenioso" | Mismo lenguaje que la API, tipos, tests      |
| En contra | Otro lenguaje (pequeño)                       | Tentación de lógica compleja; menos ejemplos |

**OpenTofu** es un fork de Terraform de 2023, cuando HashiCorp cambió la licencia a una que no es de código abierto; hoy lo mantiene la Linux Foundation. Mismo lenguaje y providers: lo aprendido vale para los dos.

Decisión: OpenTofu, una sola herramienta para todo ([ADR-0018](../../dropr/docs/adr/0018-github-settings-as-code.md)). GitHub es la primera infraestructura como código: gratis, pequeña y conocida, porque se montó a mano antes.

## Qué se gestiona

| ✅                                                                      | ⚠️ Con matices                                           | ❌                                   |
| ----------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------ |
| Ajustes del repo, ruleset, environments, alertas de Dependabot, equipos | **Secretos**: el recurso sí, el valor nunca en el código | El token con el que trabaja OpenTofu |
|                                                                         | **Estado**: dónde se guarda                              | Ajustes de la cuenta personal        |

## La seguridad del propio código

```hcl
resource "github_repository" "zero_to_scale" {
  # ...
  archive_on_destroy = true
  lifecycle {
    prevent_destroy = true
  }
}
```

Sin esto, borrar el bloque por error haría que el siguiente `apply` **borrase el repositorio**. `prevent_destroy` hace que OpenTofu se niegue, y `archive_on_destroy` lo archivaría como segunda red.

## El estado

- **Local y fuera de Git** al principio: si se pierde, se vuelve a importar. Lo importante es el código.
- No se commitea porque, cuando haya secretos gestionados, el estado los guarda **en claro**.
- `.terraform.lock.hcl` **sí** se commitea: es el lockfile de los providers, como `pnpm-lock.yaml`.
- Con más gente o con secretos: backend remoto, cifrado y con acceso restringido (`tofu init -migrate-state`).

## Cómo se hace

Instrucciones completas en [`dropr/infra/github/README.md`](../../dropr/infra/github/README.md). Resumen:

1. Token fine-grained **solo para esto** (Administration, Environments, Metadata), cargado en la terminal, nunca en un fichero.
2. `tofu init` y bloquear los providers para macOS y Linux.
3. `import` de lo existente y `tofu plan`. Cada `~ update` es una diferencia entre el código y GitHub: decide quién tiene razón.
4. `tofu apply`, después `tofu plan` → _No changes_. Se borra `imports.tf`.
5. Prueba la deriva: cambia algo a mano en GitHub y mira cómo lo detecta el plan.

Una alternativa al escribir el código desde cero: `tofu plan -generate-config-out=generated.tf` genera el código a partir de lo que existe, para limpiarlo después.

## Reglas

- Cada cambio por PR, como el código. `apply` después del merge, desde `main`.
- `No changes` es el estado normal. Nunca se cambia a mano lo que está en código.
- Lo que guarda datos o historial lleva `prevent_destroy`.
- Un token personal sirve para aplicar a mano; la automatización que deba sobrevivir a una persona usa una GitHub App.
