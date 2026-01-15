 (() => {
  const overlayEl = document.getElementById('globalLoadingOverlay');
  const messageEl = overlayEl?.querySelector('[data-loading-message]');
  const subtextEl = overlayEl?.querySelector('[data-loading-subtext]');
  const progressEl = overlayEl?.querySelector('[data-progress-bar]');
  const containerEl = overlayEl?.querySelector('[data-loading-container]');
  const successCheckEl = overlayEl?.querySelector('[data-loading-success]');
  const progressLabelEl = overlayEl?.querySelector('[data-progress-label]');

  let autoProgressTimer = null;

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
      clearTimeout(autoProgressTimer);
      autoProgressTimer = null;
    }
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

    setProgress(progress);

    if (autoProgress && progressEl) {
      autoProgressTimer = setTimeout(() => {
        setProgress(100);
      }, 100);
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

    const finalizeHide = () => {
      overlayEl.classList.add('opacity-0', 'pointer-events-none');
      if (containerEl) {
        containerEl.style.transform = 'scale(0.95)';
        containerEl.style.opacity = '0.5';
      }
      setTimeout(() => {
        overlayEl.classList.add('hidden');
        if (resetProgress) setProgress(0);
      }, 300);
    };

    if (success && successCheckEl) {
      successCheckEl.style.opacity = '1';
      successCheckEl.style.transform = 'scale(1)';
      setTimeout(finalizeHide, delay);
    } else {
      finalizeHide();
    }
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

        if (disableInputs) {
          form.querySelectorAll('button').forEach(button => {
            button.disabled = true;
            button.classList.add('opacity-50', 'cursor-not-allowed');
          });
        }

        showLoadingOverlay({
          message: customMessage || 'Procesando...',
          subtext: customSubtext || 'Por favor espera',
          autoProgress
        });
      });

      form.dataset.loadingBound = 'true';
    });
  };

  attachLoadingToForms();

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
          clearAutoProgress();
          autoProgressTimer = setTimeout(() => setProgress(progress), 50);
        } else {
          clearAutoProgress();
          setProgress(progress);
        }
      }
    };
  }
})();
