-- Table: system_notifications
DROP TABLE IF EXISTS `system_notifications`;
CREATE TABLE `system_notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(2000) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `scope` varchar(20) NOT NULL,
  `sender_id` bigint NOT NULL,
  `target_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK45gyq6gf9lecnou3bjietxtm6` (`sender_id`),
  KEY `FKgppvk928mogxmn4rgr8jul17x` (`target_id`),
  CONSTRAINT `FK45gyq6gf9lecnou3bjietxtm6` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKgppvk928mogxmn4rgr8jul17x` FOREIGN KEY (`target_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `system_notifications` (`id`, `content`, `created_at`, `scope`, `sender_id`, `target_id`) VALUES (1, '测试', '2026-02-20T22:22:45.070666', 'USER', 8, 11);
INSERT INTO `system_notifications` (`id`, `content`, `created_at`, `scope`, `sender_id`, `target_id`) VALUES (2, '测试1', '2026-02-20T22:22:53.281469', 'ALL', 8, NULL);
