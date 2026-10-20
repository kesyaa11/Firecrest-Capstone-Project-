// PROTOTYPE DEMONSTRATION ACCOUNTS ONLY
//
// These accounts exist so the prototype can be demonstrated with each role's navigation.
// The usernames, names and passwords are fictional and are not real employee credentials.
//
// WARNING: this login is checked entirely in the browser. The passwords are shipped to every
// visitor inside the JavaScript bundle, and the backend API does not check who is calling it.
// It provides no backend security and must not be used for a production deployment.
// Replace it with the client's authentication provider before any real use.
export const AUTH_USERS = [
  // Employee logins carry id, their database users.id, so pages link a login to its employee record by ID instead of name
  {
    id: 1,
    username: "manager",
    password: "Manager-Demo-2026",
    role: "manager",
    name: "Terry Jeffords",
  },
  {
    username: "admin",
    password: "Admin-Demo-2026",
    role: "admin",
    name: "Admin User",
  },
  {
    id: 3,
    username: "sd",
    password: "ServiceDelivery-Demo-2026",
    role: "sd",
    name: "Sarah Parker",
  },
  {
    id: 2,
    username: "dev",
    password: "Developer-Demo-2026",
    role: "developer",
    name: "Benjamin Franklin",
  },
];
