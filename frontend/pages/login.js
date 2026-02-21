Router.register('login', function (app) {
  app.innerHTML = `
    <div class="login-page">
      <div class="login-box">
        <h2>校园失物招领系统</h2>
        <div class="login-row">
          <label>用户名</label>
          <input id="username" />
        </div>
        <div class="login-row">
          <label>密码</label>
          <input id="password" type="password" />
        </div>
        <div class="login-actions">
          <button id="loginBtn" class="btn-login">登 录</button>
          <label class="remember"><input type="checkbox" id="rememberMe" checked />记住我</label>
        </div>
        <p id="loginMsg" class="msg"></p>
      </div>
    </div>
  `;

  const msg = (text, ok) => {
    const el = document.getElementById('loginMsg');
    el.textContent = text;
    el.className = ok ? 'msg msg-ok' : 'msg msg-err';
  };

  document.getElementById('loginBtn').onclick = async () => {
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('username').value,
          password: document.getElementById('password').value
        })
      });
      Auth.save(data.data);
      if (data.data.firstLogin) {
        Router.go('changePassword');
      } else {
        Router.go('announcements');
      }
    } catch (e) { msg(e.message, false); }
  };

  document.getElementById('password').onkeydown = e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  };
});

Router.register('changePassword', function (app) {
  app.innerHTML = `
    <div class="changepwd-page">
      <div class="changepwd-box">
        <span class="exit-icon" id="cpExit" title="退出登录">&#x27A1;</span>
        <h2>修改密码</h2>
        <hr style="margin-bottom:30px;border:none;border-top:1px solid #ddd"/>
        <div class="login-row" style="justify-content:center">
          <label style="width:80px">新的密码:</label>
          <input id="newPwd" type="password" style="width:260px" />
        </div>
        <div class="login-row" style="justify-content:center">
          <label style="width:80px">重新输入:</label>
          <input id="newPwd2" type="password" style="width:260px" />
        </div>
        <div style="text-align:center;margin-top:40px">
          <button id="changePwdBtn" class="btn-primary" style="width:240px;padding:12px">提 交</button>
        </div>
        <p id="cpMsg" class="msg" style="text-align:center"></p>
      </div>
    </div>
  `;

  document.getElementById('cpExit').onclick = () => { Auth.clear(); Router.go('login'); };

  document.getElementById('changePwdBtn').onclick = async () => {
    const newPwd = document.getElementById('newPwd').value;
    if (newPwd !== document.getElementById('newPwd2').value) {
      document.getElementById('cpMsg').textContent = '两次密码不一致';
      document.getElementById('cpMsg').className = 'msg msg-err';
      return;
    }
    if (newPwd.length < 6) {
      document.getElementById('cpMsg').textContent = '密码至少6位';
      document.getElementById('cpMsg').className = 'msg msg-err';
      return;
    }
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword: '', newPassword: newPwd })
      });
      Auth.clearFirst();
      Router.go('announcements');
    } catch (e) {
      document.getElementById('cpMsg').textContent = e.message;
      document.getElementById('cpMsg').className = 'msg msg-err';
    }
  };
});

Router.register('announcements', async function (app) {
  app.innerHTML = `
    <div class="changepwd-page">
      <div class="changepwd-box" style="width:560px">
        <h2>系统公告</h2>
        <hr style="margin-bottom:20px;border:none;border-top:1px solid #ddd"/>
        <div id="annoList" style="max-height:400px;overflow-y:auto"></div>
        <div style="text-align:center;margin-top:20px">
          <button id="annoConfirm" class="btn-primary" style="width:240px;padding:12px">我已阅读，进入系统</button>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await api('/api/announcements?scope=GLOBAL');
    const list = data.data || [];
    document.getElementById('annoList').innerHTML = list.length === 0
      ? '<p class="empty">暂无公告</p>'
      : list.map(a => `<div style="border:1px solid #ddd;padding:12px;margin-bottom:10px"><h3 style="text-align:center;font-size:15px">${esc(a.title)}</h3><p style="font-size:13px;line-height:1.6">${esc(a.content)}</p></div>`).join('');
  } catch (e) {
    document.getElementById('annoList').innerHTML = '<p class="empty">暂无公告</p>';
  }

  document.getElementById('annoConfirm').onclick = () => {
    const role = Auth.getRole();
    if (role === 'SUPER_ADMIN') Router.go('superAdmin');
    else Router.go('systemNotifications');
  };
});

Router.register('systemNotifications', async function (app) {
  const role = Auth.getRole();
  if (role === 'SUPER_ADMIN') {
    Router.go('superAdmin');
    return;
  }
  app.innerHTML = `
    <div class="changepwd-page">
      <div class="changepwd-box" style="width:560px">
        <h2>系统通知</h2>
        <hr style="margin-bottom:20px;border:none;border-top:1px solid #ddd"/>
        <div id="notifyList" style="max-height:400px;overflow-y:auto"></div>
        <div style="text-align:center;margin-top:20px">
          <button id="notifyConfirm" class="btn-primary" style="width:240px;padding:12px">我已阅读，进入系统</button>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await api('/api/notifications');
    const list = data.data || [];
    document.getElementById('notifyList').innerHTML = list.length === 0
      ? '<p class="empty">暂无系统通知</p>'
      : list.map(n => `<div style="border:1px solid #ddd;padding:12px;margin-bottom:10px"><p style="line-height:1.8">${esc(n.content || '')}</p><div style="text-align:right;color:#888;font-size:12px">发布于：${fmtTime(n.createdAt)}</div></div>`).join('');
  } catch (e) {
    document.getElementById('notifyList').innerHTML = '<p class="empty">暂无系统通知</p>';
  }

  document.getElementById('notifyConfirm').onclick = () => {
    if (role === 'ADMIN') Router.go('admin');
    else Router.go('home');
  };
});
