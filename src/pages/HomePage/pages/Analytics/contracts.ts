import { AnalyticsModuleContract } from "./types";

const baseRequestShape =
  '{"date_range":{"from":"YYYY-MM-DD","to":"YYYY-MM-DD"},"timezone":"Africa/Accra","filters":{},"metrics":[],"group_by":"day|week|month","compare":{"enabled":true,"mode":"previous_period"}}';

const baseResponseShape =
  '{"module":"<module>","generated_at":"ISO8601","filters_applied":{},"metrics":{}}';

const endpoint = "/api/v1/analytics/{module}/aggregate";

export const membershipContract: AnalyticsModuleContract = {
  module: "membership",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "new_members_trend",
      title: "New Members Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type", "department", "country/state/city"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":120}],"total":120}',
      formula: "count(users where created_at is in bucket)",
    },
    {
      key: "active_inactive_split",
      title: "Active vs Inactive",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type", "department"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"ACTIVE","label":"Active","value":900,"percent":81.8}]}',
      formula: "group count(users) by is_active",
    },
    {
      key: "visitor_to_member_funnel",
      title: "Visitor to Member Funnel",
      payloadType: "funnel",
      sourceEndpoints: ["GET /visitor/visitors", "GET /user/list-users"],
      request: {
        filters: ["date_range", "country/state/city"],
      },
      responseShape:
        '{"type":"funnel","stages":[{"stage":"visitor","count":500},{"stage":"interested","count":220},{"stage":"member","count":120}]}',
      formula:
        "stages: visitors total -> visitors where membershipWish=true -> visitors where is_member=true",
    },
    {
      key: "soulwon_to_member_funnel",
      title: "Soulwon to Member Funnel",
      payloadType: "funnel",
      sourceEndpoints: ["GET /lifecenter/soulswon", "GET /user/list-users"],
      request: {
        filters: ["date_range", "lifeCenterId", "wonById"],
      },
      responseShape:
        '{"type":"funnel","stages":[{"stage":"soul_won","count":180},{"stage":"member","count":64}]}',
      formula:
        "stages: souls won total -> souls where memberId is not null",
    },
    {
      key: "program_participation_rate",
      title: "Program Participation Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /program/user-enrollment", "GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type", "department"],
      },
      responseShape:
        '{"type":"ratio","numerator":540,"denominator":1200,"value":45.0}',
      formula: "members with >=1 enrollment / total members",
    },
    {
      key: "ministry_involvement_rate",
      title: "Ministry Involvement Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /user/list-users"],
      request: {
        filters: ["date_range", "department"],
      },
      responseShape:
        '{"type":"ratio","numerator":430,"denominator":1200,"value":35.8}',
      formula:
        "count(users where is_user=true AND (position OR department_name OR department_positions)) / total users",
    },
    {
      key: "discipleship_completion_rate",
      title: "Discipleship Completion Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /program/user-enrollment"],
      request: {
        filters: ["date_range", "programId", "cohortId"],
      },
      responseShape:
        '{"type":"ratio","numerator":120,"denominator":200,"value":60.0}',
      formula: "completed enrollments / total enrollments",
    },
    {
      key: "age_band_distribution",
      title: "Age Band Distribution",
      payloadType: "distribution",
      sourceEndpoints: ["GET /user/list-users", "GET /user/stats-users"],
      request: {
        filters: ["date_range", "membership_type", "country/state/city"],
      },
      responseShape:
        '{"type":"distribution","bins":[{"key":"18-24","value":150,"percent":20.0}]}',
      formula: "bucket users by age (from date_of_birth)",
    },
    {
      key: "gender_distribution",
      title: "Gender Distribution",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /user/list-users", "GET /user/stats-users"],
      request: {
        filters: ["date_range", "membership_type"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"MALE","value":520,"percent":43.3},{"key":"FEMALE","value":680,"percent":56.7}]}',
      formula: "group count(users) by gender",
    },
    {
      key: "marital_status_distribution",
      title: "Marital Status Distribution",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"SINGLE","value":420,"percent":35.0}]}',
      formula: "group count(users) by marital_status",
    },
    {
      key: "location_distribution",
      title: "Location Distribution",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /user/list-users"],
      request: {
        filters: ["date_range", "country/state/city", "membership_type"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"Ghana|Greater Accra|Accra","value":310,"percent":25.8}]}',
      formula: "group count(users) by country/state_region/city",
    },
    {
      key: "family_connection_coverage",
      title: "Family Connection Coverage",
      payloadType: "ratio",
      sourceEndpoints: ["GET /user/get-user-family", "GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type"],
        notes: "V1 may require sampling if full member-family pull is expensive",
      },
      responseShape:
        '{"type":"ratio","numerator":640,"denominator":1200,"value":53.3}',
      formula: "members with >=1 family relation / total members",
    },
    {
      key: "emergency_contact_completeness",
      title: "Emergency Contact Completeness",
      payloadType: "score",
      sourceEndpoints: ["GET /user/get-user", "GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type"],
        notes: "Derived from required emergency fields",
      },
      responseShape: '{"type":"score","value":78.4,"grade":"B"}',
      formula:
        "avg completeness across [emergency_contact.name, relation, phone_number, country_code]",
    },
    {
      key: "profile_completeness_score",
      title: "Profile Completeness Score",
      payloadType: "score",
      sourceEndpoints: ["GET /user/list-users", "GET /user/get-user"],
      request: {
        filters: ["date_range", "membership_type", "department", "country/state/city"],
      },
      responseShape: '{"type":"score","value":84.1,"grade":"A-"}',
      formula:
        "avg completeness across required profile fields (name,email,phone,DOB,gender,marital_status,location,department)",
    },
    {
      key: "duplicate_risk",
      title: "Duplicate Risk",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /user/list-users"],
      request: {
        filters: ["membership_type", "department"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"EMAIL_COLLISION","value":12},{"key":"PHONE_COLLISION","value":8}]}',
      formula: "count duplicate email and duplicate phone clusters",
    },
    {
      key: "lifecycle_stage_distribution",
      title: "Lifecycle Stage Distribution",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /visitor/visitors", "GET /user/list-users"],
      request: {
        filters: ["date_range", "membership_type", "department"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"visitor","value":800},{"key":"new_member","value":150},{"key":"active_member","value":700},{"key":"leader_worker","value":120},{"key":"mature_member","value":300},{"key":"disengaged_member","value":90}]}',
      formula:
        "rule-based stage classification from visitor/member records at current snapshot",
    },
  ],
};

