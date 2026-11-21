const STORAGE_KEY = "dunnkayce-payment-sound";

// G5 -> C6: a soft, two-tone "ding" that stays pleasant even when repeated.
const CHIME_NOTES = [
  { frequency: 783.99, delay: 0, duration: 0.14 },
  { frequency: 1046.5, delay: 0.12, duration: 0.28 },
];

let audioContext = null;
let memoryPreference = null;
const audioStateListeners = new Set();
let stateListenerAttached = false;

function isBrowser() {
  return typeof window !== "undefined";
}

function notifyAudioState() {
  audioStateListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener failures so the remaining listeners still run.
    }
  });
}

function watchAudioContextState(context) {
  if (stateListenerAttached || !context) return;
  stateListenerAttached = true;
  try {
    if (typeof context.addEventListener === "function") {
      context.addEventListener("statechange", notifyAudioState);
      return;
    }
  } catch {
    // Fall through to the legacy onstatechange hook.
  }
  try {
    if ("onstatechange" in context) context.onstatechange = notifyAudioState;
  } catch {
    // State-change notifications are best-effort.
  }
}

function getAudioContext() {
  if (!isBrowser()) return null;
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext || null;
      if (!AudioContextClass) return null;
      audioContext = new AudioContextClass();
      watchAudioContextState(audioContext);
    }
    return audioContext;
  } catch {
    return null;
  }
}

function scheduleChime(context) {
  try {
    const startTime = context.currentTime + 0.01;

    CHIME_NOTES.forEach(({ frequency, delay, duration }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = startTime + delay;
      const noteEnd = noteStart + duration;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.02);
      oscillator.onended = () => {
        try {
          oscillator.disconnect();
          gain.disconnect();
        } catch {
          // Already disconnected; nothing to clean up.
        }
      };
    });

    return true;
  } catch {
    return false;
  }
}

/** Whether the admin payment chime should play (defaults to enabled). */
export function isPaymentSoundEnabled() {
  try {
    if (memoryPreference !== null) return memoryPreference;
    if (!isBrowser()) return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored !== "false";
  } catch {
    return true;
  }
}

/** Persist the admin's mute preference; falls back to memory if storage is blocked. */
export function setPaymentSoundEnabled(enabled) {
  const next = Boolean(enabled);
  memoryPreference = next;
  try {
    if (isBrowser()) window.localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
  } catch {
    // Private browsing / blocked storage — preference still applies this session.
  }
}

/** Whether the shared AudioContext is currently running (does not create one). */
export function isPaymentAudioRunning() {
  return Boolean(audioContext && audioContext.state === "running");
}

/**
 * Observe AudioContext state changes so gesture priming can be re-armed if
 * audio becomes suspended (or interrupted) again. Returns an unsubscribe fn.
 */
export function onPaymentAudioStateChange(listener) {
  if (typeof listener !== "function") return () => {};
  audioStateListeners.add(listener);
  return () => {
    audioStateListeners.delete(listener);
  };
}

/** Resume a lazily created AudioContext from a user gesture. Safe to call repeatedly. */
export function primePaymentAudio() {
  try {
    const context = getAudioContext();
    if (!context || context.state === "closed") return false;
    if (context.state !== "suspended" && context.state !== "interrupted") return true;
    if (typeof context.resume !== "function") return false;

    const resumeResult = context.resume();
    if (resumeResult && typeof resumeResult.catch === "function") {
      resumeResult.catch(() => {
        // Autoplay is still blocked; a later gesture can prime it again.
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Play the two-tone chime. Returns false when unavailable, muted, or when the
 * AudioContext is not already running. A suspended context is resumed for a
 * future gesture, but no chime is ever queued — the next payment will sound
 * once audio is actually running.
 */
export function playPaymentChime() {
  try {
    if (!isBrowser() || !isPaymentSoundEnabled()) return false;

    const context = getAudioContext();
    if (!context || context.state === "closed") return false;
    if (typeof context.createOscillator !== "function") return false;

    // Only schedule audio when the context is already running. Payments that
    // arrive while suspended/interrupted are simply skipped, so several of
    // them can never pile up into stale delayed chimes.
    if (context.state !== "running") {
      if (typeof context.resume === "function") {
        try {
          const resumeResult = context.resume();
          if (resumeResult && typeof resumeResult.catch === "function") {
            resumeResult.catch(() => {
              // Still blocked; a later gesture may prime it again.
            });
          }
        } catch {
          // Resume failed — skip this chime entirely.
        }
      }
      return false;
    }

    return scheduleChime(context);
  } catch {
    return false;
  }
}
