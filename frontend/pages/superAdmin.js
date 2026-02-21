Router.register('superAdmin', function (app) {
  Router.go('superHome');
});

Router.register('superHome', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superHome');
  main.innerHTML = `<h2 style="text-align:center;margin-top:60px"><b>系统管理员 ${esc(Auth.getUser())}，欢迎登录失物招领系统</b></h2>`;
});

Router.register('superGlobal', async function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superGlobal');
  main.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" data-gtab="overview">信息总览</button>
      <button class="tab-btn" data-gtab="params">修改参数</button>
    </div>
    <div id="globalContent"></div>
  `;

  let currentTab = 'overview';
  document.querySelectorAll('[data-gtab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-gtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.gtab;
      renderTab();
    };
  });

  async function renderTab() {
    const box = document.getElementById('globalContent');
    if (currentTab === 'overview') {
      box.innerHTML = '<p>加载中...</p>';
      try {
        const data = await api('/api/admin/stats/overview');
        const s = data.data || {};
        const monthly = s.monthlyStats || [];
        const statusCounts = s.statusCounts || {};
        const rate = (s.claimRate || 0).toFixed(1);
        const pieData = [
          { label: '未匹配', value: statusCounts.APPROVED || 0, color: '#4cb8c4' },
          { label: '已匹配', value: statusCounts.MATCHED || 0, color: '#7f8c8d' },
          { label: '已认领', value: statusCounts.CLAIMED || 0, color: '#2ecc71' },
          { label: '已归档', value: statusCounts.ARCHIVED || 0, color: '#f39c12' }
        ];
        const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);

        function polar(cx, cy, r, ang) {
          const a = (ang - 90) * Math.PI / 180.0;
          return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
        }
        function arcPath(cx, cy, r, start, end) {
          const s = polar(cx, cy, r, end);
          const e = polar(cx, cy, r, start);
          const large = end - start <= 180 ? 0 : 1;
          return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
        }
        function pieSvg() {
          if (pieTotal === 0) {
            return `<svg width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="90" fill="#e0e0e0"></circle></svg>`;
          }
          let start = 0;
          const parts = pieData.map(d => {
            const angle = (d.value / pieTotal) * 360;
            const path = arcPath(110, 110, 90, start, start + angle);
            start += angle;
            return `<path d="${path}" fill="${d.color}"></path>`;
          }).join('');
          return `<svg width="220" height="220" viewBox="0 0 220 220">${parts}</svg>`;
        }

        const maxMonthly = monthly.reduce((m, x) => Math.max(m, x.total || 0), 0);
        const bars = monthly.map(m => {
          const h = maxMonthly === 0 ? 0 : Math.round((m.total || 0) / maxMonthly * 160);
          return `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="width:28px;height:${h}px;background:#000"></div>
              <div style="font-size:12px">${m.label || ''}</div>
            </div>
          `;
        }).join('');
        const monthLines = monthly.map(m => {
          return `<div>${m.label || ''}：${m.lost || 0} 条失物 + ${m.found || 0} 条寻物</div>`;
        }).join('');
        box.innerHTML = `
          <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
            <div style="background:#d9d9d9;padding:18px 22px;min-width:360px">
              <div style="font-weight:bold;margin-bottom:10px">数据统计：</div>
              <div>总发布消息数量：${s.totalItems || 0}</div>
              <div>总失物招领数量：${s.foundCount || 0}</div>
              <div>总寻物启事数量：${s.lostCount || 0}</div>
              <div>已匹配消息数量：${s.matchedItems || 0}</div>
              <div>已认领消息数量：${s.claimedItems || 0}</div>
              <div>已归档消息数量：${s.archivedItems || 0}</div>
              <div>认领率：${rate}%</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;min-width:260px">
              ${pieSvg()}
              <div style="font-weight:bold">失物招领消息状态饼图</div>
            </div>
          </div>
          <div style="margin-top:26px;font-weight:bold">近一年截至目前的统计数据</div>
          <div style="display:flex;gap:24px;align-items:flex-start;margin-top:12px;flex-wrap:wrap">
            <div style="background:#fff;border:1px solid #ddd;padding:20px 20px 16px;min-width:360px">
              <div style="display:flex;align-items:flex-end;gap:14px;height:200px">${bars}</div>
              <div style="text-align:center;margin-top:10px;font-weight:bold">每月发布消息条形图</div>
            </div>
            <div style="background:#d9d9d9;padding:16px 20px;min-width:300px">
              <div style="border:1px solid #f39c12;padding:10px 12px;line-height:1.8">${monthLines}</div>
            </div>
          </div>
        `;
      } catch (e) { box.innerHTML = `<p class="msg msg-err">${e.message}</p>`; }
    } else {
      box.innerHTML = `
        <div id="paramCards"></div>
        <div id="paramModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
          <div style="background:#fff;padding:24px;border-radius:8px;min-width:420px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div id="paramModalTitle" style="font-weight:bold;margin-bottom:12px"></div>
            <div id="paramModalBody"></div>
            <div style="display:flex;justify-content:flex-end;gap:16px;margin-top:18px">
              <button class="btn-outline" id="paramCancel">否</button>
              <button class="btn-outline" id="paramConfirm">是</button>
            </div>
          </div>
        </div>
      `;
      const modal = document.getElementById('paramModal');
      const closeModal = () => { modal.style.display = 'none'; };
      document.getElementById('paramCancel').onclick = closeModal;
      modal.addEventListener('click', function (e) { if (e.target === this) closeModal(); });

      function renderCards(cfg) {
        const cats = (cfg.categories || '').split(/[,，;]/).map(s => s.trim()).filter(Boolean);
        const normRows = [
          `是否开启违禁词检查：${cfg.forbidWordCheck ? '是' : '否'}`,
          `是否上传图片：${cfg.requireImage ? '是' : '否'}`,
          `是否填写地址：${cfg.requireLocationDetail ? '是' : '否'}`,
          `是否开启发布审核：${cfg.enableReview ? '是' : '否'}`,
          `是否开启描述字数限制：${cfg.enableDescLimit ? '是' : '否'}${cfg.enableDescLimit ? `（上限${cfg.descMaxLength || 0}字）` : ''}`
        ].map(s => `<div>${s}</div>`).join('');
        document.getElementById('paramCards').innerHTML = `
          <div class="param-card">
            <div class="param-left">
              <div class="param-title">目前物品类型：</div>
              <div>${cats.join('；') || '-'}</div>
            </div>
            <button class="btn-outline" data-edit="categories">修改</button>
          </div>
          <div class="param-card">
            <div class="param-left">
              <div class="param-title">目前认领时效：</div>
              <div>${cfg.claimExpireDays || 0}天</div>
            </div>
            <button class="btn-outline" data-edit="claimExpireDays">修改</button>
          </div>
          <div class="param-card">
            <div class="param-left">
              <div class="param-title">目前消息发布频率：</div>
              <div>每${cfg.publishCooldownMinutes || 0}分钟可发布一次</div>
            </div>
            <button class="btn-outline" data-edit="publishCooldownMinutes">修改</button>
          </div>
          <div class="param-card">
            <div class="param-left">
              <div class="param-title">目前发布内容规范：</div>
              <div style="line-height:1.8">${normRows}</div>
            </div>
            <button class="btn-outline" data-edit="norms">修改</button>
          </div>
        `;
        document.querySelectorAll('[data-edit]').forEach(btn => {
          btn.onclick = () => openModal(btn.dataset.edit, cfg);
        });
      }

      function openModal(type, cfg) {
        const title = document.getElementById('paramModalTitle');
        const body = document.getElementById('paramModalBody');
        if (type === 'categories') {
          title.textContent = '修改物品类型';
          body.innerHTML = `<textarea id="paramCategories" style="width:100%;min-height:120px">${esc(cfg.categories || '')}</textarea><div style="font-size:12px;color:#888;margin-top:6px">用逗号分隔类型</div>`;
        } else if (type === 'claimExpireDays') {
          title.textContent = '修改认领时效';
          body.innerHTML = `<input id="paramClaimDays" type="number" style="width:100%" value="${cfg.claimExpireDays || 0}" />`;
        } else if (type === 'publishCooldownMinutes') {
          title.textContent = '修改发布频率';
          body.innerHTML = `<input id="paramCooldown" type="number" style="width:100%" value="${cfg.publishCooldownMinutes || 0}" />`;
        } else {
          title.textContent = '修改发布内容规范';
          body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:8px">
              <label><input type="checkbox" id="normForbid" ${cfg.forbidWordCheck ? 'checked' : ''} /> 是否开启违禁词检查</label>
              <label><input type="checkbox" id="normImage" ${cfg.requireImage ? 'checked' : ''} /> 是否上传图片</label>
              <label><input type="checkbox" id="normLocation" ${cfg.requireLocationDetail ? 'checked' : ''} /> 是否填写地址</label>
              <label><input type="checkbox" id="normReview" ${cfg.enableReview ? 'checked' : ''} /> 是否开启发布审核</label>
              <label><input type="checkbox" id="normDescLimit" ${cfg.enableDescLimit ? 'checked' : ''} /> 是否开启描述字数限制</label>
              <input id="normDescMax" type="number" style="width:100%" value="${cfg.descMaxLength || 0}" />
            </div>
          `;
        }
        modal.style.display = 'flex';
        document.getElementById('paramConfirm').onclick = async () => {
          try {
            const update = { ...cfg };
            if (type === 'categories') {
              update.categories = document.getElementById('paramCategories').value.trim();
            } else if (type === 'claimExpireDays') {
              update.claimExpireDays = parseInt(document.getElementById('paramClaimDays').value || '0', 10);
            } else if (type === 'publishCooldownMinutes') {
              update.publishCooldownMinutes = parseInt(document.getElementById('paramCooldown').value || '0', 10);
            } else {
              update.forbidWordCheck = document.getElementById('normForbid').checked;
              update.requireImage = document.getElementById('normImage').checked;
              update.requireLocationDetail = document.getElementById('normLocation').checked;
              update.enableReview = document.getElementById('normReview').checked;
              update.enableDescLimit = document.getElementById('normDescLimit').checked;
              update.descMaxLength = parseInt(document.getElementById('normDescMax').value || '0', 10);
            }
            const saved = await api('/api/super/config', { method: 'PUT', body: JSON.stringify(update) });
            const newCfg = saved.data || update;
            renderCards(newCfg);
            closeModal();
          } catch (e) { alert(e.message); }
        };
      }

      async function loadConfig() {
        try {
          const data = await api('/api/super/config');
          const cfg = data.data || {};
          renderCards(cfg);
        } catch (e) {
          document.getElementById('paramCards').innerHTML = `<p class="empty">${e.message}</p>`;
        }
      }
      loadConfig();
    }
  }
  renderTab();
});

