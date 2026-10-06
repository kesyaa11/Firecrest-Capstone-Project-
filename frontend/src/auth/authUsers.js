// Hardcoded accounts for login for page navigation
export const AUTH_USERS = [
  // Employee logins carry id, their database users.id, so pages link a login to its employee record by ID instead of name
  { id: 1, username: "manager", password: "password", role: "manager", name: "John Doe" },
  { username: "admin", password: "password", role: "admin", name: "Admin User" },
  { id: 3, username: "sd", password: "password", role: "sd", name: "Sarah Parker" },
  { id: 2, username: "dev", password: "password", role: "developer", name: "Michael Green" },
];