import { Platform } from 'react-native';

/**
 * ANSI escape codes — work in Metro bundler terminal and Node.
 * Ignored silently in environments that don't support them.
 */
const ANSI = {
    blue:    '\x1b[34m',
    cyan:    '\x1b[36m',
    green:   '\x1b[32m',
    yellow:  '\x1b[33m',
    red:     '\x1b[31m',
    magenta: '\x1b[35m',
    gray:    '\x1b[90m',
    reset:   '\x1b[0m',
};

/** CSS styles for browser DevTools (web platform). */
const CSS = {
    blue:    'color:#4a9eff;font-weight:bold',
    cyan:    'color:#00bcd4;font-weight:bold',
    green:   'color:#4caf50;font-weight:bold',
    yellow:  'color:#ff9800;font-weight:bold',
    red:     'color:#f44336;font-weight:bold',
    magenta: 'color:#e040fb;font-weight:bold',
    gray:    'color:#9e9e9e',
};

const isWeb = Platform.OS === 'web';

function colorLog(fn, color, label, details) {
    if (isWeb) {
        details !== undefined
            ? fn(`%c${label}`, CSS[color] ?? '', details)
            : fn(`%c${label}`, CSS[color] ?? '');
    } else {
        details !== undefined
            ? fn(`${ANSI[color] ?? ''}${label}${ANSI.reset}`, details)
            : fn(`${ANSI[color] ?? ''}${label}${ANSI.reset}`);
    }
}

// ── Box formatter ─────────────────────────────────────────────────────────────

const BOX_W = 60;

function divider(label) {
    if (!label) return '─'.repeat(BOX_W);
    const inner = ` ${label} `;
    const fill = Math.max(4, BOX_W - inner.length);
    const l = Math.floor(fill / 2);
    return `${'─'.repeat(l)}${inner}${'─'.repeat(fill - l)}`;
}

function sectionBody(data, indent = '  ') {
    if (data == null) return `${indent}[none]`;
    if (typeof data === 'string') return `${indent}${data}`;
    const entries = Object.entries(data);
    if (entries.length === 0) return `${indent}[none]`;
    const maxK = Math.max(...entries.map(([k]) => k.length));
    return entries
        .map(([k, v]) => {
            const val = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `${indent}${k.padEnd(maxK)}  :  ${val}`;
        })
        .join('\n');
}

/**
 * Build a structured log box.
 * @param {string} title
 * @param {Array<{label: string, data: any}>} sections
 */
function buildBox(title, sections) {
    const lines = [divider(), ` ${title}`];
    for (const { label, data } of sections) {
        lines.push(divider(label));
        lines.push(sectionBody(data));
    }
    lines.push(divider());
    return lines.join('\n');
}

/**
 * Color-coded dev logger — only for use inside `__DEV__` / `API_DEBUG` guards.
 *
 * Simple (single-line):
 *   devLog.wsOpen   → green   (WS connection opened / ACK)
 *   devLog.wsWarn   → yellow  (non-fatal WS warning)
 *   devLog.wsError  → red     (WS error / unexpected close)
 *
 * Structured box (multi-line):
 *   devLog.apiRequest(title, sections)   → blue  box  (outgoing HTTP request)
 *   devLog.apiSuccess(title, sections)   → green box  (2xx HTTP response)
 *   devLog.apiError(title, sections)     → red   box  (HTTP error / network failure)
 *   devLog.wsBox(color, title, sections) → colored box (WS message / frame)
 */
export const devLog = {
    // kept for simple one-liner WS status messages
    wsOpen:  (label, details) => colorLog(console.log,  'green',   label, details),
    wsWarn:  (label, details) => colorLog(console.warn, 'yellow',  label, details),
    wsError: (label, details) => colorLog(console.warn, 'red',     label, details),

    // structured box logs
    apiRequest: (title, sections) => colorLog(console.log,  'blue',    buildBox(title, sections)),
    apiSuccess: (title, sections) => colorLog(console.log,  'green',   buildBox(title, sections)),
    apiError:   (title, sections) => colorLog(console.warn, 'red',     buildBox(title, sections)),
    wsBox: (color, title, sections) => colorLog(console.log, color, buildBox(title, sections)),
};
