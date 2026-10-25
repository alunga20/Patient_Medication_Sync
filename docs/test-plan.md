# Initial test plan

## Authentication and authorization
- Signed-out visitor cannot read patient tables.
- Patient A cannot read Patient B's profile, prescriptions, schedules, dose events, appointments, or sync jobs.
- Client cannot insert prescriptions or schedules directly.
- Invalid/expired JWT is rejected by Edge Functions.
- API secrets never appear in browser bundles or logs.

## Synchronization
- Mock sync creates a job without importing real data.
- Repeating a sync does not create duplicate prescription records.
- Invalid provider payload is rejected.
- Timeout and rate-limit errors are recorded safely and can be retried.
- Sync conflict does not silently reactivate a discontinued prescription.

## Dose tracking
- Only a dose belonging to the authenticated patient can be updated.
- Duplicate taps do not create duplicate dose events.
- Snoozing does not change prescribed instructions.
- A missing response is not silently labelled as a confirmed missed dose.
- Cancelled/completed prescriptions do not create future reminders.

## Usability and accessibility
- Keyboard navigation works.
- Labels and status messages are screen-reader accessible.
- Mobile layout works at 320px width.
- Error, loading, empty, and offline states are understandable.
- All medication data in test environments is fictional.
- Changing a sample dose updates the dashboard, medication list, and session history consistently.
- Session history is cleared on reload and is not represented as a clinical record.
- The demo sync control indicates its pending state and remains clear that it contacts no pharmacy.

## Automated demo UI tests
- Run `npm test` to check dashboard summary values and sample schedule rendering.
- Verify reported-taken changes appear in the summary, medication list, and session activity history.
- Verify snoozing leaves sample medication instructions unchanged.
- Verify corrections are shown as “No response recorded,” not as a confirmed missed dose.
- Verify session activity starts empty and resets after the app is remounted.
- Verify demo sync shows a disabled pending state and an explicit no-pharmacy completion message.

These UI tests do not validate database RLS, Auth, the Edge Function, or production readiness. See [data-flow-security-review.md](./data-flow-security-review.md).
