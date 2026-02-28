Router.register('superAdmin', function (app) {
  Router.go('superHome');
});

Router.register('superHome', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superHome');
  main.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:60vh;animation:scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards">
      <div style="font-size:64px;margin-bottom:24px">👑</div>
      <h2 style="font-size:32px;font-weight:800;color:var(--text-main);letter-spacing:-0.02em;margin-bottom:16px">系统管理员 ${esc(Auth.getUser())}，欢迎回来</h2>
      <p style="font-size:16px;color:var(--text-muted)">请在左侧菜单选择需要进行的操作</p>
    </div>
  `;
});

Router.register('superGlobal', async function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superGlobal');
  main.innerHTML = `
    <div class="tab-bar" style="display:flex;gap:32px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
      <button class="tab-btn active" data-gtab="overview" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">信息总览</button>
      <button class="tab-btn" data-gtab="params" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">修改参数</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; font-weight: 600 !important; }
      .tab-btn::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; transform: scaleX(0); transition: transform 0.3s ease; }
      .tab-btn.active::after { transform: scaleX(1); }
    </style>
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
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:30px;group">
              <div style="width:100%;max-width:36px;height:${h}px;background:var(--primary);border-radius:4px 4px 0 0;transition:var(--transition);cursor:pointer" title="${m.label || ''}: ${m.total || 0}条"></div>
              <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;text-align:center">${m.label || ''}</div>
            </div>
          `;
        }).join('');
        const monthLines = monthly.map(m => {
          return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:14px">
            <span style="color:var(--text-main);font-weight:500">${m.label || ''}</span>
            <span style="color:var(--text-muted)">
              <span style="color:var(--primary);font-weight:600">${m.lost || 0}</span> 寻物 / 
              <span style="color:var(--success);font-weight:600">${m.found || 0}</span> 招领
            </span>
          </div>`;
        }).join('');
        box.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;margin-bottom:32px">
            <div class="stats-box" style="margin-bottom:0;display:flex;flex-direction:column;justify-content:center">
              <div style="font-size:18px;font-weight:600;color:var(--text-main);margin-bottom:20px;display:flex;align-items:center;gap:8px">
                <span style="font-size:24px">📊</span> 数据统计概览
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div style="background:var(--bg-color);padding:20px;border-radius:var(--radius-md);border:1px solid var(--border);box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
                  <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;font-weight:500">总发布消息</div>
                  <div style="font-size:28px;font-weight:800;color:var(--text-main)">${s.totalItems || 0}</div>
                </div>
                <div style="background:var(--bg-color);padding:20px;border-radius:var(--radius-md);border:1px solid var(--border);box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
                  <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;font-weight:500">认领率</div>
                  <div style="font-size:28px;font-weight:800;color:var(--primary)">${rate}%</div>
                </div>
                <div style="background:var(--bg-color);padding:20px;border-radius:var(--radius-md);border:1px solid var(--border);box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
                  <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;font-weight:500">失物招领</div>
                  <div style="font-size:24px;font-weight:700;color:var(--success)">${s.foundCount || 0}</div>
                </div>
                <div style="background:var(--bg-color);padding:20px;border-radius:var(--radius-md);border:1px solid var(--border);box-shadow:inset 0 2px 4px rgba(0,0,0,0.02)">
                  <div style="font-size:14px;color:var(--text-muted);margin-bottom:8px;font-weight:500">寻物启事</div>
                  <div style="font-size:24px;font-weight:700;color:var(--warning)">${s.lostCount || 0}</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:24px;padding-top:20px;border-top:1px solid var(--border);font-size:15px;color:var(--text-muted)">
                <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:var(--primary)"></span>已匹配: <b style="color:var(--text-main)">${s.matchedItems || 0}</b></span>
                <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:var(--success)"></span>已认领: <b style="color:var(--text-main)">${s.claimedItems || 0}</b></span>
                <span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:var(--text-muted)"></span>已归档: <b style="color:var(--text-main)">${s.archivedItems || 0}</b></span>
              </div>
            </div>
            <div class="stats-box" style="margin-bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px">
              <div style="font-size:18px;font-weight:600;color:var(--text-main);margin-bottom:32px;align-self:flex-start">消息状态分布</div>
              <div style="position:relative;width:240px;height:240px;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.08));transition:transform 0.3s ease" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                ${pieSvg()}
              </div>
              <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:20px;margin-top:32px;padding:16px;background:var(--bg-color);border-radius:var(--radius-md);width:100%">
                ${pieData.map(d => `
                  <div style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:var(--text-main)">
                    <span style="width:12px;height:12px;border-radius:4px;background:${d.color};box-shadow:0 2px 4px rgba(0,0,0,0.1)"></span>
                    ${d.label} <span style="color:var(--text-muted);margin-left:4px">${d.value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div style="font-size:20px;font-weight:700;color:var(--text-main);margin:32px 0 24px;display:flex;align-items:center;gap:12px">
            <span style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.1))">📈</span> 近一年趋势分析
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px">
            <div class="stats-box" style="margin-bottom:0;display:flex;flex-direction:column;padding:24px">
              <div style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:32px;display:flex;align-items:center;gap:8px">
                <span style="width:4px;height:16px;background:var(--primary);border-radius:2px"></span> 每月发布消息数量
              </div>
              <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;height:220px;padding:0 16px 16px;flex:1;border-bottom:2px solid var(--border)">
                ${bars}
              </div>
            </div>
            <div class="stats-box" style="margin-bottom:0;max-height:340px;overflow-y:auto;padding:24px">
              <div style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:20px;position:sticky;top:-24px;background:var(--surface);padding:24px 0 16px;border-bottom:2px solid var(--border);z-index:10;display:flex;align-items:center;gap:8px">
                <span style="width:4px;height:16px;background:var(--success);border-radius:2px"></span> 详细数据明细
              </div>
              <div style="display:flex;flex-direction:column;gap:12px">
                ${monthLines}
              </div>
            </div>
          </div>
        `;
      } catch (e) { box.innerHTML = `<p class="msg msg-err">${e.message}</p>`; }
    } else {
      box.innerHTML = `
        <div id="paramCards" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px"></div>
        <div id="paramModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;align-items:center;justify-content:center;animation:fadeIn 0.2s ease">
          <div style="background:var(--surface);padding:32px;border-radius:var(--radius-lg);min-width:480px;box-shadow:0 24px 48px rgba(0,0,0,0.2);animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)">
            <div id="paramModalTitle" style="font-weight:700;font-size:22px;margin-bottom:24px;text-align:center;color:var(--text-main)"></div>
            <div id="paramModalBody" style="font-size:15px;color:var(--text-main)"></div>
            <div style="display:flex;justify-content:flex-end;gap:16px;margin-top:32px;padding-top:24px;border-top:1px solid var(--border)">
              <button class="btn-outline" id="paramCancel" style="padding:10px 24px;border-radius:var(--radius-md)">取消</button>
              <button class="btn-primary" id="paramConfirm" style="padding:10px 24px;border-radius:var(--radius-md)">确认</button>
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
          `目前违禁词：${(cfg.forbiddenWords || '').split(/[,，;；\s\n\r\t]+/).map(s => s.trim()).filter(Boolean).join('、') || '-'}`,
          `是否上传图片：${cfg.requireImage ? '是' : '否'}`,
          `是否填写地址：${cfg.requireLocationDetail ? '是' : '否'}`,
          `是否开启发布审核：${cfg.enableReview ? '是' : '否'}`,
          `是否开启描述字数限制：${cfg.enableDescLimit ? '是' : '否'}${cfg.enableDescLimit ? `（上限${cfg.descMaxLength || 0}字）` : ''}`
        ].map(s => `<div>${s}</div>`).join('');
        document.getElementById('paramCards').innerHTML = `
          <div class="param-card" style="background:var(--surface);padding:24px;border-radius:var(--radius-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:16px;transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.02)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div class="param-left" style="flex:1">
              <div class="param-title" style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:20px">📦</span> 目前物品类型</div>
              <div style="color:var(--text-muted);font-size:14px;line-height:1.6">${cats.join('；') || '-'}</div>
            </div>
            <button class="btn-outline" data-edit="categories" style="padding:6px 16px;border-radius:var(--radius-sm)">修改</button>
          </div>
          <div class="param-card" style="background:var(--surface);padding:24px;border-radius:var(--radius-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:16px;transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.02)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div class="param-left" style="flex:1">
              <div class="param-title" style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:20px">⏳</span> 目前认领时效</div>
              <div style="color:var(--text-muted);font-size:14px;line-height:1.6"><b style="color:var(--text-main);font-size:18px">${cfg.claimExpireDays || 0}</b> 天</div>
            </div>
            <button class="btn-outline" data-edit="claimExpireDays" style="padding:6px 16px;border-radius:var(--radius-sm)">修改</button>
          </div>
          <div class="param-card" style="background:var(--surface);padding:24px;border-radius:var(--radius-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:16px;transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.02)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div class="param-left" style="flex:1">
              <div class="param-title" style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:20px">⏱️</span> 目前消息发布频率</div>
              <div style="color:var(--text-muted);font-size:14px;line-height:1.6">每 <b style="color:var(--text-main);font-size:18px">${cfg.publishCooldownMinutes || 0}</b> 分钟可发布一次</div>
            </div>
            <button class="btn-outline" data-edit="publishCooldownMinutes" style="padding:6px 16px;border-radius:var(--radius-sm)">修改</button>
          </div>
          <div class="param-card" style="background:var(--surface);padding:24px;border-radius:var(--radius-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:16px;transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.02)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div class="param-left" style="flex:1">
              <div class="param-title" style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:20px">💬</span> 限制最大聊天数</div>
              <div style="color:var(--text-muted);font-size:14px;line-height:1.6">同一帖子申请通过后，每人最多发送 <b style="color:var(--text-main);font-size:18px">${cfg.maxChatPerUser || 50}</b> 条消息</div>
            </div>
            <button class="btn-outline" data-edit="maxChatPerUser" style="padding:6px 16px;border-radius:var(--radius-sm)">修改</button>
          </div>
          <div class="param-card" style="background:var(--surface);padding:24px;border-radius:var(--radius-md);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start;gap:16px;transition:all 0.3s ease;box-shadow:0 4px 6px rgba(0,0,0,0.02);grid-column:1/-1" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 6px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div class="param-left" style="flex:1">
              <div class="param-title" style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:16px;display:flex;align-items:center;gap:8px"><span style="font-size:20px">📝</span> 目前发布内容规范</div>
              <div style="line-height:1.8;color:var(--text-muted);font-size:14px;display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px">${normRows}</div>
            </div>
            <button class="btn-outline" data-edit="norms" style="padding:6px 16px;border-radius:var(--radius-sm)">修改</button>
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
        } else if (type === 'maxChatPerUser') {
          title.textContent = '修改最大聊天数';
          body.innerHTML = `<input id="paramMaxChat" type="number" style="width:100%" value="${cfg.maxChatPerUser || 50}" />`;
        } else {
          title.textContent = '修改发布内容规范';
          body.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:8px">
              <label><input type="checkbox" id="normForbid" ${cfg.forbidWordCheck ? 'checked' : ''} /> 是否开启违禁词检查</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input id="normWordInput" placeholder="输入违禁词后点击添加" style="flex:1" />
                <button type="button" class="btn-outline" id="normWordAddBtn">添加</button>
              </div>
              <textarea id="normWords" style="width:100%;min-height:90px" placeholder="可手动输入，支持逗号/空格/换行分隔">${esc(cfg.forbiddenWords || '')}</textarea>
              <div id="normWordsView" style="font-size:12px;color:#555;line-height:1.8"></div>
              <label><input type="checkbox" id="normImage" ${cfg.requireImage ? 'checked' : ''} /> 是否上传图片</label>
              <label><input type="checkbox" id="normLocation" ${cfg.requireLocationDetail ? 'checked' : ''} /> 是否填写地址</label>
              <label><input type="checkbox" id="normReview" ${cfg.enableReview ? 'checked' : ''} /> 是否开启发布审核</label>
              <label><input type="checkbox" id="normDescLimit" ${cfg.enableDescLimit ? 'checked' : ''} /> 是否开启描述字数限制</label>
              <input id="normDescMax" type="number" style="width:100%" value="${cfg.descMaxLength || 0}" />
            </div>
          `;

          const wordsArea = document.getElementById('normWords');
          const wordsView = document.getElementById('normWordsView');
          const wordInput = document.getElementById('normWordInput');
          const addBtn = document.getElementById('normWordAddBtn');

          const normalizeWords = (text) => {
            return (text || '').split(/[,，;；\s\n\r\t]+/).map(s => s.trim()).filter(Boolean);
          };
          const refreshWordsView = () => {
            const words = normalizeWords(wordsArea.value);
            wordsView.textContent = words.length ? ('当前已添加：' + words.join('、')) : '当前未添加违禁词';
          };

          wordsArea.addEventListener('input', refreshWordsView);
          addBtn.onclick = () => {
            const word = (wordInput.value || '').trim();
            if (!word) return;
            const words = normalizeWords(wordsArea.value);
            if (!words.includes(word)) words.push(word);
            wordsArea.value = words.join(',');
            wordInput.value = '';
            refreshWordsView();
          };
          refreshWordsView();
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
            } else if (type === 'maxChatPerUser') {
              update.maxChatPerUser = parseInt(document.getElementById('paramMaxChat').value || '0', 10);
            } else {
              update.forbidWordCheck = document.getElementById('normForbid').checked;
              update.forbiddenWords = document.getElementById('normWords').value.trim();
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
          } catch (e) { await uiAlert(e.message, '保存失败'); }
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
    <div class="tab-bar" style="display:flex;gap:32px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
      <button class="tab-btn active" data-atab="accounts" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">账号管理</button>
      <button class="tab-btn" data-atab="notify" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">系统通知</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; font-weight: 600 !important; }
      .tab-btn::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; transform: scaleX(0); transition: transform 0.3s ease; }
      .tab-btn.active::after { transform: scaleX(1); }
    </style>
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
        <div style="margin-bottom:24px;display:flex;justify-content:flex-end;">
          <button class="btn-primary" id="addAdminBtn" style="padding:10px 24px;border-radius:8px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(var(--primary-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb),0.2)'">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            添加新账号
          </button>
        </div>
        <div class="filter-bar" style="display:flex;flex-wrap:wrap;gap:16px;background:var(--surface);padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);margin-bottom:24px;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">账号类型</label>
            <select id="uRoleFilter" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
              <option value="">所有</option><option value="USER">用户</option><option value="ADMIN">管理员</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">权限类型</label>
            <select id="uStatusFilter" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
              <option value="">所有</option><option value="true">可启用</option><option value="false">已封禁</option>
            </select>
          </div>
          <button id="uSearchBtn" style="background:var(--primary);color:white;border:none;border-radius:6px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.2s;margin-left:auto;" onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary)'">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
        <div id="userList" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:20px;"></div>
        <div id="uPager" class="pager" style="margin-top:32px;display:flex;justify-content:center;gap:8px;"></div>
      `;

      let pg = 0;
      async function loadUsers() {
        const role = document.getElementById('uRoleFilter').value;
        try {
          const data = await api(`/api/super/users?role=${role}&page=${pg}&size=10`);
          const page = data.data;
          const list = page.content || [];
          document.getElementById('userList').innerHTML = list.length === 0
            ? '<div style="grid-column:1/-1;"><p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无用户</p></div>'
            : list.map(u => `
              <div class="account-card" style="background:var(--surface);border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:20px;transition:transform 0.2s, box-shadow 0.2s;position:relative;overflow:hidden;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:${u.enabled ? 'var(--success)' : 'var(--danger)'};"></div>
                <div class="account-info" style="display:flex;flex-direction:column;gap:12px;flex:1;">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--bg-color);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--primary);">
                      ${u.role === 'ADMIN' ? '🛡️' : u.role === 'SUPER_ADMIN' ? '👑' : '👤'}
                    </div>
                    <div>
                      <div style="font-size:16px;font-weight:600;color:var(--text-primary);">${esc(u.username)}</div>
                      <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${u.role === 'ADMIN' ? '管理员' : u.role === 'SUPER_ADMIN' ? '系统管理员' : '用户 - ' + (esc(u.realName) || '学生')}</div>
                    </div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--bg-color);padding:12px;border-radius:8px;">
                    <div style="display:flex;flex-direction:column;gap:4px;">
                      <span style="font-size:12px;color:var(--text-secondary);">所属地区</span>
                      <span style="font-size:14px;color:var(--text-primary);font-weight:500;">${esc(u.region || '屏峰')}</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                      <span style="font-size:12px;color:var(--text-secondary);">账号状态</span>
                      <span style="font-size:14px;font-weight:500;color:${u.enabled ? 'var(--success)' : 'var(--danger)'};display:flex;align-items:center;gap:4px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:currentColor;"></span>
                        ${u.enabled ? '正常' : '已封禁'}
                      </span>
                    </div>
                  </div>
                  ${u.complaintCount ? `
                    <div style="display:flex;align-items:center;gap:8px;color:var(--warning);font-size:13px;background:rgba(var(--warning-rgb),0.1);padding:8px 12px;border-radius:6px;">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      遭投诉次数：<b>${u.complaintCount}</b> 次
                    </div>
                  ` : ''}
                </div>
                <button class="${u.enabled ? 'btn-outline' : 'btn-primary'}" data-toggle="${u.id}" data-enabled="${u.enabled}" style="width:100%;padding:10px;border-radius:8px;font-weight:500;transition:all 0.2s;${u.enabled ? 'color:var(--danger);border-color:var(--danger);' : ''}" ${u.enabled ? 'onmouseover="this.style.background=\'var(--danger)\';this.style.color=\'white\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--danger)\'"' : ''}>
                  ${u.enabled ? '封禁账号' : '解封账号'}
                </button>
              </div>
            `).join('');

          document.querySelectorAll('[data-toggle]').forEach(b => {
            b.onclick = async () => {
              try { await api(`/api/super/users/${b.dataset.toggle}/toggle`, { method: 'PUT' }); loadUsers(); }
              catch (e) { await uiAlert(e.message, '操作失败'); }
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
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
        overlay.innerHTML = `
          <div class="modal-box" style="background:var(--surface);padding:32px;border-radius:16px;width:100%;max-width:480px;box-shadow:0 24px 48px rgba(0,0,0,0.2);position:relative;animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
            <span class="close-btn" id="closeModal" style="position:absolute;top:20px;right:20px;font-size:24px;color:var(--text-secondary);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-secondary)'">&times;</span>
            <h3 style="margin:0 0 24px 0;font-size:20px;font-weight:600;color:var(--text-primary);text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              创建新账号
            </h3>
            <div class="modal-row" style="margin-bottom:16px;">
              <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">用户名</label>
              <input id="newAdminName" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" placeholder="请输入账号用户名" />
            </div>
            <div class="modal-row" style="margin-bottom:16px;">
              <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">账号类型</label>
              <select id="newAccountRole" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'></polyline></svg>');background-repeat:no-repeat;background-position:right 12px center;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
                <option value="USER">普通用户</option><option value="ADMIN">管理员</option>
              </select>
            </div>
            <div class="modal-row" style="margin-bottom:16px;">
              <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">密码</label>
              <input id="newAdminPwd" type="password" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" placeholder="默认密码为 123456" />
            </div>
            <div class="modal-row" style="margin-bottom:24px;">
              <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">所属校区</label>
              <select id="newAdminRegion" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 12px center;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
                <option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option>
              </select>
            </div>
            <div style="display:flex;gap:16px;justify-content:flex-end;margin-top:32px;padding-top:24px;border-top:1px solid var(--border-color);">
              <button class="btn-outline" id="cancelCreate" style="padding:10px 24px;border-radius:8px;font-weight:500;">取消</button>
              <button class="btn-primary" id="confirmCreate" style="padding:10px 24px;border-radius:8px;font-weight:500;box-shadow:0 4px 12px rgba(var(--primary-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb),0.2)'">确认创建</button>
            </div>
            <p id="createMsg" class="msg" style="text-align:center;margin-top:16px;font-size:14px;"></p>
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
                region: document.getElementById('newAdminRegion').value,
                role: document.getElementById('newAccountRole').value
              })
            });
            overlay.remove();
            await uiAlert('创建成功！', '创建成功');
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
        <div style="max-width:980px;background:var(--surface);padding:32px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid var(--border-color);">
          <h3 style="margin:0 0 20px 0;font-size:18px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            选择目标用户
          </h3>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;background:var(--bg-color);padding:12px 16px;border-radius:10px;border:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:12px;">
              <input type="checkbox" id="notifyAll" style="width:18px;height:18px;accent-color:var(--primary);cursor:pointer;" />
              <label for="notifyAll" style="font-size:15px;font-weight:500;color:var(--text-primary);cursor:pointer;user-select:none;">发送给全体用户</label>
            </div>
            <span id="notifySelectedCount" style="font-size:13px;color:var(--primary);background:rgba(var(--primary-rgb),0.1);padding:4px 10px;border-radius:999px;font-weight:600;">已选 0 人</span>
          </div>

          <div style="position:relative;margin-bottom:12px;">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="var(--text-secondary)" stroke-width="2" fill="none" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input id="notifyFilter" placeholder="搜索账号..." style="width:100%;padding:10px 12px 10px 40px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>

          <div id="notifyUserList" style="height:260px;border:1px solid var(--border-color);border-radius:10px;overflow-y:auto;background:var(--bg-color);margin-bottom:28px;"></div>

          <div>
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              发布内容
            </h3>
            <textarea id="notifyContent" style="width:100%;min-height:180px;border:1px solid var(--border-color);border-radius:8px;padding:16px;background:var(--bg-color);color:var(--text-primary);font-size:15px;line-height:1.6;outline:none;resize:vertical;transition:border-color 0.2s, box-shadow 0.2s;font-family:inherit;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" placeholder="请输入系统通知内容..."></textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid var(--border-color);">
            <button class="btn-outline" id="notifyClear" style="padding:10px 24px;border-radius:8px;font-weight:500;">清空内容</button>
            <button class="btn-primary" id="notifySend" style="padding:10px 32px;border-radius:8px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(var(--primary-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb),0.2)'">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              发送通知
            </button>
          </div>
          <p id="notifyMsg" class="msg" style="margin-top:16px;text-align:center;"></p>
        </div>
      `;

      let users = [];
      const selectedIds = new Set();

      function refreshSelectedCount() {
        document.getElementById('notifySelectedCount').textContent = `已选 ${selectedIds.size} 人`;
      }

      function renderUserList() {
        const kw = (document.getElementById('notifyFilter').value || '').toLowerCase();
        const allChecked = document.getElementById('notifyAll').checked;
        const list = users.filter(u => (u.username || '').toLowerCase().includes(kw));
        document.getElementById('notifyUserList').innerHTML = list.length === 0
          ? '<div style="padding:24px;color:var(--text-secondary);text-align:center;font-size:14px;">暂无匹配用户</div>'
          : list.map(u => `
            <div data-id="${u.id}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border-color);cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='rgba(var(--primary-rgb),0.05)'" onmouseout="this.style.background='transparent'">
              <input type="checkbox" ${selectedIds.has(String(u.id)) ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--primary);" />
              <div style="width:32px;height:32px;border-radius:50%;background:var(--surface);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-secondary);font-weight:500;">${u.id}</div>
              <span style="font-size:14px;color:var(--text-primary);font-weight:500;">${esc(u.username || '')}</span>
            </div>
          `).join('');

        const listBox = document.getElementById('notifyUserList');
        listBox.style.opacity = allChecked ? '0.55' : '1';
        listBox.style.pointerEvents = allChecked ? 'none' : 'auto';

        document.querySelectorAll('#notifyUserList [data-id]').forEach(row => {
          row.onclick = () => {
            const id = String(row.dataset.id);
            if (selectedIds.has(id)) selectedIds.delete(id);
            else selectedIds.add(id);
            refreshSelectedCount();
            renderUserList();
          };
        });
      }

      async function loadUsers() {
        try {
          const data = await api('/api/super/users?role=&page=0&size=200');
          const page = data.data;
          users = (page.content || []).filter(u => u.role !== 'SUPER_ADMIN');
          refreshSelectedCount();
          renderUserList();
        } catch (e) {
          document.getElementById('notifyUserList').innerHTML = `<div style="padding:10px;color:#888">${e.message}</div>`;
        }
      }

      document.getElementById('notifyFilter').oninput = renderUserList;
      document.getElementById('notifyAll').onchange = e => {
        const disabled = e.target.checked;
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
          if (!all && selectedIds.size === 0) throw new Error('请至少选择一个目标用户');
          const ids = Array.from(selectedIds).map(id => Number(id)).filter(id => !Number.isNaN(id));
          await api('/api/super/notifications', {
            method: 'POST',
            body: JSON.stringify({
              scope: all ? 'ALL' : 'USER',
              targetUserId: all ? null : (ids.length === 1 ? ids[0] : null),
              targetUserIds: all ? [] : ids,
              content
            })
          });
          document.getElementById('notifyMsg').textContent = '发送成功';
          document.getElementById('notifyMsg').className = 'msg msg-ok';
          const confirmed = await uiConfirm('系统通知发送成功，点击确认后刷新页面并重新填写', '发送成功');
          if (confirmed) {
            renderTab();
            return;
          }
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
    <div class="tab-bar" style="display:flex;gap:32px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
      <button class="tab-btn active" data-antab="global" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">发布全局公告</button>
      <button class="tab-btn" data-antab="review" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">审核地区公告</button>
      <button class="tab-btn" data-antab="view" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">查看公告</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; font-weight: 600 !important; }
      .tab-btn::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; transform: scaleX(0); transition: transform 0.3s ease; }
      .tab-btn.active::after { transform: scaleX(1); }
    </style>
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
        <div style="max-width:700px;background:var(--surface);padding:32px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid var(--border-color);">
          <h3 style="margin:0 0 24px 0;font-size:18px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
            发布全局公告
          </h3>
          <div class="form-group" style="margin-bottom:20px;">
            <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">标题</label>
            <input id="globalAnnoTitle" style="width:100%;padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:15px;outline:none;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" placeholder="请输入公告标题" />
          </div>
          <div class="form-group" style="margin-bottom:24px;">
            <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">内容</label>
            <textarea id="globalAnnoContent" style="width:100%;min-height:240px;padding:16px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:15px;line-height:1.6;outline:none;resize:vertical;transition:border-color 0.2s, box-shadow 0.2s;font-family:inherit;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" placeholder="请输入公告详细内容..."></textarea>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:16px;padding-top:24px;border-top:1px solid var(--border-color);">
            <button class="btn-outline" id="globalAnnoClear" style="padding:10px 24px;border-radius:8px;font-weight:500;">清空内容</button>
            <button class="btn-primary" id="globalAnnoSend" style="padding:10px 32px;border-radius:8px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(var(--primary-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb),0.2)'">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              发布公告
            </button>
          </div>
          <p id="globalAnnoMsg" class="msg" style="margin-top:16px;text-align:center;"></p>
        </div>
        <div id="globalAnnoSuccess" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;">
          <div style="background:var(--surface);padding:32px;border-radius:16px;min-width:360px;box-shadow:0 24px 48px rgba(0,0,0,0.2);animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(var(--success-rgb),0.1);color:var(--success);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
              <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div style="font-weight:600;font-size:20px;margin-bottom:8px;color:var(--text-primary);">发布成功</div>
            <div style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;">全局公告已成功发送给所有用户</div>
            <button class="btn-primary" id="globalAnnoSuccessConfirm" style="width:100%;padding:12px;border-radius:8px;font-weight:500;">确认</button>
          </div>
        </div>
      `;

      const successBox = document.getElementById('globalAnnoSuccess');
      document.getElementById('globalAnnoClear').onclick = () => {
        document.getElementById('globalAnnoTitle').value = '';
        document.getElementById('globalAnnoContent').value = '';
      };
      document.getElementById('globalAnnoSend').onclick = async () => {
        try {
          const title = document.getElementById('globalAnnoTitle').value.trim();
          const content = document.getElementById('globalAnnoContent').value.trim();
          document.getElementById('globalAnnoMsg').textContent = '';
          await api('/api/super/announcements', { method: 'POST', body: JSON.stringify({ title, content }) });
          successBox.style.display = 'flex';
        } catch (e) {
          document.getElementById('globalAnnoMsg').textContent = e.message;
          document.getElementById('globalAnnoMsg').className = 'msg msg-err';
        }
      };
      document.getElementById('globalAnnoSuccessConfirm').onclick = () => {
        successBox.style.display = 'none';
        renderTab();
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
            ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无待审核地区公告</p>'
            : list.map(a => `
              <div style="background:var(--surface);border-radius:12px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);overflow:hidden;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                <div style="padding:24px;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <div style="background:rgba(var(--primary-rgb),0.1);color:var(--primary);padding:6px 12px;border-radius:6px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${esc(a.region || '-')}
                      </div>
                      <div style="font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        发送者：${esc(a.author?.username || '-')}
                      </div>
                    </div>
                  </div>
                  <div style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">${esc(a.title || '-')}</div>
                  <div style="font-size:15px;color:var(--text-regular);line-height:1.6;white-space:pre-wrap;background:var(--bg-color);padding:16px;border-radius:8px;border:1px solid var(--border-color);">${esc(a.content || '')}</div>
                </div>
                <div style="border-top:1px solid var(--border-color);padding:16px 24px;display:flex;justify-content:flex-end;gap:16px;background:var(--bg-color);">
                  <button class="btn-outline" data-reject="${a.id}" style="padding:8px 24px;border-radius:6px;font-weight:500;color:var(--danger);border-color:var(--danger);" onmouseover="this.style.background='var(--danger)';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='var(--danger)'">退回</button>
                  <button class="btn-primary" data-approve="${a.id}" style="padding:8px 24px;border-radius:6px;font-weight:500;box-shadow:0 2px 8px rgba(var(--primary-rgb),0.2);">通过审核</button>
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
              const ok = await uiConfirm('确定退回该公告？', '确认退回');
              if (!ok) return;
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
      <div class="tab-bar" style="display:flex;gap:24px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
        <button class="tab-btn active" data-vtab="global" style="background:none;border:none;padding:10px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">全体公告</button>
        <button class="tab-btn" data-vtab="region" style="background:none;border:none;padding:10px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">地区公告</button>
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
          ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无公告</p>'
          : list.map(a => `
            <div class="anno-card" style="background:var(--surface);border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
              <h3 style="margin:0 0 12px 0;font-size:18px;color:var(--text-primary);font-weight:600;display:flex;align-items:center;gap:8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
                ${esc(a.title)}
              </h3>
              ${a.scope === 'REGION' ? `<div style="font-size:12px;color:var(--primary);background:rgba(var(--primary-rgb),0.1);padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:16px;">地区公告：${esc(a.region || '-')}</div>` : '<div style="font-size:12px;color:var(--success);background:rgba(var(--success-rgb),0.1);padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:16px;">全体公告</div>'}
              <p style="margin:0 0 16px 0;font-size:15px;color:var(--text-regular);line-height:1.6;white-space:pre-wrap;">${esc(a.content)}</p>
              <div class="anno-time" style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                发布于 ${fmtTime(a.createdAt)}
              </div>
            </div>
          `).join('');
      } catch (e) {
        document.getElementById('viewAnnoList').innerHTML = '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无公告</p>';
      }
    }
    loadView();
  }
  renderTab();
});

Router.register('superMessages', function (app) {
  const main = renderLayout(app, 'SUPER_ADMIN', 'superMessages');
  main.innerHTML = `
    <div class="tab-bar" style="display:flex;gap:32px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
      <button class="tab-btn active" data-smtab="manage" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">管理消息</button>
      <button class="tab-btn" data-smtab="complaint" style="background:none;border:none;padding:12px 4px;font-size:16px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-secondary)'">处理投诉</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; font-weight: 600 !important; }
      .tab-btn::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; transform: scaleX(0); transition: transform 0.3s ease; }
      .tab-btn.active::after { transform: scaleX(1); }
    </style>
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
      <div class="filter-bar" style="display:flex;flex-wrap:wrap;gap:16px;background:var(--surface);padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);margin-bottom:24px;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">消息类型</label>
          <select id="smType" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">物品类型</label>
          <select id="smCat" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">地点</label>
          <select id="smLoc" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">时间范围</label>
          <select id="smTime" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:14px;color:var(--text-secondary);font-weight:500;">物品状态</label>
          <select id="smStatus" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 8px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'"><option value="">所有</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option><option value="ADMIN_DELETED">管理员删除</option></select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
          <div style="position:relative;width:100%;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-secondary)" stroke-width="2" fill="none" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="smKeyword" placeholder="物品名查找..." style="width:100%;padding:8px 12px 8px 32px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'" />
          </div>
          <button id="smSearchBtn" style="background:var(--primary);color:white;border:none;border-radius:6px;padding:8px 16px;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.2s;white-space:nowrap;" onmouseover="this.style.background='var(--primary-hover)'" onmouseout="this.style.background='var(--primary)'">搜索</button>
        </div>
      </div>
      <div id="smList" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:20px;"></div>
      <div id="smPager" class="pager" style="margin-top:32px;display:flex;justify-content:center;gap:8px;"></div>
      <div id="deleteModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;">
        <div style="background:var(--surface);padding:32px;border-radius:16px;width:100%;max-width:480px;box-shadow:0 24px 48px rgba(0,0,0,0.2);position:relative;animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
          <span id="smDeleteClose" style="position:absolute;right:20px;top:20px;font-size:24px;cursor:pointer;color:var(--text-secondary);transition:color 0.2s;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-secondary)'">&times;</span>
          <h3 style="margin:0 0 24px 0;font-size:20px;font-weight:600;color:var(--danger);text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            删除理由填写
          </h3>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">选择快捷理由</label>
            <select id="smDeleteReason" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 12px center;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
              <option value="恶意广告">恶意广告</option>
              <option value="虚假信息">虚假信息</option>
              <option value="侵权图片">侵权图片</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div style="margin-bottom:24px;">
            <label style="display:block;margin-bottom:8px;font-size:14px;font-weight:500;color:var(--text-secondary);">填写具体理由</label>
            <textarea id="smDeleteDetail" style="width:100%;min-height:120px;border:1px solid var(--border-color);border-radius:8px;padding:12px;background:var(--bg-color);color:var(--text-primary);font-size:14px;line-height:1.6;outline:none;resize:vertical;transition:border-color 0.2s, box-shadow 0.2s;font-family:inherit;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" placeholder="请输入详细的删除原因..."></textarea>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:16px;padding-top:24px;border-top:1px solid var(--border-color);">
            <button class="btn-outline" onclick="document.getElementById('smDeleteClose').click()" style="padding:10px 24px;border-radius:8px;font-weight:500;">取消</button>
            <button class="btn-danger" id="smDeleteConfirm" style="padding:10px 32px;border-radius:8px;font-weight:500;background:var(--danger);color:white;border:none;box-shadow:0 4px 12px rgba(var(--danger-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--danger-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb),0.2)'">确认删除</button>
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
      } catch (e) { await uiAlert(e.message, '删除失败'); }
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
          ? '<div style="grid-column:1/-1;"><p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无数据</p></div>'
          : list.map(item => `
            <div class="item-entry" style="background:var(--surface);border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);display:flex;flex-direction:column;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
              <div style="flex:1;">
                ${itemCardHtml(item)}
              </div>
              <div class="item-actions" style="padding:16px;border-top:1px solid var(--border-color);background:var(--bg-color);display:flex;justify-content:flex-end;">
                <button class="btn-sm btn-danger" data-del="${item.id}" style="padding:8px 20px;border-radius:6px;font-weight:500;background:var(--danger);color:white;border:none;display:flex;align-items:center;gap:6px;transition:background 0.2s;" onmouseover="this.style.background='var(--danger-hover)'" onmouseout="this.style.background='var(--danger)'">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  删除
                </button>
              </div>
            </div>
          `).join('');
        document.querySelectorAll('#smList .item-card-row[data-id]').forEach(card => {
          card.onclick = () => {
            sessionStorage.setItem('lf_detail_back_route', 'superMessages');
            Router.go('detail', { id: card.dataset.id });
          };
        });
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
      <div id="complaintList" style="display:flex;flex-direction:column;gap:20px;"></div>
      <div id="complaintPager" class="pager" style="margin-top:32px;display:flex;justify-content:center;gap:8px;"></div>
      <div id="complaintModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;">
        <div style="background:var(--surface);padding:32px;border-radius:16px;width:100%;max-width:400px;box-shadow:0 24px 48px rgba(0,0,0,0.2);position:relative;animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
          <div style="margin-bottom:24px;font-weight:600;font-size:20px;text-align:center;color:var(--text-primary);display:flex;align-items:center;justify-content:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--warning)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            处理违规用户方式
          </div>
          <select id="complaintAction" style="width:100%;padding:12px 16px;margin-bottom:32px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-primary);font-size:15px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 12px center;transition:border-color 0.2s, box-shadow 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
            <option value="WARN">警告用户</option>
            <option value="DELETE_ITEM">删除违规内容</option>
            <option value="BAN_USER">封禁该用户</option>
            <option value="DELETE_AND_BAN">删除内容并封禁</option>
          </select>
          <div style="display:flex;gap:16px;">
            <button class="btn-outline" onclick="document.getElementById('complaintModal').style.display='none'" style="flex:1;padding:12px;border-radius:8px;font-weight:500;">取消</button>
            <button id="complaintConfirm" class="btn-primary" style="flex:1;padding:12px;border-radius:8px;font-weight:500;box-shadow:0 4px 12px rgba(var(--primary-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb),0.2)'">确认处理</button>
          </div>
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
      } catch (e) { await uiAlert(e.message, '处理失败'); }
    };

    async function load() {
      try {
        const data = await api(`/api/super/complaints?status=PENDING&page=${pg}&size=8`);
        const page = data.data;
        const list = page.content || [];
        document.getElementById('complaintList').innerHTML = list.length === 0
          ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无投诉记录</p>'
          : list.map(c => {
            const item = c.item || {};
            const reporter = c.reporter || {};
            const target = c.target || {};
            const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
            const isLost = item.type === 'LOST';
            const locLabel = isLost ? '丢失地点' : '拾取地点';
            const timeLabel = isLost ? '丢失时间' : '拾得时间';
            const complaintType = c.complaintType || 'ITEM_POST';
            let complaintTypeLabel = '帖子投诉';
            if (complaintType === 'ITEM_POST') complaintTypeLabel = isLost ? '寻物启事投诉' : '失物招领投诉';
            else if (complaintType === 'CLAIM_APPLICATION') complaintTypeLabel = '申请投诉';
            else if (complaintType === 'CHAT_MESSAGE') complaintTypeLabel = '聊天投诉';
            return `
              <div class="complaint-card" style="background:var(--surface);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);overflow:hidden;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
                <div class="complaint-main" style="padding:24px;display:flex;gap:24px;flex-wrap:wrap;">
                  <div class="complaint-info" style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:12px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                      <span style="background:rgba(var(--danger-rgb),0.1);color:var(--danger);padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:4px;">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        ${esc(complaintTypeLabel)}
                      </span>
                      <span style="font-size:16px;font-weight:600;color:var(--text-primary);">${esc(item.title || '-')}</span>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;background:var(--bg-color);padding:16px;border-radius:8px;border:1px solid var(--border-color);">
                      <div style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:12px;color:var(--text-secondary);">物品类型</span><span style="font-size:14px;color:var(--text-primary);font-weight:500;">${esc(item.category || '-')}</span></div>
                      <div style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:12px;color:var(--text-secondary);">${locLabel}</span><span style="font-size:14px;color:var(--text-primary);font-weight:500;">${esc(item.location || '-')}</span></div>
                      <div style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:12px;color:var(--text-secondary);">${timeLabel}</span><span style="font-size:14px;color:var(--text-primary);font-weight:500;">${esc(item.lostTime || '-')}</span></div>
                    </div>
                    <div style="background:rgba(var(--warning-rgb),0.05);padding:16px;border-radius:8px;border:1px solid rgba(var(--warning-rgb),0.2);">
                      <div style="font-size:14px;font-weight:600;color:var(--warning);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        举报原因：${esc(c.reason || '-')}
                      </div>
                      <div style="font-size:14px;color:var(--text-regular);line-height:1.6;">${esc(c.detail || '-')}</div>
                    </div>
                    <div style="display:flex;gap:24px;margin-top:8px;font-size:13px;">
                      <div style="display:flex;align-items:center;gap:6px;color:var(--text-secondary);">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        举报人：<span style="color:var(--text-primary);font-weight:500;">${esc(reporter.username || '-')}</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:6px;color:var(--text-secondary);">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="var(--danger)" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
                        被举报用户：<span style="color:var(--danger);font-weight:500;">${esc(target.username || '-')}</span>
                      </div>
                    </div>
                  </div>
                  <div class="complaint-images" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;">
                    ${imgs.length > 0 ? imgs.slice(0, 3).map(u => `<div style="border-radius:8px;overflow:hidden;border:1px solid var(--border-color);box-shadow:0 2px 4px rgba(0,0,0,0.05);">${imgTag(u, 120, 90)}</div>`).join('') : '<div class="img-placeholder" style="width:120px;height:90px;background:var(--bg-color);border:1px dashed var(--border-color);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:12px;">暂无图片</div>'}
                  </div>
                </div>
                <div class="complaint-actions" style="padding:16px 24px;border-top:1px solid var(--border-color);background:var(--bg-color);display:flex;justify-content:flex-end;gap:16px;">
                  <button class="btn-outline" data-reject="${c.id}" style="padding:8px 24px;border-radius:6px;font-weight:500;">驳回投诉</button>
                  <button class="btn-primary" data-handle="${c.id}" style="padding:8px 24px;border-radius:6px;font-weight:500;background:var(--danger);color:white;border:none;box-shadow:0 2px 8px rgba(var(--danger-rgb),0.2);transition:background 0.2s;" onmouseover="this.style.background='var(--danger-hover)'" onmouseout="this.style.background='var(--danger)'">处理违规</button>
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
            const ok = await uiConfirm('确定驳回该投诉？', '确认驳回');
            if (!ok) return;
            await api(`/api/super/complaints/${b.dataset.reject}/reject`, { method: 'PUT' });
            load();
          };
        });
        renderPager(document.getElementById('complaintPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
      } catch (e) {
        document.getElementById('complaintList').innerHTML = `<p class="empty" style="text-align:center;padding:40px;color:var(--danger);font-size:15px;">${e.message}</p>`;
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
    <div style="padding:0 8px;max-width:1000px;margin:0 auto;">
      <h2 style="margin:0 0 24px 0;font-size:24px;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:12px;">
        <svg viewBox="0 0 24 24" width="28" height="28" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        数据管理
      </h2>
      
      <div style="background:var(--surface);border-radius:16px;padding:32px;margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:24px;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.04)'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
              系统数据备份
            </h3>
            <p style="margin:0;font-size:14px;color:var(--text-secondary);">手动触发全量数据库备份，确保数据安全</p>
          </div>
          <button class="btn-primary" id="backupBtn" style="padding:10px 24px;border-radius:8px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(var(--primary-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb),0.2)'">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            立即备份
          </button>
        </div>
        <div style="background:var(--bg-color);padding:20px;border-radius:12px;border:1px solid var(--border-color);display:flex;align-items:center;gap:12px;">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(var(--success-rgb),0.1);color:var(--success);display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">最近一次备份时间</div>
            <div id="lastBackupTime" style="font-size:18px;font-weight:600;color:var(--text-primary);">加载中...</div>
          </div>
        </div>
        <p id="backupMsg" class="msg" style="margin:0;"></p>
      </div>

      <div style="background:var(--surface);border-radius:16px;padding:32px;margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:24px;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.04)'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              导出业务数据
            </h3>
            <p style="margin:0;font-size:14px;color:var(--text-secondary);">按条件导出系统业务数据为 CSV 格式</p>
          </div>
          <button class="btn-outline" id="exportBtn" style="padding:10px 24px;border-radius:8px;font-weight:500;display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            导出数据
          </button>
        </div>
        <div style="background:var(--bg-color);padding:24px;border-radius:12px;border:1px solid var(--border-color);display:flex;flex-direction:column;gap:20px;">
          <div style="display:flex;align-items:center;gap:16px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-secondary);width:100px;">导出时间范围</label>
            <select id="exportRange" style="flex:1;max-width:300px;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:14px;outline:none;cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23666\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'6 9 12 15 18 9\\'></polyline></svg>');background-repeat:no-repeat;background-position:right 12px center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
              <option value="1">最近 1 个月</option>
              <option value="2">最近 2 个月</option>
              <option value="4">最近 4 个月</option>
              <option value="8">最近 8 个月</option>
              <option value="12">最近 1 年</option>
            </select>
          </div>
          <div style="display:flex;align-items:flex-start;gap:16px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-secondary);width:100px;margin-top:8px;">导出数据类型</label>
            <div style="display:flex;flex-wrap:wrap;gap:16px;flex:1;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--surface);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <input type="checkbox" value="FOUND" checked style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" />
                <span style="font-size:14px;color:var(--text-primary);">失物招领</span>
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--surface);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <input type="checkbox" value="LOST" style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" />
                <span style="font-size:14px;color:var(--text-primary);">寻物启事</span>
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--surface);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <input type="checkbox" value="GLOBAL_ANNOUNCEMENT" style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" />
                <span style="font-size:14px;color:var(--text-primary);">全局公告</span>
              </label>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--surface);padding:8px 16px;border-radius:8px;border:1px solid var(--border-color);transition:border-color 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <input type="checkbox" value="REGION_ANNOUNCEMENT" style="width:16px;height:16px;accent-color:var(--primary);cursor:pointer;" />
                <span style="font-size:14px;color:var(--text-primary);">地区公告</span>
              </label>
            </div>
          </div>
        </div>
        <p id="exportMsg" class="msg" style="margin:0;"></p>
      </div>

      <div style="background:var(--surface);border-radius:16px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.04);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:24px;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.04)'">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h3 style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:var(--danger);display:flex;align-items:center;gap:8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              清理过期数据
            </h3>
            <p style="margin:0;font-size:14px;color:var(--text-secondary);">永久删除已完结且超过指定天数的历史数据，释放存储空间</p>
          </div>
          <button class="btn-danger" id="cleanupBtn" style="padding:10px 24px;border-radius:8px;font-weight:500;background:var(--danger);color:white;border:none;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(var(--danger-rgb),0.2);transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--danger-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb),0.2)'">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
            执行清理
          </button>
        </div>
        <div style="background:rgba(var(--danger-rgb),0.05);padding:24px;border-radius:12px;border:1px solid rgba(var(--danger-rgb),0.2);display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <span style="font-size:14px;color:var(--text-primary);font-weight:500;">清理条件：状态为已认领、已归档、已取消、已驳回，且距今超过</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <input id="cleanupDays" type="number" min="1" value="7" style="width:80px;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--surface);color:var(--text-primary);font-size:14px;outline:none;text-align:center;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--danger)'" onblur="this.style.borderColor='var(--border-color)'" />
              <span style="font-size:14px;color:var(--text-primary);font-weight:500;">天</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-secondary);">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            预计可清理数据量：<span id="cleanupCount" style="font-weight:600;color:var(--danger);font-size:16px;">0 条</span>
          </div>
        </div>
        <p id="cleanupMsg" class="msg" style="margin:0;"></p>
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
      const res = await api('/api/super/export/csv', {
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
      link.download = data.fileName || 'data-export.csv';
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
