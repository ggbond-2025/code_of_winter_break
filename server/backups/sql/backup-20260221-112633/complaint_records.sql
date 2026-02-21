-- Table: complaint_records
DROP TABLE IF EXISTS `complaint_records`;
CREATE TABLE `complaint_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `detail` varchar(500) DEFAULT NULL,
  `handled_at` datetime(6) DEFAULT NULL,
  `reason` varchar(60) NOT NULL,
  `status` varchar(20) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `handler_id` bigint DEFAULT NULL,
  `item_id` bigint DEFAULT NULL,
  `reporter_id` bigint NOT NULL,
  `target_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKp0d96lnyjrunhuv61i5bsnhdy` (`handler_id`),
  KEY `FK2jpxdr2grd8g4lqxris2u37bu` (`item_id`),
  KEY `FKp9no18q36l3i1ybwswyttlp2p` (`reporter_id`),
  KEY `FKnqst40j5l3rgsg9xqt7leg5bj` (`target_id`),
  CONSTRAINT `FK2jpxdr2grd8g4lqxris2u37bu` FOREIGN KEY (`item_id`) REFERENCES `lost_items` (`id`),
  CONSTRAINT `FKnqst40j5l3rgsg9xqt7leg5bj` FOREIGN KEY (`target_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp0d96lnyjrunhuv61i5bsnhdy` FOREIGN KEY (`handler_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp9no18q36l3i1ybwswyttlp2p` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `complaint_records` (`id`, `action`, `created_at`, `detail`, `handled_at`, `reason`, `status`, `updated_at`, `handler_id`, `item_id`, `reporter_id`, `target_id`) VALUES (1, 'BAN_USER', '2026-02-20T21:14:56.560314', '', '2026-02-20T21:15:23.137575', '虚假信息', 'RESOLVED', '2026-02-20T21:15:23.139076', 8, 10, 11, 11);
