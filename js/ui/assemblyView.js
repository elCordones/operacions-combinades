(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Themes = OpComb.Themes;
  const Session = OpComb.Session;
  const Sound = OpComb.Sound;

  const MICRO_REVIEW_BY_LEVEL = {
    as_order: { badge: '+ −', clue: "Ordre d'esquerra a dreta" },
    md_priority: { badge: '× ÷', clue: 'Primer × i ÷ abans de + i −' },
    parens_as: { badge: '( )', clue: 'Prioritat absoluta dins de ( )' },
    parens_basic: { badge: '( )', clue: 'Prioritat absoluta dins de ( )' },
    parens_combo: { badge: '( )', clue: 'Parèntesis i jerarquia interior' },
    powers_5e: { badge: 'aⁿ', clue: 'Potències (base × base...)' },
    roots_only: { badge: '√', clue: 'Arrels quadrades exactes' },
    powers_roots: { badge: 'aⁿ · √', clue: 'Potències i arrels abans de × i ÷' },
    full_5e: { badge: '1-2-3', clue: 'Tota la piràmide combinada' },
    full_5e_roots: { badge: '1-2-3', clue: 'Tota la piràmide combinada' },
    full_hierarchy: { badge: '1-2-3', clue: 'Els 4 graons de la piràmide' },
    custom_mix: { badge: '1-2-3', clue: 'Combinació de la sessió' },
    master_6e: { badge: '★', clue: 'Mestratge amb dobles parèntesis' }
  };

  function getMicroReviewMeta(challenge) {
    if (!challenge) return { badge: '1-2-3', clue: 'Jerarquia d’operacions' };
    return MICRO_REVIEW_BY_LEVEL[challenge.level] || { badge: '1-2-3', clue: challenge.focus || 'Jerarquia' };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureShuffledOrder(session) {
    const n = session.challenges.length;
    if (Array.isArray(session.assemblyOrder) && session.assemblyOrder.length === n) {
      return session.assemblyOrder;
    }
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (n > 1 && arr.every((val, idx) => val === idx)) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    session.assemblyOrder = arr;
    Session.saveSession(session);
    return arr;
  }

  function init(callbacks) {
    const themePill = document.getElementById('assembly-theme-pill');
    const progressPill = document.getElementById('assembly-progress-pill');
    const headingEl = document.getElementById('assembly-heading');
    const subtitleEl = document.getElementById('assembly-subtitle');
    const blueprintEl = document.getElementById('assembly-blueprint');
    const slotsEl = document.getElementById('assembly-slots');
    const trayEl = document.getElementById('assembly-tray');
    const trayCard = document.getElementById('assembly-tray-card');
    const feedbackBox = document.getElementById('assembly-feedback');
    const feedbackIcon = document.getElementById('assembly-feedback-icon');
    const feedbackTitle = document.getElementById('assembly-feedback-title');
    const feedbackMsg = document.getElementById('assembly-feedback-message');
    const completeCard = document.getElementById('assembly-complete-card');
    const finalArtEl = document.getElementById('assembly-final-art');
    const finalNameEl = document.getElementById('assembly-final-name');
    const finalDescEl = document.getElementById('assembly-final-desc');
    const btnGoReport = document.getElementById('btn-assembly-go-report');
    const btnSkip = document.getElementById('btn-skip-assembly');

    let currentSession = null;
    let lastRenderedSession = null;
    let selectedPieceIdx = null;
    let dragState = null;
    let suppressNextClick = false;

    function showFeedback(kind, title, message) {
      feedbackBox.hidden = false;
      feedbackBox.className =
        'feedback-box ' + (kind === 'success' ? 'is-success' : kind === 'hint' ? 'is-hint' : 'is-guide');
      feedbackIcon.textContent = kind === 'success' ? '✅' : kind === 'hint' ? '💡' : '🧩';
      feedbackTitle.textContent = title;
      feedbackMsg.textContent = message;
    }

    function clearDragArtifacts() {
      if (dragState && dragState.ghost && dragState.ghost.parentNode) {
        dragState.ghost.parentNode.removeChild(dragState.ghost);
      }
      slotsEl.querySelectorAll('.is-drop-target').forEach((el) => el.classList.remove('is-drop-target'));
      dragState = null;
    }

    function getSlotUnderPoint(x, y) {
      const els = document.elementsFromPoint(x, y);
      for (const el of els) {
        const slot = el.closest && el.closest('button.assembly-slot[data-slot-idx]');
        if (slot && !slot.disabled) return slot;
      }
      return null;
    }

    function render(session) {
      const isNewSession = session !== lastRenderedSession;
      currentSession = session;
      lastRenderedSession = session;
      clearDragArtifacts();

      const theme = Themes.getTheme(session.config.themeId);
      const assembly = theme.assembly;
      const totalActive = session.challenges.length;
      const placedSet = new Set(session.assemblyPlaced || []);

      if (isNewSession) {
        selectedPieceIdx = null;
        feedbackBox.hidden = true;
      } else if (selectedPieceIdx !== null && placedSet.has(selectedPieceIdx)) {
        selectedPieceIdx = null;
      }

      document.documentElement.dataset.theme = theme.id;
      themePill.textContent = theme.name;
      progressPill.textContent = `${placedSet.size} de ${totalActive} peces muntades`;
      headingEl.textContent = assembly.title;
      subtitleEl.textContent = assembly.subtitle;
      blueprintEl.innerHTML = assembly.blueprintSvg;

      // Renderitza les 6 ranures del plànol
      slotsEl.innerHTML = assembly.slots
        .map((slot) => {
          const isActivePiece = slot.idx < totalActive;
          const trophy = theme.trophies[slot.idx] || theme.trophies[theme.trophies.length - 1];
          const ch = session.challenges[slot.idx];
          const meta = getMicroReviewMeta(ch);

          if (!isActivePiece) {
            return (
              `<button type="button" class="assembly-slot is-base" style="--slot-x: ${slot.x}%; --slot-y: ${slot.y}%;" disabled aria-label="${escapeHtml(slot.zoneLabel)} (estructura base preinstal·lada)">` +
                `<span class="slot-svg">${trophy.svg}</span>` +
                '<span class="slot-label">Base</span>' +
              '</button>'
            );
          }

          if (placedSet.has(slot.idx)) {
            return (
              `<button type="button" class="assembly-slot is-placed" style="--slot-x: ${slot.x}%; --slot-y: ${slot.y}%;" disabled aria-label="${escapeHtml(trophy.name)} col·locat a ${escapeHtml(slot.zoneLabel)}">` +
                `<span class="slot-svg">${trophy.svg}</span>` +
                `<span class="slot-label">${escapeHtml(trophy.name)}</span>` +
              '</button>'
            );
          }

          const awaitingCls = selectedPieceIdx !== null ? ' is-awaiting-drop' : '';
          return (
            `<button type="button" class="assembly-slot is-empty${awaitingCls}" data-slot-idx="${slot.idx}" style="--slot-x: ${slot.x}%; --slot-y: ${slot.y}%;" aria-label="Ranura ${escapeHtml(slot.zoneLabel)}: ${escapeHtml(meta.clue)}">` +
              `<span class="slot-badge">${escapeHtml(meta.badge)}</span>` +
              `<span class="slot-label">${escapeHtml(slot.zoneLabel)}</span>` +
            '</button>'
          );
        })
        .join('');

      // Renderitza la safata de peces pendents
      const order = ensureShuffledOrder(session);
      const pendingIndices = order.filter((idx) => idx < totalActive && !placedSet.has(idx));

      if (pendingIndices.length === 0 || session.assemblyCompleted) {
        session.assemblyCompleted = true;
        trayCard.hidden = true;
        completeCard.hidden = false;
        finalArtEl.innerHTML = assembly.finalSvg;
        finalNameEl.textContent = assembly.finalName;
        finalDescEl.textContent = assembly.finalDesc;
        btnSkip.hidden = true;
      } else {
        trayCard.hidden = false;
        completeCard.hidden = true;
        btnSkip.hidden = false;
        trayEl.innerHTML = pendingIndices
          .map((idx) => {
            const trophy = theme.trophies[idx] || theme.trophies[0];
            const ch = session.challenges[idx];
            const meta = getMicroReviewMeta(ch);
            const isSel = selectedPieceIdx === idx;
            return (
              `<button type="button" class="assembly-piece${isSel ? ' is-selected' : ''}" data-piece-idx="${idx}" aria-pressed="${isSel ? 'true' : 'false'}">` +
                `<span class="piece-svg">${trophy.svg}</span>` +
                '<span class="piece-info">' +
                  `<span class="piece-name">${escapeHtml(trophy.name)}</span>` +
                  `<span class="piece-clue"><span class="piece-badge">${escapeHtml(meta.badge)}</span> ${escapeHtml(meta.clue)}</span>` +
                '</span>' +
              '</button>'
            );
          })
          .join('');
      }
    }

    function tryPlacePiece(pieceIdx, slotIdx) {
      if (!currentSession) return;
      const theme = Themes.getTheme(currentSession.config.themeId);
      const slotMeta = theme.assembly.slots[slotIdx];
      const ch = currentSession.challenges[slotIdx];
      const review = getMicroReviewMeta(ch);
      const trophy = theme.trophies[pieceIdx] || theme.trophies[0];

      if (pieceIdx === slotIdx) {
        if (!currentSession.assemblyPlaced.includes(pieceIdx)) {
          currentSession.assemblyPlaced.push(pieceIdx);
        }
        selectedPieceIdx = null;
        const doneNow = currentSession.assemblyPlaced.length >= currentSession.challenges.length;
        if (doneNow) {
          currentSession.assemblyCompleted = true;
          Sound.playTrophy();
          showFeedback('success', `${theme.assembly.finalName}!`, 'Has muntat totes les peces i repassat tots els graons de la jerarquia!');
        } else {
          Sound.playStepOk();
          showFeedback('success', `${trophy.name} acoblat!`, `Molt bé! Has consolidat «${review.clue}» (${review.badge}).`);
        }
        Session.saveSession(currentSession);
        render(currentSession);
        if (doneNow) {
          btnGoReport.focus();
        }
      } else {
        Sound.playHint();
        const slotBtn = slotsEl.querySelector(`button.assembly-slot[data-slot-idx="${slotIdx}"]`);
        if (slotBtn) {
          slotBtn.classList.remove('is-error-shake');
          void slotBtn.offsetWidth;
          slotBtn.classList.add('is-error-shake');
        }
        showFeedback(
          'hint',
          'Aquesta peça va en una altra ranura',
          `La zona «${slotMeta.zoneLabel}» correspon a: ${review.badge} · ${review.clue}.`
        );
      }
    }

    trayEl.addEventListener('click', (e) => {
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      if (!currentSession) return;
      const btn = e.target.closest('button.assembly-piece[data-piece-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.pieceIdx);
      selectedPieceIdx = selectedPieceIdx === idx ? null : idx;
      const theme = Themes.getTheme(currentSession.config.themeId);
      const trophy = theme.trophies[idx] || theme.trophies[0];
      if (selectedPieceIdx !== null) {
        showFeedback('guide', `Peça seleccionada: ${trophy.name}`, 'Ara clica la ranura del plànol que coincideix amb aquesta habilitat.');
      } else {
        feedbackBox.hidden = true;
      }
      render(currentSession);
    });

    trayEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const btn = e.target.closest('button.assembly-piece[data-piece-idx]');
      if (!btn || !currentSession) return;
      const idx = Number(btn.dataset.pieceIdx);
      const rect = btn.getBoundingClientRect();
      dragState = {
        idx,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        dragging: false,
        ghost: null
      };
    });

    global.addEventListener('pointermove', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId || !currentSession) return;
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      if (!dragState.dragging && dist > 8) {
        dragState.dragging = true;
        selectedPieceIdx = dragState.idx;
        const theme = Themes.getTheme(currentSession.config.themeId);
        const trophy = theme.trophies[dragState.idx] || theme.trophies[0];
        const ghost = document.createElement('div');
        ghost.className = 'assembly-drag-ghost';
        ghost.innerHTML = `<span class="piece-svg">${trophy.svg}</span><span>${escapeHtml(trophy.name)}</span>`;
        document.body.appendChild(ghost);
        dragState.ghost = ghost;
      }
      if (dragState.dragging && dragState.ghost) {
        dragState.ghost.style.left = `${e.clientX - dragState.offsetX}px`;
        dragState.ghost.style.top = `${e.clientY - dragState.offsetY}px`;
        slotsEl.querySelectorAll('.is-drop-target').forEach((el) => el.classList.remove('is-drop-target'));
        const overSlot = getSlotUnderPoint(e.clientX, e.clientY);
        if (overSlot) overSlot.classList.add('is-drop-target');
      }
    });

    global.addEventListener('pointerup', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const wasDragging = dragState.dragging;
      const draggedIdx = dragState.idx;
      const overSlot = wasDragging ? getSlotUnderPoint(e.clientX, e.clientY) : null;
      clearDragArtifacts();
      if (wasDragging) {
        suppressNextClick = true;
        setTimeout(() => {
          suppressNextClick = false;
        }, 60);
        if (overSlot) {
          tryPlacePiece(draggedIdx, Number(overSlot.dataset.slotIdx));
        }
      }
    });

    global.addEventListener('pointercancel', clearDragArtifacts);

    slotsEl.addEventListener('click', (e) => {
      if (!currentSession) return;
      const slotBtn = e.target.closest('button.assembly-slot[data-slot-idx]');
      if (!slotBtn || slotBtn.disabled) return;
      const slotIdx = Number(slotBtn.dataset.slotIdx);
      const theme = Themes.getTheme(currentSession.config.themeId);
      const slotMeta = theme.assembly.slots[slotIdx];
      const ch = currentSession.challenges[slotIdx];
      const review = getMicroReviewMeta(ch);

      if (selectedPieceIdx === null) {
        showFeedback(
          'guide',
          `Ranura: ${slotMeta.zoneLabel}`,
          `Aquí va la peça de «${review.badge} · ${review.clue}». Tria-la de la safata!`
        );
        return;
      }

      tryPlacePiece(selectedPieceIdx, slotIdx);
    });

    function goToReport() {
      if (!currentSession) return;
      currentSession.view = 'report';
      Session.saveSession(currentSession);
      callbacks.onGoReport();
    }

    btnGoReport.addEventListener('click', goToReport);
    btnSkip.addEventListener('click', goToReport);

    return {
      render,
      getMicroReviewMeta
    };
  }

  OpComb.AssemblyView = {
    init,
    getMicroReviewMeta
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