export const visitorsContract: AnalyticsModuleContract = {
  module: "visitors",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "new_visitors_trend",
      title: "New Visitors Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /visitor/visitors"],
      request: {
        filters: ["date_range", "eventId", "createdMonth", "visitMonth", "country/state/city"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":84}],"total":84}',
      formula: "count(visitors by createdAt bucket)",
    },
    {
      key: "repeat_visitor_rate",
      title: "Repeat Visitor Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /visitor/visitors"],
      request: {
        filters: ["date_range", "eventId", "country/state/city"],
      },
      responseShape: '{"type":"ratio","numerator":90,"denominator":320,"value":28.1}',
      formula: "count(visitors where visitCount > 1) / total visitors",
    },
    {
      key: "source_mix",
      title: "Source Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /visitor/visitors"],
      request: {
        filters: ["date_range", "eventId", "howHeard"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"Invite","value":120,"percent":37.5},{"key":"Social Media","value":80,"percent":25.0}]}',
      formula: "group count(visitors) by howHeard",
    },
    {
      key: "followup_status_mix",
      title: "Follow-up Status Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /visitor/followups", "GET /visitor/visitors"],
      request: {
        filters: ["date_range", "assignedTo", "status"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"pending","value":50,"percent":41.7},{"key":"completed","value":70,"percent":58.3}]}',
      formula: "group count(followups) by status",
    },
    {
      key: "visitor_to_member_conversion_rate",
      title: "Visitor to Member Conversion Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /visitor/visitors"],
      request: {
        filters: ["date_range", "eventId", "country/state/city"],
      },
      responseShape: '{"type":"ratio","numerator":62,"denominator":320,"value":19.4}',
      formula: "count(visitors where is_member=true) / total visitors",
    },
  ],
};

