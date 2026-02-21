-- Table: announcements
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

INSERT INTO `announcements` (`id`, `active`, `content`, `created_at`, `title`, `author_id`, `region`, `scope`, `status`) VALUES (1, 1, '15:00-16:00', '2026-02-20T19:56:44.068456', '停电', 9, '朝晖校区', 'REGION', '');
INSERT INTO `announcements` (`id`, `active`, `content`, `created_at`, `title`, `author_id`, `region`, `scope`, `status`) VALUES (2, 1, '111111', '2026-02-20T20:42:05.993383', '全局', 8, NULL, 'GLOBAL', 'APPROVED');
INSERT INTO `announcements` (`id`, `active`, `content`, `created_at`, `title`, `author_id`, `region`, `scope`, `status`) VALUES (3, 1, '111', '2026-02-20T20:42:21.551180', '全局1', 8, NULL, 'GLOBAL', 'APPROVED');
INSERT INTO `announcements` (`id`, `active`, `content`, `created_at`, `title`, `author_id`, `region`, `scope`, `status`) VALUES (4, 1, '1111', '2026-02-20T20:42:47.890379', '停电', 9, '朝晖校区', 'REGION', 'APPROVED');
