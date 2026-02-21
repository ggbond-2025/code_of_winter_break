# 后端启动说明

## 环境要求
- JDK 17+
- Maven 3.9+
- MySQL 8+
- Redis 6+

## 数据库准备
```sql
CREATE DATABASE lost_found DEFAULT CHARACTER SET utf8mb4;
```

修改 `src/main/resources/application.yml` 中数据库账号密码后启动。

## 启动命令
```bash
mvn spring-boot:run
```

## 默认端口
- 后端: `8080`
