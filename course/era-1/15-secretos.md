# 15 · Secretos

> ¿Dónde vive cada secreto, y quién puede verlo?

Decisión: [ADR-0019](../../dropr/docs/adr/0019-secrets-management.md). Inventario: [`security/secrets.md`](../../dropr/docs/security/secrets.md).

## Dos tipos de secretos

|              | Credenciales de personas                                                   | Secretos de máquinas                                                              |
| ------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Ejemplos     | Cuentas, 2FA, códigos de recuperación, el token con el que lanzas OpenTofu | El token de despliegue, la clave de telemetría, la contraseña de la base de datos |
| Quién lo usa | Una persona, a mano                                                        | Un proceso, sin nadie delante                                                     |

Mezclarlos es el error habitual: tokens de producción en el gestor de alguien, o contraseñas personales en el CI.

## La pregunta clave: ¿una persona necesita leerlo?

| Caso                                   | Ejemplo                          | Qué hacer                                                                                                                                                            |
| -------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solo lo usa una máquina                | Token con el que el CI despliega | Lo crea una persona, lo ve **una vez**, lo guarda donde se usa. Si se pierde, se **regenera**: guardar copias solo aumenta el riesgo                                 |
| Lo necesitan personas para desarrollar | Clave del sandbox de un tercero  | Cada desarrollador **la suya**, no la de staging                                                                                                                     |
| Conectarse desde local a staging       | Mirar datos para depurar         | Con **tus** credenciales, de solo lectura y temporales, nunca con las de la aplicación: queda registrado quién entró y se te puede quitar el acceso sin tocar la app |
| Producción                             | Lo mismo, como excepción         | _Break-glass_: aprobado, auditado, caduca solo                                                                                                                       |

## Dónde vive cada cosa en Dropr

| Qué                                                         | Dónde                                                                                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Secretos que solo usan máquinas                             | **GitHub Environment secrets** (`staging`, `production`). No se pueden leer una vez guardados: solo los workflows los reciben |
| Configuración que no es secreta                             | **En el repo**, como código                                                                                                   |
| Credenciales de personas y lo que una persona necesita leer | **Bitwarden**, en la organización                                                                                             |

Los secretos que necesita la API al ejecutarse siguen un camino:

```
GitHub Environment secret ──► job de deploy ──► plataforma (secreto del servicio) ──► variable de entorno
     (fuente de verdad)          (lo pasa en cada despliegue)
```

Rotar: nuevo valor en GitHub → redesplegar → revocar el viejo.

Dos herramientas en total. Lo que se pierde frente a un gestor de secretos (historial de valores, "ejecuta en local con los secretos de staging") es justo lo que no queremos hacer.

## Principios

1. **El mejor secreto es el que no existe**: credenciales efímeras (`GITHUB_TOKEN`, OIDC con la nube).
2. **Nunca en Git, en imágenes ni en logs**: secretlint, nada de `ARG` con secretos, errores 500 sin detalles.
3. **Mínimo privilegio y por entorno**.
4. **Los tokens de máquina se regeneran, no se recuperan**.
5. **Inventario**: qué existe, dónde, dueño, caducidad. Nunca el valor.
6. **Rotación** con caducidad, y siempre que alguien con acceso se va.

## Cómo evoluciona

| Nivel | Cuándo               | Personas                                    | Máquinas                                                                 |
| ----- | -------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| 1     | Ahora                | Gestor de contraseñas (Bitwarden)           | GitHub Environments                                                      |
| 2     | Equipo pequeño       | Gestor de equipo con colecciones por equipo | Gestor de secretos que sincroniza (Bitwarden Secrets Manager, Infisical) |
| 3     | Varios equipos, nube | SSO + gestor de equipo                      | AWS Secrets Manager + IAM + OIDC, o Vault/OpenBao                        |

Otra vía: **SOPS + age**, secretos cifrados dentro del repo. Versionado, pero cuesta gestionar quién puede descifrar.

## Con OpenTofu

Si OpenTofu gestiona un secreto, su valor queda **en claro en el estado**. Por eso el estado no va a Git. OpenTofu crea los Environments; el valor se pone aparte.
