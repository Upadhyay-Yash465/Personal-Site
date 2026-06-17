(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // YOUR ALBUMS — fill these in
  // cover/preview filled at runtime via Spotify oEmbed + iTunes.
  // ─────────────────────────────────────────────────────────────
  const ALBUMS = [
    { title: 'The College Dropout', artist: 'Kanye West',     trackName: 'All Falls Down',        cover: '', preview: '', spotifyUrl: 'https://open.spotify.com/track/5SkRLpaGtvYPhw02vZhQQ9' },
    { title: 'Hasee Toh Phasee',    artist: 'Vishal-Shekhar', trackName: 'Ishq Bulava',           cover: '', preview: '', spotifyUrl: 'https://open.spotify.com/track/1fkjRQA8wXPPyxqYLbxuqy' },
    { title: 'DAMN.',               artist: 'Kendrick Lamar', trackName: 'LOVE. FEAT. ZACARI.',   cover: '', preview: '', spotifyUrl: 'https://open.spotify.com/track/6PGoSes0D9eUDeeAafB2As' },
    { title: 'Fetty Wap',           artist: 'Fetty Wap',      trackName: 'Right Back to You',     cover: '', preview: '', spotifyUrl: 'https://open.spotify.com/track/0MaPhRfvS76NGIHTO7tUwh' },
    { title: 'Weathered',           artist: 'Creed',          trackName: 'One Last Breath',       cover: '', preview: '', spotifyUrl: 'https://open.spotify.com/track/42T2QQv3xgBlpQxaSP7lnK' },
    { title: 'My Way',              artist: 'Frank Sinatra',  trackName: 'My Way',                cover: '', preview: '', spotifyUrl: 'https://open.spotify.com/track/2YkIDPL5lGhRhomCq4S2RO' },
  ];

  const SPOTIFY_CLIENT_ID = '73740a313d01462180de4f4374c8c36f';
  const SPOTIFY_REDIRECT  = window.location.origin + window.location.pathname;
  const SPOTIFY_SCOPE     = 'user-read-playback-state';

  // ── DOM refs ──────────────────────────────────────────────────
  const musicOuter    = document.getElementById('music-outer');
  const musicList     = document.getElementById('music-carousel');
  const booksList     = document.getElementById('books-carousel');
  const audio         = document.getElementById('preview-audio');
  const globalPlayBtn = document.getElementById('global-play-btn');

  const metaAlbum  = document.getElementById('meta-album');
  const metaSong   = document.getElementById('meta-song');
  const metaArtist = document.getElementById('meta-artist');

  const PLAY_SVG  = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"/></svg>`;
  const PAUSE_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="5" height="18" rx="1"/><rect x="14" y="3" width="5" height="18" rx="1"/></svg>`;

  let currentTrackIdx = -1;
  let isPlaying       = false;

  // ── Render music carousel ─────────────────────────────────────
  function renderMusicCards() {
    if (!musicList) return;
    musicList.innerHTML = '';
    const VINYL = `<svg viewBox="0 0 24 24" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 3"/></svg>`;
    ALBUMS.forEach((album, i) => {
      const li = document.createElement('li');
      li.className   = 'carousel-card';
      li.dataset.idx = i;
      if (album.spotifyUrl) li.dataset.url = album.spotifyUrl;
      const cover = album.cover
        ? `<img class="cover-art" src="${album.cover}" alt="${album.title}" loading="lazy">`
        : `<div class="cover-thumb">${VINYL}</div>`;
      li.innerHTML = `<div class="cover-wrap">${cover}</div>`;
      musicList.appendChild(li);
    });
  }

  function updateMeta(idx) {
    const album = ALBUMS[idx];
    if (!album) return;
    if (metaAlbum)  metaAlbum.textContent  = album.title     || '—';
    if (metaSong)   metaSong.textContent   = album.trackName || '—';
    if (metaArtist) metaArtist.textContent = album.artist    || '—';
  }

  // ── Audio (iTunes preview clips) ──────────────────────────────
  function updatePlayBtn() {
    if (!globalPlayBtn) return;
    globalPlayBtn.innerHTML = isPlaying ? PAUSE_SVG : PLAY_SVG;
    globalPlayBtn.ariaLabel = isPlaying ? 'Pause' : 'Play';
  }

  function playPreview(album, idx) {
    if (!audio) return;
    if (!album?.preview) { currentTrackIdx = idx; return; }
    if (audio.src !== album.preview) { audio.src = album.preview; audio.currentTime = 0; }
    currentTrackIdx = idx;
    audio.volume = 0.65;
    audio.play().then(() => { isPlaying = true; updatePlayBtn(); }).catch(() => {});
  }

  if (audio) audio.addEventListener('ended', () => { isPlaying = false; updatePlayBtn(); });

  async function fetchPreviews() {
    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    await Promise.all(ALBUMS.map(async (album, i) => {
      try {
        const q   = encodeURIComponent(`${album.trackName} ${album.artist}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=10&media=music`);
        const dat = await res.json();
        const candidates = (dat.results || []).filter(r => r.previewUrl);
        const tn = norm(album.trackName);
        const an = norm(album.artist);
        const hit = candidates.find(r =>
          norm(r.trackName).includes(tn.slice(0, 4)) &&
          norm(r.artistName).includes(an.slice(0, 4))
        );
        if (hit?.previewUrl) ALBUMS[i].preview = hit.previewUrl;
      } catch (_) {}
    }));
    if (currentTrackIdx >= 0) updateMeta(currentTrackIdx);
  }

  // ── Carousel: center detection + drag with snap ───────────────
  function initCarousel(listEl, scrollContainer, onActivate) {
    if (!listEl || !scrollContainer) return;
    let activeCard = null;
    const getCards = () => listEl.querySelectorAll('.carousel-card');

    function findNearest() {
      const cx = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;
      let best = null, bestDist = Infinity;
      getCards().forEach(card => {
        const dist = Math.abs((card.offsetLeft + card.offsetWidth / 2) - cx);
        if (dist < bestDist) { bestDist = dist; best = card; }
      });
      return best;
    }
    function pickCenter() {
      const best = findNearest();
      if (best && best !== activeCard) {
        if (activeCard) activeCard.classList.remove('is-active');
        best.classList.add('is-active');
        activeCard = best;
        onActivate(parseInt(best.dataset.idx, 10), best);
      }
    }
    function snapToNearest() {
      const best = findNearest();
      if (!best) return;
      const target = best.offsetLeft + best.offsetWidth / 2 - scrollContainer.clientWidth / 2;
      scrollContainer.scrollTo({ left: target, behavior: 'smooth' });
      setTimeout(() => { scrollContainer.style.scrollSnapType = ''; }, 500);
    }

    scrollContainer.addEventListener('scroll', pickCenter, { passive: true });
    requestAnimationFrame(pickCenter);

    let isDown = false, startX = 0, startScroll = 0;
    let velX = 0, lastX = 0, lastT = 0, rafId = null;

    function momentum() {
      if (Math.abs(velX) < 0.5) { snapToNearest(); return; }
      velX *= 0.88;
      scrollContainer.scrollLeft += velX;
      rafId = requestAnimationFrame(momentum);
    }
    scrollContainer.addEventListener('mousedown', e => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      isDown = true; startX = e.pageX; startScroll = scrollContainer.scrollLeft;
      velX = 0; lastX = e.pageX; lastT = performance.now();
      scrollContainer.style.scrollSnapType = 'none';
    });
    const endDrag = () => { if (!isDown) return; isDown = false; rafId = requestAnimationFrame(momentum); };
    scrollContainer.addEventListener('mouseleave', endDrag);
    scrollContainer.addEventListener('mouseup',    endDrag);
    scrollContainer.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      scrollContainer.scrollLeft = startScroll - (e.pageX - startX) * 1.4;
      const now = performance.now();
      const dt  = now - lastT;
      if (dt > 0) velX = -(e.pageX - lastX) / dt * 12;
      lastX = e.pageX; lastT = now;
    });
  }

  function onMusicActivate(idx) {
    updateMeta(idx);
    currentTrackIdx = idx;
    if (isPlaying) playPreview(ALBUMS[idx], idx);
  }

  // ── Spotify PKCE (optional) + public oEmbed covers ────────────
  async function sha256(plain) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain));
    return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }
  function rnd(n) {
    const a = new Uint8Array(n); crypto.getRandomValues(a);
    return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'').slice(0,n);
  }
  async function exchangeCode(code) {
    const verifier = sessionStorage.getItem('sp_verifier');
    if (!verifier) return null;
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: SPOTIFY_REDIRECT, client_id: SPOTIFY_CLIENT_ID, code_verifier: verifier }),
    });
    const d = await res.json();
    if (d.access_token) {
      sessionStorage.setItem('sp_token', d.access_token);
      sessionStorage.setItem('sp_expires', Date.now() + d.expires_in * 1000);
      window.history.replaceState({}, '', window.location.pathname);
      return d.access_token;
    }
    return null;
  }
  function getToken() {
    const t = sessionStorage.getItem('sp_token');
    const e = parseInt(sessionStorage.getItem('sp_expires') || '0');
    return t && Date.now() < e - 60000 ? t : null;
  }

  async function fetchCovers() {
    if (!musicList) return;
    let changed = false;
    await Promise.all(ALBUMS.map(async (album, i) => {
      if (!album.spotifyUrl) return;
      try {
        const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(album.spotifyUrl)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.title) {
          const byIdx = data.title.lastIndexOf(' by ');
          if (byIdx !== -1) { ALBUMS[i].trackName = data.title.slice(0, byIdx); ALBUMS[i].artist = data.title.slice(byIdx + 4); }
          else { ALBUMS[i].trackName = data.title; }
        }
        if (data.thumbnail_url) ALBUMS[i].cover = data.thumbnail_url;
        changed = true;
      } catch (_) {}
    }));
    if (changed) { renderMusicCards(); initCarousel(musicList, musicOuter, onMusicActivate); updateMeta(0); }
  }

  async function enrichFromSpotify(token) {
    if (!musicList) return;
    const entries = ALBUMS.map((a, i) => {
      const m = (a.spotifyUrl || '').match(/track\/([A-Za-z0-9]+)/);
      return m ? { id: m[1], idx: i } : null;
    }).filter(Boolean);
    if (!entries.length) return;
    const res  = await fetch(`https://api.spotify.com/v1/tracks?ids=${entries.map(e => e.id).join(',')}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    (data.tracks || []).forEach((track, i) => {
      if (!track) return;
      const idx = entries[i]?.idx;
      if (idx == null) return;
      if (track.name)                    ALBUMS[idx].trackName = track.name;
      if (track.artists?.[0]?.name)      ALBUMS[idx].artist    = track.artists[0].name;
      if (track.album?.name)             ALBUMS[idx].title     = track.album.name;
      if (track.album?.images?.[0]?.url) ALBUMS[idx].cover     = track.album.images[0].url;
    });
    renderMusicCards();
    initCarousel(musicList, musicOuter, onMusicActivate);
    updateMeta(0);
  }

  async function handleOAuthReturn() {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return false;
    const token = await exchangeCode(code);
    if (token) await enrichFromSpotify(token);
    return !!token;
  }

  // ── Boot ──────────────────────────────────────────────────────
  async function boot() {
    if (musicList) {
      renderMusicCards();
      updateMeta(0);
      initCarousel(musicList, musicOuter, onMusicActivate);
      updatePlayBtn();
      globalPlayBtn?.addEventListener('click', () => {
        if (isPlaying) { audio?.pause(); isPlaying = false; updatePlayBtn(); }
        else { const idx = currentTrackIdx >= 0 ? currentTrackIdx : 0; playPreview(ALBUMS[idx], idx); }
      });
      fetchCovers();
      fetchPreviews();
      const wasReturn = await handleOAuthReturn();
      if (!wasReturn) { const token = getToken(); if (token) await enrichFromSpotify(token); }
    }

    if (booksList) {
      initCarousel(booksList, booksList.closest('.carousel-outer'), () => {});
    }
  }

  boot();
}());
