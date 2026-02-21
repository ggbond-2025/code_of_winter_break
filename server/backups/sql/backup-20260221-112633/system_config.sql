-- Table: system_config
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id` bigint NOT NULL,
  `categories` varchar(500) NOT NULL,
  `claim_expire_days` int NOT NULL,
  `desc_max_length` int NOT NULL,
  `enable_desc_limit` bit(1) NOT NULL,
  `enable_review` bit(1) NOT NULL,
  `forbid_word_check` bit(1) NOT NULL,
  `publish_cooldown_minutes` int NOT NULL,
  `require_image` bit(1) NOT NULL,
  `require_location_detail` bit(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `last_backup_at` datetime(6) DEFAULT NULL,
  `last_backup_file` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `system_config` (`id`, `categories`, `claim_expire_days`, `desc_max_length`, `enable_desc_limit`, `enable_review`, `forbid_word_check`, `publish_cooldown_minutes`, `require_image`, `require_location_detail`, `updated_at`, `last_backup_at`, `last_backup_file`) VALUES (1, '证件,电子产品,生活用品,文体,书籍,球,其他', 20, 20, 1, 0, 0, 1, 0, 0, '2026-02-21T00:34:50.565934', NULL, NULL);
