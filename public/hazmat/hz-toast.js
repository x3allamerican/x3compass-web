/* X3 Compass Hazmat — toast helper
   Replaces alert() with brand-aligned non-blocking notification. */
(function(){
  if (window.hzToast) return;
  window.hzToast = function(message, opts){
    opts = opts || {};
    const duration = opts.duration || 4500;
    const wrap = document.createElement('div');
    wrap.className = 'hz-toast';
    wrap.setAttribute('role', opts.role || 'status');
    wrap.setAttribute('aria-live', opts.ariaLive || 'polite');
    wrap.setAttribute('aria-atomic', 'true');
    wrap.innerHTML = `
      <div class="hz-toast-icon" aria-hidden="true">i</div>
      <div class="hz-toast-body">${message}</div>
      <button class="hz-toast-close" aria-label="Dismiss notification">&times;</button>
    `;
    document.body.appendChild(wrap);
    const dismiss = () => {
      wrap.classList.add('hz-toast-out');
      setTimeout(() => wrap.remove(), 220);
    };
    wrap.querySelector('.hz-toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
    return wrap;
  };
})();
