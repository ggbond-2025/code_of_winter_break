Router.register('history', function (app) {
  const main = renderLayout(app, 'USER', 'history');
  main.innerHTML = `
    <div class="filter-bar" style="background:var(--surface);padding:24px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.04);border:1px solid var(--border);margin-bottom:24px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;animation:fadeIn 0.3s ease">
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">消息类型</label><select id="hType" style="padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">物品类型</label><select id="hCat" style="padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">地点</label><select id="hLoc" style="padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">时间范围</label><select id="hTime" style="padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select></div>
      <div style="display:flex;align-items:center;gap:8px"><label style="font-weight:600;color:var(--text-main);font-size:14px">物品状态</label><select id="hStatus" style="padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"><option value="">所有</option><option value="PENDING">待审核</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="REJECTED">已驳回</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="CANCELLED">已取消</option></select></div>
      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px"><label style="font-weight:600;color:var(--text-main);font-size:14px;white-space:nowrap">物品名查找</label><input type="text" id="hKeyword" style="flex:1;padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);outline:none;transition:all 0.2s ease" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
      <span class="search-icon" id="hSearchBtn" style="background:var(--primary);color:white;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;cursor:pointer;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.2)'"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
    </div>
    <div id="historyList" style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.4s ease"></div>
    <div id="historyPager" class="pager" style="margin-top:32px"></div>
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
      const timeFilter = document.getElementById('hTime').value;

      let filtered = list;
      if (statusFilter) filtered = filtered.filter(i => i.status === statusFilter);
      if (typeFilter) filtered = filtered.filter(i => i.type === typeFilter);
      if (catFilter) filtered = filtered.filter(i => i.category === catFilter);
      if (locFilter) filtered = filtered.filter(i => (i.location || '').includes(locFilter));
      if (kwFilter) filtered = filtered.filter(i => (i.title || '').toLowerCase().includes(kwFilter));
      if (timeFilter) {
        const since = Date.now() - Number(timeFilter) * 24 * 60 * 60 * 1000;
        filtered = filtered.filter(i => {
          const t = new Date(i.createdAt || i.updatedAt || '').getTime();
          return !Number.isNaN(t) && t >= since;
        });
      }

      document.getElementById('historyList').innerHTML = filtered.length === 0
        ? '<div style="text-align:center;padding:64px 20px;background:var(--surface);border-radius:16px;border:1px solid var(--border);box-shadow:0 4px 12px rgba(0,0,0,0.02)"><svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--text-muted)" stroke-width="1.5" fill="none" style="margin-bottom:16px"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><p style="color:var(--text-secondary);font-size:15px;margin:0">暂无发布记录</p></div>'
        : filtered.map(item => {
          const card = itemCardHtml(item);
          const isPending = item.status === 'PENDING' || item.status === 'REJECTED';
          const isApproved = item.status === 'APPROVED';
          let actions = '';
          if (isPending) {
            actions += `<button class="btn-outline" data-modify="${item.id}" style="padding:8px 20px;border-radius:8px;margin-right:12px;font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--primary-rgb), 0.1)'" onmouseout="this.style.background='transparent'">修改</button>`;
            actions += `<button class="btn-outline" data-delete="${item.id}" style="padding:8px 20px;border-radius:8px;color:var(--danger);border-color:var(--danger);font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--danger-rgb), 0.1)'" onmouseout="this.style.background='transparent'">删除</button>`;
          } else if (isApproved) {
            actions += `<button class="btn-outline" data-modify="${item.id}" style="padding:8px 20px;border-radius:8px;margin-right:12px;font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--primary-rgb), 0.1)'" onmouseout="this.style.background='transparent'">补充介绍</button>`;
            actions += `<button class="btn-outline" data-cancel="${item.id}" style="padding:8px 20px;border-radius:8px;color:var(--danger);border-color:var(--danger);font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--danger-rgb), 0.1)'" onmouseout="this.style.background='transparent'">取消发布</button>`;
          } else if (item.status === 'CANCELLED') {
            actions += `<button class="btn-outline" data-republish="${item.id}" style="padding:8px 20px;border-radius:8px;margin-right:12px;font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--primary-rgb), 0.1)'" onmouseout="this.style.background='transparent'">重新发布</button>`;
            actions += `<button class="btn-outline" data-delete="${item.id}" style="padding:8px 20px;border-radius:8px;color:var(--danger);border-color:var(--danger);font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--danger-rgb), 0.1)'" onmouseout="this.style.background='transparent'">删除</button>`;
          }
          return `<div style="position:relative;transition:all 0.3s ease" onmouseover="this.querySelector('.item-actions').style.opacity='1';this.querySelector('.item-actions').style.transform='translateY(0)'" onmouseout="this.querySelector('.item-actions').style.opacity='0';this.querySelector('.item-actions').style.transform='translateY(-4px)'">${card}${actions ? `<div class="item-actions" style="position:absolute;top:20px;right:20px;opacity:0;transform:translateY(-4px);transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);z-index:10;background:var(--surface);padding:12px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.12);border:1px solid var(--border);display:flex;align-items:center">${actions}</div>` : ''}</div>`;
        }).join('');

      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => Router.go('detail', { id: c.dataset.id });
      });

      document.querySelectorAll('[data-cancel]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const ok = await uiConfirm('确定取消发布？取消后状态将变为已取消', '确认取消');
          if (!ok) return;
          try { await api(`/api/items/${btn.dataset.cancel}/cancel`, { method: 'PUT' }); load(); }
          catch (err) { await uiAlert(err.message, '操作失败'); }
        };
      });

      document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const ok = await uiConfirm('确定删除此记录？删除后不可恢复', '确认删除');
          if (!ok) return;
          try { await api(`/api/items/${btn.dataset.delete}`, { method: 'DELETE' }); load(); }
          catch (err) { await uiAlert(err.message, '操作失败'); }
        };
      });

      document.querySelectorAll('[data-republish]').forEach(btn => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const ok = await uiConfirm('确定重新发布该帖子？', '确认重新发布');
          if (!ok) return;
          try { await api(`/api/items/${btn.dataset.republish}/republish`, { method: 'PUT' }); load(); }
          catch (err) { await uiAlert(err.message, '操作失败'); }
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
    let cfg = {};
    try { cfg = await getConfig(); } catch (_) {}
    const data = await api(`/api/items/${params.id}`);
    const item = data.data;
    const isLost = item.type === 'LOST';
    const canEditAll = item.status === 'PENDING' || item.status === 'REJECTED';
    const canEditImage = canEditAll && !!cfg.requireImage;
    const dis = canEditAll ? '' : 'disabled';
    const locLabel = isLost ? '丢失大致地点' : '拾取具体地点';
    const timeLabel = isLost ? '丢失大致时间' : '拾取时间';
    const campusLabel = isLost ? '丢失校区' : '拾取校区';
    const existingImgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const locParts = (item.location || '').split(' — ');
    const campusVal = locParts.length > 1 ? locParts[0] : '';
    const specificLoc = locParts.length > 1 ? locParts.slice(1).join(' — ') : (item.location || '');

    main.innerHTML = `
      <div class="publish-form" style="max-width:700px;margin:40px auto;background:var(--surface);padding:40px;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.05);animation:fadeIn 0.3s ease;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--border)">
          <span class="back-arrow" id="backHistory" style="font-size:24px;cursor:pointer;color:var(--text-main);transition:transform 0.2s ease;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--bg-color);box-shadow:0 2px 8px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateX(-4px)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.color='var(--text-main)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span>
          <h3 style="margin:0;font-size:24px;font-weight:800;color:var(--text-main);letter-spacing:0.5px">修改发布信息 ${canEditAll ? '' : '<span style="color:var(--text-muted);font-size:14px;font-weight:normal;margin-left:8px">（已通过，仅可修改物品介绍）</span>'}</h3>
        </div>
        <div class="form-group" style="margin-bottom:24px"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">物品名称 <span class="req" style="color:var(--danger)">*</span></label><input id="eTitle" value="${esc(item.title || '')}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
        <div class="form-group" style="margin-bottom:24px"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">${esc(locLabel)} <span class="req" style="color:var(--danger)">*</span></label><input id="eLocation" value="${esc(specificLoc)}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
        <div class="form-group" style="margin-bottom:24px"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">${esc(timeLabel)} <span class="req" style="color:var(--danger)">*</span></label><input id="eLostTime" value="${esc(item.lostTime || '')}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
        ${isLost ? `<div class="form-group" style="margin-bottom:24px"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">悬赏（可选）</label><input id="eReward" type="number" value="${item.reward || ''}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>` : `<div class="form-group" style="margin-bottom:24px"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">领取地点</label><input id="eStorage" value="${esc(item.storageLocation || '')}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>`}
        <div class="form-group" style="margin-bottom:24px"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">物品介绍 <span class="req" style="color:var(--danger)">*</span></label><textarea id="eDesc" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);min-height:120px;resize:vertical;transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">${esc(item.description || '')}</textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
          <div class="form-group"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">${esc(campusLabel)} <span class="req" style="color:var(--danger)">*</span></label>
            <select id="eCampus" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
              <option value="朝晖校区" ${campusVal.includes('朝晖') ? 'selected' : ''}>朝晖校区</option>
              <option value="屏峰校区" ${campusVal.includes('屏峰') ? 'selected' : ''}>屏峰校区</option>
              <option value="莫干山校区" ${campusVal.includes('莫干山') ? 'selected' : ''}>莫干山校区</option>
            </select>
          </div>
          <div class="form-group"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">物品类型 <span class="req" style="color:var(--danger)">*</span></label>
            <select id="eCategory" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
              <option value="文体" ${item.category === '文体' ? 'selected' : ''}>文体</option>
              <option value="证件" ${item.category === '证件' ? 'selected' : ''}>证件</option>
              <option value="电子产品" ${item.category === '电子产品' ? 'selected' : ''}>电子产品</option>
              <option value="生活用品" ${item.category === '生活用品' ? 'selected' : ''}>生活用品</option>
              <option value="书籍" ${item.category === '书籍' ? 'selected' : ''}>书籍</option>
              <option value="其他" ${item.category === '其他' ? 'selected' : ''}>其他</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:20px">
          <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:block">图片${canEditAll ? '' : '（不可修改）'}：</label>
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center" id="eImgBox">
            ${existingImgs.map(u => `<div style="position:relative;width:100px;height:100px;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);animation:fadeIn 0.3s ease;" class="eimg-wrap"><img src="${imgUrl(u)}" style="width:100%;height:100%;object-fit:cover" />${canEditImage ? `<span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--danger)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0,0,0,0.6)';this.style.transform='none'" data-ermurl="${esc(u)}">&times;</span>` : ''}</div>`).join('')}
            ${canEditImage && existingImgs.length < 3 ? `<label class="upload-area" id="eUploadLabel" style="width:100px;height:100px;border:2px dashed var(--border);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--bg-color);color:var(--text-secondary);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span style="font-size:12px;margin-top:8px;">上传图片</span></label><input type="file" id="eImgInput" accept="image/*" multiple style="display:none" />` : ''}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px">
          <div class="form-group"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">联系人名称/班级 <span class="req" style="color:var(--danger)">*</span></label><input id="eContact" value="${esc(item.contactName || '')}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
          <div class="form-group"><label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">联系方式 <span class="req" style="color:var(--danger)">*</span></label><input id="ePhone" value="${esc(item.contactPhone || '')}" ${dis} style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" /></div>
        </div>
        <div class="form-actions" style="display:flex;gap:16px;margin-top:40px;padding-top:24px;border-top:1px solid var(--border)">
          <button class="btn-outline" id="eCancelBtn" style="flex:1;padding:14px;background:transparent;color:var(--text-main);border:1px solid var(--border);border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.3s ease" onmouseover="this.style.background='var(--bg-color)';this.style.borderColor='var(--text-muted)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--border)'">取消</button>
          <button class="btn-primary" id="eSaveBtn" style="flex:2;padding:14px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.3)" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.3)'">保存修改</button>
        </div>
        <p id="eMsg" class="msg" style="margin-top:16px;text-align:center;font-size:14px"></p>
      </div>
    `;

    let editImgUrls = [...existingImgs];
    const eImgBox = document.getElementById('eImgBox');

    if (canEditImage) {
      const eImgInput = document.getElementById('eImgInput');
      const eUploadLabel = document.getElementById('eUploadLabel');

      if (eUploadLabel && eImgInput) {
        eUploadLabel.onclick = (evt) => {
          evt.preventDefault();
          eImgInput.click();
        };
      }

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
              wrap.style.cssText = 'position:relative;width:100px;height:100px;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);animation:fadeIn 0.3s ease;';
              wrap.innerHTML = '<img src="' + imgUrl(url) + '" style="width:100%;height:100%;object-fit:cover;" /><span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'var(--danger)\';this.style.transform=\'scale(1.1)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.6)\';this.style.transform=\'none\'" data-ermurl="' + url + '">&times;</span>';
              eImgBox.insertBefore(wrap, eUploadLabel);
            });
            if (editImgUrls.length >= 3 && eUploadLabel) eUploadLabel.style.display = 'none';
          } catch (e) { await uiAlert(e.message, '上传失败'); }
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
