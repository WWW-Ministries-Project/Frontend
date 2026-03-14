# Department Membership Backend Contract

## Purpose

The membership module now exposes a `Departments and Ministries` flow in the frontend:

- `/home/membership/departments-and-ministries`
- `/home/membership/departments-and-ministries/:id`

The detail page currently falls back to filtering the member directory client-side. A dedicated backend endpoint should replace that for scale, pagination, and tighter authorization control.

## Recommended endpoint

- `GET /department/get-department`

## Query params

- `id` required
- `page` optional, default `1`
- `limit` optional, default `12`
- `name` optional, member search term

## Response shape

```json
{
  "data": {
    "id": 4,
    "name": "Ushering Ministry",
    "description": "Coordinates member seating and service flow.",
    "department_head": 18,
    "department_head_info": {
      "id": 18,
      "name": "Martha Owusu"
    },
    "member_count": 26,
    "members": [
      {
        "id": 91,
        "name": "Kofi Mensah",
        "email": "kofi@example.com",
        "member_id": "WWM-0021",
        "created_at": "2025-01-12T09:24:00.000Z",
        "is_active": true,
        "is_user": true,
        "department_id": 4,
        "department_name": "Ushering Ministry",
        "membership_type": "IN_HOUSE",
        "status": "MEMBER",
        "country_code": "+233",
        "primary_number": "241234567",
        "title": "Mr.",
        "photo": "https://..."
      }
    ]
  },
  "current_page": 1,
  "take": 12,
  "total": 26,
  "page_size": 12,
  "totalPages": 3
}
```

## Notes

- Reuse existing `view_departments` authorization for this endpoint.
- Member items should match the shape already returned by `user/list-users` so the existing member profile navigation can remain unchanged.
- If pagination metadata is returned at the top level, it will fit the frontend's current `ApiResponse<T>` wrapper without extra client changes.
