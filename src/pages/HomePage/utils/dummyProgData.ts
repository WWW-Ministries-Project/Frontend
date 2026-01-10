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

export const progTopic = {
  id: 1,
  progId: 12,
  name: "Test Program",
  description: "test description",
  topic: [
    {
      id: 101,
      name: "Lesson Note: Product Discovery Fundamentals",
      order: 1,
      completed: false,
      description:
        "<p>This lesson introduces the fundamentals of product discovery and why it is critical to building successful products.</p>",
      learningUnit: {
        type: "lesson-note",
        data: {
          content: `
            <h3>Introduction</h3>
            <p>
              Product discovery is the process of understanding <strong>real user problems</strong>
              and validating potential solutions <em>before</em> investing significant time and
              resources into development. Many products fail not because teams lack technical
              skills, but because they build solutions that users do not truly need.
            </p>

            <p>
              By practicing effective product discovery, teams can reduce uncertainty, make
              evidence-based decisions, and ensure alignment between business goals and user needs.
              Discovery helps teams learn early, fail cheaply, and improve outcomes.
            </p>

            <h3>Why Product Discovery Matters</h3>
            <p>
              When discovery is skipped or rushed, assumptions often replace facts. This can lead
              to wasted development effort, poor user adoption, and missed business opportunities.
            </p>

            <ul>
              <li>Validates real user needs and pain points</li>
              <li>Reduces waste by avoiding unnecessary features</li>
              <li>Aligns stakeholders around evidence, not opinions</li>
              <li>Increases the likelihood of product success</li>
            </ul>

            <h3>Key Activities in Product Discovery</h3>
            <p>
              Product discovery is not a one-time phase. It is a continuous process that happens
              throughout the product lifecycle. Common discovery activities include:
            </p>

            <ol>
              <li>User interviews and field research</li>
              <li>Problem framing and assumption mapping</li>
              <li>Rapid prototyping and usability testing</li>
              <li>Experimentation and learning from feedback</li>
            </ol>

            <p>
              <strong>Key takeaway:</strong> The goal of product discovery is not to find perfect
              answers, but to learn quickly and make informed decisions with confidence.
            </p>
          `,
        },
      },
    },

    {
      id: 102,
      name: "Video: Product Discovery Overview",
      order: 2,
      completed: false,
      description:
        "<p>Watch a short video introducing the key ideas behind product discovery.</p>",
      learningUnit: {
        type: "video",
        data: {
          value: "https://www.youtube.com/embed/1wfeqDyMUx4",
        },
      },
    },

    {
      id: 103,
      name: "PDF: Product Discovery Guide",
      order: 3,
      completed: false,
      description:
        "<p>Download and read the detailed product discovery guide.</p>",
      learningUnit: {
        type: "pdf",
        data: {
          link: "https://example.com/product-discovery.pdf",
        },
      },
    },

    {
      id: 104,
      name: "PPT: Discovery Workshop Slides",
      order: 4,
      completed: false,
      description:
        "<p>Slides used during the product discovery workshop.</p>",
      learningUnit: {
        type: "ppt",
        data: {
          link: "https://example.com/discovery-workshop.pptx",
        },
      },
    },

    {
      id: 105,
      name: "Live Session: Discovery Q&A",
      order: 5,
      completed: false,
      description:
        "<p>Join the live session to ask questions and discuss product discovery concepts.</p>",
      learningUnit: {
        type: "live",
        data: {
          value: "https://zoom.us/j/1234567890",
        },
      },
    },

    {
      id: 106,
      name: "In-Person Discovery Workshop",
      order: 6,
      completed: false,
      description:
        "<p>Attend the in-person discovery workshop at the Accra campus.</p>",
      learningUnit: {
        type: "in-person",
        data: {
          value: "ICON Institute, Accra Campus",
        },
      },
    },

    {
      id: 107,
      name: "Assignment (MCQ): Product Discovery Quiz",
      order: 7,
      completed: false,
      description:
        "<p>Test your understanding of product discovery concepts.</p>",
      learningUnit: {
        type: "assignment",
        data: {
          questions: [
            {
              id: "q1",
              question: "What is the primary goal of product discovery?",
              correctOptionId: "q1o2",
              options: [
                { id: "q1o1", text: "To write production code early" },
                { id: "q1o2", text: "To validate user problems and solutions" },
                { id: "q1o3", text: "To deploy features faster" },
              ],
            },
            {
              id: "q2",
              question: "Which activity is most associated with product discovery?",
              correctOptionId: "q2o1",
              options: [
                { id: "q2o1", text: "User interviews" },
                { id: "q2o2", text: "Database optimization" },
                { id: "q2o3", text: "Infrastructure scaling" },
              ],
            },
            {
              id: "q3",
              question: "What is a key risk of skipping product discovery?",
              correctOptionId: "q3o3",
              options: [
                { id: "q3o1", text: "Slower development speed" },
                { id: "q3o2", text: "Higher server costs" },
                { id: "q3o3", text: "Building the wrong product" },
              ],
            },
            {
              id: "q4",
              question: "Who is primarily responsible for product discovery?",
              correctOptionId: "q4o2",
              options: [
                { id: "q4o1", text: "System Administrator" },
                { id: "q4o2", text: "Product Manager" },
                { id: "q4o3", text: "Network Engineer" },
              ],
            },
            {
              id: "q5",
              question: "What is a common output of product discovery?",
              correctOptionId: "q5o1",
              options: [
                { id: "q5o1", text: "Validated assumptions" },
                { id: "q5o2", text: "Final codebase" },
                { id: "q5o3", text: "Deployed infrastructure" },
              ],
            },
            {
              id: "q6",
              question: "Which technique helps validate ideas quickly?",
              correctOptionId: "q6o3",
              options: [
                { id: "q6o1", text: "Long-term roadmap planning" },
                { id: "q6o2", text: "Full system implementation" },
                { id: "q6o3", text: "Prototyping and testing" },
              ],
            },
            {
              id: "q7",
              question: "When should product discovery ideally occur?",
              correctOptionId: "q7o1",
              options: [
                { id: "q7o1", text: "Before development begins" },
                { id: "q7o2", text: "After product launch" },
                { id: "q7o3", text: "Only when issues arise" },
              ],
            },
          ],
        },
      },
    },

    {
      id: 108,
      name: "Assignment (Essay): Discovery Reflection",
      order: 8,
      completed: false,
      description:
        "<p>Reflect on the importance of product discovery.</p>",
      learningUnit: {
        type: "assignment-essay",
        data: {
          question: `
            <p>
              Explain how product discovery helps reduce waste and improve the likelihood of
              building successful products. Use examples where possible.
            </p>
            <p>
              Students are required to submit their answers by uploading a document.
            </p>
          `,
        },
      },
    },
  ],
};