export const eventsContract: AnalyticsModuleContract = {
  module: "events",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "events_created_trend",
      title: "Events Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /event/list-events"],
      request: {
        filters: ["date_range", "event_type", "event_status"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":18}],"total":18}',
      formula: "count(events by start_date bucket)",
    },
    {
      key: "event_type_mix",
      title: "Event Type Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /event/list-events"],
      request: {
        filters: ["date_range", "event_type"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"SERVICE","value":24,"percent":40.0}]}',
      formula: "group count(events) by event_type",
    },
    {
      key: "upcoming_active_ended_split",
      title: "Upcoming/Active/Ended",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /event/list-events"],
      request: {
        filters: ["date_range", "event_type", "event_status"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"upcoming","value":14},{"key":"active","value":6},{"key":"ended","value":40}]}',
      formula: "status by date window against now",
    },
    {
      key: "registration_attendance_rate",
      title: "Registration to Attendance Rate",
      payloadType: "ratio",
      sourceEndpoints: [
        "GET /event/get-registered-event-members?event_id=<id>",
        "GET /event/church-attendance",
      ],
      request: {
        filters: ["date_range", "eventId"],
        notes: "V1 may be partial where registration endpoint is unavailable per event",
      },
      responseShape: '{"type":"ratio","numerator":120,"denominator":180,"value":66.7}',
      formula: "attendance_count / registration_count",
    },
    {
      key: "no_show_rate",
      title: "No-show Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /event/get-registered-event-members?event_id=<id>"],
      request: {
        filters: ["date_range", "eventId"],
      },
      responseShape: '{"type":"ratio","numerator":60,"denominator":180,"value":33.3}',
      formula: "(registrations - attendance) / registrations",
    },
  ],
};

export const attendanceContract: AnalyticsModuleContract = {
  module: "attendance",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "total_attendance_trend",
      title: "Total Attendance Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /event/church-attendance"],
      request: {
        filters: ["date_range", "eventId", "date", "membership_type"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"week","series":[{"period":"2026-W07","value":850}],"total":850}',
      formula:
        "sum(adultMale + adultFemale + childrenMale + childrenFemale + youthMale + youthFemale) per bucket",
    },
    {
      key: "adult_children_youth_mix",
      title: "Adults vs Children vs Youth",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /event/church-attendance"],
      request: {
        filters: ["date_range", "eventId", "group"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"adults","value":1200,"percent":54.5},{"key":"children","value":600,"percent":27.3},{"key":"youth","value":400,"percent":18.2}]}',
      formula: "aggregate subgroup totals and compute share",
    },
    {
      key: "male_female_mix",
      title: "Male vs Female Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /event/church-attendance"],
      request: {
        filters: ["date_range", "eventId", "group"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"male","value":1100,"percent":50.0},{"key":"female","value":1100,"percent":50.0}]}',
      formula: "sum male fields vs female fields across attendance records",
    },
    {
      key: "avg_attendance_per_event",
      title: "Average Attendance per Event",
      payloadType: "ratio",
      sourceEndpoints: ["GET /event/church-attendance"],
      request: {
        filters: ["date_range", "eventId"],
      },
      responseShape: '{"type":"ratio","numerator":2200,"denominator":14,"value":157.1}',
      formula: "total attendance / distinct event count",
    },
    {
      key: "visiting_pastors_trend",
      title: "Visiting Pastors Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /event/church-attendance"],
      request: {
        filters: ["date_range", "eventId", "date"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":12}],"total":12}',
      formula: "sum(visitingPastors) per bucket",
    },
  ],
};

