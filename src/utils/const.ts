export const relativePath = {
  root: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  home: {
    main: "/home",
    dashboard: "dashboard",
    members: {
      main: "members",
      mainNew: "/home/members",
      manage: "members/manage-member",
      details: "members/:id",
      info: "members/:id/info",
    },
    visitors: {
      main: "visitors",
      details: "visitors/visitor/:visitorId",
    },
    events: {
      main: "events",
      manage: "manage-event",
      view: "view-event",
    },
    assets: {
      main: "assets",
      manage: "assets/manage-asset",
    },
    users: {
      main: "users",
      details: "users/:id/info",
    },
    ministrySchool: {
      main: "ministry-school",
      program: "programs",
      cohort: "cohort/:id",
      class: "class/:id",
      student: "student/:id",
      certificate: "ministry-school/programs/cohort/class/student/certificate",
    },
    settings: {
      main: "settings",
      general: "settings",
      accessRights: "settings/access-rights",
      manageAccess: "settings/access-rights/manage-access",
    },
    lifeCenter:{
      main:"life-centers",
      detail:"life-center/:id"
    },
    fallback: "*",
  },
  out: {
    main: "/out",
    programs: {
      main: "/out/programs",
      details: "/out/programs/:name",
      apply: "/out/programs/:name/apply",
    },
    registerMember: "/out/register-member",
    registerEvent: "/out/events/register-event",
  },
  programs: {
    details: "/programs/:name",
    apply: "/programs/:name/apply",
  },
  registerMember: "/register-member",
  registerEvent: "/events/register-event",
};
