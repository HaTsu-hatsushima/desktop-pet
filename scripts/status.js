const fs = require('fs');
const path = require('path');
const statusPath = path.join(__dirname, '..', 'status.txt');
const queuePath = path.join(__dirname, '..', 'status-queue.json');
const maxStatusLength = 120;

const presets = Object.freeze({
  approval: { text: '\u627F\u8A8D\u5F85\u3061\u3063\u3061\u3083\u3093\u3002\u96E2\u5E2D\u4E2D\u3067\u3082\u5927\u4E08\u592B\u3001\u623B\u3063\u305F\u3089\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u306D\u266A', kind: 'approval', scope: 'general', durationMs: 60 * 60 * 1000 },
  approvalPet: { text: '\u0044\u0065\u0073\u006B\u0074\u006F\u0070\u0020\u0050\u0065\u0074\uFF1A\u627F\u8A8D\u5F85\u3061\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u306D\u266A', kind: 'approval', scope: 'desktopPet', durationMs: 60 * 60 * 1000 },
  approvalKakeibo: { text: '\u5BB6\u8A08\u7C3F\u81EA\u52D5\u5316\uFF1A\u627F\u8A8D\u5F85\u3061\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u306D\u266A', kind: 'approval', scope: 'kakeibo', durationMs: 60 * 60 * 1000 },
  approvalNews: { text: '\u004E\u0065\u0077\u0073\u30A2\u30D7\u30EA\uFF1A\u627F\u8A8D\u5F85\u3061\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u306D\u266A', kind: 'approval', scope: 'news', durationMs: 60 * 60 * 1000 },
  approvalTaicho: { text: '\u4F53\u8ABF\u7BA1\u7406\u5E33 \u4E00\u90E8\u81EA\u52D5\u5316\uFF1A\u627F\u8A8D\u5F85\u3061\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u306D\u266A', kind: 'approval', scope: 'taicho', durationMs: 60 * 60 * 1000 },
  error: { text: '\u30A8\u30E9\u30FC\u304C\u51FA\u305F\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u753B\u9762\u3092\u78BA\u8A8D\u3057\u3066\u306D\u3002', kind: 'error', scope: 'general', durationMs: 60 * 60 * 1000 },
  errorPet: { text: '\u0044\u0065\u0073\u006B\u0074\u006F\u0070\u0020\u0050\u0065\u0074\uFF1A\u30A8\u30E9\u30FC\u304C\u51FA\u305F\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u78BA\u8A8D\u3092\u304A\u9858\u3044\u306D\u3002', kind: 'error', scope: 'desktopPet', durationMs: 60 * 60 * 1000 },
  errorKakeibo: { text: '\u5BB6\u8A08\u7C3F\u81EA\u52D5\u5316\uFF1A\u30A8\u30E9\u30FC\u304C\u51FA\u305F\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u78BA\u8A8D\u3092\u304A\u9858\u3044\u306D\u3002', kind: 'error', scope: 'kakeibo', durationMs: 60 * 60 * 1000 },
  errorNews: { text: '\u004E\u0065\u0077\u0073\u30A2\u30D7\u30EA\uFF1A\u30A8\u30E9\u30FC\u304C\u51FA\u305F\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u78BA\u8A8D\u3092\u304A\u9858\u3044\u306D\u3002', kind: 'error', scope: 'news', durationMs: 60 * 60 * 1000 },
  errorTaicho: { text: '\u4F53\u8ABF\u7BA1\u7406\u5E33 \u4E00\u90E8\u81EA\u52D5\u5316\uFF1A\u30A8\u30E9\u30FC\u304C\u51FA\u305F\u3063\u3061\u3083\u3093\u3002\u623B\u3063\u305F\u3089\u78BA\u8A8D\u3092\u304A\u9858\u3044\u306D\u3002', kind: 'error', scope: 'taicho', durationMs: 60 * 60 * 1000 },
  waiting: { text: '\u3072\u3068\u6BB5\u843D\u3057\u305F\u3088\u266A\u6B21\u306E\u6307\u793A\u5F85\u3061\u3063\u3061\u3083\u3093\u3002', kind: 'waiting', scope: 'general', durationMs: 60 * 60 * 1000 },
  waitingPet: { text: '\u0044\u0065\u0073\u006B\u0074\u006F\u0070\u0020\u0050\u0065\u0074\uFF1A\u3072\u3068\u6BB5\u843D\u3057\u305F\u3088\u266A\u6B21\u306E\u6307\u793A\u5F85\u3061\u3063\u3061\u3083\u3093\u3002', kind: 'waiting', scope: 'desktopPet', durationMs: 60 * 60 * 1000 },
  waitingKakeibo: { text: '\u5BB6\u8A08\u7C3F\u81EA\u52D5\u5316\uFF1A\u3072\u3068\u6BB5\u843D\u3057\u305F\u3088\u266A\u6B21\u306E\u6307\u793A\u5F85\u3061\u3063\u3061\u3083\u3093\u3002', kind: 'waiting', scope: 'kakeibo', durationMs: 60 * 60 * 1000 },
  waitingNews: { text: '\u004E\u0065\u0077\u0073\u30A2\u30D7\u30EA\uFF1A\u3072\u3068\u6BB5\u843D\u3057\u305F\u3088\u266A\u6B21\u306E\u6307\u793A\u5F85\u3061\u3063\u3061\u3083\u3093\u3002', kind: 'waiting', scope: 'news', durationMs: 60 * 60 * 1000 },
  waitingTaicho: { text: '\u4F53\u8ABF\u7BA1\u7406\u5E33 \u4E00\u90E8\u81EA\u52D5\u5316\uFF1A\u3072\u3068\u6BB5\u843D\u3057\u305F\u3088\u266A\u6B21\u306E\u6307\u793A\u5F85\u3061\u3063\u3061\u3083\u3093\u3002', kind: 'waiting', scope: 'taicho', durationMs: 60 * 60 * 1000 },
  working: { text: '\u4F5C\u696D\u4E2D\u3063\u3061\u3083\u3093\u3002\u5C11\u3057\u5F85\u3063\u3068\u3063\u3066\u306D\u266A', kind: 'working', scope: 'general', durationMs: 6000 },
  workingPet: { text: '\u0044\u0065\u0073\u006B\u0074\u006F\u0070\u0020\u0050\u0065\u0074\uFF1A\u4F5C\u696D\u4E2D\u3063\u3061\u3083\u3093\u266A', kind: 'working', scope: 'desktopPet', durationMs: 6000 },
  workingKakeibo: { text: '\u5BB6\u8A08\u7C3F\u81EA\u52D5\u5316\uFF1A\u4F5C\u696D\u4E2D\u3063\u3061\u3083\u3093\u266A', kind: 'working', scope: 'kakeibo', durationMs: 6000 },
  workingNews: { text: '\u004E\u0065\u0077\u0073\u30A2\u30D7\u30EA\uFF1A\u4F5C\u696D\u4E2D\u3063\u3061\u3083\u3093\u266A', kind: 'working', scope: 'news', durationMs: 6000 },
  workingTaicho: { text: '\u4F53\u8ABF\u7BA1\u7406\u5E33 \u4E00\u90E8\u81EA\u52D5\u5316\uFF1A\u4F5C\u696D\u4E2D\u3063\u3061\u3083\u3093\u266A', kind: 'working', scope: 'taicho', durationMs: 6000 },
  testing: { text: '\u30C6\u30B9\u30C8\u4E2D\u3063\u3061\u3083\u3093\u3002\u52D5\u304D\u3092\u78BA\u8A8D\u3057\u3066\u308B\u3088\u266A', kind: 'testing', scope: 'general', durationMs: 6000 },
  done: { text: '\u3067\u304D\u305F\u3088\u266A\u78BA\u8A8D\u3057\u3066\u307F\u3066\u306D', kind: 'done', scope: 'general', durationMs: 6000 },
  donePet: { text: '\u0044\u0065\u0073\u006B\u0074\u006F\u0070\u0020\u0050\u0065\u0074\uFF1A\u4F5C\u696D\u5B8C\u4E86\u3057\u305F\u3088\u266A', kind: 'done', scope: 'desktopPet', durationMs: 8000 },
  doneKakeibo: { text: '\u5BB6\u8A08\u7C3F\u81EA\u52D5\u5316\uFF1A\u4F5C\u696D\u5B8C\u4E86\u3057\u305F\u3088\u266A', kind: 'done', scope: 'kakeibo', durationMs: 8000 },
  doneNews: { text: '\u004E\u0065\u0077\u0073\u30A2\u30D7\u30EA\uFF1A\u4F5C\u696D\u5B8C\u4E86\u3057\u305F\u3088\u266A', kind: 'done', scope: 'news', durationMs: 8000 },
  doneTaicho: { text: '\u4F53\u8ABF\u7BA1\u7406\u5E33 \u4E00\u90E8\u81EA\u52D5\u5316\uFF1A\u4F5C\u696D\u5B8C\u4E86\u3057\u305F\u3088\u266A', kind: 'done', scope: 'taicho', durationMs: 8000 },
  clear: { text: '', kind: 'clear', scope: 'general', durationMs: 0 }
});

