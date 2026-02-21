-- Table: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `enabled` bit(1) NOT NULL,
  `first_login` bit(1) NOT NULL,
  `id_card` varchar(18) DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `real_name` varchar(30) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `region` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` (`id`, `created_at`, `enabled`, `first_login`, `id_card`, `password`, `phone`, `real_name`, `role`, `username`, `region`) VALUES (8, '2026-02-20T03:08:12', 1, 0, NULL, '$2b$10$Fi4FWMaXjYLSvIuFmJRL4.DrEIq6kuI9FL60.dd4Pah.l1to3jI4W', '13800000000', '系统管理员', 'SUPER_ADMIN', 'superadmin', NULL);
INSERT INTO `users` (`id`, `created_at`, `enabled`, `first_login`, `id_card`, `password`, `phone`, `real_name`, `role`, `username`, `region`) VALUES (9, '2026-02-20T03:08:12', 1, 0, NULL, '$2b$10$Fi4FWMaXjYLSvIuFmJRL4.DrEIq6kuI9FL60.dd4Pah.l1to3jI4W', '13900000001', '管理员张三', 'ADMIN', 'admin01', NULL);
INSERT INTO `users` (`id`, `created_at`, `enabled`, `first_login`, `id_card`, `password`, `phone`, `real_name`, `role`, `username`, `region`) VALUES (10, '2026-02-20T03:08:12', 1, 0, NULL, '$2b$10$Fi4FWMaXjYLSvIuFmJRL4.DrEIq6kuI9FL60.dd4Pah.l1to3jI4W', '13900000002', '管理员李四', 'ADMIN', 'admin02', NULL);
INSERT INTO `users` (`id`, `created_at`, `enabled`, `first_login`, `id_card`, `password`, `phone`, `real_name`, `role`, `username`, `region`) VALUES (11, '2026-02-20T03:08:12', 1, 0, NULL, '$2b$10$Fi4FWMaXjYLSvIuFmJRL4.DrEIq6kuI9FL60.dd4Pah.l1to3jI4W', '15800000001', '王小明', 'USER', '2024001', NULL);
INSERT INTO `users` (`id`, `created_at`, `enabled`, `first_login`, `id_card`, `password`, `phone`, `real_name`, `role`, `username`, `region`) VALUES (12, '2026-02-20T03:08:12', 1, 0, NULL, '$2b$10$Fi4FWMaXjYLSvIuFmJRL4.DrEIq6kuI9FL60.dd4Pah.l1to3jI4W', '15800000002', '赵小红', 'USER', '2024002', NULL);
INSERT INTO `users` (`id`, `created_at`, `enabled`, `first_login`, `id_card`, `password`, `phone`, `real_name`, `role`, `username`, `region`) VALUES (13, '2026-02-20T03:08:12', 1, 0, NULL, '$2b$10$Fi4FWMaXjYLSvIuFmJRL4.DrEIq6kuI9FL60.dd4Pah.l1to3jI4W', '15800000003', '刘老师', 'USER', 'T001', NULL);
