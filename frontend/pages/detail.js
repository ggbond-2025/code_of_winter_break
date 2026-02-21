Router.register('detail', async function (app, params) {
  const role = Auth.getRole();
  let layoutRole = 'USER';
  if (role === 'ADMIN') layoutRole = 'ADMIN';
  else if (role === 'SUPER_ADMIN') layoutRole = 'SUPER_ADMIN';
  const main = renderLayout(app, layoutRole, '');
  main.innerHTML = '<p>加载中...</p>';

  try {
    const data = await api(`/api/items/${params.id}`);
    const item = data.data;
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
    const claimBtnLabel = isLost ? '归还申请' : '失物招领申请';
    const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const locStr = item.location || '';
    const locParts = locStr.split(' — ');
    const m = locStr.match(/^(朝晖校区|屏峰校区|莫干山校区)/);
    const campusPart = locParts.length > 1 ? locParts[0].trim() : (m ? m[1] : '');
    const campusLabel = isLost ? '丢失校区' : '拾取校区';

    main.innerHTML = `
      <div class="detail-page">
        <span class="back-arrow" id="backBtn">&#x21A9;</span>
        <div class="detail-header">
          <div class="item-type-label" style="font-size:18px">${esc(typeLabel)}</div>
          <div class="card-time">发布时间：${fmtTime(item.createdAt)}</div>
        </div>
        <div class="detail-box">
          <div style="display:flex;gap:20px">
            <div style="flex:1">
              <div class="info-line"><b>目前进度：</b>${statusLabel(item.status)}</div>
              <div class="info-line"><b>物品名称：</b>${esc(item.title)}</div>
              <div class="info-line"><b>物品类型：</b>${esc(item.category || '-')}</div>
              ${campusPart ? `<div class="info-line"><b>${campusLabel}：</b>${esc(campusPart)}</div>` : ''}
              <div class="info-line"><b>${locLabel}：</b>${esc(locStr || '-')}</div>
              <div class="info-line"><b>${timeLabel}：</b>${esc(item.lostTime || '-')}</div>
              <div class="info-line"><b>领取地点：</b>${esc(item.storageLocation || '-')}</div>
              <div class="info-line"><b>联系方式：</b>${esc((item.contactPhone || '') + ' ' + (item.contactName || ''))}</div>
              <div class="info-line"><b>物品介绍：</b>${esc(item.description || item.features || '-')}</div>
            </div>
            ${(item.status === 'REJECTED' || item.status === 'ADMIN_DELETED') && item.rejectReason ? `
              <div>
                <div style="font-size:13px"><b>原因：</b>${esc(item.rejectReason)}</div>
              </div>
            ` : ''}
          </div>
          <div class="detail-images">
            ${imgs.length > 0 ? imgs.map(u => imgTag(u, 200, 160)).join('') : '<div class="img-placeholder"></div><div class="img-placeholder"></div>'}
          </div>
        </div>
        ${canClaim ? `<div style="text-align:center;margin-top:24px"><button class="btn-primary" id="goClaimBtn" style="padding:10px 40px;font-size:16px">${claimBtnLabel}</button></div>` : ''}
        ${hasActiveClaim ? `<div style="text-align:center;margin-top:16px;color:#888">已提交申请（${claimStatusLabel(myClaim.status)}），等待审核结果</div>` : ''}
        ${isOwner ? '<div id="ownerClaimsSection"></div>' : ''}
      </div>
    `;

    document.getElementById('backBtn').onclick = () => history.back();

    const goClaimBtn = document.getElementById('goClaimBtn');
    if (goClaimBtn) {
      goClaimBtn.onclick = () => Router.go('claimForm', { id: item.id });
    }

    if (isOwner) {
      loadOwnerClaims(item.id);
    }
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});

async function loadOwnerClaims(itemId) {
  const section = document.getElementById('ownerClaimsSection');
  if (!section) return;
  try {
    const data = await api(`/api/claims/item/${itemId}`);
    const claims = data.data || [];
    if (claims.length === 0) {
      section.innerHTML = '<div style="margin-top:20px;padding:16px;border:1px solid #eee"><p class="empty">暂无认领申请</p></div>';
      return;
    }
    section.innerHTML = `
      <div style="margin-top:20px;border:1px solid #ddd;padding:16px">
        <h3 style="margin-bottom:12px">认领申请（${claims.length}条）</h3>
        ${claims.map(c => {
          const claimImgs = c.imageUrls ? c.imageUrls.split(',').filter(Boolean) : [];
          return `
            <div style="border:1px solid #eee;padding:12px;margin-bottom:10px;border-radius:4px">
              <div><b>申请人：</b>${esc(c.claimer?.username || '-')}</div>
              <div><b>留言：</b>${esc(c.message || '-')}</div>
              ${claimImgs.length > 0 ? `<div style="display:flex;gap:6px;margin:8px 0">${claimImgs.map(u => imgTag(u, 80, 60)).join('')}</div>` : ''}
              <div><b>状态：</b>${claimStatusLabel(c.status)}</div>
              <div style="font-size:12px;color:#999">提交时间：${fmtTime(c.createdAt)}</div>
              ${c.status === 'PENDING' ? '<div style="margin-top:8px;color:#888">待管理员审核通过后，您可在此进行审核</div>' : ''}
              ${c.status === 'ADMIN_APPROVED' ? `
                <div style="margin-top:8px;display:flex;gap:10px">
                  <button class="btn-sm" style="background:#000;color:#fff;border:1px solid #000" data-claim-approve="${c.id}">通过</button>
                  <button class="btn-sm btn-danger" data-claim-reject="${c.id}">驳回</button>
                </div>
              ` : ''}
              ${c.status === 'APPROVED' ? `<div style="margin-top:8px"><button class="btn-sm btn-primary" data-goto-chat="${c.id}">进入聊天</button></div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.querySelectorAll('[data-claim-approve]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('确定通过此认领申请？通过后该物品状态将变为已匹配')) return;
        try {
          await api(`/api/claims/${btn.dataset.claimApprove}/review`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'APPROVED', reason: '' })
          });
          alert('已通过！');
          loadOwnerClaims(itemId);
        } catch (e) { alert(e.message); }
      };
    });

    document.querySelectorAll('[data-claim-reject]').forEach(btn => {
      btn.onclick = async () => {
        const reason = prompt('请输入驳回原因:');
        if (reason === null) return;
        try {
          await api(`/api/claims/${btn.dataset.claimReject}/review`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'REJECTED', reason: reason })
          });
          loadOwnerClaims(itemId);
        } catch (e) { alert(e.message); }
      };
    });

    document.querySelectorAll('[data-goto-chat]').forEach(btn => {
      btn.onclick = () => Router.go('chatDetail', { claimId: btn.dataset.gotoChat });
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
    const itemData = await api(`/api/items/${params.id}`);
    const item = itemData.data;
    let myClaim = null;
    try {
      const myClaimData = await api(`/api/claims/my/item/${params.id}`);
      myClaim = myClaimData.data || null;
    } catch (_) {}
    if (myClaim && myClaim.status !== 'REJECTED') {
      main.innerHTML = `
        <div class="publish-form" style="max-width:700px;margin:0 auto">
          <span class="back-arrow" id="claimBack">&#x21A9;</span>
          <h2 style="text-align:center;margin-bottom:24px"><b>申请已提交</b></h2>
          <p style="text-align:center;color:#666">当前状态：${claimStatusLabel(myClaim.status)}</p>
        </div>
      `;
      document.getElementById('claimBack').onclick = () => Router.go('detail', { id: params.id });
      return;
    }

    main.innerHTML = `
      <div class="publish-form" style="max-width:700px;margin:0 auto">
        <span class="back-arrow" id="claimBack">&#x21A9;</span>
        <h2 style="text-align:center;margin-bottom:24px"><b>认领申请</b></h2>
        <p style="margin-bottom:8px"><b>请提供物品其余特征信息或者相关证明信息：</b></p>
        <textarea id="claimMsg" style="width:100%;min-height:180px;border:1px solid #333;padding:12px;font-size:14px;box-sizing:border-box" placeholder="请在此处提供对于物品其他未涉及的特征进行描述或者相关证明信息"></textarea>
        <p style="margin:16px 0 8px"><b>如果有，请在此处附上相关图片：</b></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap" id="claimImgBox">
          <label class="upload-area" id="claimUploadLabel">+<input type="file" id="claimImgInput" accept="image/*" multiple style="display:none" /></label>
        </div>
        <div style="text-align:center;margin-top:30px">
          <button class="btn-primary" id="claimSubmitBtn" style="padding:10px 50px;font-size:16px;background:#38b6ff;border:none;border-radius:4px;color:#fff;cursor:pointer">提交申请</button>
        </div>
        <div id="claimResultBox" style="margin-top:20px;text-align:center;display:none">
          <div style="border:1px solid #ddd;padding:20px;margin:10px auto;max-width:500px" id="claimResultContent"></div>
        </div>
      </div>
    `;

    document.getElementById('claimBack').onclick = () => Router.go('detail', { id: params.id });

    let claimUploadedUrls = [];
    let allowClaimImage = true;
    const claimImgInput = document.getElementById('claimImgInput');
    const claimImgBox = document.getElementById('claimImgBox');
    const claimUploadLabel = document.getElementById('claimUploadLabel');

    try {
      const cfg = await getConfig();
      allowClaimImage = !!cfg.requireImage;
      if (!allowClaimImage) {
        claimImgBox.style.display = 'none';
        claimUploadedUrls = [];
      }
    } catch (_) {}

    claimImgInput.onchange = async () => {
      if (!allowClaimImage) return;
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
          wrap.style.cssText = 'position:relative;width:80px;height:80px;';
          wrap.innerHTML = '<img src="' + imgUrl(url) + '" style="width:80px;height:80px;object-fit:cover;border:1px solid #ccc" /><span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" data-crmurl="' + url + '">&times;</span>';
          claimImgBox.insertBefore(wrap, claimUploadLabel);
        });
        if (claimUploadedUrls.length >= 3) claimUploadLabel.style.display = 'none';
      } catch (e) { alert(e.message); }
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
      if (!msg) { alert('请填写特征信息或证明'); return; }
      const resultBox = document.getElementById('claimResultBox');
      const resultContent = document.getElementById('claimResultContent');
      try {
        await api('/api/claims', {
          method: 'POST',
          body: JSON.stringify({
            itemId: Number(item.id),
            message: msg,
            proof: '',
            imageUrls: allowClaimImage ? (claimUploadedUrls || []).join(',') : ''
          })
        });
        document.getElementById('claimSubmitBtn').disabled = true;
        resultBox.style.display = 'block';
        resultContent.innerHTML = '<p style="color:#27ae60;font-size:16px"><b>递交成功！ 可以返回 主页-认领进度 来查看当前认领进度！希望你能尽快找到自己的物品！</b></p>';
      } catch (e) {
        resultBox.style.display = 'block';
        resultContent.innerHTML = '<p style="color:#e74c3c;font-size:16px"><b>递交失败！' + esc(e.message) + '</b></p>';
      }
    };
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});
