# Security Specification for TeamHub

## 1. Data Invariants
- **Multi-Role Access Control (Admin vs Member)**:
  - Users with admin status (`admins/{uid}` exists or `request.auth.token.email == 'agrinova.ponic@gmail.com'`) can read/write all projects, tasks, clients, team members, and notes.
  - Member users can only view and update tasks assigned to them (`assigneeId == request.auth.uid`) or created by them.
  - Member users can only view and update clients they own (`ownerId == request.auth.uid`).
- **Profile Integrity**: Users can create their own profile during registration. Only admins can modify user roles or promote members to admin.
- **Client Notes**: Notes attached to a client can only be written if the user is an admin or the owner of that client.
- **Project Governance**: Projects can be created and managed by admins or team members, and tasks must reference an existing project.

## 2. The "Dirty Dozen" Payloads
1. **Self-Promotion Attack**: A normal member tries to set their role to `"admin"` in `/users/{userId}` without admin authorization. (Expected: PERMISSION_DENIED)
2. **Ghost Admin Document**: A non-admin user attempts to create `/admins/{userId}` directly. (Expected: PERMISSION_DENIED)
3. **Task Snooping**: A member attempts to fetch a task where `assigneeId != request.auth.uid` and they are not an admin. (Expected: PERMISSION_DENIED)
4. **Task Hijack**: A member attempts to change the `assigneeId` or `projectId` of an existing task to steal it. (Expected: PERMISSION_DENIED)
5. **Client Snooping**: A member attempts to list or get clients where `ownerId != request.auth.uid`. (Expected: PERMISSION_DENIED)
6. **Client Note Injection**: A member attempts to write a note to a client owned by someone else. (Expected: PERMISSION_DENIED)
7. **Client Takeover**: A non-owner non-admin tries to change `ownerId` of an existing client. (Expected: PERMISSION_DENIED)
8. **Oversized String Bomb**: A user attempts to create a task title with a 100,000 character string to exhaust storage. (Expected: PERMISSION_DENIED)
9. **Invalid Document ID Poisoning**: A user tries to write to `/projects/bad..id%20slash` with characters violating `^[a-zA-Z0-9_\-]+$`. (Expected: PERMISSION_DENIED)
10. **Unauthenticated Query Scraping**: An unauthenticated request attempts to list `/users` or `/clients`. (Expected: PERMISSION_DENIED)
11. **Shadow Field Injection**: A user tries to inject unauthorized keys like `__isAdmin: true` into a project document. (Expected: PERMISSION_DENIED)
12. **Member Deletion Attack**: A non-admin member attempts to delete another user's document from `/users`. (Expected: PERMISSION_DENIED)
