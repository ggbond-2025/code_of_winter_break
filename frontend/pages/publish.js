Router.register('publishChoose', function (app) {
  const main = renderLayout(app, 'USER', 'publishChoose');
  main.innerHTML = `
    <div class="choose-box">
      <h2>你希望发布什么消息?</h2>
      <button class="choose-btn" id="toLost">我丢东西了，发布寻物启事</button>
      <button class="choose-btn" id="toFound">我捡到东西，发布失物招领</button>
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
    <div class="publish-form">
      <span class="back-arrow" id="backChoose">&#x21A9;</span>
      <div class="form-group">
        <label>物品名称 <span class="req">*</span>:</label>
        <input id="pubTitle" />
      </div>
      <div class="form-group">
        <label>${esc(locLabel)} <span class="req">*</span>:</label>
        <input id="pubLocation" />
      </div>
      <div class="form-group">
        <label>${esc(timeLabel)} <span class="req">*</span>:</label>
        <input id="pubTime" type="text" placeholder="如：2026.2.20 15:00" />
      </div>
      ${isLost ? `
        <div class="form-group">
          <label>悬赏（可选，填入金额）：</label>
          <input id="pubReward" type="number" />
        </div>
      ` : `
        <div class="form-group">
          <label>领取地点 <span class="req">*</span>:</label>
          <input id="pubStorage" />
        </div>
      `}
      <div class="form-group">
        <label>物品介绍 <span class="req">*</span>:</label>
        <textarea id="pubDesc"></textarea>
      </div>
      <div class="form-group">
        <label>${esc(campusLabel)} <span class="req">*</span>:</label>
        <select id="pubCampus">
          <option value="朝晖校区">朝晖校区</option>
          <option value="屏峰校区">屏峰校区</option>
          <option value="莫干山校区">莫干山校区</option>
        </select>
      </div>
      <div class="form-group">
        <label>物品类型 <span class="req">*</span>:</label>
        <select id="pubCategory">
          <option value="文体">文体</option>
          <option value="证件">证件</option>
          <option value="电子产品">电子产品</option>
          <option value="生活用品">生活用品</option>
          <option value="书籍">书籍</option>
          <option value="其他">其他</option>
        </select>
      </div>
      <div class="form-group">
        <label>上传图片（可选，最多三张）：</label>
        <div style="display:flex;gap:10px;flex-wrap:wrap" id="imgPreviewBox">
          <label class="upload-area" id="uploadLabel">+<input type="file" id="imgInput" accept="image/*" multiple style="display:none" /></label>
        </div>
        <p id="uploadMsg" class="msg" style="margin-top:4px"></p>
      </div>
      <div class="form-group">
        <label>联系人名称/联系人班级（格式：名称+专业班级）<span class="req">*</span>:</label>
        <input id="pubContact" />
      </div>
      <div class="form-group">
        <label>联系方式（电话/微信号/QQ号 输入时在前说明 如：电话19857751703）<span class="req">*</span>:</label>
        <input id="pubPhone" />
      </div>
      <div class="form-actions">
        <button class="btn-outline" id="pubClear" style="color:#e74c3c;border-color:#e74c3c">删除</button>
        <button class="btn-primary" id="pubSubmit">提交</button>
      </div>
      <p id="pubMsg" class="msg"></p>
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
        wrap.style.cssText = 'position:relative;width:80px;height:80px;';
        wrap.innerHTML = `<img src="${API_BASE}${url}" style="width:80px;height:80px;object-fit:cover;border:1px solid #ccc" /><span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" data-rmurl="${url}">&times;</span>`;
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

  document.getElementById('pubClear').onclick = () => {
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
      document.getElementById('pubMsg').textContent = e.message;
      document.getElementById('pubMsg').className = 'msg msg-err';
    }
  };
});

Router.register('publish', function (app) {
  Router.go('publishChoose');
});
