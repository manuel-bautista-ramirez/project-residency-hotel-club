 (() => {
  const overlayEl = document.getElementById('globalLoadingOverlay');
  const messageEl = overlayEl?.querySelector('[data-loading-message]');
  const subtextEl = overlayEl?.querySelector('[data-loading-subtext]');
  const progressEl = overlayEl?.querySelector('[data-progress-bar]');
  const containerEl = overlayEl?.querySelector('[data-loading-container]');
  const successCheckEl = overlayEl?.querySelector('[data-loading-success]');
  const progressLabelEl = overlayEl?.querySelector('[data-progress-label]');

  let autoProgressTimer = null;
  let autoProgressStart = null;

  const clampProgress = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return 0;
    return Math.min(100, Math.max(0, num));
  };

  const setProgress = (value = 0) => {
    if (!progressEl) return;

    const normalized = clampProgress(value);
    progressEl.style.width = `${normalized}%`;

    if (progressLabelEl) {
      progressLabelEl.textContent = `${Math.round(normalized)}%`;
    }
  };

  const clearAutoProgress = () => {
    if (autoProgressTimer) {
      clearInterval(autoProgressTimer);
      autoProgressTimer = null;
    }
    autoProgressStart = null;
  };

  const startAutoProgress = ({ startValue = 0 } = {}) => {
    if (!progressEl) return;

    clearAutoProgress();
    autoProgressStart = Date.now();

    const start = clampProgress(startValue);
    setProgress(start);

    autoProgressTimer = setInterval(() => {
      const elapsed = Date.now() - autoProgressStart;

      let next;
      if (elapsed < 1200) {
        next = 10 + (elapsed / 1200) * 60;
      } else if (elapsed < 4200) {
        next = 70 + ((elapsed - 1200) / 3000) * 20;
      } else {
        const t = elapsed - 4200;
        next = 90 + (1 - Math.exp(-t / 4000)) * 5;
      }

      const capped = Math.min(95, next);
      const currentWidth = clampProgress(progressEl.style.width?.replace('%', '') || 0);
      if (capped > currentWidth) setProgress(capped);
    }, 120);
  };

  const showLoadingOverlay = ({
    message = 'Procesando...',
    subtext = 'Por favor espera',
    showSubtext = true,
    progress = 0,
    autoProgress = true
  } = {}) => {
    if (!overlayEl) return;

    clearAutoProgress();

    if (messageEl) messageEl.textContent = message;
    if (subtextEl) {
      subtextEl.textContent = subtext;
      subtextEl.classList.toggle('opacity-0', !showSubtext);
    }

    const initialProgress = autoProgress ? Math.max(12, clampProgress(progress)) : progress;
    setProgress(initialProgress);

    if (autoProgress) {
      startAutoProgress({ startValue: initialProgress });
    }

    if (successCheckEl) {
      successCheckEl.style.opacity = '0';
      successCheckEl.style.transform = 'scale(0.95)';
    }

    if (!overlayEl.classList.contains('flex')) {
      overlayEl.classList.add('flex');
    }

    overlayEl.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlayEl.classList.remove('opacity-0', 'pointer-events-none');
      if (containerEl) {
        containerEl.style.transform = 'scale(1)';
        containerEl.style.opacity = '1';
      }
    });
  };

  const hideLoadingOverlay = ({ success = true, delay = 300, resetProgress = true } = {}) => {
    if (!overlayEl) return;

    clearAutoProgress();

    const completeProgress = (onComplete) => {
      if (!progressEl) return onComplete();

      const animateProgress = (from, to, duration, cb) => {
        const start = Date.now();
        const tick = () => {
          const t = Math.min(1, (Date.now() - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const value = from + (to - from) * eased;
          setProgress(value);
          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            setProgress(to);
            cb();
          }
        };
        requestAnimationFrame(tick);
      };

      const current = clampProgress(progressEl.style.width?.replace('%', '') || 0);

      if (current < 95) {
        const to95Duration = Math.min(650, Math.max(220, (95 - current) * 10));
        animateProgress(current, 95, to95Duration, () => {
          animateProgress(95, 100, 220, onComplete);
        });
        return;
      }

      animateProgress(current, 100, 220, onComplete);
    };

    const finalizeHide = () => {
      overlayEl.classList.add('opacity-0', 'pointer-events-none');
      if (containerEl) {
        containerEl.style.transform = 'scale(0.95)';
        containerEl.style.opacity = '0.5';
      }
      setTimeout(() => {
        overlayEl.classList.add('hidden');
        if (resetProgress) setProgress(0);
        document.dispatchEvent(new CustomEvent('globalLoadingOverlay:hidden'));
      }, 300);
    };

    completeProgress(() => {
      if (success && successCheckEl) {
        successCheckEl.style.opacity = '1';
        successCheckEl.style.transform = 'scale(1)';
        setTimeout(finalizeHide, delay);
      } else {
        finalizeHide();
      }
    });
  };

  const attachLoadingToForms = ({ selector = 'form[data-loading]' } = {}) => {
    if (!overlayEl) return;

    document.querySelectorAll(selector).forEach(form => {
      if (form.dataset.loadingBound === 'true') return;

      form.addEventListener('submit', () => {
        const customMessage = form.dataset.loadingMessage;
        const customSubtext = form.dataset.loadingSubtext;
        const disableInputs = form.dataset.loadingDisableInputs !== 'false';
        const autoProgress = form.dataset.loadingAutoProgress !== 'false';
        const notifyMessage = form.dataset.loadingNotifyMessage;
        const notifyType = form.dataset.loadingNotifyType || 'info';
        const delayMs = Number(form.dataset.loadingDelay || 0);
        const overlayDelay = Number.isNaN(delayMs) ? 0 : delayMs;

        if (disableInputs) {
          form.querySelectorAll('button').forEach(button => {
            button.disabled = true;
            button.classList.add('opacity-50', 'cursor-not-allowed');
          });
        }

        if (notifyMessage && typeof window.showNotification === 'function') {
          window.showNotification(notifyMessage, notifyType);
        }

        const triggerOverlay = () => {
          showLoadingOverlay({
            message: customMessage || 'Procesando...',
            subtext: customSubtext || 'Por favor espera',
            autoProgress
          });
        };

        if (notifyMessage && overlayDelay > 0) {
          setTimeout(triggerOverlay, overlayDelay);
        } else {
          triggerOverlay();
        }
      });

      form.dataset.loadingBound = 'true';
    });
  };

  attachLoadingToForms();

  if (overlayEl) {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const bodyDisabled = document.body?.dataset?.disablePageLoadingOverlay === 'true';
    const isPublicPath = [
      '/login',
      '/password-reset/request',
      '/whatsapp-qr'
    ].includes(pathname);
    const shouldShowPageOverlay = !bodyDisabled && !isPublicPath;

    document.addEventListener('DOMContentLoaded', () => {
      if (!shouldShowPageOverlay) return;
      showLoadingOverlay({
        message: 'Cargando vista...',
        subtext: 'Preparando información',
        progress: 25,
        autoProgress: false
      });
    });

    window.addEventListener('load', () => {
      if (!shouldShowPageOverlay) return;
      const urlParams = new URLSearchParams(window.location.search);
      const hasSuccess = Boolean(urlParams.get('success'));
      hideLoadingOverlay({ success: true, delay: hasSuccess ? 1350 : 350 });
    });
  }

  if (typeof window !== 'undefined') {
    window.showLoadingOverlay = showLoadingOverlay;
    window.hideLoadingOverlay = hideLoadingOverlay;
    window.attachLoadingToForms = attachLoadingToForms;
    window.updateLoadingProgress = (value) => {
      clearAutoProgress();
      setProgress(value);
    };
    window.setLoadingOverlayContent = ({ message, subtext, showSubtext, progress, autoProgress } = {}) => {
      if (message !== undefined && messageEl) messageEl.textContent = message;
      if (subtext !== undefined && subtextEl) {
        subtextEl.textContent = subtext;
        if (showSubtext !== undefined) {
          subtextEl.classList.toggle('opacity-0', !showSubtext);
        }
      }
      if (progress !== undefined) {
        if (autoProgress === true) {
          const initialProgress = Math.max(12, clampProgress(progress));
          startAutoProgress({ startValue: initialProgress });
        } else {
          clearAutoProgress();
          setProgress(progress);
        }
      }
    };
  }
})();
