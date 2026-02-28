Router.register('admin', function (app) {
  Router.go('adminHome');
});

Router.register('adminHome', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminHome');
  main.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:60vh;animation:scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards">
      <div style="font-size:64px;margin-bottom:24px">👋</div>
      <h2 style="font-size:32px;font-weight:800;color:var(--text-main);letter-spacing:-0.02em;margin-bottom:16px">管理员 ${esc(Auth.getUser())}，欢迎回来</h2>
      <p style="font-size:16px;color:var(--text-muted)">请在左侧菜单选择需要进行的操作</p>
    </div>
  `;
});

Router.register('adminReview', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminReview');
  main.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;animation:fadeIn 0.3s ease">
      <h2 style="margin:0;font-size:24px;font-weight:700;color:var(--text-main)">待审核消息</h2>
    </div>
    <div class="tab-bar" style="display:flex;gap:16px;margin-bottom:24px;border-bottom:2px solid var(--border);padding-bottom:12px;animation:fadeIn 0.3s ease">
      <button class="tab-btn active" data-rtab="FOUND" style="padding:8px 24px;background:transparent;border:none;font-size:16px;font-weight:600;color:var(--text-muted);cursor:pointer;position:relative;transition:all 0.3s ease" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-muted)'">失物招领</button>
      <button class="tab-btn" data-rtab="LOST" style="padding:8px 24px;background:transparent;border:none;font-size:16px;font-weight:600;color:var(--text-muted);cursor:pointer;position:relative;transition:all 0.3s ease" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-muted)'">寻物启事</button>
      <button class="tab-btn" data-rtab="CLAIM" style="padding:8px 24px;background:transparent;border:none;font-size:16px;font-weight:600;color:var(--text-muted);cursor:pointer;position:relative;transition:all 0.3s ease" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-muted)'">申请</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; }
      .tab-btn.active::after { content: ''; position: absolute; bottom: -14px; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; }
    </style>
    <div id="reviewList" style="display:flex;flex-direction:column;gap:20px"></div>
    <div id="reviewPager" class="pager" style="margin-top:32px"></div>
  `;

  let currentTab = 'FOUND';
  let pg = 0;
  let config = null;

  async function ensureConfig() {
    if (config) return config;
    try { config = await getConfig(); } catch (_) { config = {}; }
    return config;
  }

  document.querySelectorAll('[data-rtab]').forEach(btn => {
    btn.onclick = async () => {
      const cfg = await ensureConfig();
      if (!cfg.enableReview && (btn.dataset.rtab === 'FOUND' || btn.dataset.rtab === 'LOST')) {
        currentTab = 'CLAIM';
      } else {
        currentTab = btn.dataset.rtab;
      }
      document.querySelectorAll('[data-rtab]').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`[data-rtab="${currentTab}"]`);
      if (activeBtn) activeBtn.classList.add('active');
      pg = 0;
      load();
    };
  });

  async function load() {
    const cfg = await ensureConfig();
    if (!cfg.enableReview && currentTab !== 'CLAIM') {
      document.getElementById('reviewList').innerHTML = '<p class="empty">已关闭发布审核</p>';
      document.getElementById('reviewPager').innerHTML = '';
      return;
    }
    if (currentTab === 'CLAIM') {
      loadClaims();
      return;
    }
    try {
      const data = await api(`/api/admin/items?status=PENDING&type=${currentTab}&page=${pg}&size=8`);
      const page = data.data;
      const list = page.content || [];
      document.getElementById('reviewList').innerHTML = list.length === 0
        ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-muted);background:var(--surface);border-radius:var(--radius-lg);box-shadow:0 4px 12px rgba(0,0,0,0.05)">暂无待审核消息</p>'
        : list.map(item => {
          const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
          return `
            <div class="review-card" data-review-item-id="${item.id}" style="background:var(--surface);border-radius:var(--radius-lg);padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);transition:all 0.3s ease;border-left:4px solid var(--primary);cursor:pointer;animation:fadeIn 0.3s ease" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:15px;color:var(--text-main)">
                <div class="info-line"><b style="color:var(--text-muted)">物品名称：</b>${esc(item.title)}</div>
                <div class="info-line"><b style="color:var(--text-muted)">物品类型：</b>${esc(item.category || '-')}</div>
                <div class="info-line"><b style="color:var(--text-muted)">${item.type === 'LOST' ? '丢失' : '拾取'}地点：</b>${esc(item.location || '-')}</div>
                <div class="info-line"><b style="color:var(--text-muted)">${item.type === 'LOST' ? '丢失' : '拾得'}时间：</b>${esc(item.lostTime || '-')}</div>
                <div class="info-line"><b style="color:var(--text-muted)">领取地点：</b>${esc(item.storageLocation || '-')}</div>
                <div class="info-line"><b style="color:var(--text-muted)">联系方式：</b>${esc((item.contactPhone || '') + ' ' + (item.contactName || ''))}</div>
              </div>
              <div class="info-line" style="margin-bottom:16px;font-size:15px;color:var(--text-main);background:var(--bg-color);padding:12px;border-radius:var(--radius-md)"><b style="color:var(--text-muted)">物品介绍：</b>${esc(item.description || item.features || '-')}</div>
              <div class="review-images" style="display:flex;gap:12px;margin-bottom:20px">
                ${imgs.length > 0 ? imgs.slice(0, 3).map(u => `<img src="${imgUrl(u)}" style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius-md);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('') : '<div class="img-placeholder" style="width:120px;height:120px;background:var(--bg-color);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:14px">暂无图片</div>'}
              </div>
              <div class="review-actions" style="display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px">
                <button class="btn-outline" data-open-detail="${item.id}" style="padding:8px 20px;background:transparent;color:var(--text-main);border:1px solid var(--border);border-radius:var(--radius-md);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease" onmouseover="this.style.background='var(--bg-color)';this.style.borderColor='var(--text-muted)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--border)'">查看详情</button>
                <button class="btn-outline" data-approve="${item.id}" style="padding:8px 20px;background:var(--success);color:#fff;border:none;border-radius:var(--radius-md);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--success-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--success-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--success-rgb), 0.3)'">通过</button>
                <button class="btn-outline" data-reject="${item.id}" style="padding:8px 20px;background:var(--danger);color:#fff;border:none;border-radius:var(--radius-md);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--danger-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--danger-rgb), 0.3)'">驳回</button>
              </div>
            </div>
          `;
        }).join('');

      bindReviewActions();
      renderPager(document.getElementById('reviewPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('reviewList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  async function loadClaims() {
    try {
      const data = await api('/api/admin/claims/pending');
      const list = data.data || [];
      document.getElementById('reviewPager').innerHTML = '';
      if (list.length === 0) {
        document.getElementById('reviewList').innerHTML = '<p class="empty" style="text-align:center;padding:40px;color:var(--text-muted);background:var(--surface);border-radius:var(--radius-lg);box-shadow:0 4px 12px rgba(0,0,0,0.05)">暂无待审核申请</p>';
        return;
      }
      document.getElementById('reviewList').innerHTML = list.map(c => {
        const item = c.item || {};
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const claimImgs = c.imageUrls ? c.imageUrls.split(',').filter(Boolean) : [];
        return `
          <div class="review-card" data-claim-id="${c.id}" style="background:var(--surface);border-radius:var(--radius-lg);padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);transition:all 0.3s ease;border-left:4px solid var(--warning);animation:fadeIn 0.3s ease" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:15px;color:var(--text-main)">
              <div class="info-line"><b style="color:var(--text-muted)">关联物品：</b>${esc(item.title || '-')} <span style="background:rgba(var(--warning-rgb), 0.1);color:var(--warning);padding:2px 8px;border-radius:12px;font-size:12px;margin-left:8px">${item.type === 'LOST' ? '寻物' : '招领'}</span></div>
              <div class="info-line"><b style="color:var(--text-muted)">申请人：</b>${esc(c.claimer?.username || '-')}</div>
            </div>
            <div class="info-line" style="margin-bottom:16px;font-size:15px;color:var(--text-main);background:var(--bg-color);padding:12px;border-radius:var(--radius-md)"><b style="color:var(--text-muted)">留言/证明：</b>${esc(c.message || '-')}</div>
            <div style="display:flex;gap:24px;margin-bottom:20px">
              ${claimImgs.length > 0 ? `<div><div class="info-line" style="font-size:14px;color:var(--text-muted);margin-bottom:8px">证明材料图：</div><div style="display:flex;gap:8px">${claimImgs.map(u => `<img src="${imgUrl(u)}" style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('')}</div></div>` : ''}
              <div><div class="info-line" style="font-size:14px;color:var(--text-muted);margin-bottom:8px">物品图：</div><div style="display:flex;gap:8px">${imgs.length > 0 ? imgs.slice(0, 3).map(u => `<img src="${imgUrl(u)}" style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('') : '<span style="color:var(--text-muted);font-size:14px">无</span>'}</div></div>
            </div>
            <div class="review-actions" style="display:flex;gap:12px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:16px">
              <button class="btn-outline" data-claim-approve="${c.id}" style="padding:8px 20px;background:var(--success);color:#fff;border:none;border-radius:var(--radius-md);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--success-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--success-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--success-rgb), 0.3)'">通过（转发布者审核）</button>
              <button class="btn-outline" data-claim-reject="${c.id}" style="padding:8px 20px;background:var(--danger);color:#fff;border:none;border-radius:var(--radius-md);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--danger-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--danger-rgb), 0.3)'">驳回</button>
            </div>
          </div>
        `;
      }).join('');
      document.querySelectorAll('[data-claim-approve]').forEach(b => {
        b.onclick = async () => {
          try {
            await api(`/api/claims/${b.dataset.claimApprove}/review`, { method: 'PUT', body: JSON.stringify({ status: 'APPROVED', reason: '' }) });
            loadClaims();
          } catch (e) { await uiAlert(e.message, '操作失败'); }
        };
      });
      document.querySelectorAll('[data-claim-reject]').forEach(b => {
        b.onclick = async () => {
          openRejectModal(async (reason) => {
            try {
              await api(`/api/claims/${b.dataset.claimReject}/review`, { method: 'PUT', body: JSON.stringify({ status: 'REJECTED', reason }) });
              loadClaims();
            } catch (e) { await uiAlert(e.message, '操作失败'); }
          });
        };
      });
    } catch (e) {
      document.getElementById('reviewList').innerHTML = `<p class="empty">${e.message}</p>`;
      document.getElementById('reviewPager').innerHTML = '';
    }
  }

  function openRejectModal(onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:transparent;z-index:1100;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `
      <div style="background:var(--surface);border-radius:var(--radius-lg);min-width:520px;max-width:90%;padding:32px;position:relative;box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 0 1px var(--border)">
        <div style="position:absolute;right:16px;top:16px;font-size:20px;cursor:pointer;color:var(--text-muted);width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:var(--transition)" id="rejectClose">✖</div>
        <div style="font-weight:600;font-size:18px;margin-bottom:20px;text-align:center;color:var(--danger)">驳回理由填写</div>
        <select id="rejectReasonSelect" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:16px;font-size:14px;outline:none">
          <option value="消息不真实">消息不真实</option>
          <option value="信息不完整">信息不完整</option>
          <option value="图片不清晰">图片不清晰</option>
          <option value="与物品不符">与物品不符</option>
          <option value="其他">其他</option>
        </select>
        <div style="font-weight:500;margin-bottom:8px;font-size:14px;color:var(--text-main)">填写具体理由：</div>
        <textarea id="rejectReasonDetail" style="width:100%;min-height:100px;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;box-sizing:border-box;font-size:14px;outline:none;resize:vertical"></textarea>
        <div id="rejectError" style="color:var(--danger);margin-top:8px;min-height:18px;font-size:13px"></div>
        <div style="display:flex;justify-content:flex-end;gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid var(--border)">
          <button class="btn-outline" id="rejectCancelBtn">取消</button>
          <button class="btn-danger" id="rejectConfirmBtn">提交驳回</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#rejectClose').onclick = close;
    overlay.querySelector('#rejectCancelBtn').onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };
    overlay.querySelector('#rejectConfirmBtn').onclick = async () => {
      const base = overlay.querySelector('#rejectReasonSelect').value || '';
      const detail = overlay.querySelector('#rejectReasonDetail').value.trim();
      const reason = detail ? `${base}：${detail}` : base;
      if (!reason.trim()) {
        overlay.querySelector('#rejectError').textContent = '请填写驳回原因';
        return;
      }
      await onConfirm(reason);
      close();
    };
  }

  function bindReviewActions() {
    const reviewList = document.getElementById('reviewList');
    if (reviewList && !reviewList._detailDelegated) {
      reviewList.addEventListener('click', (evt) => {
        if (evt.target.closest('[data-open-detail],[data-approve],[data-reject]')) return;
        const card = evt.target.closest('[data-review-item-id]');
        if (card) {
          sessionStorage.setItem('lf_detail_back_route', 'adminReview');
          Router.go('detail', { id: card.dataset.reviewItemId });
        }
      });
      reviewList._detailDelegated = true;
    }

    document.querySelectorAll('[data-open-detail]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        sessionStorage.setItem('lf_detail_back_route', 'adminReview');
        Router.go('detail', { id: btn.dataset.openDetail });
      };
    });

    document.querySelectorAll('[data-approve]').forEach(b => {
      b.onclick = async (e) => {
        e.stopPropagation();
        try { await api(`/api/admin/items/${b.dataset.approve}/approve`, { method: 'PUT' }); load(); }
        catch (e) { await uiAlert(e.message, '操作失败'); }
      };
    });
    document.querySelectorAll('[data-reject]').forEach(b => {
      b.onclick = async (e) => {
        e.stopPropagation();
        const reason = await uiPrompt('请输入驳回原因（必填）', '驳回帖子', { required: true, placeholder: '请输入驳回原因' });
        if (reason === null) return;
        try { await api(`/api/admin/items/${b.dataset.reject}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }); load(); }
        catch (e) { await uiAlert(e.message, '操作失败'); }
      };
    });
  }

  (async () => {
    const cfg = await ensureConfig();
    if (!cfg.enableReview) {
      currentTab = 'CLAIM';
      document.querySelectorAll('[data-rtab]').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector('[data-rtab="CLAIM"]');
      if (activeBtn) activeBtn.classList.add('active');
    }
    load();
  })();
});

Router.register('adminManage', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminManage');
  main.innerHTML = `
    <div class="filter-bar" style="display:flex;flex-wrap:wrap;gap:16px;background:var(--surface);padding:20px;border-radius:var(--radius-lg);box-shadow:0 4px 12px rgba(0,0,0,0.05);margin-bottom:24px;align-items:center;animation:fadeIn 0.3s ease">
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main)">消息类型</label><select id="mType" style="padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main)">物品类型</label><select id="mCat" style="padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main)">地点</label><select id="mLoc" style="padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main)">时间范围</label><select id="mTime" style="padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main)">物品状态</label><select id="mStatus" style="padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option></select></div>
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px"><label style="font-weight:600;color:var(--text-main);white-space:nowrap">物品名查找</label><input type="text" id="mKeyword" style="flex:1;padding:8px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
      <span class="search-icon" id="mSearchBtn" style="cursor:pointer;font-size:20px;padding:8px;background:var(--primary);color:#fff;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--primary-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--primary-rgb), 0.3)'">&#128269;</span>
    </div>
    <div id="manageList" style="display:flex;flex-direction:column;gap:20px"></div>
    <div id="managePager" class="pager" style="margin-top:32px"></div>
    <div id="statusModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
      <div id="statusModalPanel" style="background:var(--surface);padding:32px;border-radius:16px;width:min(420px,100%);box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px var(--border);animation:scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards">
        <div style="margin-bottom:16px;font-weight:600;font-size:18px;color:var(--text-main)">更改状态为:</div>
        <select id="statusModalSelect" style="width:100%;padding:12px 16px;margin-bottom:24px;border:1px solid var(--border);border-radius:8px;font-size:15px;outline:none;background:var(--bg-color);transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
          <option value="APPROVED">未认领</option>
          <option value="MATCHED">已匹配</option>
          <option value="CLAIMED">已认领</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <div style="display:flex;gap:12px">
          <button id="statusModalCancel" class="btn-outline" style="flex:1;padding:12px;background:transparent;color:var(--text-main);border:1px solid var(--border);border-radius:var(--radius-md);font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease" onmouseover="this.style.background='var(--bg-color)';this.style.borderColor='var(--text-muted)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--border)'">取消</button>
          <button id="statusModalConfirm" class="btn-primary" style="flex:1;padding:12px;background:var(--primary);color:#fff;border:none;border-radius:var(--radius-md);font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--primary-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--primary-rgb), 0.3)'">确认</button>
        </div>
      </div>
    </div>
    <div id="archiveModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1001;align-items:center;justify-content:center">
      <div style="background:var(--surface);padding:32px 40px;min-width:540px;max-width:92%;position:relative;border-radius:16px;box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px var(--border);animation:scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards">
        <div id="archiveCloseBtn" style="position:absolute;right:20px;top:16px;font-size:28px;color:var(--text-muted);cursor:pointer;transition:all 0.2s ease" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-muted)'">&times;</div>
        <div style="font-size:24px;font-weight:700;color:var(--text-main);margin-bottom:24px">物品处理方式填写</div>
        <select id="archiveMethodSelect" style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:24px;font-size:15px;background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
          <option value="自行处理">自行处理</option>
          <option value="统一销毁">统一销毁</option>
          <option value="存储点存放">存储点存放</option>
        </select>
        <div style="font-size:16px;font-weight:600;color:var(--text-main);margin-bottom:12px">填写具体地点以及照片：</div>
        <input id="archiveLocationInput" style="width:100%;padding:12px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:24px;font-size:15px;background:var(--bg-color);outline:none;transition:all 0.2s ease" placeholder="请输入具体地点" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
        <div id="archiveImgBox" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"></div>
        <div id="archiveError" style="color:var(--danger);min-height:20px;margin-top:12px;font-size:14px"></div>
        <div style="text-align:right;margin-top:24px">
          <button class="btn-danger" id="archiveConfirmBtn" style="padding:12px 32px;background:var(--danger);color:#fff;border:none;border-radius:var(--radius-md);font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--danger-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--danger-rgb), 0.3)'">确认归档</button>
        </div>
      </div>
    </div>
    <div id="archiveGuardModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1002;align-items:center;justify-content:center">
      <div style="background:var(--surface);padding:40px;border-radius:16px;min-width:420px;max-width:90%;box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px var(--border);animation:scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards">
        <div style="font-size:20px;color:var(--text-main);text-align:center;margin-bottom:32px;font-weight:600;line-height:1.5">消息存在尚未超过规定天数<br>是否确认归档？</div>
        <div style="display:flex;justify-content:center;gap:16px">
          <button class="btn-outline" id="archiveGuardNo" style="flex:1;padding:12px;background:transparent;color:var(--text-main);border:1px solid var(--border);border-radius:var(--radius-md);font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease" onmouseover="this.style.background='var(--bg-color)';this.style.borderColor='var(--text-muted)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--border)'">取消</button>
          <button class="btn-danger" id="archiveGuardYes" style="flex:1;padding:12px;background:var(--danger);color:#fff;border:none;border-radius:var(--radius-md);font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 8px rgba(var(--danger-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(var(--danger-rgb), 0.3)'">确认归档</button>
        </div>
      </div>
    </div>
  `;

  let pg = 0;
  let claimExpireDays = 30;
  const itemMap = new Map();
  let archiveUploadedUrls = [];

  function renderArchiveImageSlots() {
    const box = document.getElementById('archiveImgBox');
    if (!box) return;
    const slots = [];
    for (let i = 0; i < 2; i++) {
      const url = archiveUploadedUrls[i];
      if (url) {
        slots.push(`
          <div style="position:relative;width:120px;height:120px;border-radius:var(--radius-md);overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
            <img src="${imgUrl(url)}" style="width:100%;height:100%;object-fit:cover" />
            <span data-archive-rm="${esc(url)}" style="position:absolute;top:4px;right:4px;background:rgba(231,76,60,0.9);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:transform 0.2s ease" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='none'">&times;</span>
          </div>
        `);
      } else {
        slots.push(`
          <label style="width:120px;height:120px;border:2px dashed var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--text-muted);cursor:pointer;transition:all 0.2s ease;background:var(--bg-color)" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-muted)'">+
            <input type="file" accept="image/*" data-archive-upload="${i}" style="display:none" />
          </label>
        `);
      }
    }
    box.innerHTML = slots.join('');
  }

  async function uploadArchiveImage(file) {
    const formData = new FormData();
    formData.append('files', file);
    const token = Auth.getToken();
    const res = await fetch(API_BASE + '/api/files/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData
    });
    const d = await res.json();
    if (!res.ok || d.success === false) throw new Error(d.message || '上传失败');
    const urls = d.data || [];
    if (!urls.length) throw new Error('上传失败');
    return urls[0];
  }

  (async () => {
    try {
      const cfg = await getConfig();
      if (cfg && cfg.claimExpireDays && Number(cfg.claimExpireDays) > 0) {
        claimExpireDays = Number(cfg.claimExpireDays);
      }
    } catch (_) {}
  })();

  function daysSinceLastAction(item) {
    const base = item?.updatedAt || item?.createdAt;
    if (!base) return 0;
    const ts = new Date(base).getTime();
    if (Number.isNaN(ts)) return 0;
    return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  }

  function openArchiveModal(itemId) {
    const archiveModal = document.getElementById('archiveModal');
    archiveModal._itemId = itemId;
    archiveUploadedUrls = [];
    document.getElementById('archiveMethodSelect').value = '自行处理';
    document.getElementById('archiveLocationInput').value = '';
    document.getElementById('archiveError').textContent = '';
    renderArchiveImageSlots();
    archiveModal.style.display = 'flex';
  }

  function openArchiveGuardModal(itemId) {
    const guard = document.getElementById('archiveGuardModal');
    guard._itemId = itemId;
    guard.style.display = 'flex';
  }

  function closeArchiveGuardModal() {
    const guard = document.getElementById('archiveGuardModal');
    guard._itemId = null;
    guard.style.display = 'none';
  }

  function startArchiveFlow(itemId) {
    const item = itemMap.get(String(itemId));
    if (!item) return;
    const daysSince = daysSinceLastAction(item);
    if (daysSince < claimExpireDays) {
      openArchiveGuardModal(itemId);
      return;
    }
    if (item.type === 'FOUND') {
      openArchiveModal(itemId);
      return;
    }
    submitArchive(itemId, { method: '', location: '', imageUrls: '' }).catch(err => uiAlert(err.message, '操作失败'));
  }

  async function submitArchive(itemId, payload) {
    await api(`/api/admin/items/${itemId}/archive`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const archiveModal = document.getElementById('archiveModal');
    archiveModal.style.display = 'none';
    load();
  }

  fillCategorySelect('mCat');
  async function load() {
    const type = document.getElementById('mType').value;
    const cat = document.getElementById('mCat').value;
    const loc = document.getElementById('mLoc').value;
    const status = document.getElementById('mStatus').value;
    const kw = document.getElementById('mKeyword').value.trim();
    try {
      const data = await api(`/api/admin/items?keyword=${encodeURIComponent(kw)}&type=${type}&category=${encodeURIComponent(cat)}&location=${encodeURIComponent(loc)}&status=${status}&page=${pg}&size=8`);
      const page = data.data;
      const list = page.content || [];
      itemMap.clear();
      list.forEach(item => itemMap.set(String(item.id), item));
      document.getElementById('manageList').innerHTML = list.length === 0
        ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无数据</p>'
        : list.map(item => {
          const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
          const isLost = item.type === 'LOST';
          const showArchiveDetail = item.status === 'ARCHIVED' && item.type === 'FOUND';
          const daysSince = daysSinceLastAction(item);
          const statusColor = item.status === 'APPROVED' ? 'var(--success)' : item.status === 'REJECTED' ? 'var(--danger)' : item.status === 'ARCHIVED' ? 'var(--text-secondary)' : 'var(--warning)';
          return `
            <div class="manage-card" style="background:var(--surface);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border-left:4px solid ${isLost ? 'var(--danger)' : 'var(--primary)'};transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
              <div class="item-card-row" style="display:flex;gap:20px;border:none;padding:0;margin:0;cursor:default">
                <div class="card-left" style="flex:1;">
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <span style="padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600;background:${isLost ? 'rgba(var(--danger-rgb),0.1)' : 'rgba(var(--primary-rgb),0.1)'};color:${isLost ? 'var(--danger)' : 'var(--primary)'}">${isLost ? '寻物启事' : '失物招领'}</span>
                    <span style="font-size:13px;color:${statusColor};font-weight:500;display:flex;align-items:center;gap:4px;">
                      <span style="width:6px;height:6px;border-radius:50%;background:currentColor;"></span>
                      ${statusLabel(item.status)}
                    </span>
                  </div>
                  <div class="item-info" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px;font-size:14px;color:var(--text-regular);">
                    <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">物品名称</span><span style="font-weight:500;color:var(--text-primary);">${esc(item.title)}</span></div>
                    <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">物品类型</span><span>${esc(item.category || '-')}</span></div>
                    <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">${isLost ? '丢失' : '拾取'}地点</span><span>${esc(item.location || '-')}</span></div>
                    <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">${isLost ? '丢失' : '拾得'}时间</span><span>${esc(item.lostTime || '-')}</span></div>
                    ${showArchiveDetail ? `<div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">处理方式</span><span>${esc(item.archiveMethod || '自行处理')}</span></div>` : ''}
                    ${showArchiveDetail ? `<div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">处理地点</span><span>${esc(item.archiveLocation || '-')}</span></div>` : ''}
                  </div>
                </div>
                <div class="card-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;min-width:120px;">
                  <div style="display:flex;gap:8px;">
                    ${imgs.length > 0 ? imgs.slice(0, 2).map(u => `<img src="${u}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--border-color);">`).join('') : '<div style="width:60px;height:60px;border-radius:8px;background:var(--background);display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:12px;border:1px dashed var(--border-color);">暂无图</div>'}
                  </div>
                  <div style="font-size:12px;color:var(--text-secondary);">发布于 ${fmtTime(item.createdAt)}</div>
                </div>
              </div>
              
              <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div class="days-info" style="display:flex;gap:16px;font-size:13px;color:var(--text-secondary);align-items:center;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    距上次操作 <b style="color:var(--text-primary);">${daysSince}</b> 天
                  </div>
                  ${daysSince >= claimExpireDays && item.status !== 'CANCELLED' ? `<div style="color:var(--danger);display:flex;align-items:center;gap:4px;background:rgba(var(--danger-rgb),0.1);padding:4px 8px;border-radius:4px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>符合归档标准</div>` : ''}
                </div>
                <div class="manage-actions">
                  ${item.status === 'CANCELLED' ? '<span style="color:var(--text-secondary);font-size:13px;padding:6px 12px;background:var(--background);border-radius:6px;">已取消</span>' : `<button class="btn-sm" data-mstatus="${item.id}" style="padding:6px 16px;border-radius:6px;background:var(--primary);color:white;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s;" onmouseover="this.style.filter='brightness(1.1)';this.style.transform='translateY(-1px)'" onmouseout="this.style.filter='none';this.style.transform='none'">更改状态</button>`}
                </div>
              </div>
            </div>
          `;
        }).join('');

      document.querySelectorAll('[data-mstatus]').forEach(btn => {
        btn.onclick = () => {
          const modal = document.getElementById('statusModal');
          const select = document.getElementById('statusModalSelect');
          modal._itemId = btn.dataset.mstatus;
          select.value = 'APPROVED';
          modal.style.display = 'flex';
        };
      });

      renderPager(document.getElementById('managePager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('manageList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  document.getElementById('mSearchBtn').onclick = () => { pg = 0; load(); };
  ['mType', 'mCat', 'mLoc', 'mTime', 'mStatus'].forEach(id => {
    document.getElementById(id).onchange = () => { pg = 0; load(); };
  });
  document.getElementById('mKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };

  document.getElementById('statusModalConfirm').onclick = async () => {
    const modal = document.getElementById('statusModal');
    const itemId = modal._itemId;
    if (!itemId) return;
    const newStatus = document.getElementById('statusModalSelect').value;
    if (newStatus === 'ARCHIVED') {
      modal.style.display = 'none';
      startArchiveFlow(itemId);
      return;
    }
    try {
      await api(`/api/admin/items/${itemId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      modal.style.display = 'none';
      load();
    } catch (e) {
      await uiAlert(e.message, '操作失败');
    }
  };
  document.getElementById('statusModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });
  document.getElementById('statusModalPanel').addEventListener('click', function (e) {
    e.stopPropagation();
  });
  document.getElementById('statusModalCancel').onclick = () => {
    const modal = document.getElementById('statusModal');
    modal._itemId = null;
    modal.style.display = 'none';
  };

  document.getElementById('archiveCloseBtn').onclick = () => {
    document.getElementById('archiveModal').style.display = 'none';
  };

  document.getElementById('archiveImgBox').addEventListener('change', async (e) => {
    const input = e.target.closest('input[data-archive-upload]');
    if (!input || !input.files || !input.files.length) return;
    try {
      const url = await uploadArchiveImage(input.files[0]);
      if (archiveUploadedUrls.length < 2) {
        archiveUploadedUrls.push(url);
      }
      renderArchiveImageSlots();
    } catch (err) {
      document.getElementById('archiveError').textContent = err.message;
    }
  });

  document.getElementById('archiveImgBox').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-archive-rm]');
    if (!rm) return;
    archiveUploadedUrls = archiveUploadedUrls.filter(u => u !== rm.dataset.archiveRm);
    renderArchiveImageSlots();
  });

  document.getElementById('archiveConfirmBtn').onclick = async () => {
    const archiveModal = document.getElementById('archiveModal');
    const itemId = archiveModal._itemId;
    if (!itemId) return;
    const method = document.getElementById('archiveMethodSelect').value;
    const location = (document.getElementById('archiveLocationInput').value || '').trim();
    if (!method.trim()) {
      document.getElementById('archiveError').textContent = '请选择处理方式';
      return;
    }
    try {
      await submitArchive(itemId, {
        method,
        location,
        imageUrls: archiveUploadedUrls.join(',')
      });
    } catch (e) {
      document.getElementById('archiveError').textContent = e.message;
    }
  };
  document.getElementById('archiveModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  document.getElementById('archiveGuardYes').onclick = () => {
    const guard = document.getElementById('archiveGuardModal');
    const itemId = guard._itemId;
    closeArchiveGuardModal();
    if (!itemId) return;
    const item = itemMap.get(String(itemId));
    if (!item) return;
    if (item.type === 'FOUND') {
      openArchiveModal(itemId);
      return;
    }
    submitArchive(itemId, { method: '', location: '', imageUrls: '' }).catch(err => uiAlert(err.message, '操作失败'));
  };
  document.getElementById('archiveGuardNo').onclick = () => {
    closeArchiveGuardModal();
  };
  document.getElementById('archiveGuardModal').addEventListener('click', function (e) {
    if (e.target === this) closeArchiveGuardModal();
  });

  load();
});

