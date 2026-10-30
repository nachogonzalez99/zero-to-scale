# Access

Who can reach what, and how access is granted and removed. The decision is [ADR-0020](../adr/0020-identity-and-access.md).

## Principles

- The company owns every account: a company account (dedicated email, 2FA) is the owner of every service. It is used only for emergencies.
- Never a single owner: every service has at least two people or accounts that can administer it.
- People use their own accounts. Access goes to teams and roles, not individuals.
- Least privilege, per environment. Production secrets are seen by machines only.
- "Sign in with GitHub" wherever a service offers it.

## Systems

| System                  | Owner               | Admins | Members | How people sign in  | How to revoke                |
| ----------------------- | ------------------- | ------ | ------- | ------------------- | ---------------------------- |
| GitHub organization     | Company account     | CTO    | —       | Personal GitHub     | Remove from the organization |
| Bitwarden organization  | Company account     | CTO    | —       | Personal Bitwarden  | Remove from the organization |
| GHCR (images)           | GitHub organization | —      | —       | Via GitHub          | Via GitHub                   |
| Hosting (planned)       | Company account     | CTO    | —       | Sign in with GitHub | Remove from the team         |
| Observability (planned) | Company account     | CTO    | —       | Sign in with GitHub | Remove from the organization |

## Joiner

1. Personal accounts with 2FA: GitHub, Bitwarden.
2. Add to the GitHub organization, in the right team (a pull request in `dropr/infra/github` once teams are in code).
3. Add to the Bitwarden organization, only the collections the team needs.
4. Add to the other systems in the table, through their team.
5. Update this page.

## Mover

1. Add the new team's access.
2. Remove the old team's access, the same day.
3. Rotate secrets of the old team the person could read and the new team cannot.

## Leaver

1. Remove from the GitHub organization: this cuts the code and every "Sign in with GitHub" service.
2. Remove from the Bitwarden organization.
3. Go through every row of the table above.
4. Rotate every secret the person could read (the [inventory](secrets.md) says which).
5. Transfer anything they owned: tokens, scheduled jobs, alerts routed to them.
6. Update this page.

## Review

Every quarter, compare this page with reality in each system. Remove what nobody needs.
