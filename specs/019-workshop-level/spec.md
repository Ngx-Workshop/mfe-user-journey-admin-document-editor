# Workshop level

FR-001: Workshops have a whole-number level from 1 to 20, defaulting to 1.
FR-002: Administrator create/edit forms require level and persist the selection.
AC-001: Omitted/legacy level uses 1; boundaries 1/20 succeed; blank, fractional and out-of-range form values block submission.
AC-002: Saved level reloads on edit; updates omitting level preserve it.

Constitution Check: Preserve routes, identifiers, authorization and editor blocks; validate server payloads and use typed Material forms.

FR-003: Show “Level N” in the workshop detail toolbar and workshop cards, defaulting legacy missing levels to 1.
AC-003: The toolbar reflects current workshop level changes; catalog cards display workshop level.