Router.register('adminMaintain', async function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminMaintain');
  main.innerHTML = `
    <div class="tab-bar" style="display:flex;gap:32px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
      <button class="tab-btn" data-mtab="update" style="background:none;border:none;padding:12px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;">更新信息</button>
      <button class="tab-btn" data-mtab="overview" style="background:none;border:none;padding:12px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;">消息总览</button>
      <button class="tab-btn" data-mtab="filter" style="background:none;border:none;padding:12px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;">筛选统计</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; }
      .tab-btn::after { content:''; position:absolute; bottom:-1px; left:0; width:100%; height:3px; background:var(--primary); border-radius:3px 3px 0 0; transform:scaleX(0); transition:transform 0.2s; }
      .tab-btn.active::after { transform:scaleX(1); }
    </style>
    <div id="maintainContent"></div>
  `;

  let currentTab = sessionStorage.getItem('adminMaintainTab') || 'update';
  document.querySelectorAll('[data-mtab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mtab === currentTab);
    btn.onclick = () => {
      document.querySelectorAll('[data-mtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.mtab;
      sessionStorage.setItem('adminMaintainTab', currentTab);
      renderTab();
    };
  });

  async function renderTab() {
    sessionStorage.setItem('adminMaintainTab', currentTab);
    const box = document.getElementById('maintainContent');
    if (currentTab === 'update') {
      box.innerHTML = `
        <div class="filter-bar" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;background:var(--surface);padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">消息类型</label>
            <select id="muType" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">物品类型</label>
            <select id="muCat" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">地点</label>
            <select id="muLoc" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">时间范围</label>
            <select id="muTime" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">物品状态</label>
            <select id="muStatus" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="PENDING">待审核</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="REJECTED">已驳回</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
            <div style="position:relative;flex:1;display:flex;align-items:center;">
              <input type="text" id="muKeyword" placeholder="物品名查找..." style="width:100%;padding:8px 36px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
              <span class="search-icon" id="muSearchBtn" style="position:absolute;right:10px;cursor:pointer;color:var(--text-secondary);transition:color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
            </div>
          </div>
        </div>
        <div id="maintainList"></div>
        <div id="maintainPager" class="pager"></div>
      `;

      let pg = 0;
      fillCategorySelect('muCat');
      async function load() {
        const type = document.getElementById('muType').value;
        const cat = document.getElementById('muCat').value;
        const loc = document.getElementById('muLoc').value;
        const status = document.getElementById('muStatus').value;
        const kw = document.getElementById('muKeyword').value.trim();
        try {
          const data = await api(`/api/admin/items?keyword=${encodeURIComponent(kw)}&type=${type}&category=${encodeURIComponent(cat)}&location=${encodeURIComponent(loc)}&status=${status}&page=${pg}&size=8`);
          const page = data.data;
          const list = page.content || [];
          document.getElementById('maintainList').innerHTML = list.length === 0
            ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无数据</p>'
            : list.map(item => itemCardHtml(item)).join('');
          document.querySelectorAll('#maintainList .item-card-row[data-id]').forEach(c => {
            c.onclick = () => Router.go('adminEditItem', { id: c.dataset.id });
          });
          renderPager(document.getElementById('maintainPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
        } catch (e) {
          document.getElementById('maintainList').innerHTML = `<p class="empty">${e.message}</p>`;
          document.getElementById('maintainPager').innerHTML = '';
        }
      }

      document.getElementById('muSearchBtn').onclick = () => { pg = 0; load(); };
      ['muType', 'muCat', 'muLoc', 'muTime', 'muStatus'].forEach(id => {
        document.getElementById(id).onchange = () => { pg = 0; load(); };
      });
      document.getElementById('muKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };
      load();
      return;
    }
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
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:30px;">
              <div style="width:100%;max-width:32px;height:${h}px;background:var(--primary);border-radius:4px 4px 0 0;transition:height 0.3s, filter 0.2s;" onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter='none'" title="${m.total || 0}条"></div>
              <div style="font-size:12px;color:var(--text-secondary);">${m.label || ''}</div>
            </div>
          `;
        }).join('');
        const monthLines = monthly.map(m => {
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--background);border-radius:8px;font-size:14px;"><span style="font-weight:500;color:var(--text-primary);">${m.label || ''}</span><span style="color:var(--text-secondary);"><span style="color:var(--primary);font-weight:500;">${m.lost || 0}</span> 寻物 / <span style="color:var(--danger);font-weight:500;">${m.found || 0}</span> 招领</span></div>`;
        }).join('');

        box.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px;margin-bottom:32px;">
            <div style="background:var(--surface);border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);">
              <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:20px;display:flex;align-items:center;gap:8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                数据统计
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px;color:var(--text-regular);">
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">总发布消息</span><span style="font-size:20px;font-weight:600;color:var(--text-primary);">${s.totalItems || 0}</span></div>
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">认领率</span><span style="font-size:20px;font-weight:600;color:var(--primary);">${rate}%</span></div>
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">失物招领</span><span style="font-size:16px;font-weight:500;">${s.foundCount || 0}</span></div>
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">寻物启事</span><span style="font-size:16px;font-weight:500;">${s.lostCount || 0}</span></div>
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">已匹配</span><span style="font-size:16px;font-weight:500;">${s.matchedItems || 0}</span></div>
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">已认领</span><span style="font-size:16px;font-weight:500;color:var(--success);">${s.claimedItems || 0}</span></div>
                <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">已归档</span><span style="font-size:16px;font-weight:500;color:var(--warning);">${s.archivedItems || 0}</span></div>
              </div>
            </div>
            <div style="background:var(--surface);border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:20px;align-self:flex-start;display:flex;align-items:center;gap:8px;">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
                状态分布
              </div>
              ${pieSvg()}
              <div style="display:flex;gap:16px;margin-top:20px;flex-wrap:wrap;justify-content:center;">
                ${pieData.map(d => `<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);"><span style="width:10px;height:10px;border-radius:50%;background:${d.color};"></span>${d.label}</div>`).join('')}
              </div>
            </div>
          </div>
          
          <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:16px;display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            近一年趋势
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px;">
            <div style="background:var(--surface);border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);overflow-x:auto;">
              <div style="display:flex;align-items:flex-end;gap:16px;height:200px;padding-bottom:10px;border-bottom:1px solid var(--border-color);">${bars}</div>
              <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-secondary);">每月发布消息数量</div>
            </div>
            <div style="background:var(--surface);border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);">
              <div style="display:flex;flex-direction:column;gap:12px;">${monthLines}</div>
            </div>
          </div>
        `;
      } catch (e) {
        box.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
      }
      return;
    }
    if (currentTab === 'filter') {
      box.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
          <button class="btn-outline" id="mfExportBtn" style="display:flex;align-items:center;gap:8px;padding:8px 16px;border-radius:6px;font-size:14px;font-weight:500;transition:all 0.2s;">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            导出统计数据
          </button>
        </div>
        <div class="filter-bar" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;background:var(--surface);padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">消息类型</label>
            <select id="mfType" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">物品类型</label>
            <select id="mfCat" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">地点</label>
            <select id="mfLoc" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">物品状态</label>
            <select id="mfStatus" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="PENDING">待审核</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="REJECTED">已驳回</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">时间范围</label>
            <select id="mfTime" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
            <div style="position:relative;flex:1;display:flex;align-items:center;">
              <input type="text" id="mfKeyword" placeholder="物品名查找..." style="width:100%;padding:8px 36px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
              <span class="search-icon" id="mfSearchBtn" style="position:absolute;right:10px;cursor:pointer;color:var(--text-secondary);transition:color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
            </div>
          </div>
        </div>
        <div id="mfList"></div>
        <div id="mfPager" class="pager"></div>
      `;

      let pg = 0;
      fillCategorySelect('mfCat');

      function buildFilterParams(pageIndex, pageSize) {
        const type = document.getElementById('mfType').value;
        const cat = document.getElementById('mfCat').value;
        const loc = document.getElementById('mfLoc').value;
        const status = document.getElementById('mfStatus').value;
        const time = document.getElementById('mfTime').value;
        const kw = document.getElementById('mfKeyword').value.trim();
        const params = new URLSearchParams({
          keyword: kw,
          type,
          category: cat,
          location: loc,
          status,
          page: String(pageIndex),
          size: String(pageSize)
        });
        if (time) params.set('time', time);
        return params;
      }

      function csvEscape(val) {
        const s = String(val == null ? '' : val);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      }

      async function load() {
        try {
          const params = buildFilterParams(pg, 8);
          const data = await api(`/api/admin/items?${params.toString()}`);
          const page = data.data;
          const list = page.content || [];
          document.getElementById('mfList').innerHTML = list.length === 0
            ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无数据</p>'
            : list.map(item => itemCardHtml(item)).join('');
          document.querySelectorAll('#mfList .item-card-row[data-id]').forEach(c => {
            c.onclick = () => Router.go('detail', { id: c.dataset.id });
          });
          renderPager(document.getElementById('mfPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
        } catch (e) {
          document.getElementById('mfList').innerHTML = `<p class="empty">${e.message}</p>`;
          document.getElementById('mfPager').innerHTML = '';
        }
      }

      document.getElementById('mfExportBtn').onclick = async () => {
        const btn = document.getElementById('mfExportBtn');
        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '导出中...';
        try {
          const pageSize = 200;
          const firstData = await api(`/api/admin/items?${buildFilterParams(0, pageSize).toString()}`);
          const firstPage = firstData.data || {};
          const totalPages = firstPage.totalPages || 1;
          const all = [...(firstPage.content || [])];

          for (let p = 1; p < totalPages; p++) {
            const d = await api(`/api/admin/items?${buildFilterParams(p, pageSize).toString()}`);
            const page = d.data || {};
            all.push(...(page.content || []));
          }

          if (all.length === 0) {
            await uiAlert('当前筛选条件下无可导出数据', '导出提示');
            return;
          }

          const headers = ['物品ID', '消息类型', '物品名称', '物品类型', '地点', '时间', '当前进度', '联系人', '联系方式', '发布时间'];
          const rows = all.map(item => [
            item.id || '',
            item.type === 'LOST' ? '寻物启事' : '失物招领',
            item.title || '',
            item.category || '',
            item.location || '',
            item.lostTime || '',
            statusLabel(item.status || ''),
            item.contactName || '',
            item.contactPhone || '',
            fmtTime(item.createdAt)
          ]);

          const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const now = new Date();
          const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
          a.href = url;
          a.download = `管理员筛选统计_${stamp}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          await uiAlert(e.message || '导出失败', '导出失败');
        } finally {
          btn.disabled = false;
          btn.textContent = oldText;
        }
      };

      document.getElementById('mfSearchBtn').onclick = () => { pg = 0; load(); };
      ['mfType', 'mfCat', 'mfLoc', 'mfStatus', 'mfTime'].forEach(id => {
        document.getElementById(id).onchange = () => { pg = 0; load(); };
      });
      document.getElementById('mfKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };
      load();
      return;
    }
  }

  renderTab();
});

Router.register('adminEditItem', async function (app, params) {
  const main = renderLayout(app, 'ADMIN', 'adminMaintain');
  main.innerHTML = '<p>加载中...</p>';

  try {
    const data = await api(`/api/items/${params.id}`);
    const item = data.data;
    const isLost = item.type === 'LOST';
    const canEdit = item.status !== 'ARCHIVED' && item.status !== 'CLAIMED';
    const dis = canEdit ? '' : 'disabled';
    const locLabel = isLost ? '丢失大致地点' : '拾取具体地点';
    const timeLabel = isLost ? '丢失大致时间' : '拾取时间';
    const campusLabel = isLost ? '丢失校区' : '拾取校区';
    const existingImgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const locParts = (item.location || '').split(' — ');
    const campusVal = locParts.length > 1 ? locParts[0] : '';
    const specificLoc = locParts.length > 1 ? locParts.slice(1).join(' — ') : (item.location || '');

    main.innerHTML = `
      <div class="publish-form" style="max-width:800px;margin:0 auto;background:var(--surface);padding:32px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);position:relative;">
        <span class="back-arrow" id="backMaintain" style="position:absolute;top:32px;left:32px;font-size:24px;color:var(--text-secondary);cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'">&#x21A9;</span>
        <h3 style="text-align:center;margin-bottom:32px;font-size:24px;color:var(--text-primary);font-weight:600;">修改发布信息 ${canEdit ? '' : '<span style="color:var(--danger);font-size:14px;font-weight:normal;background:rgba(var(--danger-rgb),0.1);padding:4px 8px;border-radius:4px;vertical-align:middle;">已归档/已认领，无法修改</span>'}</h3>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">物品名称 <span class="req" style="color:var(--danger);">*</span></label>
            <input id="eTitle" value="${esc(item.title || '')}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">${esc(locLabel)} <span class="req" style="color:var(--danger);">*</span></label>
            <input id="eLocation" value="${esc(specificLoc)}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">${esc(timeLabel)} <span class="req" style="color:var(--danger);">*</span></label>
            <input id="eLostTime" value="${esc(item.lostTime || '')}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>
          ${isLost ? `<div class="form-group" style="display:flex;flex-direction:column;gap:8px;"><label style="font-size:14px;font-weight:500;color:var(--text-primary);">悬赏（可选）</label><input id="eReward" type="number" value="${item.reward || ''}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" /></div>` : `<div class="form-group" style="display:flex;flex-direction:column;gap:8px;"><label style="font-size:14px;font-weight:500;color:var(--text-primary);">领取地点</label><input id="eStorage" value="${esc(item.storageLocation || '')}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" /></div>`}
        </div>
        
        <div class="form-group" style="display:flex;flex-direction:column;gap:8px;margin-top:24px;">
          <label style="font-size:14px;font-weight:500;color:var(--text-primary);">物品介绍 <span class="req" style="color:var(--danger);">*</span></label>
          <textarea id="eDesc" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;min-height:120px;resize:vertical;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">${esc(item.description || '')}</textarea>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;">
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">${esc(campusLabel)} <span class="req" style="color:var(--danger);">*</span></label>
            <select id="eCampus" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 12px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
            <option value="朝晖校区" ${campusVal.includes('朝晖') ? 'selected' : ''}>朝晖校区</option>
            <option value="屏峰校区" ${campusVal.includes('屏峰') ? 'selected' : ''}>屏峰校区</option>
            <option value="莫干山校区" ${campusVal.includes('莫干山') ? 'selected' : ''}>莫干山校区</option>
          </select>
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">物品类型 <span class="req" style="color:var(--danger);">*</span></label>
            <select id="eCategory" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 12px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
            <option value="文体" ${item.category === '文体' ? 'selected' : ''}>文体</option>
            <option value="证件" ${item.category === '证件' ? 'selected' : ''}>证件</option>
            <option value="电子产品" ${item.category === '电子产品' ? 'selected' : ''}>电子产品</option>
            <option value="生活用品" ${item.category === '生活用品' ? 'selected' : ''}>生活用品</option>
            <option value="书籍" ${item.category === '书籍' ? 'selected' : ''}>书籍</option>
            <option value="其他" ${item.category === '其他' ? 'selected' : ''}>其他</option>
          </select>
          </div>
        </div>
        
        <div class="form-group" style="display:flex;flex-direction:column;gap:8px;margin-top:24px;">
          <label style="font-size:14px;font-weight:500;color:var(--text-primary);">图片${canEdit ? '' : ' <span style="color:var(--text-secondary);font-weight:normal;">（不可修改）</span>'}</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;" id="eImgBox">
            ${existingImgs.map(u => `<div style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);" class="eimg-wrap"><img src="${imgUrl(u)}" style="width:100%;height:100%;object-fit:cover;" />${canEdit ? `<span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='var(--danger)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'" data-ermurl="${esc(u)}">&times;</span>` : ''}</div>`).join('')}
            ${canEdit && existingImgs.length < 3 ? `<label class="upload-area" id="eUploadLabel" style="width:100px;height:100px;border:2px dashed var(--border-color);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:all 0.2s;background:var(--background);" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.color='var(--text-secondary)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span style="font-size:12px;margin-top:4px;">上传图片</span><input type="file" id="eImgInput" accept="image/*" multiple style="display:none" /></label>` : ''}
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;">
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">联系人名称/班级 <span class="req" style="color:var(--danger);">*</span></label>
            <input id="eContact" value="${esc(item.contactName || '')}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>
          <div class="form-group" style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:14px;font-weight:500;color:var(--text-primary);">联系方式 <span class="req" style="color:var(--danger);">*</span></label>
            <input id="ePhone" value="${esc(item.contactPhone || '')}" ${dis} style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          </div>
        </div>
        
        <div class="form-actions" style="display:flex;justify-content:flex-end;gap:16px;margin-top:40px;padding-top:24px;border-top:1px solid var(--border-color);">
          <button class="btn-outline" id="eCancelBtn" style="padding:10px 24px;border-radius:8px;font-size:15px;font-weight:500;">取消</button>
          <button class="btn-primary" id="eSaveBtn" ${canEdit ? '' : 'disabled'} style="padding:10px 32px;border-radius:8px;font-size:15px;font-weight:500;background:var(--primary);color:white;border:none;cursor:${canEdit ? 'pointer' : 'not-allowed'};opacity:${canEdit ? '1' : '0.5'};transition:all 0.2s;" ${canEdit ? `onmouseover="this.style.filter='brightness(1.1)';this.style.transform='translateY(-1px)'" onmouseout="this.style.filter='none';this.style.transform='none'"` : ''}>保存修改</button>
        </div>
        <p id="eMsg" class="msg" style="text-align:center;margin-top:16px;"></p>
      </div>
    `;

    let editImgUrls = [...existingImgs];
    const eImgBox = document.getElementById('eImgBox');

    if (canEdit) {
      const eImgInput = document.getElementById('eImgInput');
      const eUploadLabel = document.getElementById('eUploadLabel');

      if (eImgInput) {
        eImgInput.onchange = async () => {
          const files = eImgInput.files;
          if (!files || files.length === 0) return;
          const remaining = 3 - editImgUrls.length;
          if (remaining <= 0) return;
          const formData = new FormData();
          for (let i = 0; i < Math.min(files.length, remaining); i++) formData.append('files', files[i]);
          try {
            const token = Auth.getToken();
            const res = await fetch(API_BASE + '/api/files/upload', { method: 'POST', headers: token ? { 'Authorization': 'Bearer ' + token } : {}, body: formData });
            const d = await res.json();
            if (!res.ok || d.success === false) throw new Error(d.message || '上传失败');
            (d.data || []).forEach(url => {
              if (editImgUrls.length >= 3) return;
              editImgUrls.push(url);
              const wrap = document.createElement('div');
              wrap.className = 'eimg-wrap';
              wrap.style.cssText = 'position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
              wrap.innerHTML = '<img src="' + imgUrl(url) + '" style="width:100%;height:100%;object-fit:cover;" /><span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background=\'var(--danger)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.6)\'" data-ermurl="' + url + '">&times;</span>';
              eImgBox.insertBefore(wrap, eUploadLabel);
            });
            if (editImgUrls.length >= 3 && eUploadLabel) eUploadLabel.style.display = 'none';
          } catch (e) { await uiAlert(e.message, '操作失败'); }
          eImgInput.value = '';
        };
      }

      eImgBox.addEventListener('click', (e) => {
        const rm = e.target.closest('[data-ermurl]');
        if (!rm) return;
        editImgUrls = editImgUrls.filter(u => u !== rm.dataset.ermurl);
        rm.parentElement.remove();
        if (eUploadLabel) eUploadLabel.style.display = '';
      });
    }

    document.getElementById('backMaintain').onclick = () => Router.go('adminMaintain');
    document.getElementById('eCancelBtn').onclick = () => Router.go('adminMaintain');
    document.getElementById('eSaveBtn').onclick = async () => {
      try {
        const body = {
          title: document.getElementById('eTitle').value,
          location: document.getElementById('eCampus').value + ' — ' + document.getElementById('eLocation').value,
          lostTime: document.getElementById('eLostTime').value,
          category: document.getElementById('eCategory').value,
          contactName: document.getElementById('eContact').value,
          contactPhone: document.getElementById('ePhone').value,
          imageUrls: editImgUrls.join(','),
          description: document.getElementById('eDesc').value,
          features: ''
        };
        const rw = document.getElementById('eReward');
        if (rw) body.reward = rw.value ? parseFloat(rw.value) : null;
        const st = document.getElementById('eStorage');
        if (st) body.storageLocation = st.value;
        await api(`/api/admin/items/${item.id}`, { method: 'PUT', body: JSON.stringify(body) });
        document.getElementById('eMsg').textContent = '修改成功';
        document.getElementById('eMsg').className = 'msg msg-ok';
        setTimeout(() => Router.go('adminMaintain'), 800);
      } catch (e) {
        document.getElementById('eMsg').textContent = e.message;
        document.getElementById('eMsg').className = 'msg msg-err';
      }
    };
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});

Router.register('adminHistory', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminHistory');
  main.innerHTML = `
    <h2 style="text-align:center;margin-bottom:24px;font-size:24px;color:var(--text-primary);font-weight:600;">历史审核记录</h2>
    <div class="filter-bar" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;background:var(--surface);padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">消息类型</label>
        <select id="ahType" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option><option value="CLAIM">申请</option></select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">地点</label>
        <select id="ahLoc" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <label style="font-size:13px;color:var(--text-secondary);font-weight:500;">时间范围</label>
        <select id="ahTime" style="padding:8px 32px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 8px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px;">
        <div style="position:relative;flex:1;display:flex;align-items:center;">
          <input type="text" id="ahKeyword" placeholder="物品名查找..." style="width:100%;padding:8px 36px 8px 12px;border:1px solid var(--border-color);border-radius:6px;font-size:14px;background:var(--background);outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
          <span class="search-icon" id="ahSearchBtn" style="position:absolute;right:10px;cursor:pointer;color:var(--text-secondary);transition:color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-secondary)'">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
        </div>
      </div>
    </div>
    </div>
    <div id="ahList"></div>
    <div id="ahPager" class="pager"></div>
  `;

  let pg = 0;
  function reviewCardHtml(r) {
    const item = r.item || {};
    const claim = r.claim || {};
    const isLost = item.type === 'LOST';
    const typeLabel = r.type === 'CLAIM' ? '申请' : (isLost ? '寻物启事' : '失物招领');
    const locLabel = isLost ? '丢失地点' : '拾取地点';
    const timeLabel = isLost ? '丢失时间' : '拾得时间';
    const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const resultLabel = r.result === 'REJECTED' ? '驳回' : '通过';
    const resultColor = r.result === 'REJECTED' ? 'var(--danger)' : 'var(--success)';
    const reason = r.result === 'REJECTED'
      ? (r.type === 'CLAIM' ? claim.rejectReason : item.rejectReason)
      : '';
    const claimInfo = r.type === 'CLAIM'
      ? `
        <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">申请人</span><span>${esc(claim.claimer?.username || '-')}</span></div>
        <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">申请留言</span><span>${esc(claim.message || claim.proof || '-')}</span></div>
      `
      : '';
    return `
      <div style="background:var(--surface);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border-left:4px solid ${resultColor};transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
        <div class="item-card-row" style="display:flex;gap:20px;border:none;padding:0;margin:0;cursor:pointer" data-id="${item.id || ''}">
          <div class="card-left" style="flex:1;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <span style="padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600;background:rgba(var(--primary-rgb),0.1);color:var(--primary)">${esc(typeLabel)}</span>
              <span style="font-size:13px;color:${resultColor};font-weight:500;display:flex;align-items:center;gap:4px;">
                <span style="width:6px;height:6px;border-radius:50%;background:currentColor;"></span>
                审核${resultLabel}
              </span>
            </div>
            <div class="item-info" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px;font-size:14px;color:var(--text-regular);">
              <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">物品名称</span><span style="font-weight:500;color:var(--text-primary);">${esc(item.title || '-')}</span></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">物品类型</span><span>${esc(item.category || '-')}</span></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">${locLabel}</span><span>${esc(item.location || '-')}</span></div>
              <div style="display:flex;flex-direction:column;gap:4px;"><span style="color:var(--text-secondary);font-size:12px;">${timeLabel}</span><span>${esc(item.lostTime || '-')}</span></div>
              ${claimInfo}
            </div>
          </div>
          <div class="card-right-wrap" style="display:flex;flex-direction:column;align-items:flex-end;gap:12px;min-width:120px;">
            <div class="card-images" style="display:flex;gap:8px;">
              ${imgs.length > 0 ? imgs.slice(0, 2).map(u => `<img src="${u}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--border-color);">`).join('') : '<div style="width:60px;height:60px;border-radius:8px;background:var(--background);display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:12px;border:1px dashed var(--border-color);">暂无图</div>'}
            </div>
            <div class="card-time" style="font-size:12px;color:var(--text-secondary);">审核于 ${fmtTime(r.reviewTime)}</div>
          </div>
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color);display:flex;flex-direction:column;gap:8px;font-size:14px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="color:var(--text-secondary);">审核结果：</span>
            <span style="font-weight:500;color:${resultColor};">${resultLabel}</span>
          </div>
          ${r.result === 'REJECTED' ? `<div style="display:flex;align-items:flex-start;gap:8px;"><span style="color:var(--text-secondary);white-space:nowrap;">驳回原因：</span><span style="color:var(--text-primary);">${esc(reason || '-')}</span></div>` : ''}
        </div>
      </div>
    `;
  }
  async function load() {
    try {
      const type = document.getElementById('ahType').value;
      const loc = document.getElementById('ahLoc').value;
      const time = document.getElementById('ahTime').value;
      const kw = document.getElementById('ahKeyword').value.trim();
      const params = new URLSearchParams({ type, location: loc, keyword: kw, page: String(pg), size: '8' });
      if (time) params.set('time', time);
      const data = await api(`/api/admin/reviews/history?${params.toString()}`);
      const page = data.data;
      const list = page.content || [];
      document.getElementById('ahList').innerHTML = list.length === 0
        ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无历史审核记录</p>'
        : list.map(r => reviewCardHtml(r)).join('');
      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => c.dataset.id && Router.go('detail', { id: c.dataset.id });
      });
      renderPager(document.getElementById('ahPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('ahList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }
  document.getElementById('ahSearchBtn').onclick = () => { pg = 0; load(); };
  ['ahType', 'ahLoc', 'ahTime'].forEach(id => {
    document.getElementById(id).onchange = () => { pg = 0; load(); };
  });
  load();
});

Router.register('adminRegionAnno', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminRegionAnno');
  const region = Auth.getRegion() || '';
  main.innerHTML = `
    <div style="max-width:800px;margin:0 auto;background:var(--surface);padding:32px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <div style="font-size:20px;font-weight:600;color:var(--text-primary);margin-bottom:24px;display:flex;align-items:center;gap:8px;">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
        发布地区公告
      </div>
      
      <div class="form-group" style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
        <label style="font-size:14px;font-weight:500;color:var(--text-primary);">发送地区</label>
        <select id="regionAnnoRegion" style="width:100%;max-width:300px;padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);cursor:pointer;appearance:none;background-image:url('data:image/svg+xml;utf8,<svg fill=%22%23666%22 viewBox=%220 0 24 24%22 width=%2216%22 height=%2216%22><path d=%22M7 10l5 5 5-5z%22/></svg>');background-repeat:no-repeat;background-position:right 12px center;outline:none;transition:all 0.2s;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'">
          <option value="朝晖校区">朝晖校区</option>
          <option value="屏峰校区">屏峰校区</option>
          <option value="莫干山校区">莫干山校区</option>
        </select>
      </div>
      
      <div class="form-group" style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
        <label style="font-size:14px;font-weight:500;color:var(--text-primary);">公告标题</label>
        <input id="regionAnnoTitle" placeholder="请输入公告标题" style="width:100%;padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'" />
      </div>
      
      <div class="form-group" style="display:flex;flex-direction:column;gap:8px;margin-bottom:32px;">
        <label style="font-size:14px;font-weight:500;color:var(--text-primary);">公告内容</label>
        <textarea id="regionAnnoContent" placeholder="请输入公告详细内容..." style="width:100%;min-height:200px;padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;font-size:15px;background:var(--background);transition:all 0.2s;outline:none;resize:vertical;" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border-color)';this.style.boxShadow='none'"></textarea>
      </div>
      
      <div style="display:flex;justify-content:flex-end;gap:16px;padding-top:24px;border-top:1px solid var(--border-color);">
        <button class="btn-outline" id="regionAnnoClear" style="padding:10px 24px;border-radius:8px;font-size:15px;font-weight:500;color:var(--danger);border-color:var(--danger);background:transparent;transition:all 0.2s;" onmouseover="this.style.background='rgba(var(--danger-rgb),0.1)'" onmouseout="this.style.background='transparent'">清空</button>
        <button class="btn-primary" id="regionAnnoSend" style="padding:10px 32px;border-radius:8px;font-size:15px;font-weight:500;background:var(--primary);color:white;border:none;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.filter='brightness(1.1)';this.style.transform='translateY(-1px)'" onmouseout="this.style.filter='none';this.style.transform='none'">发送公告</button>
      </div>
      <p id="regionAnnoMsg" class="msg" style="margin-top:16px;text-align:center;"></p>
    </div>
    
    <div id="regionAnnoConfirm" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,0.08);z-index:1000;align-items:center;justify-content:center">
      <div style="background:var(--surface);padding:32px;border-radius:16px;min-width:360px;box-shadow:0 10px 40px rgba(0,0,0,0.2);border:1px solid var(--border-color);animation:modalFadeIn 0.2s ease-out;">
        <div style="font-size:18px;font-weight:600;color:var(--text-primary);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--warning)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          确认发送地区公告
        </div>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.5;">发送后将对所选校区的所有用户生效，是否确认发送？</div>
        <div style="display:flex;justify-content:flex-end;gap:12px;">
          <button class="btn-outline" id="regionAnnoCancel" style="padding:8px 20px;border-radius:6px;font-size:14px;font-weight:500;">取消</button>
          <button class="btn-primary" id="regionAnnoConfirmSend" style="padding:8px 20px;border-radius:6px;font-size:14px;font-weight:500;background:var(--primary);color:white;border:none;cursor:pointer;">确认发送</button>
        </div>
      </div>
    </div>
  `;

  const confirmBox = document.getElementById('regionAnnoConfirm');
  document.getElementById('regionAnnoClear').onclick = () => {
    document.getElementById('regionAnnoTitle').value = '';
    document.getElementById('regionAnnoContent').value = '';
  };
  const regionSelect = document.getElementById('regionAnnoRegion');
  if (region) regionSelect.value = region;
  document.getElementById('regionAnnoSend').onclick = () => {
    document.getElementById('regionAnnoMsg').textContent = '';
    confirmBox.style.display = 'flex';
  };
  document.getElementById('regionAnnoCancel').onclick = () => { confirmBox.style.display = 'none'; };
  confirmBox.addEventListener('click', function (e) { if (e.target === this) this.style.display = 'none'; });
  document.getElementById('regionAnnoConfirmSend').onclick = async () => {
    try {
      const title = document.getElementById('regionAnnoTitle').value.trim();
      const content = document.getElementById('regionAnnoContent').value.trim();
      const region = document.getElementById('regionAnnoRegion').value;
      await api('/api/admin/announcements/region', { method: 'POST', body: JSON.stringify({ title, content, region }) });
      document.getElementById('regionAnnoMsg').textContent = '已提交审核';
      document.getElementById('regionAnnoMsg').className = 'msg msg-ok';
      confirmBox.style.display = 'none';
      document.getElementById('regionAnnoTitle').value = '';
      document.getElementById('regionAnnoContent').value = '';
    } catch (e) {
      document.getElementById('regionAnnoMsg').textContent = e.message;
      document.getElementById('regionAnnoMsg').className = 'msg msg-err';
    }
  };
});

Router.register('adminViewAnno', async function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminViewAnno');
  main.innerHTML = `
    <div class="tab-bar" style="display:flex;gap:32px;border-bottom:1px solid var(--border-color);margin-bottom:24px;padding:0 8px;">
      <button class="tab-btn active" data-atab="global" style="background:none;border:none;padding:12px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;">全体公告</button>
      <button class="tab-btn" data-atab="region" style="background:none;border:none;padding:12px 4px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;position:relative;transition:color 0.2s;">地区公告</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; }
      .tab-btn::after { content:''; position:absolute; bottom:-1px; left:0; width:100%; height:3px; background:var(--primary); border-radius:3px 3px 0 0; transform:scaleX(0); transition:transform 0.2s; }
      .tab-btn.active::after { transform:scaleX(1); }
    </style>
    <div id="adminAnnoList"></div>
  `;
  let currentTab = 'global';
  document.querySelectorAll('[data-atab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-atab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.atab;
      load();
    };
  });
  async function load() {
    try {
      const region = Auth.getRegion() || '';
      const scope = currentTab === 'global' ? 'GLOBAL' : 'REGION';
      const qs = new URLSearchParams({ scope });
      if (scope === 'REGION' && region) qs.set('region', region);
      const data = await api(`/api/announcements?${qs.toString()}`);
      const list = data.data || [];
      document.getElementById('adminAnnoList').innerHTML = list.length === 0
        ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无公告</p>'
        : list.map(a => `
          <div class="anno-card" style="background:var(--surface);border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
            <h3 style="margin:0 0 12px 0;font-size:18px;color:var(--text-primary);font-weight:600;display:flex;align-items:center;gap:8px;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
              ${esc(a.title)}
            </h3>
            ${a.scope === 'REGION' ? `<div style="font-size:12px;color:var(--primary);background:rgba(var(--primary-rgb),0.1);padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:16px;">地区公告：${esc(a.region || '-')}</div>` : ''}
            <p style="margin:0 0 16px 0;font-size:15px;color:var(--text-regular);line-height:1.6;white-space:pre-wrap;">${esc(a.content)}</p>
            <div class="anno-time" style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              发布于 ${fmtTime(a.createdAt)}
            </div>
          </div>
        `).join('');
    } catch (e) {
      document.getElementById('adminAnnoList').innerHTML = '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无公告</p>';
    }
  }
  load();
});

Router.register('adminNotify', async function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminNotify');
  main.innerHTML = '<div id="adminNotifyList"></div>';
  try {
    const data = await api('/api/notifications?page=0&size=8');
    const list = (data.data && data.data.content) ? data.data.content : (data.data || []);
    document.getElementById('adminNotifyList').innerHTML = list.length === 0
      ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-secondary);font-size:15px;">暂无系统通知</p>'
      : list.map(n => `
        <div class="notify-card" style="background:var(--surface);border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid var(--border-color);border-left:4px solid var(--primary);transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'">
          <div class="notify-content" style="font-size:15px;color:var(--text-primary);line-height:1.6;margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none" style="flex-shrink:0;margin-top:2px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <div style="flex:1;">${esc(n.content || '')}</div>
          </div>
          <div class="notify-time" style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;margin-left:32px;">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            发布于 ${fmtTime(n.createdAt)}
          </div>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('adminNotifyList').innerHTML = `<p class="empty" style="text-align:center;padding:40px;color:var(--danger);font-size:15px;">${e.message}</p>`;
  }
});

Router.register('adminChat', function (app) {
  Router.go('myChat');
});
