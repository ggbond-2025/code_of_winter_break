-- 数据导出文件
-- 生成时间: 2026年2月21日 12:31:45
-- 时间范围: 最近1个月

-- lost_items
DROP TABLE IF EXISTS `lost_items`;
CREATE TABLE `lost_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `contact_name` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) NOT NULL,
  `features` varchar(500) DEFAULT NULL,
  `image_urls` varchar(1000) DEFAULT NULL,
  `location` varchar(100) NOT NULL,
  `lost_time` varchar(50) NOT NULL,
  `reject_reason` varchar(300) DEFAULT NULL,
  `reward` double DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `storage_location` varchar(200) DEFAULT NULL,
  `title` varchar(100) NOT NULL,
  `type` varchar(20) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `creator_id` bigint NOT NULL,
  `supplement_info` varchar(500) DEFAULT NULL,
  `archive_method` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKrtpu0khgwyga555akious2y8j` (`creator_id`),
  CONSTRAINT `FKrtpu0khgwyga555akious2y8j` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (16, '证件', '', '', '2026-02-20T23:43:04.994721', '1111', '', '/uploads/976806cb194c4dffb96e786b2a1bab94.png', '朝晖校区 — 1', '', NULL, NULL, 'CLAIMED', '', '1', 'FOUND', '2026-02-21T12:13:07.616745', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (14, '证件', '', '', '2026-02-20T23:40:10.521923', '11111111111111111111', '', '/uploads/c5810e24e37046f5ab7be657750cdd07.png,/uploads/45201962c679476c95367cab7bb8ca07.png,/uploads/d04dce627da3473cb848cc3570beb868.png', '朝晖校区 — 1', '', NULL, NULL, 'APPROVED', '', '测试修改参数', 'FOUND', '2026-02-21T00:19:19.550911', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (10, '证件', '', '', '2026-02-20T17:22:29.999761', '111', '', '/uploads/59ed84d6b05847a5bb5d240cbec708a9.png', '屏峰校区 — 4', '2026.2.11 11:00', NULL, NULL, 'APPROVED', '', '4', 'FOUND', '2026-02-20T17:22:55.302471', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (8, '电子产品', '3', '3', '2026-02-20T16:44:26.511254', '3', '', '/uploads/ed113139daa849ea9552667953196073.png', '莫干山校区 — 3', '2026.2.11 11:00', NULL, NULL, 'CLAIMED', '3', '3', 'FOUND', '2026-02-20T18:57:38.105271', 11, NULL, NULL);

