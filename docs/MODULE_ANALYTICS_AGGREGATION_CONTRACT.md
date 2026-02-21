# Module Analytics Aggregation Contract (V1)

This frontend implementation follows the backend guide:
`/Users/akwaah/Documents/GitHub/Backend/docs/ANALYTICS_V1_CLIENT_IMPLEMENTATION_GUIDE.md`

## Base Contract

- Aggregation endpoint (client contract): `POST /api/v1/analytics/{module}/aggregate`
- Request shape:

```json
{
  "date_range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "timezone": "Africa/Accra",
  "filters": {},
  "metrics": [],
  "group_by": "day|week|month",
  "compare": { "enabled": true, "mode": "previous_period" }
}
```

- Response shape:

```json
{
  "module": "<module>",
  "generated_at": "ISO8601",
  "filters_applied": {},
  "metrics": {}
}
```

## Exact Metric Contracts

Exact metric-level contracts (source endpoints, filter mapping, formula, and response payload shape) are implemented in:

- `src/pages/HomePage/pages/Analytics/contracts.ts`

Modules covered:

1. membership
2. visitors
3. events
4. attendance
5. appointments
6. assets
7. marketplace
8. school_of_ministry

The UI renders these exact contracts in each module analytics page under **"API Aggregation Contract"**.
