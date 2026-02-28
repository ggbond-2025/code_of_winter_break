Router.register('home', async function (app) {
  const main = renderLayout(app, 'USER', 'home');
  main.innerHTML = `
    <div style="max-width:1000px;margin:0 auto;padding:24px;animation:fadeIn 0.3s ease">
      <div style="text-align:center;margin:40px 0 48px;display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="font-size:48px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.1));animation:scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)">👋</div>
        <h2 style="margin:0;font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:0.5px"><b>${esc(Auth.getUser())}</b>，欢迎登录失物招领系统</h2>
        <div style="width:60px;height:4px;background:var(--primary);border-radius:2px"></div>
      </div>
      <div style="background:var(--surface);padding:32px;border-radius:var(--radius-lg);box-shadow:0 8px 24px rgba(0,0,0,0.04);border:1px solid var(--border)">
        <h3 style="margin:0 0 24px 0;font-size:20px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:12px"><span style="font-size:24px">📋</span> <b>目前进度</b></h3>
        <div id="myPostList" style="display:flex;flex-direction:column;gap:16px"></div>
        <div id="myPostPager" class="pager" style="margin-top:32px"></div>
      </div>
    </div>
  `;

  let pg = 0;
  const pageSize = 8;
  const hiddenStatuses = new Set(['APPROVED', 'CLAIMED', 'ARCHIVED', 'REJECTED']);

  async function fetchAllPages(pathBuilder) {
    let current = 0;
    let totalPages = 1;
    const all = [];
    while (current < totalPages) {
      const data = await api(pathBuilder(current, 50));
      const page = data.data || {};
      all.push(...(page.content || []));
      totalPages = page.totalPages || 1;
      current += 1;
    }
    return all;
  }

  async function load() {
    try {
      const [myItems, myApplications] = await Promise.all([
        fetchAllPages((page, size) => `/api/items/my?page=${page}&size=${size}`),
        fetchAllPages((page, size) => `/api/claims/my/applications?page=${page}&size=${size}`)
      ]);

      const ownEntries = myItems
        .filter(item => item && !hiddenStatuses.has(item.status))
        .map(item => ({
          item,
          source: 'PUBLISHED',
          sortAt: item.updatedAt || item.createdAt || ''
        }));

      const applyMap = new Map();
      for (const claim of myApplications) {
        const item = claim?.item;
        if (!item || hiddenStatuses.has(item.status) || applyMap.has(item.id)) continue;
        applyMap.set(item.id, {
          item,
          source: 'APPLIED',
          sortAt: claim.updatedAt || claim.createdAt || item.updatedAt || item.createdAt || ''
        });
      }
      const all = [...ownEntries, ...Array.from(applyMap.values())]
        .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

      if (all.length === 0) {
        document.getElementById('myPostList').innerHTML = '<p class="empty">暂无进度记录</p>';
        document.getElementById('myPostPager').innerHTML = '';
        return;
      }
      const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
      const from = pg * pageSize;
      const pageList = all.slice(from, from + pageSize);

      document.getElementById('myPostList').innerHTML = pageList.map(entry => {
        const item = entry.item;
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const isLost = item.type === 'LOST';
        return `
          <div class="item-card-row" data-id="${item.id}" style="cursor:pointer;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;display:flex;justify-content:space-between;gap:24px;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);position:relative;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.02)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:${isLost ? 'var(--warning)' : 'var(--success)'};border-radius:16px 0 0 16px"></div>
            <div class="card-left" style="flex:1;display:flex;flex-direction:column;gap:16px;padding-left:8px">
              <div class="item-status" style="font-size:16px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:8px">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--primary)"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                目前进度：${statusLabel(item.status)}
              </div>
              <div class="item-info" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;font-size:14px;color:var(--text-secondary)">
                <div style="grid-column:1/-1;color:var(--primary);font-weight:600;background:rgba(var(--primary-rgb), 0.1);padding:6px 16px;border-radius:20px;display:inline-flex;align-items:center;gap:6px;width:fit-content">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  来源：${entry.source === 'PUBLISHED' ? '我发布的帖子' : '我提交申请的帖子'}
                </div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg><span style="color:var(--text-main);font-weight:500">物品名称：</span>${esc(item.title || '-')}</div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg><span style="color:var(--text-main);font-weight:500">物品类型：</span>${esc(item.category || '-')}</div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span style="color:var(--text-main);font-weight:500">${isLost ? '丢失' : '拾取'}地点：</span>${esc(item.location || '-')}</div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><span style="color:var(--text-main);font-weight:500">${isLost ? '丢失' : '拾得'}时间：</span>${esc(item.lostTime || '-')}</div>
                <div style="grid-column:1/-1;color:var(--primary);font-size:13px;margin-top:12px;display:flex;align-items:center;gap:6px;font-weight:500;opacity:0.8">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                  点击卡片查看详情及申请情况
                </div>
              </div>
            </div>
            <div class="card-right-wrap" style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;min-width:240px">
              <div class="card-images" style="display:flex;gap:12px">
                ${imgs.length > 0 ? imgs.slice(0, 2).map(u => `<img src="${imgUrl(u)}" style="width:110px;height:88px;object-fit:cover;border-radius:12px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('') : '<div class="img-placeholder" style="width:110px;height:88px;background:var(--bg-color);border-radius:12px;border:2px dashed var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;gap:4px"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>暂无图片</div>'}
              </div>
              <div class="card-time" style="font-size:13px;color:var(--text-muted);margin-top:16px;display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                发布时间：${fmtTime(item.createdAt)}
              </div>
            </div>
          </div>
        `;
      }).join('');
      document.querySelectorAll('#myPostList .item-card-row[data-id]').forEach(c => {
        c.onclick = () => {
          sessionStorage.removeItem('lf_detail_from');
          sessionStorage.removeItem('lf_detail_from_item');
          sessionStorage.removeItem('lf_claim_back_route');
          Router.go('detail', { id: c.dataset.id });
        };
      });
      renderPager(document.getElementById('myPostPager'), pg, totalPages, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('myPostList').innerHTML = '<p class="empty">暂无进度记录</p>';
      document.getElementById('myPostPager').innerHTML = '';
    }
  }
  load();
});

Router.register('search', function (app) {
  const main = renderLayout(app, 'USER', 'search');
  main.innerHTML = `
    <div class="filter-bar" style="background:var(--surface);padding:24px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.04);border:1px solid var(--border);margin-bottom:24px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;animation:fadeIn 0.3s ease">
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">消息类型</label><select id="fType" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">物品类型</label><select id="fCat" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">地点</label><select id="fLoc" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">时间范围</label><select id="fTime" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">物品状态</label><select id="fStatus" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option></select></div>
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px"><label style="font-weight:600;color:var(--text-main);font-size:14px;white-space:nowrap">物品名查找</label><input type="text" id="fKeyword" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
      <span class="search-icon" id="searchBtn" style="background:var(--primary);color:white;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:8px;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.2)'"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
    </div>
    <div id="itemList" style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.4s ease"></div>
    <div id="pager" class="pager" style="margin-top:32px"></div>
    <div id="reportModal" class="modal-overlay hidden" style="background:rgba(15,23,42,0.08)">
      <div class="modal-box" style="padding:32px;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.2);animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);max-width:400px;width:90%">
        <span class="close-btn" id="reportClose" style="top:20px;right:20px;font-size:24px;color:var(--text-muted);transition:color 0.2s ease;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--bg-color)" onmouseover="this.style.color='var(--danger)';this.style.background='rgba(var(--danger-rgb),0.1)'" onmouseout="this.style.color='var(--text-muted)';this.style.background='var(--bg-color)'">&times;</span>
        <h3 style="margin-bottom:24px;font-size:20px;font-weight:800;color:var(--text-main);text-align:center;display:flex;align-items:center;justify-content:center;gap:8px">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="var(--danger)" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          举报信息
        </h3>
        <div class="modal-row" style="margin-bottom:20px;display:flex;flex-direction:column;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">举报原因</label>
          <select id="reportReason" style="width:100%;padding:12px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
            <option value="违规广告">违规广告</option>
            <option value="虚假信息">虚假信息</option>
            <option value="侵权图片">侵权图片</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="modal-row" style="margin-bottom:32px;display:flex;flex-direction:column;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">具体说明</label><textarea id="reportDetail" style="width:100%;min-height:120px;padding:16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;resize:vertical;transition:all 0.2s" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"></textarea></div>
        <div style="display:flex;gap:16px;justify-content:flex-end;padding-top:24px;border-top:1px solid var(--border)">
          <button class="btn-outline" id="reportCancel" style="padding:12px 24px;border-radius:12px;font-weight:600;flex:1">取消</button>
          <button class="btn-primary" id="reportSubmit" style="padding:12px 24px;border-radius:12px;background:var(--danger);border-color:var(--danger);box-shadow:0 4px 12px rgba(var(--danger-rgb), 0.2);font-weight:600;flex:1;transition:all 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 16px rgba(var(--danger-rgb), 0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--danger-rgb), 0.2)'">提交举报</button>
        </div>
        <p id="reportMsg" class="msg" style="text-align:center;margin-top:16px"></p>
      </div>
    </div>
  `;

  let currentPage = 0;
  fillCategorySelect('fCat');
  let reportItemId = null;
  const reportModal = document.getElementById('reportModal');
  const closeReportModal = () => {
    reportModal.classList.add('hidden');
    reportItemId = null;
  };
  document.getElementById('reportClose').onclick = closeReportModal;
  document.getElementById('reportCancel').onclick = closeReportModal;
  reportModal.addEventListener('click', function (e) { if (e.target === this) closeReportModal(); });
  document.getElementById('reportSubmit').onclick = async () => {
    try {
      const reason = document.getElementById('reportReason').value;
      const detail = document.getElementById('reportDetail').value.trim();
      await api('/api/complaints', { method: 'POST', body: JSON.stringify({ itemId: reportItemId, reason, detail }) });
      await uiAlert('举报已提交', '提交成功');
      closeReportModal();
    } catch (e) {
      document.getElementById('reportMsg').textContent = e.message;
      document.getElementById('reportMsg').className = 'msg msg-err';
    }
  };
  async function load() {
    const kw = document.getElementById('fKeyword').value;
    const type = document.getElementById('fType').value;
    const cat = document.getElementById('fCat').value;
    const loc = document.getElementById('fLoc').value;
    const status = document.getElementById('fStatus').value;
    const qs = `keyword=${encodeURIComponent(kw)}&type=${type}&category=${encodeURIComponent(cat)}&location=${encodeURIComponent(loc)}&status=${status}&page=${currentPage}&size=8`;
    try {
      const data = await api(`/api/items?${qs}`);
      const pg = data.data;
      const list = pg.content || [];
      document.getElementById('itemList').innerHTML = list.length === 0
        ? '<div style="text-align:center;padding:64px 24px;background:var(--surface);border-radius:16px;border:1px solid var(--border);box-shadow:0 4px 12px rgba(0,0,0,0.02)"><svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--text-muted)" stroke-width="1.5" fill="none" style="margin-bottom:16px"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><p style="margin:0;color:var(--text-secondary);font-size:16px">暂无数据</p></div>'
        : list.map(item => `
          <div class="item-entry" style="position:relative;transition:all 0.3s ease" onmouseover="this.querySelector('.item-actions').style.opacity='1'" onmouseout="this.querySelector('.item-actions').style.opacity='0'">
            ${itemCardHtml(item)}
            <div class="item-actions" style="position:absolute;top:20px;right:20px;opacity:0;transition:opacity 0.2s ease;z-index:10">
              <button class="btn-outline" style="padding:8px 20px;border-radius:12px;color:var(--danger);border-color:var(--danger);background:var(--surface);box-shadow:0 4px 12px rgba(0,0,0,0.05);font-weight:600;display:flex;align-items:center;gap:6px;transition:all 0.2s" onmouseover="this.style.background='var(--danger)';this.style.color='white'" onmouseout="this.style.background='var(--surface)';this.style.color='var(--danger)'" data-report="${item.id}">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                举报
              </button>
            </div>
          </div>
        `).join('');
      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => {
          sessionStorage.setItem('lf_detail_from', 'search');
          sessionStorage.setItem('lf_detail_from_item', String(c.dataset.id));
          sessionStorage.setItem('lf_claim_back_route', 'search');
          Router.go('detail', { id: c.dataset.id });
        };
      });
      document.querySelectorAll('[data-report]').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          reportItemId = b.dataset.report;
          document.getElementById('reportReason').value = '违规广告';
          document.getElementById('reportDetail').value = '';
          document.getElementById('reportMsg').textContent = '';
          reportModal.classList.remove('hidden');
        };
      });
      renderPager(document.getElementById('pager'), currentPage, pg.totalPages || 1, p => { currentPage = p; load(); });
    } catch (e) {
      document.getElementById('itemList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  document.getElementById('searchBtn').onclick = () => { currentPage = 0; load(); };
  document.getElementById('fKeyword').onkeydown = e => { if (e.key === 'Enter') { currentPage = 0; load(); } };
  ['fType', 'fCat', 'fLoc', 'fTime', 'fStatus'].forEach(id => {
    document.getElementById(id).onchange = () => { currentPage = 0; load(); };
  });
  load();
});

Router.register('list', function (app) {
  Router.go('search');
});

Router.register('sysNotify', async function (app) {
  const main = renderLayout(app, 'USER', 'sysNotify');
  main.innerHTML = `
    <div class="filter-bar" style="display:flex;gap:16px;background:var(--surface);padding:24px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.04);border:1px solid var(--border);margin-bottom:24px;align-items:center;animation:fadeIn 0.3s ease">
      <div style="display:flex;align-items:center;gap:8px">
        <label style="font-weight:600;color:var(--text-main);font-size:14px">消息类型</label>
        <select id="nType" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
          <option value="">所有</option>
          <option value="系统消息">系统消息</option>
          <option value="归还申请">归还申请</option>
          <option value="认领申请">认领申请</option>
          <option value="失物招领">失物招领</option>
          <option value="寻物启事">寻物启事</option>
          <option value="举报">举报</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label style="font-weight:600;color:var(--text-main);font-size:14px">时间范围</label>
        <select id="nTime" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
          <option value="">所有</option>
          <option value="7">近7天</option>
          <option value="30">近30天</option>
          <option value="90">近90天</option>
        </select>
      </div>
    </div>
    <div id="sysNotifyList" style="display:flex;flex-direction:column;gap:16px"></div>
    <div id="sysNotifyPager" class="pager" style="margin-top:32px"></div>
  `;

  const STATUS_MAP = {
    PENDING: '待审核',
    ADMIN_APPROVED: '管理员已通过',
    CLAIM_ADMIN_REVIEW: '管理员审核申请中',
    CLAIM_OWNER_REVIEW: '发布人审核申请中',
    APPROVED: '未匹配',
    REJECTED: '已驳回',
    MATCHED: '已匹配',
    CLAIMED: '已认领',
    ARCHIVED: '已归档',
    CANCELLED: '已取消',
    ADMIN_DELETED: '管理员删除',
    RESOLVED: '已处理'
  };

  function normalizeStatusText(text) {
    return String(text || '').replace(/\b(PENDING|ADMIN_APPROVED|CLAIM_ADMIN_REVIEW|CLAIM_OWNER_REVIEW|APPROVED|REJECTED|MATCHED|CLAIMED|ARCHIVED|CANCELLED|ADMIN_DELETED|RESOLVED)\b/g, s => STATUS_MAP[s] || s);
  }

  function parseNotify(raw) {
    const normalized = normalizeStatusText(raw);
    const objectMatch = normalized.match(/对象：([^；。]+)/);
    const eventMatch = normalized.match(/事件：([^；。]+)/);
    const detailMatch = normalized.match(/说明：([^。]+)/);
    const object = objectMatch ? objectMatch[1].trim() : '';
    let event = eventMatch ? eventMatch[1].trim() : '系统事件';
    let detail = detailMatch ? detailMatch[1].trim() : normalized.replace(/^【[^】]+】/, '').trim();
    if (event === '帖子状态跟踪') {
      event = '状态变更';
    }
    if (detail.startsWith('你申请过的帖子状态由')) {
      detail = detail.replace('你申请过的帖子状态由', '状态由');
    }

    const postMatch = object.match(/(失物招领|寻物启事)《([^》]+)》#?(\d+)?/);
    const claimMatch = object.match(/(认领申请|归还申请)《([^》]+)》#?(\d+)?/);
    const chatMatch = object.match(/聊天消息#?(\d+)?/);
    const isReport = event.includes('举报');

    let type = '系统消息';
    if (isReport) {
      type = '举报';
    } else if (claimMatch) {
      type = claimMatch[1] || '认领申请';
    } else if (postMatch) {
      type = postMatch[1];
    } else if (event.includes('申请')) {
      type = '认领申请';
    } else if (object.includes('寻物启事')) {
      type = '寻物启事';
    } else if (object.includes('失物招领')) {
      type = '失物招领';
    }

    const itemName = postMatch ? postMatch[2] : (claimMatch ? claimMatch[2] : '');
    const itemId = postMatch && postMatch[3] ? Number(postMatch[3])
      : (claimMatch && claimMatch[3] ? Number(claimMatch[3]) : null);
    const chatClaimId = chatMatch && chatMatch[1] ? Number(chatMatch[1]) : null;

    let reportTargetType = '';
    if (type === '举报') {
      if (object.includes('聊天消息')) reportTargetType = '聊天消息';
      else if (object.includes('认领申请') || object.includes('归还申请') || object.includes('申请')) reportTargetType = '申请';
      else if (object.includes('寻物启事')) reportTargetType = '寻物启事';
      else if (object.includes('失物招领')) reportTargetType = '失物招领';
      else reportTargetType = '申请';
    }

    let detailAction = 'none';
    if (type === '失物招领' || type === '寻物启事' || type === '认领申请' || type === '归还申请') {
      if (itemId) detailAction = 'item';
    } else if (type === '举报') {
      if (reportTargetType === '聊天消息') detailAction = 'chat';
      else if (itemId) detailAction = 'item';
    }

    return {
      type,
      event,
      itemName,
      itemId,
      chatClaimId,
      reportTargetType,
      detailAction,
      detail,
      normalized
    };
  }

  function withinDays(createdAt, days) {
    if (!days) return true;
    if (!createdAt) return false;
    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() - t <= Number(days) * 24 * 60 * 60 * 1000;
  }

  let pageIndex = 0;

  async function loadNotifications() {
    try {
      const type = document.getElementById('nType').value;
      const days = document.getElementById('nTime').value;
      const params = new URLSearchParams({ page: String(pageIndex), size: '8' });
      const data = await api(`/api/notifications?${params.toString()}`);
      const page = data.data || {};
      const rawList = page.content || [];
      const totalPages = page.totalPages || 1;
      const list = rawList.map(n => ({
        ...n,
        __parsed: parseNotify(n.content || '')
      }));

      const filtered = list.filter(n => {
        const p = n.__parsed;
        if (type && p.type !== type) return false;
        if (!withinDays(n.createdAt, days)) return false;
        return true;
      });

      document.getElementById('sysNotifyList').innerHTML = filtered.length === 0
        ? '<div style="text-align:center;padding:64px 24px;background:var(--surface);border-radius:16px;border:1px solid var(--border);box-shadow:0 4px 12px rgba(0,0,0,0.02)"><svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--text-muted)" stroke-width="1.5" fill="none" style="margin-bottom:16px"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><p style="margin:0;color:var(--text-secondary);font-size:16px">暂无系统通知</p></div>'
        : filtered.map(n => `
          <div class="notify-card" style="background:var(--surface);border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.02);border:1px solid var(--border);transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);border-left:6px solid var(--primary);animation:fadeIn 0.3s ease" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)'" ${n.__parsed.itemId && (n.__parsed.type === '失物招领' || n.__parsed.type === '寻物启事') ? `data-item-id="${n.__parsed.itemId}"` : ''}>
            <div class="notify-head" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">
              <span class="notify-type" style="background:rgba(var(--primary-rgb), 0.1);color:var(--primary);padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                ${esc(n.__parsed.type)}
              </span>
              <div class="notify-time" style="font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${fmtTime(n.createdAt)}
              </div>
            </div>
            <div class="notify-content" style="display:flex;flex-direction:column;gap:12px">
              <div class="notify-line" style="font-size:15px;color:var(--text-main);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><b style="color:var(--text-main)">事件：</b>${esc(n.__parsed.event)}</div>
              <div class="notify-line" style="font-size:15px;color:var(--text-main);background:var(--bg-color);padding:16px;border-radius:12px;border:1px solid var(--border);display:flex;align-items:flex-start;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted);margin-top:2px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><div><b style="color:var(--text-main);margin-right:4px">说明：</b>${esc(n.__parsed.detail || '无')}</div></div>
              ${(n.__parsed.type === '失物招领' || n.__parsed.type === '寻物启事')
                ? `<div class="notify-line" style="font-size:15px;color:var(--text-main);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg><b style="color:var(--text-main)">物品名称：</b>${esc(n.__parsed.itemName || '无')}</div>
                   <div class="notify-line" style="margin-top:12px">${n.__parsed.itemId ? '<button class="btn-sm notify-link" style="padding:8px 20px;background:var(--primary);color:#fff;border:none;border-radius:12px;cursor:pointer;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 16px rgba(var(--primary-rgb), 0.3)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(var(--primary-rgb), 0.2)\'" data-detail-id="' + n.__parsed.itemId + '">查看帖子详情 <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>' : '<span style="color:var(--text-muted);font-size:14px;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>暂无可跳转详情</span>'}</div>`
                : ''}
              ${(n.__parsed.type === '认领申请' || n.__parsed.type === '归还申请')
                ? `<div class="notify-line" style="font-size:15px;color:var(--text-main);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg><b style="color:var(--text-main)">物品名称：</b>${esc(n.__parsed.itemName || '无')}</div>
                   <div class="notify-line" style="margin-top:12px">${n.__parsed.itemId ? '<button class="btn-sm notify-link" style="padding:8px 20px;background:var(--primary);color:#fff;border:none;border-radius:12px;cursor:pointer;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 16px rgba(var(--primary-rgb), 0.3)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(var(--primary-rgb), 0.2)\'" data-detail-id="' + n.__parsed.itemId + '">查看申请详情 <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>' : '<span style="color:var(--text-muted);font-size:14px;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>暂无可跳转详情</span>'}</div>`
                : ''}
              ${n.__parsed.type === '举报'
                ? `<div class="notify-line" style="font-size:15px;color:var(--text-main);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><b style="color:var(--text-main)">举报对象类型：</b>${esc(n.__parsed.reportTargetType || '申请')}</div>
                   <div class="notify-line" style="margin-top:12px">${n.__parsed.detailAction === 'item' ? '<button class="btn-sm notify-link" style="padding:8px 20px;background:var(--primary);color:#fff;border:none;border-radius:12px;cursor:pointer;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 16px rgba(var(--primary-rgb), 0.3)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(var(--primary-rgb), 0.2)\'" data-detail-id="' + (n.__parsed.itemId || '') + '">查看举报对象详情 <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>' : (n.__parsed.detailAction === 'chat' ? '<button class="btn-sm notify-chat-link" style="padding:8px 20px;background:var(--primary);color:#fff;border:none;border-radius:12px;cursor:pointer;transition:all 0.2s ease;display:inline-flex;align-items:center;gap:6px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2)" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 16px rgba(var(--primary-rgb), 0.3)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 4px 12px rgba(var(--primary-rgb), 0.2)\'">查看聊天详情 <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>' : '<span style="color:var(--text-muted);font-size:14px;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>暂无可跳转详情</span>')}</div>`
                : ''}
            </div>
          </div>
        `).join('');

      document.querySelectorAll('[data-detail-id]').forEach(btn => {
        btn.onclick = () => {
          const id = Number(btn.getAttribute('data-detail-id'));
          if (!id) return;
          sessionStorage.setItem('lf_detail_back_route', 'sysNotify');
          Router.go('detail', { id });
        };
      });
      document.querySelectorAll('.notify-chat-link').forEach(btn => {
        btn.onclick = () => Router.go('myChat');
      });
      renderPager(document.getElementById('sysNotifyPager'), pageIndex, totalPages, p => { pageIndex = p; loadNotifications(); });
    } catch (e) {
      document.getElementById('sysNotifyList').innerHTML = `<p class="empty">${e.message}</p>`;
      document.getElementById('sysNotifyPager').innerHTML = '';
    }
  }

  ['nType', 'nTime'].forEach(id => {
    document.getElementById(id).onchange = () => { pageIndex = 0; loadNotifications(); };
  });
  loadNotifications();
});
