Router.register('history', function (app) {
  const main = renderLayout(app, 'USER', 'history');
  main.innerHTML = `
    <div class="filter-bar">
      <label>消息类型</label><select id="hType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
      <label>物品类型</label><select id="hCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
      <label>地点</label><select id="hLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
      <label>时间范围</label><select id="hTime"><option value="">所有</option></select>
      <label>物品状态</label><select id="hStatus"><option value="">所有</option><option value="PENDING">待审核</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="REJECTED">已驳回</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="CANCELLED">已取消</option><option value="ADMIN_DELETED">管理员删除</option></select>
      <label>物品名查找</label><input type="text" id="hKeyword" />
      <span class="search-icon" id="hSearchBtn">&#128269;</span>
    </div>
    <div id="historyList"></div>
    <div id="historyPager" class="pager"></div>
  `;

  let pg = 0;
  fillCategorySelect('hCat');
  async function load() {
    try {
      const data = await api(`/api/items/my?page=${pg}&size=8`);
      const page = data.data;
      const list = page.content || [];
      const statusFilter = document.getElementById('hStatus').value;
      const typeFilter = document.getElementById('hType').value;
      const catFilter = document.getElementById('hCat').value;
      const locFilter = document.getElementById('hLoc').value;
      const kwFilter = document.getElementById('hKeyword').value.toLowerCase();

      let filtered = list;
      if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      if (typeFilter) filtered = filtered.filter(i => i.type === typeFilter);
      if (catFilter) filtered = filtered.filter(i => i.category === catFilter);
      if (locFilter) filtered = filtered.filter(i => (i.location || '').includes(locFilter));
      if (kwFilter) filtered = filtered.filter(i => (i.title || '').toLowerCase().includes(kwFilter));

      document.getElementById('historyList').innerHTML = filtered.length === 0
        ? '<p class="empty">暂无发布记录</p>'
        : filtered.map(item => {
          const card = itemCardHtml(item);
          const isPending = item.status === 'PENDING' || item.status === 'REJECTED';
          const isApproved = item.status === 'APPROVED';
          let actions = '';
          if (isPending) {
            actions += `<button class="btn-sm" data-modify="${item.id}" style="margin-right:6px">修改</button>`;
            actions += `<button class="btn-sm btn-danger" data-delete="${item.id}">删除</button>`;
          } else if (isApproved) {
            actions += `<button class="btn-sm" data-modify="${item.id}" style="margin-right:6px">补充介绍</button>`;
            actions += `<button class="btn-sm btn-danger" data-cancel="${item.id}">取消发布</button>`;
          }
          return card + (actions ? `<div style="text-align:right;margin-top:-8px;margin-bottom:12px">${actions}</div>` : '');
        }).join('');

      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => Router.go('detail', { id: c.dataset.id });
      });

      document.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm('确定取消发布？取消后状态将变为已取消')) return;
          try { await api(`/api/items/${btn.dataset.cancel}/cancel`, { method: 'PUT' }); load(); }
          catch (err) { alert(err.message); }
        };
      });

      document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm('确定删除此记录？删除后不可恢复')) return;
          try { await api(`/api/items/${btn.dataset.delete}`, { method: 'DELETE' }); load(); }
          catch (err) { alert(err.message); }
        };
      });

      document.querySelectorAll('[data-modify]').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); Router.go('editItem', { id: btn.dataset.modify }); };
      });

      renderPager(document.getElementById('historyPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('historyList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  document.getElementById('hSearchBtn').onclick = () => { pg = 0; load(); };
  ['hType', 'hCat', 'hLoc', 'hTime', 'hStatus'].forEach(id => {
    document.getElementById(id).onchange = () => { pg = 0; load(); };
  });
  load();
});

Router.register('myItems', function (app) {
  Router.go('history');
});

