# 校园失物招领系统接口文档

Base URL: `http://localhost:8080`

> 除特别标注外，需要请求头：`Authorization: Bearer <token>`

---

## 1. 认证接口 `/api/auth`

### 1.1 注册 (无需登录)
- **POST** `/api/auth/register`
```json
{ "username": "2024001", "password": "123456", "realName": "张三", "phone": "13800000000", "idCard": "110101200001011234" }
```

### 1.2 登录 (无需登录)
- **POST** `/api/auth/login`
```json
{ "username": "2024001", "password": "123456" }
```
- Response `data`:
```json
{ "token": "xxx", "userId": 1, "username": "2024001", "role": "USER", "firstLogin": true }
```

### 1.3 修改密码
- **POST** `/api/auth/change-password`
```json
{ "oldPassword": "123456", "newPassword": "newpass123" }
```

### 1.4 获取当前用户信息
- **GET** `/api/auth/me`

---

## 2. 公告接口

### 2.1 获取生效公告 (无需登录)
- **GET** `/api/announcements`

---

## 3. 失物/招领接口 `/api/items`

### 3.1 发布 (需登录)
- **POST** `/api/items`
```json
{
  "title": "黑色钱包", "description": "在图书馆丢失", "category": "生活用品",
  "location": "图书馆3楼", "type": "LOST", "features": "有划痕",
  "contactName": "张三", "contactPhone": "138xxx", "reward": 50.0
}
```

### 3.2 公开列表 (无需登录，默认只返回已审核通过的)
- **GET** `/api/items?keyword=&status=&category=&type=&page=0&size=10`

### 3.3 详情 (无需登录)
- **GET** `/api/items/{id}`

### 3.4 我的发布
- **GET** `/api/items/my?page=0&size=10`

### 3.5 修改发布 (仅待审核/已驳回)
- **PUT** `/api/items/{id}`

### 3.6 取消发布
- **PUT** `/api/items/{id}/cancel`

### 3.7 重新发布（仅已取消）
- **PUT** `/api/items/{id}/republish`

---

## 4. 认领接口 `/api/claims`

### 4.1 发起认领
- **POST** `/api/claims`
```json
{ "itemId": 1, "message": "描述物品特征", "proof": "补充证明" }
```

### 4.2 我的认领记录
- **GET** `/api/claims/my`

### 4.3 查看物品的认领列表 (发布者/管理员)
- **GET** `/api/claims/item/{itemId}`

### 4.4 审核认领 (发布者/管理员)
- **PUT** `/api/claims/{id}/review`
```json
{ "status": "APPROVED" }
```
- 可选值: `APPROVED` / `REJECTED`，驳回时加 `reason`

---

## 5. 管理员接口 `/api/admin` (需 ADMIN/SUPER_ADMIN 角色)

### 5.1 全部物品列表
- **GET** `/api/admin/items?keyword=&status=PENDING&page=0&size=20`

### 5.2 审核通过
- **PUT** `/api/admin/items/{id}/approve`

### 5.3 审核驳回
- **PUT** `/api/admin/items/{id}/reject`
```json
{ "reason": "信息不完整" }
```

### 5.4 归档
- **PUT** `/api/admin/items/{id}/archive`

### 5.5 删除
- **DELETE** `/api/admin/items/{id}`

### 5.6 更新存放信息
- **PUT** `/api/admin/items/{id}/info`
```json
{ "storageLocation": "保卫处", "contactName": "李四", "contactPhone": "139xxx" }
```

### 5.7 统计数据
- **GET** `/api/admin/stats`

---

## 6. 系统管理员接口 `/api/super` (需 SUPER_ADMIN 角色)

### 6.1 用户列表
- **GET** `/api/super/users?keyword=&role=&page=0&size=20`

### 6.2 新增账号（管理员/普通用户）
- **POST** `/api/super/users`
```json
{ "username": "user01", "password": "123456", "realName": "张三", "role": "USER" }
```
- `role` 可选：`USER`（普通用户）、`ADMIN`（管理员），不传默认按管理员创建。

### 6.3 启用/禁用用户
- **PUT** `/api/super/users/{id}/toggle`