function parseArgs(args) {
  const messageParts = [];
  let clearAfterMs = 0;
  let label = '';
  let scope = '';

  for (const arg of args) {
    if (arg.startsWith('--clear-after=')) {
      const seconds = Number(arg.slice('--clear-after='.length));
      clearAfterMs = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
    } else if (arg.startsWith('--label=')) {
      label = arg.slice('--label='.length).trim();
    } else if (arg.startsWith('--project=')) {
      label = arg.slice('--project='.length).trim();
    } else if (arg.startsWith('--scope=')) {
      scope = arg.slice('--scope='.length).trim();
    } else {
      messageParts.push(arg);
    }
  }

  return { messageParts, clearAfterMs, label, scope };
}

function getPresetOrMessage(args) {
  const [first, ...rest] = args;

  if (!first) {
    return presets.clear;
  }

  if (first in presets && rest.length === 0) {
    return presets[first];
  }

  return {
    text: args.join(' '),
    kind: 'custom',
    scope: 'general',
    durationMs: 6000
  };
}

function applyLabel(preset, label, scope) {
  const cleanLabel = String(label || '').trim();
  const cleanScope = String(scope || '').trim();

  if (!cleanLabel) {
    return {
      ...preset,
      scope: cleanScope || preset.scope
    };
  }

  return {
    ...preset,
    text: `${cleanLabel}：${preset.text}`,
    scope: cleanScope || (preset.scope === 'general' ? `chat:${cleanLabel}` : preset.scope)
  };
}