Router.register('editItem', async function (app, params) {
  const main = renderLayout(app, 'USER', 'history');
  main.innerHTML = '<p>加载中...</p>';

  try {
    const data = await api(`/api/items/${params.id}`);
    const item = data.data;
    const isLost = item.type === 'LOST';
    const canEditAll = item.status === 'PENDING' || item.status === 'REJECTED';
    const dis = canEditAll ? '' : 'disabled';
    const locLabel = isLost ? '丢失大致地点' : '拾取具体地点';
    const timeLabel = isLost ? '丢失大致时间' : '拾取时间';
    const campusLabel = isLost ? '丢失校区' : '拾取校区';
    const existingImgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const locParts = (item.location || '').split(' — ');
    const campusVal = locParts.length > 1 ? locParts[0] : '';
    const specificLoc = locParts.length > 1 ? locParts.slice(1).join(' — ') : (item.location || '');

    main.innerHTML = `
      <div class="publish-form">
        <span class="back-arrow" id="backHistory">&#x21A9;</span>
        <h3>修改发布信息 ${canEditAll ? '' : '<span style="color:#888;font-size:13px">（已通过，仅可修改物品介绍）</span>'}</h3>
        <div class="form-group"><label>物品名称 <span class="req">*</span>:</label><input id="eTitle" value="${esc(item.title || '')}" ${dis} /></div>
        <div class="form-group"><label>${esc(locLabel)} <span class="req">*</span>:</label><input id="eLocation" value="${esc(specificLoc)}" ${dis} /></div>
        <div class="form-group"><label>${esc(timeLabel)} <span class="req">*</span>:</label><input id="eLostTime" value="${esc(item.lostTime || '')}" ${dis} /></div>
        ${isLost ? `<div class="form-group"><label>悬赏（可选）：</label><input id="eReward" type="number" value="${item.reward || ''}" ${dis} /></div>` : `<div class="form-group"><label>领取地点：</label><input id="eStorage" value="${esc(item.storageLocation || '')}" ${dis} /></div>`}
        <div class="form-group"><label>物品介绍 <span class="req">*</span>:</label><textarea id="eDesc">${esc(item.description || '')}</textarea></div>
        <div class="form-group"><label>${esc(campusLabel)} <span class="req">*</span>:</label>
          <select id="eCampus" ${dis}>
            <option value="朝晖校区" ${campusVal.includes('朝晖') ? 'selected' : ''}>朝晖校区</option>
            <option value="屏峰校区" ${campusVal.includes('屏峰') ? 'selected' : ''}>屏峰校区</option>
            <option value="莫干山校区" ${campusVal.includes('莫干山') ? 'selected' : ''}>莫干山校区</option>
          </select>
        </div>
        <div class="form-group"><label>物品类型 <span class="req">*</span>:</label>
          <select id="eCategory" ${dis}>
            <option value="文体" ${item.category === '文体' ? 'selected' : ''}>文体</option>
            <option value="证件" ${item.category === '证件' ? 'selected' : ''}>证件</option>
            <option value="电子产品" ${item.category === '电子产品' ? 'selected' : ''}>电子产品</option>
            <option value="生活用品" ${item.category === '生活用品' ? 'selected' : ''}>生活用品</option>
            <option value="书籍" ${item.category === '书籍' ? 'selected' : ''}>书籍</option>
            <option value="其他" ${item.category === '其他' ? 'selected' : ''}>其他</option>
          </select>
        </div>
        <div class="form-group">
          <label>图片${canEditAll ? '' : '（不可修改）'}：</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap" id="eImgBox">
            ${existingImgs.map(u => `<div style="position:relative;width:80px;height:80px" class="eimg-wrap"><img src="${imgUrl(u)}" style="width:80px;height:80px;object-fit:cover;border:1px solid #ccc" />${canEditAll ? `<span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" data-ermurl="${esc(u)}">&times;</span>` : ''}</div>`).join('')}
            ${canEditAll && existingImgs.length < 3 ? `<label class="upload-area" id="eUploadLabel">+<input type="file" id="eImgInput" accept="image/*" multiple style="display:none" /></label>` : ''}
          </div>
        </div>
        <div class="form-group"><label>联系人名称/班级 <span class="req">*</span>:</label><input id="eContact" value="${esc(item.contactName || '')}" ${dis} /></div>
        <div class="form-group"><label>联系方式 <span class="req">*</span>:</label><input id="ePhone" value="${esc(item.contactPhone || '')}" ${dis} /></div>
        <div class="form-actions">
          <button class="btn-outline" id="eCancelBtn">取消</button>
          <button class="btn-primary" id="eSaveBtn">保存修改</button>
        </div>
        <p id="eMsg" class="msg"></p>
      </div>
    `;

    let editImgUrls = [...existingImgs];
    const eImgBox = document.getElementById('eImgBox');

    if (canEditAll) {
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
              wrap.style.cssText = 'position:relative;width:80px;height:80px;';
              wrap.innerHTML = '<img src="' + imgUrl(url) + '" style="width:80px;height:80px;object-fit:cover;border:1px solid #ccc" /><span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" data-ermurl="' + url + '">&times;</span>';
              eImgBox.insertBefore(wrap, eUploadLabel);
            });
            if (editImgUrls.length >= 3 && eUploadLabel) eUploadLabel.style.display = 'none';
          } catch (e) { alert(e.message); }
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

    document.getElementById('backHistory').onclick = () => Router.go('history');
    document.getElementById('eCancelBtn').onclick = () => Router.go('history');
    document.getElementById('eSaveBtn').onclick = async () => {
      try {
        const body = { description: document.getElementById('eDesc').value };
        if (canEditAll) {
          body.title = document.getElementById('eTitle').value;
          body.location = document.getElementById('eCampus').value + ' — ' + document.getElementById('eLocation').value;
          body.lostTime = document.getElementById('eLostTime').value;
          body.category = document.getElementById('eCategory').value;
          body.contactName = document.getElementById('eContact').value;
          body.contactPhone = document.getElementById('ePhone').value;
          body.imageUrls = editImgUrls.join(',');
          body.features = '';
          const rw = document.getElementById('eReward');
          if (rw) body.reward = rw.value ? parseFloat(rw.value) : null;
          const st = document.getElementById('eStorage');
          if (st) body.storageLocation = st.value;
        }
        await api(`/api/items/${item.id}`, { method: 'PUT', body: JSON.stringify(body) });
        document.getElementById('eMsg').textContent = '修改成功';
        document.getElementById('eMsg').className = 'msg msg-ok';
        setTimeout(() => Router.go('history'), 800);
      } catch (e) {
        document.getElementById('eMsg').textContent = e.message;
        document.getElementById('eMsg').className = 'msg msg-err';
      }
    };
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});