export const appointmentsContract: AnalyticsModuleContract = {
  module: "appointments",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "bookings_trend",
      title: "Bookings Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /appointment/bookings"],
      request: {
        filters: ["date_range", "staffId", "requesterId", "status", "date"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"week","series":[{"period":"2026-W07","value":38}],"total":38}',
      formula: "count(bookings by appointment date bucket)",
    },
    {
      key: "status_mix",
      title: "Status Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /appointment/bookings"],
      request: {
        filters: ["date_range", "staffId", "requesterId", "status"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"PENDING","value":20},{"key":"CONFIRMED","value":40},{"key":"CANCELLED","value":10}]}',
      formula: "group count(bookings) by status",
    },
    {
      key: "confirmation_rate",
      title: "Confirmation Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /appointment/bookings"],
      request: {
        filters: ["date_range", "staffId", "requesterId"],
      },
      responseShape: '{"type":"ratio","numerator":40,"denominator":70,"value":57.1}',
      formula: "confirmed bookings / total bookings",
    },
    {
      key: "cancellation_rate",
      title: "Cancellation Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /appointment/bookings"],
      request: {
        filters: ["date_range", "staffId", "requesterId"],
      },
      responseShape: '{"type":"ratio","numerator":10,"denominator":70,"value":14.3}',
      formula: "cancelled bookings / total bookings",
    },
    {
      key: "slot_utilization_rate",
      title: "Slot Utilization Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /appointment/bookings", "GET /appointment/availability"],
      request: {
        filters: ["date_range", "staffId", "date"],
      },
      responseShape: '{"type":"ratio","numerator":66,"denominator":120,"value":55.0}',
      formula: "non-cancelled booked sessions / available sessions",
    },
  ],
};

export const assetsContract: AnalyticsModuleContract = {
  module: "assets",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "asset_count",
      title: "Asset Count",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /assets/list-assets"],
      request: {
        filters: ["date_range", "department", "status"],
      },
      responseShape: '{"type":"breakdown","items":[{"key":"ACTIVE","value":240}]}',
      formula: "count(assets) grouped by status",
    },
    {
      key: "asset_value_total",
      title: "Total Asset Value",
      payloadType: "score",
      sourceEndpoints: ["GET /assets/list-assets"],
      request: {
        filters: ["date_range", "department", "status"],
      },
      responseShape: '{"type":"score","value":1450000,"grade":"N/A"}',
      formula: "sum(price)",
    },
    {
      key: "asset_value_by_department",
      title: "Asset Value by Department",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /assets/list-assets"],
      request: {
        filters: ["date_range", "department"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"Media","value":350000,"percent":24.1}]}',
      formula: "sum(price) grouped by department_assigned",
    },
    {
      key: "asset_age_distribution",
      title: "Asset Age Distribution",
      payloadType: "distribution",
      sourceEndpoints: ["GET /assets/list-assets"],
      request: {
        filters: ["date_range", "department", "status"],
      },
      responseShape:
        '{"type":"distribution","bins":[{"key":"0-1y","value":50,"percent":20.8},{"key":"1-3y","value":110,"percent":45.8}]}',
      formula: "bucket assets by years since date_purchased",
    },
    {
      key: "procurement_trend",
      title: "Procurement Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /assets/list-assets"],
      request: {
        filters: ["date_range", "department"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":14}],"total":14}',
      formula: "count(assets by date_purchased bucket)",
    },
  ],
};

export const marketplaceContract: AnalyticsModuleContract = {
  module: "marketplace",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "gmv_trend",
      title: "GMV Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /orders/get-all-orders"],
      request: {
        filters: ["date_range", "market_id", "payment_status", "market_status"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":128000}],"total":128000}',
      formula: "sum(order line totals by created_at bucket)",
    },
    {
      key: "orders_trend",
      title: "Orders Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /orders/get-all-orders"],
      request: {
        filters: ["date_range", "market_id", "payment_status", "market_status"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":420}],"total":420}',
      formula: "count(distinct order_id) by created_at bucket",
    },
    {
      key: "aov",
      title: "Average Order Value",
      payloadType: "ratio",
      sourceEndpoints: ["GET /orders/get-all-orders"],
      request: {
        filters: ["date_range", "market_id", "payment_status"],
      },
      responseShape: '{"type":"ratio","numerator":128000,"denominator":420,"value":304.8}',
      formula: "GMV / total distinct orders",
    },
    {
      key: "payment_status_mix",
      title: "Payment Status Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /orders/get-all-orders"],
      request: {
        filters: ["date_range", "market_id", "payment_status"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"success","value":280,"percent":66.7},{"key":"pending","value":110,"percent":26.2}]}',
      formula: "group count(orders) by payment_status",
    },
    {
      key: "pending_reconciliation_exposure",
      title: "Pending Reconciliation Exposure",
      payloadType: "score",
      sourceEndpoints: ["GET /orders/get-all-orders"],
      request: {
        filters: ["date_range", "market_id"],
      },
      responseShape: '{"type":"score","value":28000,"grade":"N/A"}',
      formula: "sum(order totals where payment_status=pending)",
    },
  ],
};