### 6.4 重置密码
- **PUT** `/api/super/users/{id}/reset-password`

### 6.5 公告列表
- **GET** `/api/super/announcements`

### 6.6 发布公告
- **POST** `/api/super/announcements`
```json
{ "title": "系统维护通知", "content": "今晚22点维护" }
```

### 6.7 启用/停用公告
- **PUT** `/api/super/announcements/{id}/toggle`

### 6.8 删除公告
- **DELETE** `/api/super/announcements/{id}`

### 6.9 全局统计
- **GET** `/api/super/stats`

### 6.10 查询最近一次备份信息
- **GET** `/api/super/backup/latest`
- Response `data` 示例：
```json
{
  "backupRoot": "D:\\project\\server\\backups\\sql",
  "backupTime": "2026年2月21日 14:22:31",
  "backupFolder": "D:\\project\\server\\backups\\sql\\backup-20260221-142231",
  "tableCount": 9
}
```

### 6.11 立即备份（按表导出 SQL）
- **POST** `/api/super/backup/now`
- 功能说明：将当前数据库内每张表导出为独立 `.sql` 文件，保存到配置目录 `backup.output-dir` 下的时间戳子目录。
- Response `data` 示例：
```json
{
  "backupTime": "2026年2月21日 14:25:10",
  "backupFolder": "D:\\project\\server\\backups\\sql\\backup-20260221-142510",
  "tableCount": 9,
  "files": ["announcement.sql", "lost_item.sql"]
}
```

### 6.12 导出数据（按范围和类型下载 CSV）
- **POST** `/api/super/export/csv`
- Request Body：
```json
{
  "rangeMonths": 4,
  "types": ["FOUND", "LOST", "GLOBAL_ANNOUNCEMENT", "REGION_ANNOUNCEMENT"]
}
```
- `rangeMonths` 可选值：`1`、`2`、`4`、`8`、`12`（12 表示 1 年）
- `types` 可多选：
  - `FOUND`：导出失物招领
  - `LOST`：导出寻物启事
  - `GLOBAL_ANNOUNCEMENT`：导出全局公告
  - `REGION_ANNOUNCEMENT`：导出地区公告
- Response `data` 示例：
```json
{
  "downloadUrl": "/uploads/exports/data-export-20260221-201500-a1b2c3d4.csv",
  "fileName": "data-export-20260221-201500-a1b2c3d4.csv",
  "rangeMonths": 4,
  "types": ["失物招领", "全局公告"],
  "rows": 123
}
```

### 6.13 预估过期数据清理条数
- **GET** `/api/super/cleanup/preview?days=7`
- 说明：统计“已认领、已归档、已取消、已驳回”且状态更新时间早于 `days` 天前的数据条数。
- Response `data` 示例：
```json
{
  "days": 7,
  "count": 35,
  "statuses": ["已认领", "已归档", "已取消", "已驳回"]
}
```

### 6.14 执行过期数据清理
- **POST** `/api/super/cleanup/execute`
- Request Body：
```json
{ "days": 7 }
```
- 说明：删除“已认领、已归档、已取消、已驳回”且状态更新时间早于 `days` 天前的数据。
- Response `data` 示例：
```json
{
  "days": 7,
  "cleanedCount": 35,
  "statuses": ["已认领", "已归档", "已取消", "已驳回"]
}
```

---

## 7. 系统通知接口 `/api/notifications`

### 7.1 我的系统通知（分页）
- **GET** `/api/notifications?page=0&size=8`
- 说明：普通用户/管理员可用，`size` 最大 8。

---

## 8. Swagger 文档
- `http://localhost:8080/swagger-ui.html`

## 角色说明
| 角色 | 值 | 权限 |
|------|-----|------|
| 学生/老师 | USER | 发布、查询、认领 |
| 失物招领管理员 | ADMIN | 审核、归档、删除、统计 |
| 系统管理员 | SUPER_ADMIN | 全部权限 + 账号管理 + 公告管理 |

## 物品状态流转
`PENDING` → `APPROVED` / `REJECTED` → `MATCHED` → `CLAIMED` → `ARCHIVED`

用户可随时 `CANCELLED`
