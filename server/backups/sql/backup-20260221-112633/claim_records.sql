-- Table: claim_records
DROP TABLE IF EXISTS `claim_records`;
CREATE TABLE `claim_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `message` varchar(500) NOT NULL,
  `proof` varchar(500) DEFAULT NULL,
  `reject_reason` varchar(300) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `claimer_id` bigint NOT NULL,
  `item_id` bigint NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `image_urls` varchar(1000) DEFAULT NULL,
  `reviewer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKoptfb6bolyoju03dijgupdieg` (`claimer_id`),
  KEY `FKidd3401lhgc6s7afryykaqdrt` (`item_id`),
  KEY `FKooierymjglhueytxkta7yacb5` (`reviewer_id`),
  CONSTRAINT `FKidd3401lhgc6s7afryykaqdrt` FOREIGN KEY (`item_id`) REFERENCES `lost_items` (`id`),
  CONSTRAINT `FKooierymjglhueytxkta7yacb5` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKoptfb6bolyoju03dijgupdieg` FOREIGN KEY (`claimer_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (4, '2026-02-20T16:46:08.674015', '1', '', '1', 'REJECTED', 11, 7, '2026-02-20T16:50:12.020051', '/uploads/ca162901320f405e8d3e0437b6638fe0.png', NULL);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (5, '2026-02-20T16:46:24.690498', '1', '', '1', 'REJECTED', 11, 7, '2026-02-20T16:50:10.435305', '/uploads/71678e48792f4e7397e4be15ab0fbca8.png', NULL);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (6, '2026-02-20T16:46:45.617392', '2', '', '1', 'REJECTED', 11, 6, '2026-02-20T16:50:08.962503', '/uploads/67731e908c6642dea3f0d5d5aa04c322.png', NULL);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (7, '2026-02-20T16:47:37.352829', '1', '', '1', 'REJECTED', 12, 8, '2026-02-20T16:50:07.432171', '/uploads/6551dc727cee4743b0f7989cbc86e2f3.png', NULL);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (8, '2026-02-20T16:47:47.439361', '11', '', '11', 'REJECTED', 12, 8, '2026-02-20T16:50:05.306887', '/uploads/5f4e33d3e8824949b939b23ae9451993.png', NULL);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (9, '2026-02-20T16:58:16.557101', '1', '', NULL, 'APPROVED', 12, 8, '2026-02-20T17:00:38.647741', '', 9);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (10, '2026-02-20T17:04:29.265653', '1', '', '图片不清晰', 'REJECTED', 11, 7, '2026-02-20T17:18:41.760969', '', NULL);
INSERT INTO `claim_records` (`id`, `created_at`, `message`, `proof`, `reject_reason`, `status`, `claimer_id`, `item_id`, `updated_at`, `image_urls`, `reviewer_id`) VALUES (11, '2026-02-20T17:32:33.306875', '1', '', NULL, 'APPROVED', 11, 7, '2026-02-20T17:33:36.201548', '', 9);
