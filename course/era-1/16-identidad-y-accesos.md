# 16 · Identidad y accesos

> ¿Quién puede entrar dónde, y cómo se revoca cuando alguien se va?

Decisión: [ADR-0020](../../dropr/docs/adr/0020-identity-and-access.md). Inventario y checklists: [`security/access.md`](../../dropr/docs/security/access.md).

## Tres ideas

1. **Las cuentas de la empresa no pueden depender de una persona.** Si todo está a nombre de tu email personal y un día no estás, la empresa pierde el acceso a todo.
2. **Una identidad por persona, y todo cuelga de ella.** En una empresa madura hay un **proveedor de identidad** (Google Workspace, Microsoft Entra, Okta) y cada herramienta se usa con SSO. Cuando alguien se va, se desactiva **una** cuenta.
3. **El acceso se da a grupos, no a personas.** Quien entra en un equipo hereda sus permisos; si cambia de equipo, cambia de grupo.

A esto se le llama **Joiner-Mover-Leaver** (alta, cambio, baja), y se apoya en un **inventario de accesos**.

## El SSO cuesta dinero

El SSO casi siempre está en los planes de pago (el _SSO tax_). Sin pagar, lo más parecido:

| Pieza                  | Versión madura             | Dropr ahora                                                                 |
| ---------------------- | -------------------------- | --------------------------------------------------------------------------- |
| Identidad de empresa   | Dominio + Google Workspace | Un email dedicado como cuenta propietaria (un dominio cuesta unos 10 €/año) |
| Código                 | GitHub Enterprise con SSO  | Organización de GitHub (gratis) con equipos                                 |
| Entrar en herramientas | SSO                        | "Sign in with GitHub" donde exista                                          |
| Secretos               | Gestor con SSO             | Organización de Bitwarden (gratis)                                          |
| Altas y bajas          | Automáticas (SCIM)         | Inventario + checklist; equipos en OpenTofu                                 |

## Cómo queda

- **Cuenta de empresa**: propietaria de todo (GitHub, Bitwarden, hosting, observabilidad, facturación). No se usa en el día a día: es _break-glass_. 2FA y códigos de recuperación que no dependan de una sola persona.
- **Organización de GitHub**: el repo se transfiere a ella. **Dos owners** como mínimo. Más adelante, equipos gestionados con OpenTofu: dar acceso es un PR revisado.
- **Organización de Bitwarden**: colección compartida con las credenciales de break-glass. Cada persona entra con su propia cuenta.
- **Automatización**: un token personal muere con la cuenta de quien lo creó. Lo que deba sobrevivir a una persona usa una GitHub App o la cuenta de empresa.

## Cuando alguien se va

1. Fuera de la organización de GitHub: pierde el repo y todo lo que entra con GitHub.
2. Fuera de la organización de Bitwarden.
3. Recorrer el inventario para lo demás.
4. **Rotar todo secreto que podía ver**. Por eso los de producción solo los ven las máquinas: si nadie los ve, nadie se los lleva.

## Pasos pendientes

1. Crear el email de empresa con 2FA.
2. Crear la organización de GitHub y transferir el repo. **Antes** de aplicar OpenTofu, porque cambia el `owner`. Las imágenes pasan a `ghcr.io/<organización>/dropr-api`.
3. Organización de Bitwarden.
4. Aplicar OpenTofu contra la organización.
5. Crear el hosting y la observabilidad con la cuenta de empresa.
