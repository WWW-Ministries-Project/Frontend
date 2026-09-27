# Members Exclusion Backend Contract

An access level can exclude specific members from the Members domain
(`permissions.Exclusions.Members = [userId, ...]`). A viewer whose access level
excludes a member can see that member in the directory by name only.

## `GET user/list-users`

Excluded members are **included** in the list (and in `total`), but their
contact and personal details are withheld:

```json
{
  "id": 12,
  "name": "Jane Doe",
  "member_id": "WWM-0012",
  "email": null,
  "primary_number": null,
  "country_code": null,
  "date_of_birth": null,
  "marital_status": null,
  "employment_status": null,
  "is_restricted": true
}
```

- Every row carries `is_restricted` (`false` for members the viewer can open).
- Other fields (name, member ID, photo, membership type, status, department)
  are returned as usual.
- `search` matches excluded members by `name` or `member_id` only, never by
  email or phone, so a search cannot confirm a hidden contact detail.

## Profile and mutation endpoints

`GET user/get-user`, `GET user/get-user-family`, update and delete return
`401` for an excluded member (unless the member is the viewer themself).

## Frontend behaviour

- `MemberCard` masks email and phone and disables "View profile", View and
  Edit when `is_restricted` is true or the viewer's own permissions exclude the
  member.
- `MemberExclusionGuard` wraps `members/:id` and `members/manage-member` and
  redirects to `/home/access-denied` for an excluded member, including when the
  URL is opened directly.
