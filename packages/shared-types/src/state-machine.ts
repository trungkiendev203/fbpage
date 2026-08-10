export type PublicationStatusType =
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'RETRY_WAIT'
  | 'UNKNOWN'
  | 'FAILED_PERMANENT'
  | 'CANCELLED';

const VALID_TRANSITIONS: Record<PublicationStatusType, PublicationStatusType[]> = {
  SCHEDULED: ['QUEUED', 'CANCELLED'],
  QUEUED: ['PUBLISHING', 'CANCELLED'],
  PUBLISHING: ['PUBLISHED', 'UNKNOWN', 'RETRY_WAIT', 'FAILED_PERMANENT'],
  RETRY_WAIT: ['QUEUED', 'FAILED_PERMANENT', 'CANCELLED'],
  UNKNOWN: ['QUEUED', 'PUBLISHED', 'FAILED_PERMANENT', 'CANCELLED'], // Only via operator reconcile
  PUBLISHED: [],
  FAILED_PERMANENT: [],
  CANCELLED: [],
};

export class PublicationStateMachine {
  public static canTransition(current: PublicationStatusType, next: PublicationStatusType): boolean {
    const allowed = VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static validateTransition(current: PublicationStatusType, next: PublicationStatusType): void {
    if (!this.canTransition(current, next)) {
      throw new Error(`Invalid state transition from ${current} to ${next}`);
    }
  }
}
