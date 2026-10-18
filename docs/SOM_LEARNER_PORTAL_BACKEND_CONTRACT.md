# School of Ministry learner portal: backend contract

Member-facing endpoints for the learner area of the member portal (`/member/school-of-ministries/*`).
All routes are `GET`, need only a signed-in user (`protect`), and read **the caller's own enrollments only** —
the user id comes from the token, never from the query. Responses use the usual `{ message, data }` envelope.

Backend source: `src/modules/programs/lms/learnerService.ts` and `learnerController.ts`.
Frontend types: `LearnerEnrollment`, `LearnerSession`, `LearnerAnnouncement`, `LearnerSubmission` in
`src/utils/api/ministrySchool/interfaces.ts`.

| Endpoint | Query | Returns |
|---|---|---|
| `program/learner/overview` | — | `LearnerEnrollment[]` |
| `program/learner/sessions` | `from?` (ISO date) | `LearnerSession[]` |
| `program/learner/announcements` | — | `LearnerAnnouncement[]` |
| `program/learner/submission` | `topicId` | `LearnerSubmission` |

## `learner/overview`

One row per enrollment, newest first, with:

- `program`, `cohort`, `class` (incl. instructor name, format, location, meeting link)
- `progress` — `{ completed, total, percent }` over every topic in the program
- `nextTopic` — first topic not yet completed, or `null`
- `grading` — `{ mode, passMark, weights }`; `finalGrade`, `standing` and `attendance` come from the
  cohort gradebook row for this learner, so they always match what instructors see
- `assessments[]` — one per quiz/essay unit: `status` is the gradebook cell status
  (`graded | needs_grading | missing | open | excused | overridden`), `dueDate` already includes any
  extension, `feedback` is the latest submission's feedback (or the override note)

## `learner/sessions`

Sessions for the caller's active (not completed) classes: whole-cohort sessions plus their own class.
`attendance` is the caller's own mark (`PRESENT | LATE | ABSENT | EXCUSED`) or `null`.

## `learner/announcements`

`COHORT` announcements for the caller's cohorts and `CLASS` announcements for their class. Scheduled
announcements appear once `scheduled_for` has passed. `AT_RISK` announcements are not listed: their
recipients are resolved at send time and not stored.

## `learner/submission`

The caller's latest submission for one assessed unit (`404` if the topic is not a quiz/essay, `403` if
not enrolled). Includes `attemptsUsed`/`maxAttempts`, feedback, grader name, and:

- `quiz[]` for quizzes — `correct` is `null` until the learner passed or used every attempt, so answers
  are not leaked while retakes remain
- `rubric[]` (`label`, `level`, `factor`, `weight`) and `rubricScore` when graded with a rubric

## Related additive change

`program/program-completion-status` now also returns `cohortName`, `className`, `modules[]`
(`id`, `title`, `order_number`) and `moduleId` on each topic, so the course player can group units by module.
Existing fields are unchanged (safe for installed mobile builds).
