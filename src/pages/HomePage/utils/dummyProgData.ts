export const dummyProgData = [
  {
    "id": 11,
    "title": "Word Of Life",
    "description": "This program introduces new converts to the Word and basic discipleship practices.",
    "member_required": false,
    "leader_required": false,
    "ministry_required": false,
    "completed": false,
    "status": "in-progress",
    "createdAt": "2025-08-14T20:31:53.462Z",
    "updatedAt": "2025-11-21T09:12:00.000Z",
    "topics": [
      {
        "id": 101,
        "name": "Bible Introduction",
        "content": "Overview of the Bible, structure, and how to read it devotionally.",
        "programId": 11,
        "assignments": [
          {
            "id": 1001,
            "name": "Read Genesis 1-3 and write 1 page reflection",
            "file": "reflection_template.docx",
            "link": "https://example.com/assignments/genesis-reflection",
            "dueDate": "2025-09-01T23:59:00.000Z",
            "submittedDate": null,
            "status": "pending"
          }
        ],
        "materials": [
          {
            "id": 2001,
            "name": "Intro to the Bible (PDF)",
            "file": "intro_bible.pdf",
            "link": "https://example.com/materials/intro_bible.pdf",
            "size": 245760
          },
          {
            "id": 2002,
            "name": "How to Read the Bible (Video)",
            "file": "how_to_read.mp4",
            "link": "https://example.com/videos/how_to_read",
            "size": 104857600
          }
        ]
      },
      {
        "id": 102,
        "name": "Prayer Basics",
        "content": "Foundations of prayer: posture, models, and daily practice.",
        "programId": 11,
        "assignments": [
          {
            "id": 1002,
            "name": "7-day prayer log",
            "file": "prayer_log.xlsx",
            "link": "https://example.com/assignments/prayer-log",
            "dueDate": "2025-09-08T23:59:00.000Z",
            "submittedDate": "2025-09-07T18:34:00.000Z",
            "status": "submitted"
          }
        ],
        "materials": [
          {
            "id": 2003,
            "name": "Prayer Guide (PDF)",
            "file": "prayer_guide.pdf",
            "link": "https://example.com/materials/prayer_guide.pdf",
            "size": 51200
          }
        ]
      }
    ],
    "prerequisitePrograms": []
  },
  {
    "id": 12,
    "title": "Discipleship Foundations",
    "description": "A step-up program focused on spiritual disciplines, service, and small-group engagement.",
    "member_required": true,
    "leader_required": false,
    "ministry_required": false,
    "completed": false,
    "status": "in-progress",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "updatedAt": "2025-10-10T14:22:30.000Z",
    "topics": [
      {
        "id": 201,
        "name": "Spiritual Disciplines",
        "content": "Study and practice of fasting, solitude, study, and worship.",
        "programId": 12,
        "assignments": [
          {
            "id": 1003,
            "name": "Discipline Practice Plan",
            "file": "discipline_plan.docx",
            "link": "https://example.com/assignments/discipline-plan",
            "dueDate": "2025-07-15T23:59:00.000Z",
            "submittedDate": "2025-07-14T11:05:00.000Z",
            "status": "submitted"
          },
          {
            "id": 1004,
            "name": "Group reflection session (record minutes)",
            "file": null,
            "link": "https://example.com/assignments/group-reflection",
            "dueDate": "2025-07-20T18:00:00.000Z",
            "submittedDate": null,
            "status": "pending"
          }
        ],
        "materials": [
          {
            "id": 2004,
            "name": "Guide to Fasting (PDF)",
            "file": "fasting_guide.pdf",
            "link": "https://example.com/materials/fasting_guide.pdf",
            "size": 30720
          }
        ]
      },
      {
        "id": 202,
        "name": "Service & Outreach",
        "content": "Practical steps for serving in the local community and planning outreach events.",
        "programId": 12,
        "assignments": [
          {
            "id": 1005,
            "name": "Plan a 1-day outreach",
            "file": "outreach_plan.xlsx",
            "link": "https://example.com/assignments/outreach-plan",
            "dueDate": "2025-08-01T12:00:00.000Z",
            "submittedDate": null,
            "status": "pending"
          }
        ],
        "materials": [
          {
            "id": 2005,
            "name": "Outreach Checklist",
            "file": "outreach_checklist.pdf",
            "link": "https://example.com/materials/outreach_checklist.pdf",
            "size": 16384
          },
          {
            "id": 2006,
            "name": "Case Study: Local Outreach (Video)",
            "file": "outreach_case.mp4",
            "link": "https://example.com/videos/outreach_case",
            "size": 52428800
          }
        ]
      }
    ],
    "prerequisitePrograms": [11]
  },
  {
    "id": 13,
    "title": "Small Group Leadership",
    "description": "Training program for leaders who will run small groups and discipleship circles.",
    "member_required": true,
    "leader_required": true,
    "ministry_required": false,
    "completed": false,
    "status": "completed",
    "createdAt": "2025-03-20T08:45:00.000Z",
    "updatedAt": "2025-11-30T16:00:00.000Z",
    "topics": [
      {
        "id": 301,
        "name": "Leading a Small Group",
        "content": "Practical leadership skills: facilitation, conflict resolution, and group care.",
        "programId": 13,
        "assignments": [
          {
            "id": 1006,
            "name": "Facilitation practice (record 20-min session)",
            "file": null,
            "link": "https://example.com/assignments/facilitation-practice",
            "dueDate": "2025-04-10T20:00:00.000Z",
            "submittedDate": "2025-04-09T19:50:00.000Z",
            "status": "submitted"
          }
        ],
        "materials": [
          {
            "id": 2007,
            "name": "Leader Handbook (PDF)",
            "file": "leader_handbook.pdf",
            "link": "https://example.com/materials/leader_handbook.pdf",
            "size": 102400
          },
          {
            "id": 2008,
            "name": "Conflict Resolution Cheatsheet",
            "file": "conflict_cheatsheet.pdf",
            "link": "https://example.com/materials/conflict_cheatsheet.pdf",
            "size": 20480
          }
        ]
      },
      {
        "id": 302,
        "name": "Group Care & Pastoral Support",
        "content": "How to care for members, spot needs, and refer to pastoral teams.",
        "programId": 13,
        "assignments": [
          {
            "id": 1007,
            "name": "Create a care plan for a hypothetical member",
            "file": "care_plan_template.docx",
            "link": "https://example.com/assignments/care-plan",
            "dueDate": "2025-05-01T23:59:00.000Z",
            "submittedDate": null,
            "status": "pending"
          }
        ],
        "materials": [
          {
            "id": 2009,
            "name": "Care Plan Template",
            "file": "care_plan_template.docx",
            "link": "https://example.com/materials/care_plan_template.docx",
            "size": 40960
          }
        ]
      }
    ],
    "prerequisitePrograms": [11, 12]
  },
  {
    "id": 14,
    "title": "Youth Ministry Essentials",
    "description": "Program designed for volunteers and leaders working with youth — safeguarding, planning, and discipleship.",
    "member_required": false,
    "leader_required": false,
    "ministry_required": true,
    "completed": false,
    "status": "in-progress",
    "createdAt": "2025-10-01T12:00:00.000Z",
    "updatedAt": "2025-11-25T07:30:00.000Z",
    "topics": [
      {
        "id": 401,
        "name": "Safeguarding & Child Protection",
        "content": "Policies, reporting procedures, and best practices for safe ministry.",
        "programId": 14,
        "assignments": [
          {
            "id": 1008,
            "name": "Complete safeguarding quiz",
            "file": null,
            "link": "https://example.com/assignments/safeguarding-quiz",
            "dueDate": "2025-10-15T23:59:00.000Z",
            "submittedDate": "2025-10-14T10:22:00.000Z",
            "status": "submitted"
          }
        ],
        "materials": [
          {
            "id": 2010,
            "name": "Safeguarding Policy (PDF)",
            "file": "safeguarding_policy.pdf",
            "link": "https://example.com/materials/safeguarding_policy.pdf",
            "size": 61440
          }
        ]
      },
      {
        "id": 402,
        "name": "Creative Programming for Youth",
        "content": "Session planning, games, and faith-formation activities for teens.",
        "programId": 14,
        "assignments": [
          {
            "id": 1009,
            "name": "Draft a 4-week youth session plan",
            "file": "youth_sessions.xlsx",
            "link": "https://example.com/assignments/youth-plan",
            "dueDate": "2025-11-10T23:59:00.000Z",
            "submittedDate": null,
            "status": "pending"
          }
        ],
        "materials": [
          {
            "id": 2011,
            "name": "Session Ideas Pack (PDF)",
            "file": "session_ideas.pdf",
            "link": "https://example.com/materials/session_ideas.pdf",
            "size": 81920
          },
          {
            "id": 2012,
            "name": "Icebreakers Video",
            "file": "icebreakers.mp4",
            "link": "https://example.com/videos/icebreakers",
            "size": 31457280
          }
        ]
      }
    ],
    "prerequisitePrograms": [11]
  }
]