Router.register('superAccounts', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superAccounts');
  main.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" data-atab="accounts">账号管理</button>
      <button class="tab-btn" data-atab="notify">系统通知</button>
    </div>
    <div id="accountsContent"></div>
  `;

  let currentTab = 'accounts';
  document.querySelectorAll('[data-atab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-atab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.atab;
      renderTab();
    };
  });

  async function renderTab() {
    const box = document.getElementById('accountsContent');
    if (currentTab === 'accounts') {
      box.innerHTML = `
        <div style="margin:12px 0"><button class="btn-outline" id="addAdminBtn">添加新管理员账号</button></div>
        <div class="filter-bar">
          <label>账号类型</label><select id="uRoleFilter"><option value="">所有</option><option value="USER">用户</option><option value="ADMIN">管理员</option></select>
          <label>权限类型</label><select id="uStatusFilter"><option value="">所有</option><option value="true">可启用</option><option value="false">已封禁</option></select>
          <span class="search-icon" id="uSearchBtn">&#128269;</span>
        </div>
        <div id="userList"></div>
        <div id="uPager" class="pager"></div>
      `;

      let pg = 0;
      async function loadUsers() {
        const role = document.getElementById('uRoleFilter').value;
        try {
          const data = await api(`/api/super/users?role=${role}&page=${pg}&size=10`);
          const page = data.data;
          const list = page.content || [];
          document.getElementById('userList').innerHTML = list.length === 0
            ? '<p class="empty">暂无用户</p>'
            : list.map(u => `
              <div class="account-card">
                <div class="account-info">
                  <div><b>账号名：</b>${esc(u.username)}</div>
                  <div><b>账号类型：</b>${u.role === 'ADMIN' ? '管理员' : u.role === 'SUPER_ADMIN' ? '系统管理员' : '用户-' + (esc(u.realName) || '学生')}</div>
                  <div><b>所属地区：</b>${esc(u.region || '屏峰')}</div>
                  <div><b>账号权限：</b>${u.enabled ? '可启用' : '已封禁'}</div>
                  ${u.complaintCount ? `<div><b>遭投诉次数：</b>${u.complaintCount}次</div>` : ''}
                </div>
                <button class="btn-outline" data-toggle="${u.id}" data-enabled="${u.enabled}">${u.enabled ? '封禁' : '解封'}</button>
              </div>
            `).join('');

          document.querySelectorAll('[data-toggle]').forEach(b => {
            b.onclick = async () => {
              try { await api(`/api/super/users/${b.dataset.toggle}/toggle`, { method: 'PUT' }); loadUsers(); }
              catch (e) { alert(e.message); }
            };
          });

          renderPager(document.getElementById('uPager'), pg, page.totalPages || 1, p => { pg = p; loadUsers(); });
        } catch (e) {
          document.getElementById('userList').innerHTML = `<p class="empty">${e.message}</p>`;
        }
      }

      document.getElementById('uSearchBtn').onclick = () => { pg = 0; loadUsers(); };
      ['uRoleFilter', 'uStatusFilter'].forEach(id => {
        document.getElementById(id).onchange = () => { pg = 0; loadUsers(); };
      });

      document.getElementById('addAdminBtn').onclick = () => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal-box">
            <span class="close-btn" id="closeModal">&times;</span>
            <h3>创建新管理员</h3>
            <div class="modal-row"><label>用户名</label><input id="newAdminName" /></div>
            <div class="modal-row"><label>密码</label><input id="newAdminPwd" type="password" /></div>
            <div class="modal-row"><label>所属校区</label><select id="newAdminRegion"><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select></div>
            <div style="display:flex;gap:20px;justify-content:center;margin-top:20px">
              <button class="btn-outline" id="confirmCreate">确认创建</button>
              <button class="btn-outline" id="cancelCreate">取消</button>
            </div>
            <p id="createMsg" class="msg" style="text-align:center"></p>
          </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('closeModal').onclick = () => overlay.remove();
        document.getElementById('cancelCreate').onclick = () => overlay.remove();
        document.getElementById('confirmCreate').onclick = async () => {
          try {
            await api('/api/super/users', {
              method: 'POST',
              body: JSON.stringify({
                username: document.getElementById('newAdminName').value,
                password: document.getElementById('newAdminPwd').value || '123456',
                realName: '',
                region: document.getElementById('newAdminRegion').value
              })
            });
            overlay.remove();
            alert('创建成功！点击任意处返回');
            loadUsers();
          } catch (e) {
            document.getElementById('createMsg').textContent = e.message;
            document.getElementById('createMsg').className = 'msg msg-err';
          }
        };
      };

      loadUsers();
    } else {
      box.innerHTML = `
        <div style="display:flex;gap:40px;align-items:flex-start">
          <div style="flex:1;min-width:520px">
            <h3 style="margin-bottom:10px">选择目标用户</h3>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <label>发送给全体用户</label>
              <input type="checkbox" id="notifyAll" />
            </div>
            <select id="notifyTarget" style="width:100%;max-width:520px;padding:6px 10px;border:1px solid #ccc"></select>
            <div style="margin-top:24px">
              <h3 style="margin-bottom:10px">发布内容</h3>
              <textarea id="notifyContent" style="width:100%;min-height:220px;border:1px solid #ccc;padding:8px" placeholder="请输入发布系统通知内容"></textarea>
            </div>
            <div style="display:flex;justify-content:space-between;max-width:520px;margin-top:20px">
              <button class="btn-outline" id="notifyClear">删除</button>
              <button class="btn-outline" id="notifySend">发送</button>
            </div>
            <p id="notifyMsg" class="msg" style="margin-top:12px"></p>
          </div>
          <div style="width:360px">
            <input id="notifyFilter" placeholder="按账号筛选" style="width:100%;padding:6px 10px;border:1px solid #ddd;margin-bottom:10px" />
            <div id="notifyUserList" style="border:1px solid #ddd;max-height:520px;overflow-y:auto"></div>
          </div>
        </div>
      `;

      let users = [];
      let selectedId = '';

      function renderSelect() {
        const select = document.getElementById('notifyTarget');
        const options = users.map(u => `<option value="${u.id}">${esc(u.username || '')}</option>`).join('');
        select.innerHTML = options || '<option value="">暂无用户</option>';
        if (selectedId) select.value = selectedId;
      }

      function renderUserList() {
        const kw = (document.getElementById('notifyFilter').value || '').toLowerCase();
        const list = users.filter(u => (u.username || '').toLowerCase().includes(kw));
        document.getElementById('notifyUserList').innerHTML = list.length === 0
          ? '<div style="padding:10px;color:#888">暂无用户</div>'
          : list.map(u => `
            <div data-id="${u.id}" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #eee;cursor:pointer">
              <input type="radio" name="notifyUser" ${String(u.id) === String(selectedId) ? 'checked' : ''} />
              <span style="width:30px;color:#666">${u.id}</span>
              <span>${esc(u.username || '')}</span>
            </div>
          `).join('');
        document.querySelectorAll('#notifyUserList [data-id]').forEach(row => {
          row.onclick = () => {
            selectedId = row.dataset.id;
            document.getElementById('notifyTarget').value = selectedId;
            renderUserList();
          };
        });
      }

      async function loadUsers() {
        try {
          const data = await api('/api/super/users?role=&page=0&size=200');
          const page = data.data;
          users = (page.content || []).filter(u => u.role !== 'SUPER_ADMIN');
          if (!selectedId && users[0]) selectedId = String(users[0].id);
          renderSelect();
          renderUserList();
        } catch (e) {
          document.getElementById('notifyUserList').innerHTML = `<div style="padding:10px;color:#888">${e.message}</div>`;
        }
      }

      document.getElementById('notifyFilter').oninput = renderUserList;
      document.getElementById('notifyTarget').onchange = e => {
        selectedId = e.target.value;
        renderUserList();
      };
      document.getElementById('notifyAll').onchange = e => {
        const disabled = e.target.checked;
        document.getElementById('notifyTarget').disabled = disabled;
        document.getElementById('notifyFilter').disabled = disabled;
        renderUserList();
      };
      document.getElementById('notifyClear').onclick = () => {
        document.getElementById('notifyContent').value = '';
        document.getElementById('notifyMsg').textContent = '';
      };
      document.getElementById('notifySend').onclick = async () => {
        try {
          const content = document.getElementById('notifyContent').value.trim();
          const all = document.getElementById('notifyAll').checked;
          if (!content) throw new Error('请输入通知内容');
          if (!all && !selectedId) throw new Error('请选择目标用户');
          await api('/api/super/notifications', {
            method: 'POST',
            body: JSON.stringify({
              scope: all ? 'ALL' : 'USER',
              targetUserId: all ? null : selectedId,
              content
            })
          });
          document.getElementById('notifyMsg').textContent = '发送成功';
          document.getElementById('notifyMsg').className = 'msg msg-ok';
          document.getElementById('notifyContent').value = '';
        } catch (e) {
          document.getElementById('notifyMsg').textContent = e.message;
          document.getElementById('notifyMsg').className = 'msg msg-err';
        }
      };

      loadUsers();
    }
  }
  renderTab();
});

Router.register('superAnno', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superAnno');
  main.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" data-antab="global">发布全局公告</button>
      <button class="tab-btn" data-antab="review">审核地区公告</button>
      <button class="tab-btn" data-antab="view">查看公告</button>
    </div>
    <div id="annoContent"></div>
  `;

  let currentTab = 'global';
  document.querySelectorAll('[data-antab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-antab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.antab;
      renderTab();
    };
  });

  async function renderTab() {
    const box = document.getElementById('annoContent');
    if (currentTab === 'global') {
      box.innerHTML = `
        <div style="max-width:700px">
          <div class="form-group">
            <label>标题:</label>
            <input id="globalAnnoTitle" style="width:420px" />
          </div>
          <div class="form-group">
            <label>内容:</label>
            <textarea id="globalAnnoContent" style="width:520px;min-height:220px"></textarea>
          </div>
          <div style="display:flex;justify-content:space-between;max-width:520px;margin-top:30px">
            <button class="btn-outline" id="globalAnnoClear">删除</button>
            <button class="btn-outline" id="globalAnnoSend">发送</button>
          </div>
          <p id="globalAnnoMsg" class="msg" style="margin-top:12px"></p>
        </div>
        <div id="globalAnnoConfirm" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
          <div style="background:#fff;padding:24px;border-radius:8px;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
            <div style="font-weight:bold;margin-bottom:8px">是否确定发送</div>
            <div style="text-align:right;margin-top:12px">
              <button class="btn-sm" id="globalAnnoCancel" style="margin-right:8px">否</button>
              <button class="btn-sm btn-danger" id="globalAnnoConfirmSend">是</button>
            </div>
          </div>
        </div>
      `;

      const confirmBox = document.getElementById('globalAnnoConfirm');
      document.getElementById('globalAnnoClear').onclick = () => {
        document.getElementById('globalAnnoTitle').value = '';
        document.getElementById('globalAnnoContent').value = '';
      };
      document.getElementById('globalAnnoSend').onclick = () => {
        document.getElementById('globalAnnoMsg').textContent = '';
        confirmBox.style.display = 'flex';
      };
      document.getElementById('globalAnnoCancel').onclick = () => { confirmBox.style.display = 'none'; };
      confirmBox.addEventListener('click', function (e) { if (e.target === this) this.style.display = 'none'; });
      document.getElementById('globalAnnoConfirmSend').onclick = async () => {
        try {
          const title = document.getElementById('globalAnnoTitle').value.trim();
          const content = document.getElementById('globalAnnoContent').value.trim();
          await api('/api/super/announcements', { method: 'POST', body: JSON.stringify({ title, content }) });
          document.getElementById('globalAnnoMsg').textContent = '发送成功！点击任意处返回';
          document.getElementById('globalAnnoMsg').className = 'msg msg-ok';
          confirmBox.style.display = 'none';
          document.getElementById('globalAnnoTitle').value = '';
          document.getElementById('globalAnnoContent').value = '';
        } catch (e) {
          document.getElementById('globalAnnoMsg').textContent = e.message;
          document.getElementById('globalAnnoMsg').className = 'msg msg-err';
        }
      };
      return;
    }

    if (currentTab === 'review') {
      box.innerHTML = '<div id="regionReviewList"></div><div id="regionReviewPager" class="pager"></div>';
      let pg = 0;
      async function load() {
        try {
          const data = await api('/api/super/announcements/region/pending');
          const list = data.data || [];
          document.getElementById('regionReviewList').innerHTML = list.length === 0
            ? '<p class="empty">暂无待审核地区公告</p>'
            : list.map(a => `
              <div style="border:1px solid #ddd;margin-bottom:16px">
                <div style="padding:16px 20px">
                  <div style="font-weight:bold;font-size:18px">${esc(a.region || '-')}</div>
                  <div style="margin:8px 0;font-weight:bold">${esc(a.title || '-')}</div>
                  <div style="color:#555;line-height:1.8">${esc(a.content || '')}</div>
                  <div style="text-align:right;color:#888;margin-top:6px">发送者：${esc(a.author?.username || '-')}</div>
                </div>
                <div style="border-top:1px solid #eee;padding:12px 20px;display:flex;justify-content:center;gap:80px">
                  <button class="btn-outline" data-approve="${a.id}">通过</button>
                  <button class="btn-outline" data-reject="${a.id}">退回</button>
                </div>
              </div>
            `).join('');
          document.querySelectorAll('[data-approve]').forEach(b => {
            b.onclick = async () => {
              await api(`/api/super/announcements/${b.dataset.approve}/approve`, { method: 'PUT' });
              load();
            };
          });
          document.querySelectorAll('[data-reject]').forEach(b => {
            b.onclick = async () => {
              if (!confirm('确定退回该公告？')) return;
              await api(`/api/super/announcements/${b.dataset.reject}/reject`, { method: 'PUT' });
              load();
            };
          });
          renderPager(document.getElementById('regionReviewPager'), pg, 1, () => {});
        } catch (e) {
          document.getElementById('regionReviewList').innerHTML = `<p class="empty">${e.message}</p>`;
          document.getElementById('regionReviewPager').innerHTML = '';
        }
      }
      load();
      return;
    }

    box.innerHTML = `
      <div class="tab-bar" style="margin-bottom:12px">
        <button class="tab-btn active" data-vtab="global">全体公告</button>
        <button class="tab-btn" data-vtab="region">地区公告</button>
      </div>
      <div id="viewAnnoList"></div>
    `;
    let viewTab = 'global';
    document.querySelectorAll('[data-vtab]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('[data-vtab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        viewTab = btn.dataset.vtab;
        loadView();
      };
    });
    async function loadView() {
      try {
        const scope = viewTab === 'global' ? 'GLOBAL' : 'REGION';
        const data = await api(`/api/announcements?scope=${scope}`);
        const list = data.data || [];
        document.getElementById('viewAnnoList').innerHTML = list.length === 0
          ? '<p class="empty">暂无公告</p>'
          : list.map(a => `
            <div class="anno-card">
              <h3>${esc(a.title)}</h3>
              ${a.scope === 'REGION' ? `<div style="text-align:center;font-size:12px;color:#888">地区公告：${esc(a.region || '-')}</div>` : '<div style="text-align:center;font-size:12px;color:#888">全体公告</div>'}
              <p>${esc(a.content)}</p>
              <div class="anno-time">发布于：${fmtTime(a.createdAt)}</div>
            </div>
          `).join('');
      } catch (e) {
        document.getElementById('viewAnnoList').innerHTML = '<p class="empty">暂无公告</p>';
      }
    }
    loadView();
  }
  renderTab();
});

