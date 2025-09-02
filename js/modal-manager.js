class ModalManager {
  createModal(options = {}) {
    const { title = 'Notification', message = '', type = 'info', primaryButton = 'OK', secondaryButton = null, onPrimary = null, onSecondary = null, autoClose = null } = options;

    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = `modal-dialog modal-${type}`;

    const getIcon = (type) => {
      switch (type) {
        case 'success':
          return '✓';
        case 'warning':
          return '⚠';
        case 'error':
          return '✕';
        case 'celebration':
          return '🎉';
        default:
          return 'ℹ';
      }
    };

    dialog.innerHTML = `
            <div class="modal-header">
                <div class="modal-icon">${getIcon(type)}</div>
                <h2 class="modal-title">${title}</h2>
            </div>
            <div class="modal-message">${message}</div>
            <div class="modal-actions">
                ${secondaryButton ? `<button class="modal-btn modal-btn-secondary" data-action="secondary">${secondaryButton}</button>` : ''}
                <button class="modal-btn modal-btn-primary" data-action="primary">${primaryButton}</button>
            </div>
        `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const primaryBtn = overlay.querySelector('[data-action="primary"]');
    const secondaryBtn = overlay.querySelector('[data-action="secondary"]');

    const closeModal = () => {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, 300);
    };

    primaryBtn.addEventListener('click', () => {
      if (onPrimary) onPrimary();
      closeModal();
    });

    if (secondaryBtn) {
      secondaryBtn.addEventListener('click', () => {
        if (onSecondary) onSecondary();
        closeModal();
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    if (autoClose) {
      setTimeout(closeModal, autoClose);
    }

    return { close: closeModal };
  }

  showInfo(title, message, onOk = null) {
    return this.createModal({
      title,
      message,
      type: 'info',
      primaryButton: 'OK',
      onPrimary: onOk,
    });
  }

  showSuccess(title, message, onOk = null) {
    return this.createModal({
      title,
      message,
      type: 'success',
      primaryButton: 'Continue',
      onPrimary: onOk,
    });
  }

  showWarning(title, message, onOk = null) {
    return this.createModal({
      title,
      message,
      type: 'warning',
      primaryButton: 'OK',
      onPrimary: onOk,
    });
  }

  showError(title, message, onOk = null) {
    return this.createModal({
      title,
      message,
      type: 'error',
      primaryButton: 'OK',
      onPrimary: onOk,
    });
  }

  showCelebration(title, message, onOk = null) {
    return this.createModal({
      title,
      message,
      type: 'celebration',
      primaryButton: 'Awesome!',
      onPrimary: onOk,
    });
  }

  showConfirm(title, message, onConfirm = null, onCancel = null) {
    return this.createModal({
      title,
      message,
      type: 'warning',
      primaryButton: 'Confirm',
      secondaryButton: 'Cancel',
      onPrimary: onConfirm,
      onSecondary: onCancel,
    });
  }
}
