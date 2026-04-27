# Security Specification: InformMe

## Data Invariants
1.  **Identity:** A user can only create or update their own profile.
2.  **Immutability:** `createdAt` timestamps and `authorId`/`senderId` fields must not change after creation.
3.  **Relational Integrity:** A comment cannot exist without a valid parent post.
4.  **Privacy:** Messages are only readable by the sender or receiver (participants).
5.  **Validation:** No field can exceed reasonable size limits (e.g., content < 5000 chars).
6.  **Admin:** System-wide admins can manage any content (if needed, but not requested so I'll stick to owner-based).

## The "Dirty Dozen" Payloads (Rejected)
1.  Create post as another user (`authorId: "someone_else"`)
2.  Update post `authorId` to "hacker"
3.  Inject 2MB string into post `content`
4.  Read messages from a chat I'm not a participant of
5.  Delete a post I didn't create
6.  Update a user's `uid` field
7.  Create a comment with a non-existent `postId`
8.  Update `createdAt` on a post to 10 years ago
9.  Set `commentCount` to -999 manually
10. Spoof `updatedAt` to a future date
11. Add a field `isAdmin: true` to user profile
12. Fetch all users' emails without being authenticated

## Test Runner (firestore.rules.test.ts concept)
All above payloads will return `PERMISSION_DENIED`.
