/**
 * Hada Homes — Exit Intent Popup
 * Verschijnt wanneer de bezoeker de muis naar boven beweegt (desktop)
 * of na 40 seconden inactiviteit (mobiel)
 * Maximaal 1x per sessie getoond
 */
(function () {
  'use strict';

  // Niet tonen op de boekingspagina zelf
  if (window.location.pathname.includes('/boeken')) return;

  // Slechts 1x per sessie
  if (sessionStorage.getItem('hada_exit_shown')) return;

  const WHATSAPP = 'https://wa.me/31645182246?text=Hallo%2C%20ik%20heb%20een%20vraag%20over%20Hada%20Homes!';
  const EMAIL    = 'mailto:hadahomesspain@gmail.com?subject=Vraag%20over%20Hada%20Homes';
  const BOOK_URL = '/boeken/';

  // ── Popup HTML ──
  const popup = document.createElement('div');
  popup.id = 'hada-exit-popup';
  popup.innerHTML = `
    <div id="hada-exit-overlay"></div>
    <div id="hada-exit-modal">
      <button id="hada-exit-close" aria-label="Sluiten">✕</button>
      <div id="hada-exit-inner">
        <p id="hada-exit-eyebrow">Wacht even!</p>
        <h2 id="hada-exit-title">Nog vragen?</h2>
        <p id="hada-exit-body">
          We helpen je graag persoonlijk. Neem direct contact op met Kevin &amp; Sophie — 
          we reageren binnen een paar uur.
        </p>
        <div id="hada-exit-buttons">
          <a href="${WHATSAPP}" target="_blank" rel="noopener" id="hada-btn-wa">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a href="${EMAIL}" id="hada-btn-email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
            E-mail
          </a>
          <a href="${BOOK_URL}" id="hada-btn-book">
            Toch boeken →
          </a>
        </div>
      </div>
    </div>
  `;

  // ── Styles ──
  const style = document.createElement('style');
  style.textContent = `
    #hada-exit-overlay {
      position: fixed; inset: 0;
      background: rgba(11,59,102,0.55);
      backdrop-filter: blur(3px);
      z-index: 99998;
      opacity: 0; transition: opacity .3s ease;
    }
    #hada-exit-modal {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -46%);
      z-index: 99999;
      background: #faf8f3;
      border: 1px solid #e8e4da;
      border-radius: 4px;
      padding: 40px 36px 36px;
      max-width: 440px;
      width: calc(100% - 32px);
      box-shadow: 0 24px 64px rgba(11,59,102,0.18);
      opacity: 0; transition: opacity .3s ease, transform .3s ease;
      font-family: 'Montserrat', Arial, sans-serif;
    }
    #hada-exit-popup.visible #hada-exit-overlay,
    #hada-exit-popup.visible #hada-exit-modal {
      opacity: 1;
    }
    #hada-exit-popup.visible #hada-exit-modal {
      transform: translate(-50%, -50%);
    }
    #hada-exit-close {
      position: absolute; top: 14px; right: 16px;
      background: none; border: none; cursor: pointer;
      font-size: 18px; color: #5a5a4a; line-height: 1;
      padding: 4px 6px;
    }
    #hada-exit-close:hover { color: #18180f; }
    #hada-exit-eyebrow {
      font-size: 11px; letter-spacing: 2px;
      text-transform: uppercase; color: #b5673a;
      margin: 0 0 10px; font-weight: 600;
    }
    #hada-exit-title {
      font-size: 26px; font-weight: 400;
      color: #18180f; margin: 0 0 12px;
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.2;
    }
    #hada-exit-body {
      font-size: 14px; color: #5a5a4a;
      line-height: 1.7; margin: 0 0 24px;
    }
    #hada-exit-buttons {
      display: flex; flex-direction: column; gap: 10px;
    }
    #hada-exit-buttons a {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 13px 20px;
      border-radius: 3px; text-decoration: none;
      font-size: 14px; font-weight: 600;
      font-family: 'Montserrat', Arial, sans-serif;
      transition: opacity .2s;
    }
    #hada-exit-buttons a:hover { opacity: .85; }
    #hada-btn-wa {
      background: #25D366; color: #fff;
    }
    #hada-btn-email {
      background: #0b3b66; color: #fff;
    }
    #hada-btn-book {
      background: transparent; color: #5a5a4a;
      border: 1px solid #e8e4da;
      font-weight: 400; font-size: 13px;
    }
    @media (max-width: 480px) {
      #hada-exit-modal { padding: 32px 20px 24px; }
      #hada-exit-title { font-size: 22px; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(popup);

  // ── Show / Hide ──
  function show() {
    if (sessionStorage.getItem('hada_exit_shown')) return;
    sessionStorage.setItem('hada_exit_shown', '1');
    popup.classList.add('visible');
  }

  function hide() {
    popup.classList.remove('visible');
  }

  document.getElementById('hada-exit-close').addEventListener('click', hide);
  document.getElementById('hada-exit-overlay').addEventListener('click', hide);

  // ── Desktop: muis verlaat venster bovenaan ──
  let triggered = false;
  document.addEventListener('mouseleave', function (e) {
    if (triggered) return;
    if (e.clientY <= 10) {
      triggered = true;
      setTimeout(show, 200);
    }
  });

  // ── Mobiel: na 40 seconden inactiviteit ──
  let mobileTimer = null;
  function resetMobileTimer() {
    clearTimeout(mobileTimer);
    mobileTimer = setTimeout(show, 40000);
  }
  if ('ontouchstart' in window) {
    ['touchstart', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, resetMobileTimer, { passive: true });
    });
    resetMobileTimer();
  }

  // ── ESC toets ──
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });
})();
