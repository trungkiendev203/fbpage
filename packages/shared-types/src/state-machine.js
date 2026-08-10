"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationStateMachine = void 0;
const VALID_TRANSITIONS = {
    SCHEDULED: ['QUEUED', 'CANCELLED'],
    QUEUED: ['PUBLISHING', 'CANCELLED'],
    PUBLISHING: ['PUBLISHED', 'UNKNOWN', 'RETRY_WAIT', 'FAILED_PERMANENT'],
    RETRY_WAIT: ['QUEUED', 'FAILED_PERMANENT', 'CANCELLED'],
    UNKNOWN: ['QUEUED', 'PUBLISHED', 'FAILED_PERMANENT', 'CANCELLED'], // Only via operator reconcile
    PUBLISHED: [],
    FAILED_PERMANENT: [],
    CANCELLED: [],
};
class PublicationStateMachine {
    static canTransition(current, next) {
        const allowed = VALID_TRANSITIONS[current] || [];
        return allowed.includes(next);
    }
    static validateTransition(current, next) {
        if (!this.canTransition(current, next)) {
            throw new Error(`Invalid state transition from ${current} to ${next}`);
        }
    }
}
exports.PublicationStateMachine = PublicationStateMachine;
//# sourceMappingURL=state-machine.js.map