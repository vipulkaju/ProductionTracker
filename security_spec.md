# Security Specification - Machine Production Tracker

## Data Invariants
1. A Machine must have an `ownerId`.
2. A ProductionRecord must belong to a valid Machine.
3. Users can only read and write machines they own.
4. Production logs can only be created for machines the user owns.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a machine with a different `ownerId`.
2. **Access Violation**: User A trying to read User B's machine.
3. **Ghost Update**: User B trying to update a machine they don't own.
4. **Invalid Status**: Setting machine status to a value not in the enum (e.g., "BROKEN").
5. **Orphan Log**: Creating a production log for a non-existent machine.
6. **Hijacked Log**: Creating a log for User B's machine while authenticated as User A.
7. **Negative Progress**: Setting machine progress to -10.
8. **Resource Exhaustion**: Sending a 1MB string as `machineHead`.
9. **Timestamp Manipulation**: Manually setting `updatedAt` to a future date instead of server timestamp.
10. **Immutability Breach**: Attempting to change the `ownerId` of an existing machine.
11. **State Injection**: Adding extra fields like `isAdmin: true` to a machine document.
12. **Anonymous Access**: Attempting to read machines without being signed in.

## Test Runner (Draft)

```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
// ... test cases for each payload
```
