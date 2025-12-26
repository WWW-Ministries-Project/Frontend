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
        id: 101,
        title: "Introduction to Product Discovery",
        order: 1,
        description: "<p>Product discovery is the process of understanding user problems and validating solutions before building them.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Product discovery is the process of understanding user problems and validating solutions before building them. In this lesson, you'll learn why discovery is critical and how it reduces wasted effort.</p>"
          }
        }
      },
      {
        id: 102,
        title: "Product Discovery Overview (Video)",
        order: 2,
        description: "<p>Watch this short video introducing the key ideas behind product discovery.</p>",
        learningUnit: {
          type: "video",
          data: {
            value: "https://www.youtube.com/embed/1wfeqDyMUx4"
          }
        }
      },
      {
        id: 103,
        title: "Product Discovery Reading Material",
        order: 3,
        description: "<p>Download and read the product discovery guide.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://ds06gjz5fln1t.cloudfront.net/CMS-documents/approved/f1d32346-d7d6-497c-b898-7a5e9d8e09a6_fidus-inc-psa.pdf"
          }
        }
      },
      {
        id: 104,
        title: "Discovery Workshop Slides",
        order: 4,
        description: "<p>Slides used during the discovery workshop.</p>",
        learningUnit: {
          type: "ppt",
          data: {
            link: "https://example.com/discovery-workshop.pptx"
          }
        }
      },
      {
        id: 105,
        title: "External Resource: Lean Product Playbook",
        order: 5,
        description: "<p>An external reference for deeper learning.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Read more at <a href='https://leanproductplaybook.com/' target='_blank'>Lean Product Playbook</a>.</p>"
          }
        }
      },
      {
        id: 106,
        title: "Live Product Discovery Workshop",
        order: 6,
        description: "<p>Join the live online workshop session.</p>",
        learningUnit: {
          type: "live",
          data: {
            value: "https://zoom.us/j/1234567890"
          }
        }
      },
      {
        id: 107,
        title: "In-person Discovery Session",
        order: 7,
        description: "<p>Attend the in-person discovery session at the Accra campus.</p>",
        learningUnit: {
          type: "in-person",
          data: {
            value: "ICON Institute, Accra Campus"
          }
        }
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
        id: 201,
        title: "Spiritual Disciplines",
        order: 1,
        description: "<p>Study and practice of fasting, solitude, study, and worship.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>In this lesson, you'll explore the core spiritual disciplines including fasting, solitude, study, and worship. Learn how to incorporate these practices into your daily life for spiritual growth.</p>"
          }
        }
      },
      {
        id: 202,
        title: "Guide to Fasting (PDF)",
        order: 2,
        description: "<p>Download and study the fasting guide for deeper understanding.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://example.com/materials/fasting_guide.pdf"
          }
        }
      },
      {
        id: 203,
        title: "Service & Outreach",
        order: 3,
        description: "<p>Practical steps for serving in the local community and planning outreach events.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Learn how to effectively serve your local community and plan impactful outreach events. This lesson covers practical steps and best practices for community engagement.</p>"
          }
        }
      },
      {
        id: 204,
        title: "Outreach Checklist and Planning",
        order: 4,
        description: "<p>Download the outreach checklist to help plan your service activities.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://example.com/materials/outreach_checklist.pdf"
          }
        }
      },
      {
        id: 205,
        title: "Local Outreach Case Study (Video)",
        order: 5,
        description: "<p>Watch this video case study of successful local outreach initiatives.</p>",
        learningUnit: {
          type: "video",
          data: {
            value: "https://example.com/videos/outreach_case"
          }
        }
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
        id: 301,
        title: "Leading a Small Group",
        order: 1,
        description: "<p>Practical leadership skills: facilitation, conflict resolution, and group care.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Develop essential leadership skills for small group facilitation, including conflict resolution techniques and effective group management strategies.</p>"
          }
        }
      },
      {
        id: 302,
        title: "Leader Handbook (PDF)",
        order: 2,
        description: "<p>Download the comprehensive leader handbook for small group leadership.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://example.com/materials/leader_handbook.pdf"
          }
        }
      },
      {
        id: 303,
        title: "Conflict Resolution Workshop",
        order: 3,
        description: "<p>Learn conflict resolution strategies through this practical workshop.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Master conflict resolution techniques with this practical workshop. Download the cheatsheet for quick reference: <a href='https://example.com/materials/conflict_cheatsheet.pdf' target='_blank'>Conflict Resolution Cheatsheet</a>.</p>"
          }
        }
      },
      {
        id: 304,
        title: "Group Care & Pastoral Support",
        order: 4,
        description: "<p>How to care for members, spot needs, and refer to pastoral teams.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Learn how to effectively care for group members, identify their needs, and know when to refer them to pastoral support teams. Download the care plan template to get started.</p>"
          }
        }
      },
      {
        id: 305,
        title: "Care Plan Template",
        order: 5,
        description: "<p>Download the care plan template for creating member care strategies.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://example.com/materials/care_plan_template.docx"
          }
        }
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
        id: 401,
        title: "Safeguarding & Child Protection",
        order: 1,
        description: "<p>Policies, reporting procedures, and best practices for safe ministry.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Essential training on safeguarding policies, reporting procedures, and best practices for creating a safe environment in youth ministry.</p>"
          }
        }
      },
      {
        id: 402,
        title: "Safeguarding Policy Guide (PDF)",
        order: 2,
        description: "<p>Download the official safeguarding policy document.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://example.com/materials/safeguarding_policy.pdf"
          }
        }
      },
      {
        id: 403,
        title: "Creative Programming for Youth",
        order: 3,
        description: "<p>Session planning, games, and faith-formation activities for teens.</p>",
        learningUnit: {
          type: "lesson-note",
          data: {
            content: "<p>Learn how to create engaging session plans, incorporate games, and develop faith-formation activities specifically designed for teenagers.</p>"
          }
        }
      },
      {
        id: 404,
        title: "Youth Session Ideas Pack (PDF)",
        order: 4,
        description: "<p>Download the creative session ideas pack for youth ministry.</p>",
        learningUnit: {
          type: "pdf",
          data: {
            link: "https://example.com/materials/session_ideas.pdf"
          }
        }
      },
      {
        id: 405,
        title: "Icebreakers and Activities (Video)",
        order: 5,
        description: "<p>Watch demonstration videos of effective icebreakers and youth activities.</p>",
        learningUnit: {
          type: "video",
          data: {
            value: "https://example.com/videos/icebreakers"
          }
        }
      }
    ],
    "prerequisitePrograms": [11]
  }
]