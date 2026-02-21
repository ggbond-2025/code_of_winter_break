-- Table: chat_messages
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(1000) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `claim_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKo6ytts75wloq8cr89cletr9yh` (`claim_id`),
  KEY `FKgiqeap8ays4lf684x7m0r2729` (`sender_id`),
  CONSTRAINT `FKgiqeap8ays4lf684x7m0r2729` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKo6ytts75wloq8cr89cletr9yh` FOREIGN KEY (`claim_id`) REFERENCES `claim_records` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

