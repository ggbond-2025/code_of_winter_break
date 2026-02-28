Router.register('login', function (app) {
  app.innerHTML = `
    <div class="login-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);padding:20px;">
      <div class="login-box" style="background:var(--surface);padding:48px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.08);width:100%;max-width:440px;animation:scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="text-align:center;margin-bottom:40px;">
          <div style="width:64px;height:64px;background:var(--primary);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 16px rgba(var(--primary-rgb),0.3);transform:rotate(-10deg);">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="white" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <h2 style="margin:0;font-size:28px;font-weight:800;color:var(--text-primary);letter-spacing:1px;">校园失物招领系统</h2>
          <p style="margin:8px 0 0;color:var(--text-secondary);font-size:15px;">欢迎回来，请登录您的账号</p>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:24px;">
          <div class="login-row" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:600;color:var(--text-primary);">用户名</label>
            <div style="position:relative;">
              <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-secondary);">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
              <input id="username" style="width:100%;padding:14px 16px 14px 44px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-color);font-size:15px;color:var(--text-primary);outline:none;transition:all 0.2s;box-sizing:border-box;" placeholder="请输入用户名" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
            </div>
          </div>
          
          <div class="login-row" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:600;color:var(--text-primary);">密码</label>
            <div style="position:relative;">
              <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-secondary);">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </span>
              <input id="password" type="password" style="width:100%;padding:14px 16px 14px 44px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-color);font-size:15px;color:var(--text-primary);outline:none;transition:all 0.2s;box-sizing:border-box;" placeholder="请输入密码" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
            </div>
          </div>
          
          <div class="login-actions" style="display:flex;align-items:center;justify-content:space-between;margin-top:-8px;">
            <label class="remember" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:var(--text-secondary);user-select:none;">
              <input type="checkbox" id="rememberMe" checked style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" />
              记住我
            </label>
          </div>
          
          <button id="loginBtn" class="btn-login" style="width:100%;padding:16px;background:var(--primary);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 8px 16px rgba(var(--primary-rgb),0.2);transition:all 0.3s;margin-top:8px;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 24px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 8px 16px rgba(var(--primary-rgb),0.2)'">登 录</button>
        </div>
        <p id="loginMsg" class="msg" style="text-align:center;margin-top:24px;min-height:20px;"></p>
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
    <div class="changepwd-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);padding:20px;">
      <div class="changepwd-box" style="background:var(--surface);padding:48px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.08);width:100%;max-width:440px;position:relative;animation:scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <span class="exit-icon" id="cpExit" title="退出登录" style="position:absolute;top:24px;right:24px;width:40px;height:40px;border-radius:50%;background:var(--bg-color);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:all 0.2s;" onmouseover="this.style.background='var(--danger-light)';this.style.color='var(--danger)';this.style.transform='rotate(90deg)'" onmouseout="this.style.background='var(--bg-color)';this.style.color='var(--text-secondary)';this.style.transform='none'">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </span>
        
        <div style="text-align:center;margin-bottom:40px;">
          <div style="width:64px;height:64px;background:rgba(var(--warning-rgb),0.1);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:var(--warning);">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h2 style="margin:0;font-size:24px;font-weight:700;color:var(--text-primary);">首次登录修改密码</h2>
          <p style="margin:8px 0 0;color:var(--text-secondary);font-size:14px;">为了您的账号安全，请设置一个新的密码</p>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:24px;">
          <div class="login-row" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:600;color:var(--text-primary);">新的密码</label>
            <div style="position:relative;">
              <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-secondary);">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              </span>
              <input id="newPwd" type="password" style="width:100%;padding:14px 16px 14px 44px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-color);font-size:15px;color:var(--text-primary);outline:none;transition:all 0.2s;box-sizing:border-box;" placeholder="请输入新密码（至少6位）" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
            </div>
          </div>
          
          <div class="login-row" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:600;color:var(--text-primary);">确认密码</label>
            <div style="position:relative;">
              <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--text-secondary);">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </span>
              <input id="newPwd2" type="password" style="width:100%;padding:14px 16px 14px 44px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-color);font-size:15px;color:var(--text-primary);outline:none;transition:all 0.2s;box-sizing:border-box;" placeholder="请再次输入新密码" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
            </div>
          </div>
          
          <button id="changePwdBtn" class="btn-primary" style="width:100%;padding:16px;background:var(--primary);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 8px 16px rgba(var(--primary-rgb),0.2);transition:all 0.3s;margin-top:16px;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 24px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 8px 16px rgba(var(--primary-rgb),0.2)'">确认修改</button>
        </div>
        <p id="cpMsg" class="msg" style="text-align:center;margin-top:24px;min-height:20px;"></p>
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
    <div class="changepwd-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);padding:20px;">
      <div class="changepwd-box" style="background:var(--surface);padding:40px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.08);width:100%;max-width:600px;animation:scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:64px;height:64px;background:rgba(var(--primary-rgb),0.1);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:var(--primary);">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <h2 style="margin:0;font-size:24px;font-weight:700;color:var(--text-primary);">系统公告</h2>
          <p style="margin:8px 0 0;color:var(--text-secondary);font-size:14px;">请阅读以下重要通知</p>
        </div>
        
        <div id="annoList" style="max-height:400px;overflow-y:auto;padding-right:8px;display:flex;flex-direction:column;gap:16px;margin-bottom:32px;"></div>
        
        <button id="annoConfirm" class="btn-primary" style="width:100%;padding:16px;background:var(--primary);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 8px 16px rgba(var(--primary-rgb),0.2);transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:8px;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 24px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 8px 16px rgba(var(--primary-rgb),0.2)'">
          我已阅读，进入系统
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  `;

  try {
    const data = await api('/api/announcements?scope=GLOBAL');
    const list = data.data || [];
    document.getElementById('annoList').innerHTML = list.length === 0
      ? '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);background:var(--bg-color);border-radius:12px;border:1px dashed var(--border-color);">暂无公告</div>'
      : list.map(a => `
        <div style="background:var(--bg-color);border:1px solid var(--border-color);border-radius:16px;padding:24px;transition:all 0.2s;" onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
          <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <span style="width:4px;height:16px;background:var(--primary);border-radius:2px;"></span>
            ${esc(a.title)}
          </h3>
          <p style="margin:0;font-size:14px;line-height:1.6;color:var(--text-secondary);white-space:pre-wrap;">${esc(a.content)}</p>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('annoList').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);background:var(--bg-color);border-radius:12px;border:1px dashed var(--border-color);">暂无公告</div>';
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
    <div class="changepwd-page" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);padding:20px;">
      <div class="changepwd-box" style="background:var(--surface);padding:40px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.08);width:100%;max-width:600px;animation:scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:64px;height:64px;background:rgba(var(--primary-rgb),0.1);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:var(--primary);">
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <h2 style="margin:0;font-size:24px;font-weight:700;color:var(--text-primary);">系统通知</h2>
          <p style="margin:8px 0 0;color:var(--text-secondary);font-size:14px;">您有新的未读消息</p>
        </div>
        
        <div id="notifyList" style="max-height:400px;overflow-y:auto;padding-right:8px;display:flex;flex-direction:column;gap:16px;margin-bottom:32px;"></div>
        
        <button id="notifyConfirm" class="btn-primary" style="width:100%;padding:16px;background:var(--primary);color:white;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 8px 16px rgba(var(--primary-rgb),0.2);transition:all 0.3s;display:flex;align-items:center;justify-content:center;gap:8px;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 24px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 8px 16px rgba(var(--primary-rgb),0.2)'">
          我已阅读，进入系统
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    </div>
  `;

  try {
    const data = await api('/api/notifications?page=0&size=8');
    const list = (data.data && data.data.content) ? data.data.content : (data.data || []);
    document.getElementById('notifyList').innerHTML = list.length === 0
      ? '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);background:var(--bg-color);border-radius:12px;border:1px dashed var(--border-color);">暂无系统通知</div>'
      : list.map(n => `
        <div style="background:var(--bg-color);border:1px solid var(--border-color);border-radius:16px;padding:20px;transition:all 0.2s;border-left:4px solid var(--primary);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:var(--text-primary);">${esc(n.content || '')}</p>
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:12px;">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            发布于：${fmtTime(n.createdAt)}
          </div>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('notifyList').innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--text-secondary);background:var(--bg-color);border-radius:12px;border:1px dashed var(--border-color);">暂无系统通知</div>';
  }

  document.getElementById('notifyConfirm').onclick = () => {
    if (role === 'ADMIN') Router.go('admin');
    else Router.go('home');
  };
});
