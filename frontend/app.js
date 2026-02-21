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
  const id = parts[1];
  if (name && Router.routes[name] && name !== Router.current) {
    Router.go(name, id ? { id } : {});
  }
});
