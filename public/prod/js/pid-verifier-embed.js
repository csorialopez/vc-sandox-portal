(function(){
  'use strict';

  const DEFAULTS = {
    backendBaseUrl: 'https://verifier-backend.interfase.uy/ui',
    credentialType: 'eu.europa.ec.eudi.pid.1',
    format: 'mso_mdoc', // 'mso_mdoc' | 'dc+sd-jwt'
    pollingIntervalMs: 3000,
    pollingMaxTries: 30,
    clientId: 'x509_san_dns:verifier-backend.interfase.uy',
    requestUriMethod: 'get',
    deepLinkScheme: 'eudi-openid4vp',
    autoAttach: true,
    buttonSelector: '[data-verify-pid], #verifyPIDOnly',
    onSuccess: null,
    onError: null,
    onStateChange: null,
  };

  const state = {
    cfg: { ...DEFAULTS },
    initialized: false,
    elements: {
      overlay: null,
      canvas: null,
      status: null,
      closeBtn: null,
      openCount: 0,
    },
    pendingScript: null,
  };

  function mergeConfig(a, b){
    const out = { ...a };
    if (!b) return out;
    for (const [k,v] of Object.entries(b)) {
      if (v !== undefined) out[k] = v;
    }
    return out;
  }

  function ensureStyles(){
    if (document.getElementById('pidv-embed-styles')) return;
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      
      .pidv-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        z-index: 9999;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-family: 'Inter', sans-serif;
      }
      .pidv-overlay[aria-hidden="false"] { display: block; }
      .pidv-modal {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(92vw, 420px);
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .pidv-hd {
        padding: 24px 24px 16px;
        text-align: center;
        border-bottom: 1px solid #e2e8f0;
      }
      .pidv-hd h3 {
        margin: 0;
        font-weight: 600;
        font-size: 20px;
        color: #1a202c;
      }
      .pidv-hd p {
        margin: 8px 0 0;
        font-size: 14px;
        color: #718096;
      }
      .pidv-bd { padding: 24px; }
      .pidv-qr {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
      .pidv-qrbox {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: #fff;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      }
      .pidv-status {
        font-size: 14px;
        color: #4a5568;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: #f7fafc;
        border-radius: 8px;
      }
      .pidv-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #cbd5e0;
        border-top-color: #4a5568;
        border-radius: 50%;
        animation: pidv-spin 1s linear infinite;
      }
      @keyframes pidv-spin {
        to { transform: rotate(360deg); }
      }
      .pidv-ft {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 16px 24px;
        background-color: #f7fafc;
        border-top: 1px solid #edf2f7;
      }
      .pidv-btn {
        appearance: none;
        cursor: pointer;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        background-color: #ffffff;
        padding: 9px 17px;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.2;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      .pidv-btn:hover { background-color: #f9fafb; }
      .pidv-btn.primary {
        background-color: #4f46e5;
        border-color: #4f46e5;
        color: #ffffff;
      }
      .pidv-btn.primary:hover { background-color: #4338ca; }
      .pidv-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
      }
      .pidv-close:hover { opacity: 1; }
      .pidv-close:before, .pidv-close:after {
        content: '';
        position: absolute;
        left: 50%;
        top: 50%;
        width: 18px;
        height: 2px;
        background-color: #718096;
      }
      .pidv-close:before { transform: translate(-50%, -50%) rotate(45deg); }
      .pidv-close:after { transform: translate(-50%, -50%) rotate(-45deg); }
      .pidv-sr { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }
    `;
    const style = document.createElement('style');
    style.id = 'pidv-embed-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildModal(){
    if (state.elements.overlay) return;
    ensureStyles();

    const overlay = document.createElement('div');
    overlay.className = 'pidv-overlay';
    overlay.id = 'pidv-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-hidden','true');

    const modal = document.createElement('div');
    modal.className = 'pidv-modal';

    const topCloseBtn = document.createElement('button');
    topCloseBtn.className = 'pidv-close';
    topCloseBtn.setAttribute('aria-label', 'Close dialog');
    topCloseBtn.addEventListener('click', closeModal);
    modal.appendChild(topCloseBtn);

    const hd = document.createElement('div');
    hd.className = 'pidv-hd';
    const h3 = document.createElement('h3');
    h3.textContent = 'Scan with your Wallet';
    const p = document.createElement('p');
    p.textContent = 'Scan the QR code with your digital wallet to share your credential.';
    hd.appendChild(h3);
    hd.appendChild(p);

    const bd = document.createElement('div');
    bd.className = 'pidv-bd';

    const qrWrap = document.createElement('div');
    qrWrap.className = 'pidv-qr';

    const qrBox = document.createElement('div');
    qrBox.className = 'pidv-qrbox';
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256; canvas.id = 'pidv-qr-canvas';
    qrBox.appendChild(canvas);

    const status = document.createElement('div');
    status.className = 'pidv-status';
    status.id = 'pidv-status';

    qrWrap.appendChild(qrBox);
    qrWrap.appendChild(status);
    bd.appendChild(qrWrap);


    const ft = document.createElement('div');
    ft.className = 'pidv-ft';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pidv-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', closeModal);
    ft.appendChild(closeBtn);

    modal.appendChild(hd);
    modal.appendChild(bd);
    modal.appendChild(ft);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeModal(); });
    window.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeModal(); });

    state.elements.overlay = overlay;
    state.elements.canvas = canvas;
    state.elements.status = status;
    state.elements.closeBtn = closeBtn;
  }

  function openModal(){
    buildModal();
    state.elements.overlay.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    if (state.elements.overlay) state.elements.overlay.setAttribute('aria-hidden','true');
  }

  function emitState(next){
    try { state.cfg.onStateChange && state.cfg.onStateChange(next); } catch(_){}
  }

  function generateRandomCode(){
    if (window.crypto && window.crypto.getRandomValues){
      const b = new Uint8Array(16); window.crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
      const hex = Array.from(b, x=>x.toString(16).padStart(2,'0')).join('');
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }
    // Fallback
    let s='';
    for(let i=0;i<36;i++){
      if (i===8||i===13||i===18||i===23) s+='-';
      else if (i===14) s+='4';
      else if (i===19) s+=((((Math.random()*16)|0)&0x3)|0x8).toString(16);
      else s+=((Math.random()*16)|0).toString(16);
    }
    return s;
  }

  function buildPresentationDefinitionPID(format){
    if (format === 'dc+sd-jwt'){
      return {
        type: 'vp_token',
        presentation_definition: {
          id: generateRandomCode(),
          input_descriptors: [{
            id: 'pid-sdjwt',
            name: 'Person Identification Data (PID)',
            purpose: '',
            format: {
              'dc+sd-jwt': { 'sd-jwt_alg_values': ['ES256'], 'kb-jwt_alg_values': ['ES256'] }
            },
            constraints: {
              fields: [
                { path: ['$.vct'], filter: { type:'string', const: 'urn:eudi:pid:1' } },
                { path: ['$.family_name'], intent_to_retain: true },
                { path: ['$.given_name'], intent_to_retain: true },
                { path: ['$.birth_date'], intent_to_retain: true },
                { path: ['$.age_over_18'], intent_to_retain: true },
                { path: ['$.nationality'], intent_to_retain: true },
                { path: ['$.issuance_date'], intent_to_retain: true },
                { path: ['$.expiry_date'], intent_to_retain: true },
                { path: ['$.email_address'], intent_to_retain: true },
                { path: ['$.mobile_phone_number'], intent_to_retain: true }
              ]
            }
          }]
        },
        nonce: generateRandomCode(),
        request_uri_method: 'get'
      };
    }
    // default mso_mdoc
    return {
      type: 'vp_token',
      presentation_definition: {
        id: generateRandomCode(),
        input_descriptors: [{
          id: 'eu.europa.ec.eudi.pid.1',
          format: { mso_mdoc: { alg: ['ES256'] } },
          constraints: {
            limit_disclosure: 'required',
            fields: [
              { path: ["$['eu.europa.ec.eudi.pid.1']['family_name']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['given_name']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['birth_date']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['age_over_18']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['nationality']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['issuance_date']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['expiry_date']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['email_address']"], intent_to_retain: true },
              { path: ["$['eu.europa.ec.eudi.pid.1']['mobile_phone_number']"], intent_to_retain: true }
            ]
          }
        }]
      },
      nonce: generateRandomCode(),
      request_uri_method: 'get'
    };
  }

  function ensureQRious(){
    if (window.QRious) return Promise.resolve();
    if (state.pendingScript) return state.pendingScript;
    state.pendingScript = new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
      s.async = true;
      s.onload = ()=> resolve();
      s.onerror = ()=> reject(new Error('Failed to load QR library'));
      document.head.appendChild(s);
    });
    return state.pendingScript;
  }

  function drawQR(canvas, value){
    try {
      if (window.QRious){
        new QRious({ element: canvas, value, size: 256, padding: 0, background: 'white', foreground: 'black' });
        return;
      }
    } catch(_){}
    // Fallback text
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f0f3f7';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#234';
    ctx.font = '14px monospace';
    ctx.fillText('Scan in Wallet:', 20, 90);
    ctx.fillText(value.slice(0,18)+'…', 20, 115);
  }

  function setStatus(text, showSpinner) {
      if (!state.elements.status) return;
      let content = '';
      if (showSpinner) {
          content += '<div class="pidv-spinner"></div>';
      }
      content += `<span>${text}</span>`;
      state.elements.status.innerHTML = content;
  }

  async function startVerification(){
    const { backendBaseUrl, format, clientId, requestUriMethod, pollingIntervalMs, pollingMaxTries } = state.cfg;
    emitState('starting');
    buildModal();
    openModal();
    setStatus('Connecting to backend…', true);

    try {
      const body = buildPresentationDefinitionPID(format);
      const resp = await fetch(`${backendBaseUrl}/presentations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('Verification backend is not responding');
      const json = await resp.json();
      const tx = json.transaction_id;
      const requestUri = json.request_uri || json.qr_url || json.qrCode;
      if (!tx || !requestUri) throw new Error('Missing transaction or request_uri');

      // Build deep link value for QR
      const deepLink = `${state.cfg.deepLinkScheme}://?client_id=${encodeURIComponent(clientId)}&request_uri=${encodeURIComponent(requestUri)}&request_uri_method=${encodeURIComponent(requestUriMethod)}`;

      await ensureQRious();
      drawQR(state.elements.canvas, deepLink);
      setStatus('Waiting for wallet scan…', true);
      emitState('qr_shown');

      // Polling
      await pollStatus(tx, pollingIntervalMs, pollingMaxTries);
    } catch (e){
      setStatus('Error: ' + (e && e.message ? e.message : 'Unexpected error'), false);
      try { state.cfg.onError && state.cfg.onError(e); } catch(_){ }
      emitState('error');
    }
  }

  async function pollStatus(transactionId, interval, maxTries){
    let tries = 0;
    async function tick(){
      tries++;
      try {
        const r = await fetch(`${state.cfg.backendBaseUrl}/presentations/${transactionId}`);
        if (r.ok){
          const status = await r.json();
          // Success condition: presence of presentation_submission
          if (status && status.presentation_submission){
            setStatus('Credential Verified Successfully!', false);
            try { state.cfg.onSuccess && state.cfg.onSuccess(status); } catch(_){ }
            emitState('verified');
            setTimeout(() => closeModal(), 1500);
            return;
          }
          if (status && status.error){
            throw new Error(status.error);
          }
        }
      } catch (e){
        // only surface after timeout
      }
      if (tries < maxTries){
        setTimeout(tick, interval);
      } else {
        setStatus('Timed out waiting for presentation.', false);
        try { state.cfg.onError && state.cfg.onError(new Error('timeout')); } catch(_){ }
        emitState('timeout');
      }
    }
    setTimeout(tick, interval);
  }

  function attach(selector){
    buildModal();
    document.querySelectorAll(selector || state.cfg.buttonSelector).forEach(el=>{
      if (el.__pidvAttached) return;
      el.addEventListener('click', (ev)=>{ ev.preventDefault(); startVerification(); });
      el.__pidvAttached = true;
    });
  }

  function init(options){
    state.cfg = mergeConfig(DEFAULTS, options||{});
    buildModal();
    if (state.cfg.autoAttach) attach(state.cfg.buttonSelector);
    state.initialized = true;
  }

  // Public API
  const PIDVerifier = {
    init,
    attach,
    open: ()=> startVerification(),
    close: ()=> closeModal(),
    configure: (opts)=> { state.cfg = mergeConfig(state.cfg, opts||{}); },
    get config(){ return { ...state.cfg }; }
  };

  // Auto-init on DOM ready if script tag has data-auto-init
  function autoInitIfRequested(){
    const current = document.currentScript;
    const auto = current && current.getAttribute('data-auto-init');
    if (auto === 'false') return;
    init({});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInitIfRequested);
  else autoInitIfRequested();

  // Expose globally
  window.PIDVerifier = PIDVerifier;
})();
