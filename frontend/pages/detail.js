Router.register('detail', async function (app, params) {
  const role = Auth.getRole();
  let layoutRole = 'USER';
  if (role === 'ADMIN') layoutRole = 'ADMIN';
  else if (role === 'SUPER_ADMIN') layoutRole = 'SUPER_ADMIN';
  const main = renderLayout(app, layoutRole, '');
  main.innerHTML = '<p>加载中...</p>';
  const detailBackRoute = sessionStorage.getItem('lf_detail_back_route') || '';

  try {
    const data = await api(`/api/items/${params.id}`);
    const item = data.data;
    const detailFrom = sessionStorage.getItem('lf_detail_from');
    const detailFromItem = sessionStorage.getItem('lf_detail_from_item');
    const fromSearch = detailFrom === 'search' && detailFromItem === String(item.id);
    const isOwner = String(item.creator?.id) === Auth.getUserId();
    const isLost = item.type === 'LOST';
    const typeLabel = isLost ? '寻物启事' : '失物招领';
    const locLabel = isLost ? '丢失地点' : '拾取地点';
    const timeLabel = isLost ? '丢失时间' : '拾得时间';
    let myClaim = null;
    if (Auth.isLoggedIn() && !isOwner) {
      try {
        const myClaimData = await api(`/api/claims/my/item/${item.id}`);
        myClaim = myClaimData.data || null;
      } catch (_) {}
    }
    const hasActiveClaim = myClaim && myClaim.status !== 'REJECTED';
    const canClaim = (item.status === 'APPROVED') && Auth.isLoggedIn() && !isOwner && role === 'USER' && !hasActiveClaim;
    const claimBtnLabel = isLost ? '归还申请' : '认领申请';
    const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const archiveImgs = item.archiveImageUrls ? item.archiveImageUrls.split(',').filter(Boolean) : [];
    const showArchiveDetail = item.status === 'ARCHIVED' && item.type === 'FOUND';
    const previewImageTag = (url) => `<img class="detail-preview-img" data-full="${esc(imgUrl(url))}" src="${imgUrl(url)}" style="width:150px;height:110px;object-fit:cover;border-radius:12px;border:1px solid var(--border);cursor:zoom-in;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(0,0,0,0.05)" onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onerror="this.style.display='none'" />`;
    const locStr = item.location || '';
    const locParts = locStr.split(' — ');
    const m = locStr.match(/^(朝晖校区|屏峰校区|莫干山校区)/);
    const campusPart = locParts.length > 1 ? locParts[0].trim() : (m ? m[1] : '');
    const campusLabel = isLost ? '丢失校区' : '拾取校区';

    main.innerHTML = `
      <div class="detail-page" style="max-width:800px;margin:0 auto;padding:24px;animation:fadeIn 0.3s ease">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <span class="back-arrow" id="backBtn" style="font-size:24px;cursor:pointer;color:var(--text-main);transition:transform 0.2s ease;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--surface);box-shadow:0 2px 8px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateX(-4px)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.color='var(--text-main)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span>
          <div class="item-type-label" style="font-size:20px;font-weight:800;color:var(--text-main);letter-spacing:0.5px">${esc(typeLabel)}</div>
          <div class="card-time" style="margin-left:auto;color:var(--text-muted);font-size:14px;display:flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${fmtTime(item.createdAt)}</div>
        </div>
        <div class="detail-box" style="background:var(--surface);padding:32px;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.05);border:1px solid var(--border)">
          <div style="display:flex;gap:32px;flex-wrap:wrap">
            <div style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:16px">
              <div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">目前进度：</b>${statusLabel(item.status)}</div>
              <div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">物品名称：</b><span style="color:var(--text-main);font-weight:600">${esc(item.title)}</span></div>
              <div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">物品类型：</b><span style="background:var(--bg-color);padding:4px 12px;border-radius:8px;color:var(--text-muted);font-weight:500">${esc(item.category || '-')}</span></div>
              ${campusPart ? `<div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">${campusLabel}：</b><span style="color:var(--text-muted)">${esc(campusPart)}</span></div>` : ''}
              <div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">${locLabel}：</b><span style="color:var(--text-muted)">${esc(locStr || '-')}</span></div>
              <div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">${timeLabel}：</b><span style="color:var(--text-muted)">${esc(item.lostTime || '-')}</span></div>
              ${item.storageLocation ? `<div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">领取地点：</b><span style="color:var(--text-muted)">${esc(item.storageLocation)}</span></div>` : ''}
              ${showArchiveDetail ? `<div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">物品处理方式：</b><span style="color:var(--text-muted)">${esc(item.archiveMethod || '自行处理')}</span></div>` : ''}
              ${showArchiveDetail ? `<div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">处理地点：</b><span style="color:var(--text-muted)">${esc(item.archiveLocation || '-')}</span></div>` : ''}
              <div class="info-line" style="display:flex;align-items:center;gap:8px;font-size:15px"><b style="color:var(--text-main);min-width:80px">联系方式：</b><span style="color:var(--text-muted)">${esc((item.contactPhone || '') + ' ' + (item.contactName || ''))}</span></div>
              <div class="info-line" style="display:flex;align-items:flex-start;gap:8px;font-size:15px;margin-top:8px;padding-top:16px;border-top:1px dashed var(--border)"><b style="color:var(--text-main);min-width:80px">物品介绍：</b><span style="color:var(--text-muted);line-height:1.6;flex:1">${esc(item.description || item.features || '-')}</span></div>
            </div>
            ${(item.status === 'REJECTED' || item.status === 'ADMIN_DELETED') && item.rejectReason ? `
              <div style="background:rgba(var(--danger-rgb), 0.05);padding:16px;border-radius:12px;border:1px solid rgba(var(--danger-rgb), 0.2);align-self:flex-start;max-width:300px">
                <div style="font-size:14px;color:var(--danger);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> <b>原因：</b>${esc(item.rejectReason)}</div>
              </div>
            ` : ''}
          </div>
          <div style="margin-top:32px;font-size:16px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:8px"><span style="width:4px;height:16px;background:var(--primary);border-radius:2px"></span> 发布信息图片</div>
          <div class="detail-images" style="margin-top:16px;display:flex;gap:16px;flex-wrap:wrap">
            ${imgs.length > 0 ? imgs.map(u => previewImageTag(u)).join('') : '<div class="img-placeholder" style="width:150px;height:110px;background:var(--bg-color);border-radius:12px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px">暂无图片</div>'}
          </div>
          ${showArchiveDetail ? `<div style="margin-top:32px;font-size:16px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:8px"><span style="width:4px;height:16px;background:var(--success);border-radius:2px"></span> 归档处理图片</div><div class="detail-images" style="margin-top:16px;display:flex;gap:16px;flex-wrap:wrap">${archiveImgs.length > 0 ? archiveImgs.map(u => previewImageTag(u)).join('') : '<div class="img-placeholder" style="width:150px;height:110px;background:var(--bg-color);border-radius:12px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:13px">暂无图片</div>'}</div>` : ''}
        </div>
        <div id="detailImgPreview" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:1200;align-items:center;justify-content:center;animation:fadeIn 0.2s ease">
          <div style="position:relative;max-width:90vw;max-height:90vh;box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.5);animation:scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)">
            <span id="detailImgPreviewClose" style="position:absolute;top:-20px;right:-20px;color:var(--text-main);background:var(--surface);width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:24px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.2s ease;z-index:10" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">×</span>
            <img id="detailImgPreviewImg" src="" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:12px;background:var(--surface)" />
          </div>
        </div>
        ${canClaim ? `<div style="text-align:center;margin-top:40px"><button class="btn-primary" id="goClaimBtn" style="padding:14px 48px;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 8px 16px rgba(var(--primary-rgb), 0.2);transition:all 0.3s ease" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 20px rgba(var(--primary-rgb), 0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 8px 16px rgba(var(--primary-rgb), 0.2)'">${claimBtnLabel}</button></div>` : ''}
        ${hasActiveClaim ? `<div style="text-align:center;margin-top:32px;color:var(--text-muted);background:var(--bg-color);padding:16px 24px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;margin-left:50%;transform:translateX(-50%);border:1px solid var(--border)"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>已提交申请（<span style="font-weight:600;color:var(--primary)">${claimStatusLabel(myClaim.status)}</span>），等待审核结果</div>` : ''}
        ${isOwner ? '<div id="ownerClaimsSection" style="margin-top:40px"></div>' : ''}
      </div>
    `;

    document.getElementById('backBtn').onclick = () => {
      if (fromSearch) {
        sessionStorage.removeItem('lf_detail_from');
        sessionStorage.removeItem('lf_detail_from_item');
        sessionStorage.removeItem('lf_claim_back_route');
        Router.go('search');
        return;
      }
      if (detailBackRoute) {
        sessionStorage.removeItem('lf_detail_back_route');
        Router.go(detailBackRoute);
        return;
      }
      if (history.length <= 1) {
        if (role === 'ADMIN') Router.go('adminReview');
        else if (role === 'SUPER_ADMIN') Router.go('superMessages');
        else Router.go('home');
        return;
      }
      history.back();
    };

    const goClaimBtn = document.getElementById('goClaimBtn');
    if (goClaimBtn) {
      goClaimBtn.onclick = () => {
        if (fromSearch) {
          sessionStorage.setItem('lf_claim_back_route', 'search');
          sessionStorage.setItem('lf_detail_from_item', String(item.id));
        }
        Router.go('claimForm', { id: item.id });
      };
    }

    const previewModal = document.getElementById('detailImgPreview');
    const previewImg = document.getElementById('detailImgPreviewImg');
    const closePreview = () => { previewModal.style.display = 'none'; };
    document.querySelectorAll('.detail-preview-img[data-full]').forEach(el => {
      el.onclick = () => {
        previewImg.src = el.dataset.full;
        previewModal.style.display = 'flex';
      };
    });
    document.getElementById('detailImgPreviewClose').onclick = closePreview;
    previewModal.onclick = (e) => { if (e.target === previewModal) closePreview(); };

    if (isOwner) {
      loadOwnerClaims(item.id, isLost);
    }
  } catch (e) {
    main.innerHTML = `
      <div style="max-width:720px;margin:60px auto;padding:32px;background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.04);">
        <div style="color:var(--danger);font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;margin-bottom:16px;">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          详情加载失败
        </div>
        <p class="msg msg-err" style="margin:0 0 20px 0;">${e.message}</p>
        <button id="detailErrorBackBtn" class="btn-outline" style="padding:10px 20px;border-radius:10px;">返回</button>
      </div>
    `;

    const backBtn = document.getElementById('detailErrorBackBtn');
    if (backBtn) {
      backBtn.onclick = () => {
        if (detailBackRoute) {
          sessionStorage.removeItem('lf_detail_back_route');
          Router.go(detailBackRoute);
          return;
        }
        if (role === 'ADMIN') Router.go('adminReview');
        else if (role === 'SUPER_ADMIN') Router.go('superMessages');
        else Router.go('home');
      };
    }
  }
});

async function loadOwnerClaims(itemId, isLost) {
  const section = document.getElementById('ownerClaimsSection');
  if (!section) return;
  const applyLabel = isLost ? '归还申请' : '认领申请';
  try {
    const data = await api(`/api/claims/item/${itemId}`);
    const claims = data.data || [];
    if (claims.length === 0) {
      section.innerHTML = `<div style="margin-top:32px;padding:32px;background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);text-align:center;color:var(--text-muted);box-shadow:0 4px 12px rgba(0,0,0,0.02)"><p class="empty" style="margin:0;font-size:15px">暂无${applyLabel}</p></div>`;
      return;
    }
    section.innerHTML = `
      <div style="margin-top:40px;background:var(--surface);border-radius:16px;border:1px solid var(--border);padding:32px;box-shadow:0 12px 32px rgba(0,0,0,0.05)">
        <h3 style="margin-bottom:24px;font-size:20px;font-weight:800;color:var(--text-main);display:flex;align-items:center;gap:12px;letter-spacing:0.5px"><span style="width:4px;height:20px;background:var(--primary);border-radius:2px"></span> ${applyLabel} <span style="background:rgba(var(--primary-rgb), 0.1);padding:4px 12px;border-radius:12px;font-size:14px;color:var(--primary);font-weight:600">${claims.length}条</span></h3>
        <div style="display:flex;flex-direction:column;gap:20px">
        ${claims.map(c => {
          const claimImgs = c.imageUrls ? c.imageUrls.split(',').filter(Boolean) : [];
          return `
            <div style="border:1px solid var(--border);padding:24px;border-radius:16px;background:var(--bg-color);transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.06)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='none';this.style.borderColor='var(--border)'">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
                <div style="font-size:16px;color:var(--text-main);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><b>申请人：</b><span style="font-weight:600">${esc(c.claimer?.username || '-')}</span></div>
                <div style="font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${fmtTime(c.createdAt)}</div>
              </div>
              <div style="font-size:15px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6;background:var(--surface);padding:16px;border-radius:12px;border:1px solid var(--border)"><b>留言：</b>${esc(c.message || '-')}</div>
              ${claimImgs.length > 0 ? `<div style="display:flex;gap:12px;margin:16px 0;flex-wrap:wrap">${claimImgs.map(u => `<img src="${imgUrl(u)}" style="width:100px;height:100px;object-fit:cover;border-radius:12px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('')}</div>` : ''}
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:15px"><b>状态：</b>${claimStatusLabel(c.status)}</div>
              ${c.status === 'PENDING' ? '<div style="margin-top:8px;color:var(--warning);font-size:14px;background:rgba(var(--warning-rgb), 0.1);padding:12px 16px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(var(--warning-rgb), 0.2)"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>待管理员审核通过后，您可在此进行审核</div>' : ''}
              ${c.status === 'ADMIN_APPROVED' ? `
                <div style="margin-top:20px;display:flex;gap:16px;padding-top:20px;border-top:1px dashed var(--border)">
                  <button class="btn-primary" style="padding:10px 24px;border-radius:12px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2);transition:all 0.3s ease" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.2)'" data-claim-approve="${c.id}">通过</button>
                  <button class="btn-outline" style="padding:10px 24px;border-radius:12px;color:var(--danger);border-color:var(--danger);font-weight:600;transition:all 0.3s ease" onmouseover="this.style.background='rgba(var(--danger-rgb), 0.1)'" onmouseout="this.style.background='transparent'" data-claim-reject="${c.id}">驳回</button>
                </div>
              ` : ''}
              <div style="margin-top:20px;display:flex;gap:16px;flex-wrap:wrap;padding-top:${c.status === 'ADMIN_APPROVED' ? '0' : '20px'};border-top:${c.status === 'ADMIN_APPROVED' ? 'none' : '1px dashed var(--border)'}">
                ${c.status === 'APPROVED' ? `<button class="btn-primary" style="padding:10px 24px;border-radius:12px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.2);transition:all 0.3s ease;display:flex;align-items:center;gap:8px" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.2)'" data-goto-chat="${c.id}" data-peer-id="${c.claimer?.id || ''}"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>进入聊天</button>` : ''}
                ${c.claimer && String(c.claimer.id) !== Auth.getUserId() && c.status !== 'APPROVED' ? `<button class="btn-outline" style="padding:10px 24px;border-radius:12px;font-weight:600;transition:all 0.3s ease;display:flex;align-items:center;gap:8px" onmouseover="this.style.background='var(--bg-color)';this.style.borderColor='var(--text-muted)'" onmouseout="this.style.background='transparent';this.style.borderColor='var(--border)'" data-claim-report="${c.id}"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>举报该申请</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('[data-claim-approve]').forEach(btn => {
      btn.onclick = async () => {
        const ok = await uiConfirm(`确定通过此${applyLabel}？通过后该物品状态将变为已匹配`, '确认通过');
        if (!ok) return;
        try {
          await api(`/api/claims/${btn.dataset.claimApprove}/review`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'APPROVED', reason: '' })
          });
          await uiAlert('已通过！', '操作成功');
          loadOwnerClaims(itemId, isLost);
        } catch (e) { await uiAlert(e.message, '操作失败'); }
      };
    });

    document.querySelectorAll('[data-claim-reject]').forEach(btn => {
      btn.onclick = async () => {
        const reason = await uiPrompt('请填写驳回原因', '驳回申请', { required: true, placeholder: '请输入驳回原因' });
        if (reason === null) return;
        try {
          await api(`/api/claims/${btn.dataset.claimReject}/review`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'REJECTED', reason: reason })
          });
          loadOwnerClaims(itemId, isLost);
        } catch (e) { await uiAlert(e.message, '操作失败'); }
      };
    });

    document.querySelectorAll('[data-goto-chat]').forEach(btn => {
      btn.onclick = () => Router.go('chatDetail', { claimId: btn.dataset.gotoChat, peerId: btn.dataset.peerId });
    });

    document.querySelectorAll('[data-claim-report]').forEach(btn => {
      btn.onclick = async () => {
        const reason = await uiPrompt('可输入：违规广告、虚假信息、恶意申请、其他', '举报原因', { required: true, placeholder: '请输入举报原因' });
        if (reason === null) return;
        const detail = (await uiPrompt('请填写具体说明（可选）', '补充说明', { placeholder: '可不填' })) || '';
        try {
          await api('/api/complaints', {
            method: 'POST',
            body: JSON.stringify({
              targetType: 'CLAIM_APPLICATION',
              claimId: Number(btn.dataset.claimReport),
              reason: reason.trim() || '其他',
              detail: detail.trim()
            })
          });
          await uiAlert('投诉已提交，等待超级管理员审核', '提交成功');
        } catch (e) {
          await uiAlert(e.message, '提交失败');
        }
      };
    });
  } catch (e) {
    section.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
}

Router.register('claimForm', async function (app, params) {
  const role = Auth.getRole();
  let layoutRole = 'USER';
  if (role === 'ADMIN') layoutRole = 'ADMIN';
  else if (role === 'SUPER_ADMIN') layoutRole = 'SUPER_ADMIN';
  const main = renderLayout(app, layoutRole, '');
  main.innerHTML = '<p>加载中...</p>';

  try {
    const claimBackRoute = sessionStorage.getItem('lf_claim_back_route') || '';

    const itemData = await api(`/api/items/${params.id}`);
    const item = itemData.data;
    const isLost = item.type === 'LOST';
    const claimPageTitle = isLost ? '归还申请' : '认领申请';
    let myClaim = null;
    try {
      const myClaimData = await api(`/api/claims/my/item/${params.id}`);
      myClaim = myClaimData.data || null;
    } catch (_) {}
    function goBackAfterClaim() {
      if (claimBackRoute === 'search') {
        sessionStorage.removeItem('lf_detail_from');
        sessionStorage.removeItem('lf_detail_from_item');
        sessionStorage.removeItem('lf_claim_back_route');
        Router.go('search');
        return;
      }
      Router.go('detail', { id: params.id });
    }

    if (myClaim && myClaim.status !== 'REJECTED') {
      main.innerHTML = `
        <div class="publish-form" style="max-width:700px;margin:40px auto;padding:40px;background:var(--surface);border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.05);border:1px solid var(--border);animation:fadeIn 0.3s ease;">
          <div style="display:flex;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--border)">
            <span class="back-arrow" id="claimBack" style="font-size:24px;cursor:pointer;color:var(--text-main);transition:transform 0.2s ease;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--bg-color);box-shadow:0 2px 8px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateX(-4px)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.color='var(--text-main)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span>
            <h2 style="margin:0;flex:1;text-align:center;font-size:24px;font-weight:800;color:var(--text-main);padding-right:40px;letter-spacing:0.5px">申请已提交</h2>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:20px;padding:40px 0;">
            <div style="width:80px;height:80px;border-radius:50%;background:rgba(var(--primary-rgb),0.1);color:var(--primary);display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <p style="margin:0;font-size:18px;color:var(--text-secondary);">当前状态：<span style="font-weight:700;color:var(--primary);">${claimStatusLabel(myClaim.status)}</span></p>
          </div>
        </div>
      `;
      document.getElementById('claimBack').onclick = () => goBackAfterClaim();
      return;
    }

    main.innerHTML = `
      <div class="publish-form" style="max-width:700px;margin:40px auto;padding:40px;background:var(--surface);border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.05);border:1px solid var(--border);animation:fadeIn 0.3s ease;">
        <div style="display:flex;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--border)">
          <span class="back-arrow" id="claimBack" style="font-size:24px;cursor:pointer;color:var(--text-main);transition:transform 0.2s ease;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--bg-color);box-shadow:0 2px 8px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateX(-4px)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.color='var(--text-main)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span>
          <h2 style="margin:0;flex:1;text-align:center;font-size:24px;font-weight:800;color:var(--text-main);padding-right:40px;letter-spacing:0.5px">${claimPageTitle}</h2>
        </div>
        
        <div style="margin-bottom:32px;">
          <label style="display:block;margin-bottom:16px;font-size:16px;font-weight:600;color:var(--text-main);display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            请提供物品其余特征信息或者相关证明信息：
          </label>
          <textarea id="claimMsg" style="width:100%;min-height:160px;border:1px solid var(--border);border-radius:12px;padding:16px;font-size:15px;color:var(--text-main);background:var(--bg-color);box-sizing:border-box;resize:vertical;transition:all 0.2s;outline:none;" placeholder="请在此处提供对于物品其他未涉及的特征进行描述或者相关证明信息..." onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb),0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"></textarea>
        </div>

        <div style="margin-bottom:40px;">
          <label style="display:block;margin-bottom:16px;font-size:16px;font-weight:600;color:var(--text-main);display:flex;align-items:center;gap:8px;">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--primary)" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            如果有，请在此处附上相关图片：
          </label>
          <div style="display:flex;gap:16px;flex-wrap:wrap" id="claimImgBox">
            <label class="upload-area" id="claimUploadLabel" style="width:100px;height:100px;border:2px dashed var(--border);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--bg-color);color:var(--text-secondary);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span style="font-size:12px;margin-top:8px;">上传图片</span>
              <input type="file" id="claimImgInput" accept="image/*" multiple style="display:none" />
            </label>
          </div>
        </div>

        <div style="text-align:center;margin-top:40px;padding-top:32px;border-top:1px solid var(--border)">
          <button class="btn-primary" id="claimSubmitBtn" style="padding:14px 48px;font-size:16px;font-weight:600;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 8px 16px rgba(var(--primary-rgb),0.2);transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 24px rgba(var(--primary-rgb),0.3)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 8px 16px rgba(var(--primary-rgb),0.2)'">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            提交申请
          </button>
        </div>
        
        <div id="claimResultBox" style="margin-top:32px;display:none;animation:fadeIn 0.3s ease;">
          <div style="background:rgba(var(--success-rgb),0.05);border:1px solid rgba(var(--success-rgb),0.2);border-radius:12px;padding:24px;text-align:center;" id="claimResultContent"></div>
        </div>
      </div>
    `;

    document.getElementById('claimBack').onclick = () => goBackAfterClaim();

    let claimUploadedUrls = [];
    const claimImgInput = document.getElementById('claimImgInput');
    const claimImgBox = document.getElementById('claimImgBox');
    const claimUploadLabel = document.getElementById('claimUploadLabel');

    function clearClaimForm() {
      const msgInput = document.getElementById('claimMsg');
      if (msgInput) msgInput.value = '';
      claimUploadedUrls = [];
      claimImgBox.querySelectorAll('[data-crmurl]').forEach(btn => {
        if (btn.parentElement) btn.parentElement.remove();
      });
      claimUploadLabel.style.display = '';
    }

    claimImgInput.onchange = async () => {
      const files = claimImgInput.files;
      if (!files || files.length === 0) return;
      const remaining = 3 - claimUploadedUrls.length;
      if (remaining <= 0) return;
      const formData = new FormData();
      for (let i = 0; i < Math.min(files.length, remaining); i++) formData.append('files', files[i]);
      try {
        const token = Auth.getToken();
        const res = await fetch(API_BASE + '/api/files/upload', { method: 'POST', headers: token ? { 'Authorization': 'Bearer ' + token } : {}, body: formData });
        const d = await res.json();
        if (!res.ok || d.success === false) throw new Error(d.message || '上传失败');
        (d.data || []).forEach(url => {
          if (claimUploadedUrls.length >= 3) return;
          claimUploadedUrls.push(url);
          const wrap = document.createElement('div');
          wrap.style.cssText = 'position:relative;width:100px;height:100px;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);animation:fadeIn 0.3s ease;';
          wrap.innerHTML = '<img src="' + imgUrl(url) + '" style="width:100%;height:100%;object-fit:cover;" /><span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'var(--danger)\';this.style.transform=\'scale(1.1)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.6)\';this.style.transform=\'none\'" data-crmurl="' + url + '">&times;</span>';
          claimImgBox.insertBefore(wrap, claimUploadLabel);
        });
        if (claimUploadedUrls.length >= 3) claimUploadLabel.style.display = 'none';
      } catch (e) { await uiAlert(e.message, '上传失败'); }
      claimImgInput.value = '';
    };

    claimImgBox.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-crmurl]');
      if (!rm) return;
      claimUploadedUrls = claimUploadedUrls.filter(u => u !== rm.dataset.crmurl);
      rm.parentElement.remove();
      claimUploadLabel.style.display = '';
    });

    document.getElementById('claimSubmitBtn').onclick = async () => {
      const msg = (document.getElementById('claimMsg').value || '').trim();
      if (!msg) { await uiAlert('请填写特征信息或证明', '提示'); return; }
      const resultBox = document.getElementById('claimResultBox');
      const resultContent = document.getElementById('claimResultContent');
      try {
        await api('/api/claims', {
          method: 'POST',
          body: JSON.stringify({
            itemId: Number(item.id),
            message: msg,
            proof: '',
            imageUrls: (claimUploadedUrls || []).join(',')
          })
        });
        document.getElementById('claimSubmitBtn').disabled = true;
        resultBox.style.display = 'block';
        resultContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(var(--success-rgb),0.1);color:var(--success);display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <p style="margin:0;color:var(--success);font-size:18px;font-weight:600;">递交成功！</p>
            <p style="margin:0;color:var(--text-secondary);font-size:14px;">可以返回 <span style="color:var(--primary);font-weight:500;">主页-认领进度</span> 来查看当前认领进度！<br>希望你能尽快找到自己的物品！</p>
          </div>
        `;
      } catch (e) {
        if ((e.message || '').includes('信息包含违禁词')) {
          await uiAlert('信息包含违禁词，请重新发布', '提交失败');
          clearClaimForm();
          resultBox.style.display = 'none';
          return;
        }
        resultBox.style.display = 'block';
        resultContent.style.background = 'rgba(var(--danger-rgb),0.05)';
        resultContent.style.borderColor = 'rgba(var(--danger-rgb),0.2)';
        resultContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(var(--danger-rgb),0.1);color:var(--danger);display:flex;align-items:center;justify-content:center;">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <p style="margin:0;color:var(--danger);font-size:16px;font-weight:600;">递交失败！</p>
            <p style="margin:0;color:var(--text-secondary);font-size:14px;">${esc(e.message)}</p>
          </div>
        `;
      }
    };
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});