Router.register('superMessages', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superMessages');
  main.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" data-smtab="manage">管理消息</button>
      <button class="tab-btn" data-smtab="complaint">处理投诉</button>
    </div>
    <div id="msgContent"></div>
  `;
  let currentTab = 'manage';
  document.querySelectorAll('[data-smtab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-smtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.smtab;
      renderTab();
    };
  });

  function renderTab() {
    if (currentTab === 'manage') {
      renderManage();
      return;
    }
    renderComplaint();
  }

  function renderManage() {
    const box = document.getElementById('msgContent');
    box.innerHTML = `
      <div class="filter-bar">
        <label>消息类型</label><select id="smType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
        <label>物品类型</label><select id="smCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
        <label>地点</label><select id="smLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
        <label>时间范围</label><select id="smTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
        <label>物品状态</label><select id="smStatus"><option value="">所有</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option><option value="ADMIN_DELETED">管理员删除</option></select>
        <label>物品名查找</label><input type="text" id="smKeyword" />
        <span class="search-icon" id="smSearchBtn">&#128269;</span>
      </div>
      <div id="smList"></div>
      <div id="smPager" class="pager"></div>
      <div id="deleteModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
        <div style="background:#fff;padding:20px 24px;border:2px solid #f28c2a;min-width:360px;box-shadow:0 4px 20px rgba(0,0,0,0.15);position:relative">
          <span id="smDeleteClose" style="position:absolute;right:10px;top:8px;font-size:18px;cursor:pointer">✖</span>
          <div style="font-weight:bold;margin-bottom:8px">删除理由填写：</div>
          <select id="smDeleteReason" style="width:100%;padding:6px 8px;margin-bottom:10px;border:1px solid #f28c2a">
            <option value="恶意广告">恶意广告</option>
            <option value="虚假信息">虚假信息</option>
            <option value="侵权图片">侵权图片</option>
            <option value="其他">其他</option>
          </select>
          <div style="font-weight:bold;margin-bottom:6px">填写具体理由：</div>
          <textarea id="smDeleteDetail" style="width:100%;min-height:70px;border:1px solid #f28c2a"></textarea>
          <div style="text-align:center;margin-top:14px">
            <button class="btn-sm" id="smDeleteConfirm">确认填写</button>
          </div>
        </div>
      </div>
    `;
    let pg = 0;
    fillCategorySelect('smCat');
    let deleteId = null;
    const modal = document.getElementById('deleteModal');
    const closeModal = () => { modal.style.display = 'none'; deleteId = null; };
    document.getElementById('smDeleteClose').onclick = closeModal;
    modal.addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    document.getElementById('smDeleteConfirm').onclick = async () => {
      try {
        const reason = document.getElementById('smDeleteReason').value;
        const detail = document.getElementById('smDeleteDetail').value.trim();
        const fullReason = detail ? `${reason}：${detail}` : reason;
        await api(`/api/admin/items/${deleteId}`, { method: 'DELETE', body: JSON.stringify({ reason: fullReason }) });
        closeModal();
        load();
      } catch (e) { alert(e.message); }
    };

    async function load() {
      const type = document.getElementById('smType').value;
      const cat = document.getElementById('smCat').value;
      const loc = document.getElementById('smLoc').value;
      const status = document.getElementById('smStatus').value;
      const time = document.getElementById('smTime').value;
      const kw = document.getElementById('smKeyword').value.trim();
      try {
        const params = new URLSearchParams({ keyword: kw, type, category: cat, location: loc, status, page: String(pg), size: '8' });
        if (time) params.set('time', time);
        const data = await api(`/api/admin/items?${params.toString()}`);
        const page = data.data;
        const list = page.content || [];
        document.getElementById('smList').innerHTML = list.length === 0
          ? '<p class="empty">暂无数据</p>'
          : list.map(item => `
            <div class="item-entry">
              ${itemCardHtml(item)}
              <div class="item-actions">
                <button class="btn-sm btn-danger" data-del="${item.id}">删除</button>
              </div>
            </div>
          `).join('');
        document.querySelectorAll('[data-del]').forEach(b => {
          b.onclick = (e) => {
            e.stopPropagation();
            deleteId = b.dataset.del;
            document.getElementById('smDeleteReason').value = '恶意广告';
            document.getElementById('smDeleteDetail').value = '';
            modal.style.display = 'flex';
          };
        });
        renderPager(document.getElementById('smPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
      } catch (e) {
        document.getElementById('smList').innerHTML = `<p class="empty">${e.message}</p>`;
        document.getElementById('smPager').innerHTML = '';
      }
    }

    document.getElementById('smSearchBtn').onclick = () => { pg = 0; load(); };
    document.getElementById('smKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };
    ['smType', 'smCat', 'smLoc', 'smTime', 'smStatus'].forEach(id => {
      document.getElementById(id).onchange = () => { pg = 0; load(); };
    });
    load();
  }

  function renderComplaint() {
    const box = document.getElementById('msgContent');
    box.innerHTML = `
      <div id="complaintList"></div>
      <div id="complaintPager" class="pager"></div>
      <div id="complaintModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
        <div style="background:#fff;padding:24px;border-radius:8px;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
          <div style="margin-bottom:12px;font-weight:bold">处理违规用户方式:</div>
          <select id="complaintAction" style="width:100%;padding:8px 12px;margin-bottom:16px;border:1px solid #ddd;border-radius:4px;font-size:14px">
            <option value="WARN">警告用户</option>
            <option value="DELETE_ITEM">删除违规内容</option>
            <option value="BAN_USER">封禁该用户</option>
            <option value="DELETE_AND_BAN">删除内容并封禁</option>
          </select>
          <button id="complaintConfirm" class="btn-sm" style="width:100%;background:#333;color:#fff;border:1px solid #333;padding:8px">处理投诉</button>
        </div>
      </div>
    `;
    let pg = 0;
    let currentId = null;
    const modal = document.getElementById('complaintModal');
    const closeModal = () => { modal.style.display = 'none'; currentId = null; };
    modal.addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    document.getElementById('complaintConfirm').onclick = async () => {
      try {
        const action = document.getElementById('complaintAction').value;
        await api(`/api/super/complaints/${currentId}/resolve`, { method: 'PUT', body: JSON.stringify({ action }) });
        closeModal();
        load();
      } catch (e) { alert(e.message); }
    };

    async function load() {
      try {
        const data = await api(`/api/super/complaints?status=PENDING&page=${pg}&size=8`);
        const page = data.data;
        const list = page.content || [];
        document.getElementById('complaintList').innerHTML = list.length === 0
          ? '<p class="empty">暂无投诉记录</p>'
          : list.map(c => {
            const item = c.item || {};
            const reporter = c.reporter || {};
            const target = c.target || {};
            const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
            const isLost = item.type === 'LOST';
            const locLabel = isLost ? '丢失地点' : '拾取地点';
            const timeLabel = isLost ? '丢失时间' : '拾得时间';
            return `
              <div class="complaint-card">
                <div class="complaint-main">
                  <div class="complaint-info">
                    <div><b>物品名称：</b>${esc(item.title || '-')}</div>
                    <div><b>物品类型：</b>${esc(item.category || '-')}</div>
                    <div><b>${locLabel}：</b>${esc(item.location || '-')}</div>
                    <div><b>${timeLabel}：</b>${esc(item.lostTime || '-')}</div>
                    <div><b>举报原因：</b>${esc(c.reason || '-')}</div>
                    <div><b>具体说明：</b>${esc(c.detail || '-')}</div>
                    <div><b>举报人：</b>${esc(reporter.username || '-')}</div>
                    <div><b>被举报用户：</b>${esc(target.username || '-')}</div>
                  </div>
                  <div class="complaint-images">
                    ${imgs.length > 0 ? imgs.slice(0, 3).map(u => imgTag(u, 120, 90)).join('') : '<div class="img-placeholder">暂无图片</div>'}
                  </div>
                </div>
                <div class="complaint-actions">
                  <button class="btn-outline" data-handle="${c.id}">处理违规</button>
                  <button class="btn-outline" data-reject="${c.id}">驳回投诉</button>
                </div>
              </div>
            `;
          }).join('');
        document.querySelectorAll('[data-handle]').forEach(b => {
          b.onclick = () => {
            currentId = b.dataset.handle;
            document.getElementById('complaintAction').value = 'WARN';
            modal.style.display = 'flex';
          };
        });
        document.querySelectorAll('[data-reject]').forEach(b => {
          b.onclick = async () => {
            if (!confirm('确定驳回该投诉？')) return;
            await api(`/api/super/complaints/${b.dataset.reject}/reject`, { method: 'PUT' });
            load();
          };
        });
        renderPager(document.getElementById('complaintPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
      } catch (e) {
        document.getElementById('complaintList').innerHTML = `<p class="empty">${e.message}</p>`;
        document.getElementById('complaintPager').innerHTML = '';
      }
    }
    load();
  }

  renderTab();
});

Router.register('superChat', function (app) {
  Router.go('superHome');
});

Router.register('superBackup', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superBackup');
  main.innerHTML = `
    <div style="padding:26px 30px">
      <h2 style="margin:0 0 18px 0">数据管理</h2>
      <div style="border:1px solid #bbb;background:#f5f5f5;padding:26px 30px;min-height:170px">
        <button class="btn-outline" id="backupBtn" style="min-width:130px">立即备份</button>
        <div style="margin-top:56px;font-size:34px;line-height:1.2;font-weight:bold">
          最近一次备份时间：<span id="lastBackupTime">加载中...</span>
        </div>
        <p id="backupMsg" class="msg" style="margin-top:14px"></p>
      </div>

      <div style="border:1px solid #bbb;background:#f5f5f5;padding:26px 30px;min-height:190px;margin-top:22px">
        <button class="btn-outline" id="exportBtn" style="min-width:130px">导出数据</button>
        <div style="margin-top:24px;display:flex;flex-direction:column;gap:16px;max-width:760px">
          <div style="display:flex;align-items:center;gap:10px">
            <b style="font-size:30px;transform:scale(0.5);transform-origin:left center;white-space:nowrap">导出时间范围：</b>
            <select id="exportRange" style="height:34px;min-width:170px;padding:0 10px;border:1px solid #bbb;border-radius:3px;background:#fff">
              <option value="1">1个月</option>
              <option value="2">2个月</option>
              <option value="4">4个月</option>
              <option value="8">8个月</option>
              <option value="12">1年</option>
            </select>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px">
            <b style="font-size:30px;transform:scale(0.5);transform-origin:left top;white-space:nowrap;margin-top:2px">导出数据类型：</b>
            <div style="display:flex;flex-wrap:wrap;gap:12px 18px;padding-top:4px">
              <label><input type="checkbox" value="FOUND" checked /> 导出失物招领</label>
              <label><input type="checkbox" value="LOST" /> 寻物启事</label>
              <label><input type="checkbox" value="GLOBAL_ANNOUNCEMENT" /> 全局公告</label>
              <label><input type="checkbox" value="REGION_ANNOUNCEMENT" /> 地区公告</label>
            </div>
          </div>
        </div>
        <p id="exportMsg" class="msg" style="margin-top:14px"></p>
      </div>

      <div style="border:1px solid #bbb;background:#f5f5f5;padding:26px 30px;min-height:145px;margin-top:22px">
        <button class="btn-outline" id="cleanupBtn" style="min-width:130px">删除过期数据</button>
        <div style="margin-top:20px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b style="font-size:30px;transform:scale(0.5);transform-origin:left center;white-space:nowrap">清理时间：已归档、已删除、已认领后</b>
          <input id="cleanupDays" type="number" min="1" value="7" style="width:70px;height:30px;padding:0 8px;border:1px solid #bbb;border-radius:3px" />
          <b style="font-size:30px;transform:scale(0.5);transform-origin:left center;white-space:nowrap">天</b>
        </div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
          <b style="font-size:30px;transform:scale(0.5);transform-origin:left center;white-space:nowrap">清理条数：</b>
          <span id="cleanupCount" style="font-weight:bold">0条</span>
        </div>
        <p id="cleanupMsg" class="msg" style="margin-top:10px"></p>
      </div>
    </div>
  `;

  const backupBtn = document.getElementById('backupBtn');
  const backupMsg = document.getElementById('backupMsg');
  const lastBackupTime = document.getElementById('lastBackupTime');
  const exportBtn = document.getElementById('exportBtn');
  const exportMsg = document.getElementById('exportMsg');
  const exportRange = document.getElementById('exportRange');
  const cleanupBtn = document.getElementById('cleanupBtn');
  const cleanupDays = document.getElementById('cleanupDays');
  const cleanupCount = document.getElementById('cleanupCount');
  const cleanupMsg = document.getElementById('cleanupMsg');

  async function loadLatestBackup() {
    try {
      const res = await api('/api/super/backup/latest');
      const data = res.data || {};
      lastBackupTime.textContent = data.backupTime || '暂无';
    } catch (e) {
      lastBackupTime.textContent = '读取失败';
      backupMsg.textContent = e.message;
      backupMsg.className = 'msg msg-err';
    }
  }

  backupBtn.onclick = async () => {
    backupBtn.disabled = true;
    backupMsg.textContent = '正在备份，请稍候...';
    backupMsg.className = 'msg';
    try {
      const res = await api('/api/super/backup/now', { method: 'POST' });
      const data = res.data || {};
      lastBackupTime.textContent = data.backupTime || '刚刚';
      backupMsg.textContent = `备份成功，共导出${data.tableCount || 0}张表，目录：${data.backupFolder || '-'}`;
      backupMsg.className = 'msg msg-ok';
    } catch (e) {
      backupMsg.textContent = e.message;
      backupMsg.className = 'msg msg-err';
    } finally {
      backupBtn.disabled = false;
    }
  };

  exportBtn.onclick = async () => {
    const selectedTypes = Array.from(main.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
    if (selectedTypes.length === 0) {
      exportMsg.textContent = '请至少选择一种导出数据类型';
      exportMsg.className = 'msg msg-err';
      return;
    }
    exportBtn.disabled = true;
    exportMsg.textContent = '正在导出，请稍候...';
    exportMsg.className = 'msg';
    try {
      const res = await api('/api/super/export/sql', {
        method: 'POST',
        body: JSON.stringify({
          rangeMonths: parseInt(exportRange.value, 10),
          types: selectedTypes
        })
      });
      const data = res.data || {};
      const downloadUrl = data.downloadUrl ? (data.downloadUrl.startsWith('http') ? data.downloadUrl : `${API_BASE}${data.downloadUrl}`) : '';
      if (!downloadUrl) throw new Error('未返回下载地址');

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = data.fileName || 'data-export.sql';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      exportMsg.textContent = `导出成功，共导出${data.rows || 0}条数据，文件：${data.fileName || '-'}`;
      exportMsg.className = 'msg msg-ok';
    } catch (e) {
      exportMsg.textContent = e.message;
      exportMsg.className = 'msg msg-err';
    } finally {
      exportBtn.disabled = false;
    }
  };

  cleanupDays.onchange = () => { cleanupMsg.textContent = ''; cleanupMsg.className = 'msg'; };
  cleanupDays.onkeydown = (e) => {
    if (e.key === 'Enter') cleanupBtn.click();
  };

  cleanupBtn.onclick = async () => {
    const days = parseInt(cleanupDays.value || '0', 10);
    if (!days || days < 1) {
      cleanupMsg.textContent = '清理天数需大于0';
      cleanupMsg.className = 'msg msg-err';
      return;
    }
    cleanupBtn.disabled = true;
    cleanupMsg.textContent = '正在清理，请稍候...';
    cleanupMsg.className = 'msg';
    try {
      const res = await api('/api/super/cleanup/execute', {
        method: 'POST',
        body: JSON.stringify({ days })
      });
      const data = res.data || {};
      cleanupCount.textContent = `${data.cleanedCount || 0}条`;
      cleanupMsg.textContent = `清理完成，共清理${data.cleanedCount || 0}条信息`; 
      cleanupMsg.className = 'msg msg-ok';
    } catch (e) {
      cleanupMsg.textContent = e.message;
      cleanupMsg.className = 'msg msg-err';
    } finally {
      cleanupBtn.disabled = false;
    }
  };

  loadLatestBackup();
});
