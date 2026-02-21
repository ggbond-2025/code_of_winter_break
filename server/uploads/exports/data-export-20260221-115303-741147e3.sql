-- 数据导出文件
-- 生成时间: 2026年2月21日 11:53:03
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
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (23, '证件', '', '', '2026-02-21T00:34:10.017479', '111', '', '', '朝晖校区', '', NULL, NULL, 'APPROVED', '', '审核开关测试', 'LOST', '2026-02-21T00:35:12.382727', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (22, '球', '', '', '2026-02-21T00:32:54.259209', '', '', '', '朝晖校区', '', NULL, NULL, 'APPROVED', '', '2', 'LOST', '2026-02-21T00:32:54.259209', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (21, '证件', '', '', '2026-02-21T00:31:48.568551', '', '', '', '朝晖校区', '', NULL, NULL, 'APPROVED', '', '1', 'LOST', '2026-02-21T00:32:31.188122', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (20, '证件', '', '', '2026-02-21T00:19:45.856435', '', '', '', '朝晖校区', '', '111', NULL, 'REJECTED', '', '1', 'LOST', '2026-02-21T00:20:30.001652', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (19, '证件', '', '', '2026-02-21T00:18:40.672097', '', '', '', '朝晖校区', '', NULL, NULL, 'APPROVED', '', '2', 'FOUND', '2026-02-21T00:19:18.254344', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (18, '证件', '', '', '2026-02-21T00:18:08.279192', '', '', '', '朝晖校区', '', NULL, NULL, 'APPROVED', '', '1', 'LOST', '2026-02-21T00:18:08.279192', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (17, '球', '', '', '2026-02-21T00:06:40.896673', '', '', '', '朝晖校区 — ', '', NULL, NULL, 'APPROVED', '', '111', 'LOST', '2026-02-21T00:06:40.896673', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (16, '证件', '', '', '2026-02-20T23:43:04.994721', '1111', '', '/uploads/976806cb194c4dffb96e786b2a1bab94.png', '朝晖校区 — 1', '', NULL, NULL, 'APPROVED', '', '1', 'FOUND', '2026-02-21T00:19:19.107209', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (15, '生活用品', '', '', '2026-02-20T23:42:12.964382', '1111111111111111111', '', '/uploads/ce0f9e1cb22a4a4489dc030a5eaf3197.png', '朝晖校区 — 1', '', NULL, NULL, 'APPROVED', '', '测试22', 'LOST', '2026-02-21T00:19:16.926145', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (14, '证件', '', '', '2026-02-20T23:40:10.521923', '11111111111111111111', '', '/uploads/c5810e24e37046f5ab7be657750cdd07.png,/uploads/45201962c679476c95367cab7bb8ca07.png,/uploads/d04dce627da3473cb848cc3570beb868.png', '朝晖校区 — 1', '', NULL, NULL, 'APPROVED', '', '测试修改参数', 'FOUND', '2026-02-21T00:19:19.550911', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (13, '文体', '', '', '2026-02-20T23:38:37.690181', '1', '', '/uploads/3ee072dbc28e4a0a8a19acbb98b8a83e.png', '朝晖校区 — 1', '', NULL, NULL, 'APPROVED', '', '测试1', 'LOST', '2026-02-21T00:19:16.293871', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (12, '文体', '', '', '2026-02-20T21:45:52.810371', '', '', '', '朝晖校区 — ', '', '恶意广告：111', NULL, 'ADMIN_DELETED', '', '测试1', 'LOST', '2026-02-20T21:46:02.361128', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (11, '文体', '', '', '2026-02-20T21:32:45.984488', '11', '', '/uploads/10391ab2e88b4ad69412ad47f5f0a544.png', '莫干山校区 — 1', '', '虚假信息：太垃圾', 1.0, 'ADMIN_DELETED', '', '测试', 'LOST', '2026-02-20T21:33:36.089171', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (10, '证件', '', '', '2026-02-20T17:22:29.999761', '111', '', '/uploads/59ed84d6b05847a5bb5d240cbec708a9.png', '屏峰校区 — 4', '2026.2.11 11:00', NULL, NULL, 'APPROVED', '', '4', 'FOUND', '2026-02-20T17:22:55.302471', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (8, '电子产品', '3', '3', '2026-02-20T16:44:26.511254', '3', '', '/uploads/ed113139daa849ea9552667953196073.png', '莫干山校区 — 3', '2026.2.11 11:00', NULL, NULL, 'CLAIMED', '3', '3', 'FOUND', '2026-02-20T18:57:38.105271', 11, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (7, '证件', '2', '2', '2026-02-20T16:43:41.889068', '2', '', '/uploads/baeed9b13b9e47c48703cea4df591a7a.png,/uploads/9a0f6734f95a444b954ab20566f5cc27.png,/uploads/c6efa3ae717b407e9b9fe13f7153330c.png', '屏峰校区 — 2', '2026.1.1 1:00', NULL, 2.0, 'MATCHED', '', '2', 'LOST', '2026-02-20T17:33:36.201548', 12, NULL, NULL);
INSERT INTO `lost_items` (`id`, `category`, `contact_name`, `contact_phone`, `created_at`, `description`, `features`, `image_urls`, `location`, `lost_time`, `reject_reason`, `reward`, `status`, `storage_location`, `title`, `type`, `updated_at`, `creator_id`, `supplement_info`, `archive_method`) VALUES (6, '文体', '1', '1', '2026-02-20T16:43:20.036494', '1', '', '/uploads/c27a7afe8b574e35a5e90869da4daeb7.png,/uploads/fd523da09463437bbc2c78e069f3e276.png', '朝晖校区 — 1', '2026.1.1 1:00', NULL, 1.0, 'APPROVED', '', '1', 'LOST', '2026-02-20T16:45:20.613914', 12, NULL, NULL);

-- announcements
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `content` varchar(2000) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `title` varchar(100) NOT NULL,
  `author_id` bigint NOT NULL,
  `region` varchar(30) DEFAULT NULL,
  `scope` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1pgl63iwbqvmngumhvr3xopg3` (`author_id`),
  CONSTRAINT `FK1pgl63iwbqvmngumhvr3xopg3` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `announcements` (`id`, `active`, `content`, `created_at`, `title`, `author_id`, `region`, `scope`, `status`) VALUES (3, 1, '111', '2026-02-20T20:42:21.551180', '全局1', 8, NULL, 'GLOBAL', 'APPROVED');
INSERT INTO `announcements` (`id`, `active`, `content`, `created_at`, `title`, `author_id`, `region`, `scope`, `status`) VALUES (2, 1, '111111', '2026-02-20T20:42:05.993383', '全局', 8, NULL, 'GLOBAL', 'APPROVED');

