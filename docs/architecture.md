# Architecture and safety decisions

## Prototype boundaries
- Use fictional records only.
- The initial UI uses local sample data; it does not read or write clinical records.
- The `pharmacy-sync` function only writes a mock sync-job row. It does not call an external provider.
- SMS, push notifications, refill calculation, clinical decision support, and background scheduling are not implemented in this starter.

## Before adding a real pharmacy API
1. Obtain the provider's official API documentation, sandbox credentials, scopes, rate limits, and data dictionary.
2. Confirm a lawful basis and required approvals for data exchange.
3. Define a patient matching process that uses more than a phone number alone.
4. Validate payloads server-side and map provider statuses to an explicit internal model.
5. Use provider record IDs and idempotency keys to avoid duplicate imports.
6. Log metadata and failures without copying sensitive clinical payloads into logs.
7. Handle timeouts, retries, rate limits, partial failures, and reconciliation.
8. Test with synthetic records before any authorized pilot.

## Clinical safety rules
- Do not infer administration times from frequency abbreviations without confirmation.
- Do not generate reminders for cancelled, discontinued, or completed courses.
- A dose marked “taken” is patient-reported.
- A missing response is not proof that a dose was missed.
- Do not give automated missed-dose advice.
- Do not calculate a refill date unless the regimen, quantity, start date, and changes are sufficiently reliable; label estimates clearly.

## Production security checklist
- Test RLS using separate patient accounts and anonymous sessions.
- Use MFA for privileged staff and least-privilege staff roles.
- Keep service-role and provider secrets in server-side secret storage.
- Add rate limits, abuse protection, monitoring, alerting, backups, restore drills, and incident response.
- Establish retention/deletion policies, consent/notice workflows, and audit access.
- Conduct independent security testing and clinical review.
