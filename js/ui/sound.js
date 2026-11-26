(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const MUTE_KEY = 'opcomb_v1_muted';
  let muted = false;
  let audioCtx = null;

  try {
    muted = global.localStorage && global.localStorage.getItem(MUTE_KEY) === '1';
  } catch (_e) {
    muted = false;
  }

  function getCtx() {
    if (muted) return null;
    const Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, delaySec) {
    try {
      const ctx = getCtx();
      if (!ctx) return;
      const now = ctx.currentTime + (delaySec || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (_e) {
      // Ignora errors d'àudio en entorns sense suport
    }
  }

  function playStepOk() {
    playTone(523.25, 0.12, 'triangle', 0);
    playTone(659.25, 0.14, 'triangle', 0.08);
  }

  function playHint() {
    playTone(330, 0.14, 'sine', 0);
    playTone(293.66, 0.16, 'sine', 0.1);
  }

  function playTrophy() {
    playTone(523.25, 0.14, 'triangle', 0);
    playTone(659.25, 0.14, 'triangle', 0.11);
    playTone(783.99, 0.16, 'triangle', 0.22);
    playTone(1046.5, 0.28, 'triangle', 0.34);
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    muted = !muted;
    try {
      if (global.localStorage) {
        global.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
      }
    } catch (_e) {
      // Ignora
    }
    return muted;
  }

  OpComb.Sound = {
    isMuted,
    toggleMute,
    playStepOk,
    playHint,
    playTrophy
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
