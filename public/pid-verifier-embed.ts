(function(){
  // Converted to TypeScript – public copy for download
  type Format = 'mso_mdoc' | 'dc+sd-jwt';
  type RequestUriMethod = 'get' | 'post';
  type StateName = 'starting' | 'qr_shown' | 'verified' | 'error' | 'timeout';

  interface PIDVerifierConfig {
    backendBaseUrl: string;
    credentialType: string;
    format: Format;
    pollingIntervalMs: number;
    pollingMaxTries: number;
    clientId: string;
    requestUriMethod: RequestUriMethod;
    deepLinkScheme: string;
    autoAttach: boolean;
    buttonSelector: string;
    onSuccess?: (status: unknown) => void;
    onError?: (err: unknown) => void;
    onStateChange?: (state: StateName) => void;
  }

  type HTMLElementWithFlag = HTMLElement & { __pidvAttached?: boolean };

  interface Elements {
    overlay: HTMLDivElement | null;
    canvas: HTMLCanvasElement | null;
    status: HTMLDivElement | null;
    closeBtn: HTMLButtonElement | null;
    openCount: number;
  }

  interface State {
    cfg: PIDVerifierConfig;
    initialized: boolean;
    elements: Elements;
    pendingScript: Promise<void> | null;
  }

  const DEFAULTS: PIDVerifierConfig = {
    backendBaseUrl: 'https://verifier-backend.interfase.uy/ui',
    credentialType: 'eu.europa.ec.eudi.pid.1',
    format: 'mso_mdoc',
    pollingIntervalMs: 3000,
    pollingMaxTries: 30,
    clientId: 'x509_san_dns:verifier-backend.interfase.uy',
    requestUriMethod: 'get',
    deepLinkScheme: 'eudi-openid4vp',
    autoAttach: true,
    buttonSelector: '[data-verify-pid], #verifyPIDOnly',
    onSuccess: undefined,
    onError: undefined,
    onStateChange: undefined,
  };

  const state: State = {
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

  function mergeConfig<T extends object>(a: T, b?: Partial<T>): T {
    const out = { ...(a as any) } as T;
    if (!b) return out;
    for (const [k, v] of Object.entries(b)) {
      if (v !== undefined) (out as any)[k] = v;
    }
    return out;
  }

  function ensureStyles(): void {
    if (document.getElementById('pidv-embed-styles')) return;
    const css = `
      .pidv-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:9999}
      .pidv-overlay[aria-hidden="false"]{display:block}
      .pidv-modal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,440px);background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);overflow:hidden}
      .pidv-hd{padding:16px 18px;border-bottom:1px solid #eee}
      .pidv-hd h3{margin:0;font:600 18px/1.2 system-ui,Segoe UI,Arial}
      .pidv-bd{padding:16px 18px}
      .pidv-qr{display:flex;flex-direction:column;align-items:center}
      .pidv-qrbox{display:flex;align-items:center;justify-content:center;padding:10px;background:#fff;border-radius:10px;border:1px solid #e9eef3}
      .pidv-status{margin-top:12px;color:#445; font: 14px/1.4 system-ui,Segoe UI,Arial}
      .pidv-ft{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #eee}
      .pidv-btn{appearance:none;cursor:pointer;border-radius:8px;border:1px solid #d0d7de;background:#fff;padding:8px 12px;font:600 14px/1 system-ui,Segoe UI,Arial}
      .pidv-btn.primary{background:#0b5fff;border-color:#0b5fff;color:#fff}
      .pidv-sr{position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden}
    `;
    const style = document.createElement('style');
    style.id = 'pidv-embed-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildModal(): void {
    if (state.elements.overlay) return;
    ensureStyles();

    const overlay = document.createElement('div');
    overlay.className = 'pidv-overlay';
    (overlay as HTMLDivElement).id = 'pidv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');

    const modal = document.createElement('div');
    modal.className = 'pidv-modal';

    const hd = document.createElement('div');
    hd.className = 'pidv-hd';
    const h3 = document.createElement('h3');
    h3.textContent = 'Verify your Identity';
    hd.appendChild(h3);

    const bd = document.createElement('div');
    bd.className = 'pidv-bd';

    const qrWrap = document.createElement('div');
    qrWrap.className = 'pidv-qr';

    const qrBox = document.createElement('div');
    qrBox.className = 'pidv-qrbox';
    const canvas = document.createElement('canvas');
    canvas.width = 220; canvas.height = 220; canvas.id = 'pidv-qr-canvas';
    qrBox.appendChild(canvas);

    const status = document.createElement('div');
    status.className = 'pidv-status';
    status.id = 'pidv-status';
    status.textContent = 'Waiting for wallet scan…';

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

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    state.elements.overlay = overlay as HTMLDivElement;
    state.elements.canvas = canvas;
    state.elements.status = status as HTMLDivElement;
    state.elements.closeBtn = closeBtn;
  }

  function openModal(): void {
    buildModal();
    state.elements.overlay!.setAttribute('aria-hidden', 'false');
  }
  function closeModal(): void {
    if (state.elements.overlay) state.elements.overlay.setAttribute('aria-hidden', 'true');
  }

  function emitState(next: StateName): void {
    try { state.cfg.onStateChange && state.cfg.onStateChange(next); } catch { /* noop */ }
  }

  function generateRandomCode(): string {
    if (window.crypto && window.crypto.getRandomValues) {
      const b = new Uint8Array(16); window.crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
      const hex = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    // Fallback
    let s = '';
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
      else if (i === 14) s += '4';
      else if (i === 19) s += ((((Math.random() * 16) | 0) & 0x3) | 0x8).toString(16);
      else s += ((Math.random() * 16) | 0).toString(16);
    }
    return s;
  }

  function buildPresentationDefinitionPID(format: Format): Record<string, unknown> {
    if (format === 'dc+sd-jwt') {
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
                { path: ['$.vct'], filter: { type: 'string', const: 'urn:eudi:pid:1' } },
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

  function ensureQRious(): Promise<void> {
    if ((window as any).QRious) return Promise.resolve();
    if (state.pendingScript) return state.pendingScript;
    state.pendingScript = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load QR library'));
      document.head.appendChild(s);
    });
    return state.pendingScript;
  }

  function drawQR(canvas: HTMLCanvasElement, value: string): void {
    try {
      const QR = (window as any).QRious;
      if (QR) {
        new QR({ element: canvas, value, size: 220 });
        return;
      }
    } catch { /* noop */ }
    // Fallback text
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f3f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#234';
    ctx.font = '14px monospace';
    ctx.fillText('Scan in Wallet:', 20, 90);
    ctx.fillText(value.slice(0, 18) + '…', 20, 115);
  }

  async function startVerification(): Promise<void> {
    const { backendBaseUrl, format, clientId, requestUriMethod, pollingIntervalMs, pollingMaxTries } = state.cfg;
    emitState('starting');
    buildModal();
    openModal();
    if (state.elements.status) state.elements.status.textContent = 'Connecting…';

    try {
      const body = buildPresentationDefinitionPID(format);
      const resp = await fetch(`${backendBaseUrl}/presentations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('Verification backend is not responding');
      const json: any = await resp.json();
      const tx = json.transaction_id as string | undefined;
      const requestUri = (json.request_uri || json.qr_url || json.qrCode) as string | undefined;
      if (!tx || !requestUri) throw new Error('Missing transaction or request_uri');

      // Build deep link value for QR
      const deepLink = `${state.cfg.deepLinkScheme}://?client_id=${encodeURIComponent(clientId)}&request_uri=${encodeURIComponent(requestUri)}&request_uri_method=${encodeURIComponent(requestUriMethod)}`;

      await ensureQRious();
      drawQR(state.elements.canvas!, deepLink);
      if (state.elements.status) state.elements.status.textContent = 'Scan with your OpenID4VP wallet';
      emitState('qr_shown');

      // Polling
      await pollStatus(tx, pollingIntervalMs, pollingMaxTries);
    } catch (e: any) {
      if (state.elements.status) state.elements.status.textContent = 'Error: ' + (e && e.message ? e.message : 'Unexpected error');
      try { state.cfg.onError && state.cfg.onError(e); } catch { /* noop */ }
      emitState('error');
    }
  }

  async function pollStatus(transactionId: string, interval: number, maxTries: number): Promise<void> {
    let tries = 0;
    const tick = async () => {
      tries++;
      try {
        const r = await fetch(`${state.cfg.backendBaseUrl}/presentations/${transactionId}`);
        if (r.ok) {
          const status: any = await r.json();
          // Success condition: presence of presentation_submission
          if (status && status.presentation_submission) {
            if (state.elements.status) state.elements.status.textContent = 'Verified!';
            try { state.cfg.onSuccess && state.cfg.onSuccess(status); } catch { /* noop */ }
            emitState('verified');
            closeModal();
            return;
          }
          if (status && status.error) {
            throw new Error(status.error);
          }
        }
      } catch {
        // only surface after timeout
      }
      if (tries < maxTries) {
        setTimeout(tick, interval);
      } else {
        if (state.elements.status) state.elements.status.textContent = 'Timed out waiting for presentation';
        try { state.cfg.onError && state.cfg.onError(new Error('timeout')); } catch { /* noop */ }
        emitState('timeout');
      }
    };
    setTimeout(tick, interval);
  }

  function attach(selector?: string): void {
    buildModal();
    document.querySelectorAll(selector || state.cfg.buttonSelector).forEach((el) => {
      const target = el as HTMLElementWithFlag;
      if (target.__pidvAttached) return;
      target.addEventListener('click', (ev) => { ev.preventDefault(); void startVerification(); });
      target.__pidvAttached = true;
    });
  }

  function init(options?: Partial<PIDVerifierConfig>): void {
    state.cfg = mergeConfig(DEFAULTS, options || {});
    buildModal();
    if (state.cfg.autoAttach) attach(state.cfg.buttonSelector);
    state.initialized = true;
  }

  // Public API
  interface PIDVerifierAPI {
    init: (opts?: Partial<PIDVerifierConfig>) => void;
    attach: (selector?: string) => void;
    open: () => Promise<void>;
    close: () => void;
    configure: (opts?: Partial<PIDVerifierConfig>) => void;
    readonly config: PIDVerifierConfig;
  }

  const PIDVerifier: PIDVerifierAPI = {
    init,
    attach,
    open: () => startVerification(),
    close: () => closeModal(),
    configure: (opts) => { state.cfg = mergeConfig(state.cfg, opts || {}); },
    get config() { return { ...state.cfg }; }
  };

  // Auto-init on DOM ready if script tag has data-auto-init
  function autoInitIfRequested(): void {
    const current = document.currentScript as HTMLScriptElement | null;
    const auto = current && current.getAttribute('data-auto-init');
    if (auto === 'false') return;
    init({});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInitIfRequested);
  else autoInitIfRequested();

  // Expose globally (runtime assignment; no ambient typing to avoid module conversion)
  (window as any).PIDVerifier = PIDVerifier;
})();
