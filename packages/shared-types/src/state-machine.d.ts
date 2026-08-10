export type PublicationStatusType = 'SCHEDULED' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'RETRY_WAIT' | 'UNKNOWN' | 'FAILED_PERMANENT' | 'CANCELLED';
export declare class PublicationStateMachine {
    static canTransition(current: PublicationStatusType, next: PublicationStatusType): boolean;
    static validateTransition(current: PublicationStatusType, next: PublicationStatusType): void;
}
//# sourceMappingURL=state-machine.d.ts.map