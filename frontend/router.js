const Router = {
  routes: {},
  current: null,
  params: {},

  register(name, renderFn) {
    this.routes[name] = renderFn;
  },

  go(name, params = {}) {
    if (window.__lfChatPollTimer) {
      clearInterval(window.__lfChatPollTimer);
      window.__lfChatPollTimer = null;
    }
    this.current = name;
    this.params = params;
    const app = document.getElementById('app');
    const renderFn = this.routes[name];
    if (renderFn) {
      // Do not clear app.innerHTML here, let renderFn or renderLayout handle it
      // to allow smooth transitions and layout reuse
      renderFn(app, params);
    }
    let hash = name;
    if (params.id) hash += '/' + params.id;
    else if (params.claimId) {
      hash += '/' + params.claimId;
      if (params.peerId) hash += '/' + params.peerId;
    }
    else if (params.type) hash += '/' + params.type;
    window.location.hash = hash;
  },

  start(defaultRoute) {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const parts = hash.split('/');
      const name = parts[0];
      const p = {};
      if (parts[1]) {
        if (name === 'publishForm') p.type = parts[1];
        else if (name === 'chatDetail') {
          p.claimId = parts[1];
          if (parts[2]) p.peerId = parts[2];
        }
        else if (name === 'claimForm') p.id = parts[1];
        else p.id = parts[1];
      }
      if (this.routes[name]) {
        this.go(name, p);
        return;
      }
    }
    this.go(defaultRoute);
  }
};
