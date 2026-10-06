/**
 * Security Rule Test Suite for TeamHub
 * Validates the Dirty Dozen attack vectors against Firestore rules.
 */

export interface TestResult {
  name: string;
  expected: 'ALLOWED' | 'DENIED';
  passed: boolean;
}

export const dirtyDozenPayloads = [
  { id: 1, name: 'Self-Promotion Attack: normal user assigns role admin', target: 'users/user_123', action: 'update', data: { role: 'admin' }, expected: 'DENIED' },
  { id: 2, name: 'Ghost Admin Document: non-admin creates admins/user_123', target: 'admins/user_123', action: 'create', data: { userId: 'user_123' }, expected: 'DENIED' },
  { id: 3, name: 'Task Snooping: member gets another assignee task', target: 'tasks/task_456', action: 'get', expected: 'DENIED' },
  { id: 4, name: 'Task Hijack: member alters assigneeId of another user task', target: 'tasks/task_456', action: 'update', data: { assigneeId: 'attacker_id' }, expected: 'DENIED' },
  { id: 5, name: 'Client Snooping: member lists/gets clients owned by others', target: 'clients/client_789', action: 'get', expected: 'DENIED' },
  { id: 6, name: 'Client Note Injection: member writes note to non-owned client', target: 'clients/client_789/notes/note_1', action: 'create', data: { content: 'hack' }, expected: 'DENIED' },
  { id: 7, name: 'Client Takeover: non-owner changes ownerId', target: 'clients/client_789', action: 'update', data: { ownerId: 'attacker_id' }, expected: 'DENIED' },
  { id: 8, name: 'Oversized String Bomb: task title > 200 chars', target: 'tasks/task_new', action: 'create', data: { title: 'a'.repeat(300) }, expected: 'DENIED' },
  { id: 9, name: 'Invalid Document ID Poisoning', target: 'projects/../invalid', action: 'create', data: { name: 'exploit' }, expected: 'DENIED' },
  { id: 10, name: 'Unauthenticated Query Scraping: read /users', target: 'users', action: 'list', expected: 'DENIED' },
  { id: 11, name: 'Shadow Field Injection: extra fields in project', target: 'projects/proj_1', action: 'create', data: { __shadow: true }, expected: 'DENIED' },
  { id: 12, name: 'Member Deletion Attack: non-admin deletes user', target: 'users/victim_123', action: 'delete', expected: 'DENIED' }
];
