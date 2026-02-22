Router.register('home', async function (app) {
  const main = renderLayout(app, 'USER', 'home');
  main.innerHTML = `
    <h2 style="text-align:center;margin:20px 0 30px"><b>${esc(Auth.getUser())}，欢迎登录失物招领系统</b></h2>
    <h3 style="margin-bottom:16px"><b>我发布的帖子：</b></h3>
    <div id="myPostList"></div>
    <div id="myPostPager" class="pager"></div>
  `;

  let pg = 0;
  async function load() {
    try {
      const data = await api(`/api/items/my?page=${pg}&size=8`);
      const page = data.data || {};
      const list = page.content || [];
      if (list.length === 0) {
        document.getElementById('myPostList').innerHTML = '<p class="empty">暂无发布记录</p>';
        document.getElementById('myPostPager').innerHTML = '';
        return;
      }
      document.getElementById('myPostList').innerHTML = list.map(item => {
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const isLost = item.type === 'LOST';
        return `
          <div class="item-card-row" data-id="${item.id}" style="cursor:pointer">
            <div class="card-left">
              <div class="item-status">目前进度：${statusLabel(item.status)}</div>
              <div class="item-info">
                <div>物品名称：${esc(item.title || '-')}</div>
                <div>物品类型：${esc(item.category || '-')}</div>
                <div>${isLost ? '丢失' : '拾取'}地点：${esc(item.location || '-')}</div>
                <div>${isLost ? '丢失' : '拾得'}时间：${esc(item.lostTime || '-')}</div>
                <div style="color:#666">点击可查看详情及申请情况</div>
              </div>
            </div>
            <div class="card-right-wrap">
              <div class="card-images">
                ${imgs.length > 0 ? imgs.slice(0, 2).map(u => imgTag(u, 100, 80)).join('') : '<div class="img-placeholder">暂无图片</div><div class="img-placeholder">暂无图片</div>'}
              </div>
              <div class="card-time">发布时间：${fmtTime(item.createdAt)}</div>
            </div>
          </div>
        `;
      }).join('');
      document.querySelectorAll('#myPostList .item-card-row[data-id]').forEach(c => {
        c.onclick = () => Router.go('detail', { id: c.dataset.id });
      });
      renderPager(document.getElementById('myPostPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('myPostList').innerHTML = '<p class="empty">暂无发布记录</p>';
      document.getElementById('myPostPager').innerHTML = '';
    }
  }
  load();
});

Router.register('search', function (app) {
  const main = renderLayout(app, 'USER', 'search');
  main.innerHTML = `
    <div class="filter-bar">
      <label>消息类型</label><select id="fType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
      <label>物品类型</label><select id="fCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
      <label>地点</label><select id="fLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
      <label>时间范围</label><select id="fTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
      <label>物品状态</label><select id="fStatus"><option value="">所有</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option></select>
      <label>物品名查找</label><input type="text" id="fKeyword" />
      <span class="search-icon" id="searchBtn">&#128269;</span>
    </div>
    <div id="itemList"></div>
    <div id="pager" class="pager"></div>
    <div id="reportModal" class="modal-overlay hidden">
      <div class="modal-box">
        <span class="close-btn" id="reportClose">&times;</span>
        <h3>举报信息</h3>
        <div class="modal-row"><label>举报原因</label>
          <select id="reportReason">
            <option value="违规广告">违规广告</option>
            <option value="虚假信息">虚假信息</option>
            <option value="侵权图片">侵权图片</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="modal-row"><label>具体说明</label><textarea id="reportDetail" style="width:260px;min-height:80px"></textarea></div>
        <div style="display:flex;gap:20px;justify-content:center;margin-top:20px">
          <button class="btn-outline" id="reportSubmit">提交举报</button>
          <button class="btn-outline" id="reportCancel">取消</button>
        </div>
        <p id="reportMsg" class="msg" style="text-align:center"></p>
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
      alert('举报已提交');
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
        ? '<p class="empty">暂无数据</p>'
        : list.map(item => `
          <div class="item-entry">
            ${itemCardHtml(item)}
            <div class="item-actions">
              <button class="btn-sm" data-report="${item.id}">举报</button>
            </div>
          </div>
        `).join('');
      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => Router.go('detail', { id: c.dataset.id });
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
  main.innerHTML = '<div id="sysNotifyList"></div>';
  try {
    const data = await api('/api/notifications');
    const list = data.data || [];
    document.getElementById('sysNotifyList').innerHTML = list.length === 0
      ? '<p class="empty">暂无系统通知</p>'
      : list.map(n => `
        <div class="notify-card">
          <div class="notify-content">${esc(n.content || '')}</div>
          <div class="notify-time">发布于：${fmtTime(n.createdAt)}</div>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('sysNotifyList').innerHTML = `<p class="empty">${e.message}</p>`;
  }
});
