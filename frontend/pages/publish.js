Router.register('publishChoose', function (app) {
  const main = renderLayout(app, 'USER', 'publishChoose');
  main.innerHTML = `
    <div class="choose-box" style="max-width:600px;margin:60px auto;background:var(--surface);padding:48px;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.05);text-align:center;animation:scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);border:1px solid var(--border)">
      <h2 style="font-size:28px;font-weight:800;color:var(--text-main);margin-bottom:40px;letter-spacing:0.5px">你希望发布什么消息?</h2>
      <div style="display:flex;flex-direction:column;gap:20px">
        <button class="choose-btn" id="toLost" style="padding:24px;font-size:18px;font-weight:600;border-radius:16px;background:var(--bg-color);color:var(--text-main);border:2px solid transparent;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 4px 12px rgba(0,0,0,0.02);display:flex;align-items:center;justify-content:center;gap:16px;cursor:pointer" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='var(--primary)';this.style.boxShadow='0 12px 24px rgba(var(--primary-rgb), 0.15)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.borderColor='transparent';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)';this.style.color='var(--text-main)'">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(var(--primary-rgb), 0.1);display:flex;align-items:center;justify-content:center;color:var(--primary)">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          我丢东西了，发布寻物启事
        </button>
        <button class="choose-btn" id="toFound" style="padding:24px;font-size:18px;font-weight:600;border-radius:16px;background:var(--bg-color);color:var(--text-main);border:2px solid transparent;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 4px 12px rgba(0,0,0,0.02);display:flex;align-items:center;justify-content:center;gap:16px;cursor:pointer" onmouseover="this.style.transform='translateY(-4px)';this.style.borderColor='var(--success)';this.style.boxShadow='0 12px 24px rgba(var(--success-rgb), 0.15)';this.style.color='var(--success)'" onmouseout="this.style.transform='none';this.style.borderColor='transparent';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)';this.style.color='var(--text-main)'">
          <div style="width:48px;height:48px;border-radius:50%;background:rgba(var(--success-rgb), 0.1);display:flex;align-items:center;justify-content:center;color:var(--success)">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          我捡到东西，发布失物招领
        </button>
      </div>
    </div>
  `;
  document.getElementById('toLost').onclick = () => Router.go('publishForm', { type: 'LOST' });
  document.getElementById('toFound').onclick = () => Router.go('publishForm', { type: 'FOUND' });
});

