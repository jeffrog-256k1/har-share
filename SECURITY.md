# Security

Report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/jeffrog-256k1/har-share/security/advisories/new). Please include only fictional reproduction data. Do not put credentials or private data in public issues.

Input files are parsed in a Web Worker. Only a freshly constructed allowlisted HAR and numeric summary return to the UI. Original file names and raw parse errors are not displayed. No upload endpoint, telemetry, localStorage, sessionStorage, or automatic downloads. Buffers may remain in browser memory until reclaimed; this is not secure memory erasure. Output still contains request ordering, status codes, sizes, relative timings, and stable alias relationships. It is data minimization, not a guarantee of anonymization. Review every artifact before sharing.

The current 0.1 release line is supported on a best-effort basis. No response-time guarantee is offered.
