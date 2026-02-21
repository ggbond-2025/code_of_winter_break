# 项目运行指南

## 一、后端（Spring Boot + MySQL + Redis）
1. 启动 MySQL 和 Redis。
2. MySQL 执行：
```sql
CREATE DATABASE lost_found DEFAULT CHARACTER SET utf8mb4;
```
3. 修改 `server/src/main/resources/application.yml` 的数据库账号密码。
4. 进入后端目录并启动：
```bash
cd server
mvn spring-boot:run
```
5. 打开接口文档：`http://localhost:8080/swagger-ui.html`

## 二、前端页面
项目内保留原始打包前端（`index.html` + `assets`）不改动。

新增联调页面在 `frontend/index.html`：
- 可以用任意静态服务启动（Live Server / Python / npx serve）
- 推荐：
```bash
cd frontend
python -m http.server 5500
```
然后访问：`http://localhost:5500`
