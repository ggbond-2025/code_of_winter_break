window.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) {
    Router.start('login');
  } else if (Auth.isFirst()) {
    Router.start('changePassword');
  } else {
    const role = Auth.getRole();
    if (role === 'SUPER_ADMIN') Router.start('superHome');
    else if (role === 'ADMIN') Router.start('adminHome');
    else Router.start('home');
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  const parts = hash.split('/');
  const name = parts[0];
  const p = {};
  if (parts[1]) {
    if (name === 'publishForm') p.type = parts[1];
    else if (name === 'chatDetail') {
      p.claimId = parts[1];
      if (parts[2]) p.peerId = parts[2];
    } else if (name === 'claimForm') p.id = parts[1];
    else p.id = parts[1];
  }
  if (name && Router.routes[name] && name !== Router.current) {
    Router.go(name, p);
  }
});