export const schoolOfMinistryContract: AnalyticsModuleContract = {
  module: "school_of_ministry",
  endpoint,
  method: "POST",
  requestShape: baseRequestShape,
  responseShape: baseResponseShape,
  metrics: [
    {
      key: "programs_cohorts_classes_count",
      title: "Programs/Cohorts/Classes Count",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /program/programs", "GET /program/cohorts"],
      request: {
        filters: ["date_range", "programId", "cohortStatus"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"programs","value":25},{"key":"cohorts","value":52},{"key":"classes","value":140}]}',
      formula: "count programs, cohorts, and courses/classes",
    },
    {
      key: "enrollment_trend",
      title: "Enrollment Trend",
      payloadType: "timeseries",
      sourceEndpoints: ["GET /program/user-enrollment"],
      request: {
        filters: ["date_range", "programId", "cohortId"],
        groupBy: ["day", "week", "month"],
      },
      responseShape:
        '{"type":"timeseries","granularity":"month","series":[{"period":"2026-01","value":92}],"total":92}',
      formula: "count enrollments by enrolledAt bucket",
    },
    {
      key: "capacity_utilization",
      title: "Capacity Utilization",
      payloadType: "ratio",
      sourceEndpoints: ["GET /program/cohorts", "GET /program/cohort-courses?cohortId=<id>"],
      request: {
        filters: ["date_range", "programId", "cohortId"],
      },
      responseShape: '{"type":"ratio","numerator":540,"denominator":760,"value":71.1}',
      formula: "sum(course.enrolled) / sum(course.capacity)",
    },
    {
      key: "completion_rate",
      title: "Completion Rate",
      payloadType: "ratio",
      sourceEndpoints: ["GET /program/user-enrollment"],
      request: {
        filters: ["date_range", "programId", "cohortId"],
      },
      responseShape: '{"type":"ratio","numerator":220,"denominator":420,"value":52.4}',
      formula: "completed enrollments / total enrollments",
    },
    {
      key: "assignment_outcome_mix",
      title: "Assignment Outcome Mix",
      payloadType: "breakdown",
      sourceEndpoints: ["GET /program/assignment-results?topicId=<id>&cohortId=<id>&programId=<id>"],
      request: {
        filters: ["date_range", "programId", "cohortId", "topicId"],
      },
      responseShape:
        '{"type":"breakdown","items":[{"key":"PASS","value":150,"percent":62.5},{"key":"FAIL","value":60,"percent":25.0},{"key":"PENDING","value":30,"percent":12.5}]}',
      formula: "group assignment results by PASS/FAIL/PENDING",
    },
    {
      key: "instructor_load",
      title: "Instructor Load",
      payloadType: "distribution",
      sourceEndpoints: ["GET /program/cohorts", "GET /program/cohort-courses?cohortId=<id>"],
      request: {
        filters: ["date_range", "programId", "cohortId", "instructorId"],
      },
      responseShape:
        '{"type":"distribution","bins":[{"key":"Instructor A","value":120},{"key":"Instructor B","value":95}]}',
      formula: "sum enrolled students per instructor",
    },
  ],
};

export const moduleContracts: Record<string, AnalyticsModuleContract> = {
  membership: membershipContract,
  visitors: visitorsContract,
  events: eventsContract,
  attendance: attendanceContract,
  appointments: appointmentsContract,
  assets: assetsContract,
  marketplace: marketplaceContract,
  school_of_ministry: schoolOfMinistryContract,
};