function writeStatus(message) {
  const fileContent = message ? `\uFEFF${message}` : '';
  fs.writeFileSync(statusPath, fileContent, 'utf8');
}

function readQueue() {
  try {
    const value = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  const json = JSON.stringify(queue, null, 2).replace(/[^\x00-\x7F]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  });
  fs.writeFileSync(queuePath, `${json}\n`, 'utf8');
}

function pruneQueue(queue, now) {
  return queue.filter((item) => {
    if (!item.text) {
      return false;
    }

    if (!item.durationMs || !item.startedAt) {
      return true;
    }

    return now - item.startedAt < item.durationMs;
  });
}

function getActiveQueue(queue, now) {
  const activeQueue = pruneQueue(queue, now);
  const current = activeQueue[0];

  if (!current) {
    return { activeQueue, current: null };
  }

  if (!current.startedAt) {
    current.startedAt = now;
  }

  return { activeQueue, current };
}

function syncQueueState() {
  const now = Date.now();
  const { activeQueue, current } = getActiveQueue(readQueue(), now);

  writeQueue(activeQueue);
  writeStatus(current ? current.text : '');

  return current;
}

const rawArgs = process.argv.slice(2);
const { messageParts, clearAfterMs, label, scope } = parseArgs(rawArgs);
const preset = applyLabel(getPresetOrMessage(messageParts), label, scope);
const message = preset.text.trim().slice(0, maxStatusLength);
const now = Date.now();

if (preset.kind === 'clear' || !message) {
  writeQueue([]);
  writeStatus('');
  console.log('status queue cleared.');
  process.exit(0);
}

const durationMs = clearAfterMs || preset.durationMs || 6000;
const nextItem = {
  id: `${now}-${Math.random().toString(16).slice(2)}`,
  text: message,
  kind: preset.kind,
  scope: preset.scope,
  durationMs,
  createdAt: now,
  startedAt: 0
};

let queue = pruneQueue(readQueue(), now);
queue = queue.filter((item) => {
  const replacesGenericNotice = item.scope === 'general' && nextItem.scope !== 'general';
  const generalFollowUp = nextItem.scope === 'general' && ['working', 'testing', 'done'].includes(nextItem.kind);

  if (replacesGenericNotice && ['approval', 'error', 'waiting'].includes(nextItem.kind)) {
    return item.kind !== nextItem.kind;
  }

  if (replacesGenericNotice && ['working', 'testing', 'done'].includes(nextItem.kind)) {
    return !['approval', 'error', 'waiting', 'working', 'testing'].includes(item.kind);
  }

  if (generalFollowUp) {
    return !['approval', 'waiting', 'working', 'testing'].includes(item.kind);
  }

  if (item.scope !== nextItem.scope) {
    return true;
  }

  if (['approval', 'error', 'waiting'].includes(nextItem.kind)) {
    return item.kind !== nextItem.kind;
  }

  return !['approval', 'error', 'waiting', 'working', 'testing'].includes(item.kind);
});

queue.push(nextItem);
writeQueue(queue);
const current = syncQueueState();

if (message) {
  console.log(`status queued: ${message}`);
} else {
  console.log('status queue cleared.');
}

if (current && current.durationMs && !['approval', 'error', 'waiting'].includes(current.kind)) {
  const waitMs = Math.max(0, current.durationMs - (Date.now() - current.startedAt));

  setTimeout(function processQueue() {
    const nextCurrent = syncQueueState();

    if (!nextCurrent || !nextCurrent.durationMs) {
      console.log('status queue idle.');
      return;
    }

    const nextWaitMs = Math.max(0, nextCurrent.durationMs - (Date.now() - nextCurrent.startedAt));
    setTimeout(processQueue, nextWaitMs);
  }, waitMs);
}
