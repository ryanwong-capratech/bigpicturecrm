CREATE TABLE `student_gallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`caption` varchar(300),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_gallery_id` PRIMARY KEY(`id`)
);
