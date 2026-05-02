"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithTimeout = fetchWithTimeout;
function fetchWithTimeout(url, init, timeoutMs) {
    return fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
    });
}
//# sourceMappingURL=http-resilience.js.map