# 01 · La empresa y las eras

> ¿Qué estamos construyendo y por qué así?

## La idea

No son proyectos sueltos: es **una misma empresa que evoluciona**. Dropr nace como la startup de una persona y crece hasta tener equipos, varios servicios y varias regiones. Nunca se empieza de cero: cada era **hereda** el código, la infraestructura y también los atajos de la anterior.

Lo interesante deja de ser cada tecnología por separado y pasa a ser **cómo las decisiones de hoy condicionan los problemas de mañana**: la deuda técnica, lo que nadie documentó, la persona que se fue con el conocimiento.

## Somos el CTO

El foco es técnico y de organización técnica: cómo se trabaja, cómo se decide, cómo se opera. El negocio existe como contexto (calcular presupuestos de envío) y como fuente de tráfico.

## Las eras

| Era | Empresa             | Lo nuevo                                                               |
| --- | ------------------- | ---------------------------------------------------------------------- |
| 1   | El fundador solo    | Una API sin estado, bien hecha, desplegada y observada                 |
| 2   | Primeros clientes   | Base de datos, migraciones, backups                                    |
| 3   | Primeros empleados  | Onboarding, guardias compartidas, terceros (pagos), resiliencia        |
| 4   | Ronda de inversión  | Los primeros servicios separados, eventos asíncronos                   |
| 5   | Scale-up            | Varios equipos, ownership, SLOs por servicio, conflictos entre equipos |
| 6   | Empresa establecida | Regulación, multi-región, sistemas heredados                           |

Cada era tiene la misma estructura: la situación del negocio, el cambio técnico, la capacidad operativa que hay que dominar, lo que se añade al **Lab** (el mundo simulado) y un **criterio de salida** en forma de _game day_.

## La deuda es parte del juego

Los atajos conscientes se registran en [`tech-debt.md`](../../dropr/docs/tech-debt.md). La deuda de una era puede convertirse en el incidente de la siguiente: por eso cada entrada dice **qué riesgo tiene** y **cuándo revisarla**.

## Lo que NO se hace en la Era 1

Microservicios, Kubernetes propio, multi-región, un stack de observabilidad gigante. Una de las lecciones de la era es resistir la tentación: **simple y bien observado le gana a sofisticado y opaco**.
