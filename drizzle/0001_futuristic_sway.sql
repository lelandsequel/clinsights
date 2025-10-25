CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` varchar(512) NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text,
	`url` varchar(1024) NOT NULL,
	`imageUrl` varchar(1024),
	`source` varchar(128) NOT NULL,
	`author` varchar(256),
	`category` enum('breakthrough','company_announcement','policy','funding','research','other') NOT NULL DEFAULT 'other',
	`relevanceScore` int NOT NULL DEFAULT 50,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_sourceId_unique` UNIQUE(`sourceId`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`articleId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
