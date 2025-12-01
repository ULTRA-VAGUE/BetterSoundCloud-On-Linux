// Last.fm Scrobbler for BetterSoundCloud (minimal, clean version)
(function () {
  if (window.__BSC_LASTFM_LOADED__) {
    try { console.log('BSCReceive|LastFM|Already loaded'); } catch (_) {}
    return;
  }
  window.__BSC_LASTFM_LOADED__ = true;

  // Log helper (defined first so it can be used everywhere)
  function log(msg) {
    console.log('BSCReceive|LastFM|' + msg);
  }

  // Users must set their credentials via the Last.fm settings panel in BetterSoundCloud
  const LASTFM_API_KEY = localStorage.getItem('lastfm_api_key') || '';
  const LASTFM_SHARED_SECRET = localStorage.getItem('lastfm_shared_secret') || '';
  
  // Check if credentials are configured
  if (!LASTFM_API_KEY || !LASTFM_SHARED_SECRET) {
    log('No API credentials configured. Please go to Settings > Last.fm to enter your API key and secret.');
    log('Get your credentials at: https://www.last.fm/api/account/create');
    return;
  }

  /**
   * MD5 Hash Implementation
   * 
   * Pure JavaScript implementation of MD5 hashing algorithm.
   * Required for Last.fm API signature generation as per their authentication specification.
   * 
   * @param {string} string - Input string to hash
   * @returns {string} MD5 hash in hexadecimal format
   */
  function generateMD5Hash(string) {
    function safeAdd(x, y) {
      const lsw = (x & 0xffff) + (y & 0xffff);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }
    function bitRotateLeft(num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt));
    }
    function md5cmn(q, a, b, x, s, t) {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a, b, c, d, x, s, t) {
      return md5cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function md5gg(a, b, c, d, x, s, t) {
      return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function md5hh(a, b, c, d, x, s, t) {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a, b, c, d, x, s, t) {
      return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function binlMD5(x, len) {
      x[len >> 5] |= 0x80 << (len % 32);
      x[((len + 64) >>> 9 << 4) + 14] = len;
      let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
      for (let i = 0; i < x.length; i += 16) {
        const olda = a, oldb = b, oldc = c, oldd = d;
        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
      }
      return [a, b, c, d];
    }
    function binl2hex(binarray) {
      const hexTab = '0123456789abcdef';
      let str = '';
      for (let i = 0; i < binarray.length * 4; i++) {
        str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
               hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
      }
      return str;
    }
    function str2binl(str) {
      const bin = [];
      for (let i = 0; i < str.length * 8; i += 8) {
        bin[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << (i % 32);
      }
      return bin;
    }
    const utf8 = unescape(encodeURIComponent(string));
    return binl2hex(binlMD5(str2binl(utf8), utf8.length * 8));
  }

  /**
   * Generate API signature for Last.fm authentication
   * 
   * Creates MD5 signature according to Last.fm Web API specification:
   * 1. Sort parameters alphabetically by key
   * 2. Concatenate key+value pairs
   * 3. Append shared secret
   * 4. Generate MD5 hash
   * 
   * @param {Object} parameters - API request parameters
   * @returns {string} Generated API signature
   */
  function buildApiSig(params) {
    const keys = Object.keys(params)
      .filter(k => k !== 'format' && k !== 'callback' && k !== 'api_sig')
      .sort();
    let base = '';
    for (const k of keys) base += k + params[k];
    base += LASTFM_SHARED_SECRET;
    return generateMD5Hash(base);
  }

  /**
   * Retrieve stored session key from localStorage
   * @returns {string} Session key or empty string if not found
   */
  function getSessionKey() {
    return localStorage.getItem('lastfm_session_key') || '';
  }

  const LastFM = {
    async getToken() {
      try {
        const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=auth.gettoken&api_key=${LASTFM_API_KEY}&format=json`);
        const data = await res.json();
        if (!data || !data.token) {
          log('Error getting token: ' + (data && data.message || 'no token in response'));
          return null;
        }
        log('Token received');
        return data.token;
      } catch (e) {
        log('Error getting token: ' + e.message);
        return null;
      }
    },

    async getSession(token) {
      try {
        const cleaned = (token || '').toString().trim();
        if (!cleaned) {
          log('Error getting session: empty token');
          return null;
        }
        const body = {
          method: 'auth.getSession',
          api_key: LASTFM_API_KEY,
          token: cleaned,
          format: 'json'
        };
        const api_sig = buildApiSig(body);
        const params = new URLSearchParams({ ...body, api_sig });
        const res = await fetch('https://ws.audioscrobbler.com/2.0/?', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const data = await res.json();
        if (data && data.error) {
          log('APIError|getSession|' + data.error + '|' + data.message);
          return null;
        }
        if (!data || !data.session) {
          log('Error getting session: no session in response');
          return null;
        }
        localStorage.setItem('lastfm_session_key', data.session.key);
        localStorage.setItem('lastfm_username', data.session.name || '');
        log('Authenticated as ' + data.session.name);
        return data.session.key;
      } catch (e) {
        log('Error getting session: ' + e.message);
        return null;
      }
    },

    async updateNowPlaying(track) {
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        log('Not authenticated. Cannot update now playing.');
        return;
      }
      const body = {
        method: 'track.updateNowPlaying',
        artist: track.artist,
        track: track.title,
        duration: Math.floor(track.duration / 1000),
        api_key: LASTFM_API_KEY,
        sk: sessionKey,
        format: 'json'
      };
      const api_sig = buildApiSig(body);
      const params = new URLSearchParams({ ...body, api_sig });
      try {
        const res = await fetch('https://ws.audioscrobbler.com/2.0/?', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const data = await res.json().catch(() => null);
        if (data && data.error) log('APIError|updateNowPlaying|' + data.error + '|' + data.message);
        log('Now playing: ' + track.artist + ' - ' + track.title);
      } catch (e) {
        log('Error updating now playing: ' + e.message);
      }
    },

    async scrobble(track) {
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        log('Not authenticated. Cannot scrobble.');
        return;
      }
      const body = {
        method: 'track.scrobble',
        artist: track.artist,
        track: track.title,
        timestamp: Math.floor(track.startTime / 1000),
        api_key: LASTFM_API_KEY,
        sk: sessionKey,
        format: 'json'
      };
      const api_sig = buildApiSig(body);
      const params = new URLSearchParams({ ...body, api_sig });
      try {
        const res = await fetch('https://ws.audioscrobbler.com/2.0/?', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const data = await res.json().catch(() => null);
        if (data && data.error) log('APIError|scrobble|' + data.error + '|' + data.message);
        log('Scrobbled: ' + track.artist + ' - ' + track.title);
      } catch (e) {
        log('Error scrobbling: ' + e.message);
      }
    }
  };

  // Simple DOM polling for SoundCloud
  function getCurrentTrackFromDom() {
    try {
      const playButton = document.querySelector('.playControls__elements .playControl');
      const titleNode = document.querySelector('.playbackSoundBadge__title');
      const artistNode = document.querySelector('.playbackSoundBadge__lightLink');
      const durationSpans = document.querySelectorAll('.playbackTimeline__duration span');
      const titleText = titleNode && titleNode.innerText ? titleNode.innerText.split('\n')[1] : null;
      const artist = artistNode && artistNode.innerText || null;
      if (!titleText || !artist) return null;
      const durationText = durationSpans[1] && durationSpans[1].innerText;
      let durationMs = 0;
      if (durationText) {
        const parts = durationText.split(':').map(Number).reverse();
        durationMs = parts.reduce((total, p, idx) => total + p * Math.pow(60, idx), 0) * 1000;
      }
      const isPlaying = !!(playButton && playButton.classList.contains('playing'));
      return {
        title: titleText,
        artist,
        duration: durationMs,
        isPlaying
      };
    } catch (e) {
      log('Error reading DOM: ' + e.message);
      return null;
    }
  }

  let tracked = null;

  function pollTrack() {
    const info = getCurrentTrackFromDom();
    if (!info) return;
    const isNew = !tracked || tracked.title !== info.title || tracked.artist !== info.artist;

    if (isNew && info.isPlaying) {
      if (tracked && tracked.title && tracked.artist && tracked.startTime) {
        const playedFor = Date.now() - tracked.startTime;
        if (playedFor > Math.min(tracked.duration * 0.5, 4 * 60 * 1000)) {
          LastFM.scrobble(tracked);
        }
      }
      tracked = {
        title: info.title,
        artist: info.artist,
        duration: info.duration,
        startTime: Date.now(),
        isPlaying: true
      };
      LastFM.updateNowPlaying(tracked);
    } else if (tracked && !isNew && tracked.isPlaying !== info.isPlaying) {
      tracked.isPlaying = info.isPlaying;
      if (!info.isPlaying) {
        const playedFor = Date.now() - tracked.startTime;
        if (playedFor > Math.min(tracked.duration * 0.5, 4 * 60 * 1000)) {
          LastFM.scrobble(tracked);
        }
      }
    }
  }

  function init() {
    log('Plugin loaded');

    // Clear any stale pending token from previous failed auth attempts
    localStorage.removeItem('lastfm_pending_token');

    // Define helper if possible (best-effort)
    try {
      window.BSC_LFM_authStart = async () => {
        localStorage.removeItem('lastfm_session_key');
        localStorage.removeItem('lastfm_username');
        localStorage.removeItem('lastfm_pending_token');
        const token = await LastFM.getToken();
        if (!token) { log('AuthStart failed: no token'); return; }
        localStorage.setItem('lastfm_pending_token', token);
        const url = `https://www.last.fm/api/auth/?api_key=${LASTFM_API_KEY}&token=${token}`;
        try {
          const electron = (typeof require !== 'undefined') ? require('electron') : null;
          if (electron && electron.shell && electron.shell.openExternal) {
            electron.shell.openExternal(url);
          } else {
            window.open(url, '_blank');
          }
        } catch (_) { window.open(url, '_blank'); }
        log('Auth started; approve in browser, then I will poll for session');
        let tries = 0;
        const interval = setInterval(async () => {
          tries++;
          const sessionKey = getSessionKey();
          if (sessionKey) {
            clearInterval(interval);
            log('Connected as ' + (localStorage.getItem('lastfm_username') || 'unknown'));
            return;
          }
          const pending = localStorage.getItem('lastfm_pending_token');
          if (!pending) return;
          const session = await LastFM.getSession(pending);
          if (session) {
            clearInterval(interval);
            log('Connected as ' + (localStorage.getItem('lastfm_username') || 'unknown'));
          } else if (tries % 5 === 0) {
            log('Auth polling… (' + tries + ')');
          }
          if (tries > 120) {
            clearInterval(interval);
            log('Auth timeout; run BSC_LFM_authStart() again to retry');
          }
        }, 1000);
      };
    } catch (_) {}

    // Auto-start auth on first load if not authenticated
    if (!getSessionKey()) {
      log('Not authenticated. Starting Last.fm auth automatically.');
      try {
        // Fire and forget; same logic as helper
        window.BSC_LFM_authStart && window.BSC_LFM_authStart();
      } catch (_) {}
    } else {
      log('Already authenticated as ' + (localStorage.getItem('lastfm_username') || 'unknown'));
    }

    if (/soundcloud\.com$/i.test(location.hostname)) {
      setInterval(pollTrack, 1000);
    }
  }

  init();
})();