Router.register('publishForm', function (app, params) {
  const type = (params && params.type) || 'FOUND';
  const isLost = type === 'LOST';
  const main = renderLayout(app, 'USER', 'publishChoose');

  const locLabel = isLost ? '丢失大致地点：' : '拾取具体地点';
  const timeLabel = isLost ? '丢失大致时间' : '拾取时间';
  const campusLabel = isLost ? '丢失校区' : '拾取校区';

  main.innerHTML = `
    <div class="publish-form" style="max-width:700px;margin:40px auto;background:var(--surface);padding:40px;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.05);animation:fadeIn 0.3s ease;border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--border)">
        <span class="back-arrow" id="backChoose" style="font-size:24px;cursor:pointer;color:var(--text-main);transition:transform 0.2s ease;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--bg-color);box-shadow:0 2px 8px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateX(-4px)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.color='var(--text-main)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span>
        <h2 style="margin:0;font-size:24px;font-weight:800;color:var(--text-main);letter-spacing:0.5px">发布${isLost ? '寻物启事' : '失物招领'}</h2>
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">物品名称 <span class="req" style="color:var(--danger)">*</span></label>
        <input id="pubTitle" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">${esc(locLabel)} <span class="req" style="color:var(--danger)">*</span></label>
        <input id="pubLocation" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">${esc(timeLabel)} <span class="req" style="color:var(--danger)">*</span></label>
        <input id="pubTime" type="text" placeholder="如：2026.2.20 15:00" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
      </div>
      ${isLost ? `
        <div class="form-group" style="margin-bottom:24px">
          <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">悬赏（可选，填入金额）</label>
          <input id="pubReward" type="number" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
        </div>
      ` : `
        <div class="form-group" style="margin-bottom:24px">
          <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">领取地点 <span class="req" style="color:var(--danger)">*</span></label>
          <input id="pubStorage" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
        </div>
      `}
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">物品介绍 <span class="req" style="color:var(--danger)">*</span></label>
        <textarea id="pubDesc" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);min-height:120px;resize:vertical;transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <div class="form-group">
          <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">${esc(campusLabel)} <span class="req" style="color:var(--danger)">*</span></label>
          <select id="pubCampus" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
            <option value="朝晖校区">朝晖校区</option>
            <option value="屏峰校区">屏峰校区</option>
            <option value="莫干山校区">莫干山校区</option>
          </select>
        </div>
        <div class="form-group">
          <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">物品类型 <span class="req" style="color:var(--danger)">*</span></label>
          <select id="pubCategory" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
            <option value="文体">文体</option>
            <option value="证件">证件</option>
            <option value="电子产品">电子产品</option>
            <option value="生活用品">生活用品</option>
            <option value="书籍">书籍</option>
            <option value="其他">其他</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:12px;display:flex;align-items:center;gap:6px">上传图片（可选，最多三张）</label>
        <div style="display:flex;gap:16px;flex-wrap:wrap" id="imgPreviewBox">
          <label class="upload-area" id="uploadLabel" style="width:100px;height:100px;border:2px dashed var(--border);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:var(--bg-color);color:var(--text-secondary);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-secondary)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span style="font-size:12px;margin-top:8px;">上传图片</span></label>
          <input type="file" id="imgInput" accept="image/*" multiple style="display:none" />
        </div>
        <p id="uploadMsg" class="msg" style="margin-top:8px;font-size:13px"></p>
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">联系人名称/联系人班级（格式：名称+专业班级）<span class="req" style="color:var(--danger)">*</span></label>
        <input id="pubContact" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
      </div>
      <div class="form-group" style="margin-bottom:24px">
        <label style="font-weight:600;color:var(--text-main);margin-bottom:8px;display:flex;align-items:center;gap:6px">联系方式（电话/微信号/QQ号 输入时在前说明 如：电话19857751703）<span class="req" style="color:var(--danger)">*</span></label>
        <input id="pubPhone" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg-color);transition:all 0.2s ease;font-size:15px" onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
      </div>
      <div class="form-actions" style="display:flex;justify-content:flex-end;gap:16px;margin-top:40px;padding-top:24px;border-top:1px solid var(--border)">
        <button class="btn-outline" id="pubClear" style="color:var(--danger);border-color:var(--danger);padding:12px 32px;border-radius:12px;font-weight:600;transition:all 0.2s ease" onmouseover="this.style.background='rgba(var(--danger-rgb), 0.1)'" onmouseout="this.style.background='transparent'">清空</button>
        <button class="btn-primary" id="pubSubmit" style="padding:12px 48px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.3);transition:all 0.3s ease" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.3)'">提交发布</button>
      </div>
      <p id="pubMsg" class="msg" style="text-align:center;margin-top:16px"></p>
    </div>
  `;

  document.getElementById('backChoose').onclick = () => Router.go('publishChoose');

  let config = null;
  async function loadConfig() {
    try {
      const cfg = await getConfig();
      config = cfg || {};
      await fillCategorySelect('pubCategory', false);
      if (config.enableDescLimit && config.descMaxLength) {
        document.getElementById('pubDesc').setAttribute('maxlength', String(config.descMaxLength));
      }
      const uploadGroup = Array.from(document.querySelectorAll('.form-group')).find(g => {
        const label = g.querySelector('label');
        return label && label.textContent.includes('上传图片');
      });
      const locationGroup = Array.from(document.querySelectorAll('.form-group')).find(g => {
        const label = g.querySelector('label');
        return label && (label.textContent.includes('丢失大致地点') || label.textContent.includes('拾取具体地点'));
      });
      if (config.requireImage) {
        if (uploadGroup) uploadGroup.style.display = '';
        document.querySelectorAll('.form-group label').forEach(l => {
          if (l.textContent.includes('上传图片')) l.textContent = '上传图片（必填，最多三张）：';
        });
      } else {
        if (uploadGroup) uploadGroup.style.display = 'none';
        uploadedUrls = [];
      }
      if (config.requireLocationDetail) {
        if (locationGroup) locationGroup.style.display = '';
      } else {
        if (locationGroup) locationGroup.style.display = 'none';
        const locInput = document.getElementById('pubLocation');
        if (locInput) locInput.value = '';
      }
    } catch (_) {}
  }
  loadConfig();

  let uploadedUrls = [];
  const imgInput = document.getElementById('imgInput');
  const previewBox = document.getElementById('imgPreviewBox');
  const uploadLabel = document.getElementById('uploadLabel');

  uploadLabel.onclick = (e) => {
    e.preventDefault();
    imgInput.click();
  };

  imgInput.onchange = async () => {
    const files = imgInput.files;
    if (!files || files.length === 0) return;
    const remaining = 3 - uploadedUrls.length;
    if (remaining <= 0) {
      document.getElementById('uploadMsg').textContent = '最多上传3张图片';
      document.getElementById('uploadMsg').className = 'msg msg-err';
      return;
    }
    const formData = new FormData();
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      formData.append('files', files[i]);
    }
    try {
      document.getElementById('uploadMsg').textContent = '上传中...';
      document.getElementById('uploadMsg').className = 'msg';
      const token = Auth.getToken();
      const res = await fetch(API_BASE + '/api/files/upload', {
        method: 'POST',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || '上传失败');
      const urls = data.data || [];
      urls.forEach(url => {
        if (uploadedUrls.length >= 3) return;
        uploadedUrls.push(url);
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;width:100px;height:100px;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);animation:fadeIn 0.3s ease;';
        wrap.innerHTML = `<img src="${API_BASE}${url}" style="width:100%;height:100%;object-fit:cover;" /><span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--danger)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(0,0,0,0.6)';this.style.transform='none'" data-rmurl="${url}">&times;</span>`;
        previewBox.insertBefore(wrap, uploadLabel);
      });
      if (uploadedUrls.length >= 3) uploadLabel.style.display = 'none';
      document.getElementById('uploadMsg').textContent = '';
    } catch (e) {
      document.getElementById('uploadMsg').textContent = e.message;
      document.getElementById('uploadMsg').className = 'msg msg-err';
    }
    imgInput.value = '';
  };

  previewBox.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rmurl]');
    if (!rm) return;
    uploadedUrls = uploadedUrls.filter(u => u !== rm.dataset.rmurl);
    rm.parentElement.remove();
    uploadLabel.style.display = '';
  });

  function clearPublishForm() {
    ['pubTitle','pubLocation','pubTime','pubDesc','pubContact','pubPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const r = document.getElementById('pubReward');
    if (r) r.value = '';
    const s = document.getElementById('pubStorage');
    if (s) s.value = '';
    uploadedUrls = [];
    previewBox.querySelectorAll('div[style]').forEach(d => { if (d !== uploadLabel) d.remove(); });
    uploadLabel.style.display = '';
  };

  document.getElementById('pubClear').onclick = () => {
    clearPublishForm();
  };

  document.getElementById('pubSubmit').onclick = async () => {
    const reward = document.getElementById('pubReward');
    const storage = document.getElementById('pubStorage');
    try {
      if (!config) config = await getConfig();
      if (config && config.requireImage && uploadedUrls.length === 0) {
        document.getElementById('pubMsg').textContent = '请上传图片';
        document.getElementById('pubMsg').className = 'msg msg-err';
        return;
      }
      const campus = document.getElementById('pubCampus').value;
      const locDetail = document.getElementById('pubLocation').value;
      const locationValue = config && config.requireLocationDetail ? (campus + ' — ' + locDetail) : campus;
      await api('/api/items', {
        method: 'POST',
        body: JSON.stringify({
          title: document.getElementById('pubTitle').value,
          category: document.getElementById('pubCategory').value,
          location: locationValue,
          description: document.getElementById('pubDesc').value,
          type: type,
          features: '',
          contactName: document.getElementById('pubContact').value,
          contactPhone: document.getElementById('pubPhone').value,
          reward: reward ? (reward.value ? parseFloat(reward.value) : null) : null,
          storageLocation: storage ? storage.value : '',
          lostTime: document.getElementById('pubTime').value,
          imageUrls: uploadedUrls.join(',')
        })
      });
      document.getElementById('pubMsg').textContent = config && config.enableReview ? '发布成功！等待管理员审核' : '发布成功';
      document.getElementById('pubMsg').className = 'msg msg-ok';
      setTimeout(() => Router.go('history'), 1200);
    } catch (e) {
      if ((e.message || '').includes('信息包含违禁词')) {
        document.getElementById('pubMsg').textContent = '信息包含违禁词，请重新发布';
        document.getElementById('pubMsg').className = 'msg msg-err';
        clearPublishForm();
        return;
      }
      document.getElementById('pubMsg').textContent = e.message;
      document.getElementById('pubMsg').className = 'msg msg-err';
    }
  };
});

Router.register('publish', function (app) {
  Router.go('publishChoose');
});
