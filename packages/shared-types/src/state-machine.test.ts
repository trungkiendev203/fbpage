import { PublicationStateMachine } from './state-machine';

describe('PublicationStateMachine Unit Tests', () => {
  it('should allow valid status transitions', () => {
    expect(PublicationStateMachine.canTransition('SCHEDULED', 'QUEUED')).toBe(true);
    expect(PublicationStateMachine.canTransition('QUEUED', 'PUBLISHING')).toBe(true);
    expect(PublicationStateMachine.canTransition('PUBLISHING', 'PUBLISHED')).toBe(true);
    expect(PublicationStateMachine.canTransition('PUBLISHING', 'UNKNOWN')).toBe(true);
    expect(PublicationStateMachine.canTransition('UNKNOWN', 'QUEUED')).toBe(true);
  });

  it('should reject invalid status transitions', () => {
    expect(PublicationStateMachine.canTransition('SCHEDULED', 'PUBLISHED')).toBe(false);
    expect(PublicationStateMachine.canTransition('PUBLISHED', 'QUEUED')).toBe(false);
    expect(PublicationStateMachine.canTransition('FAILED_PERMANENT', 'PUBLISHED')).toBe(false);
  });

  it('should throw error on invalid transition attempt', () => {
    expect(() => PublicationStateMachine.validateTransition('PUBLISHED', 'QUEUED')).toThrow();
  });
});
