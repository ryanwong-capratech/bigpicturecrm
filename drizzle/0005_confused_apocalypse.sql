CREATE TABLE `student_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`content` text NOT NULL,
	`sessionLabel` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_shares_id` PRIMARY KEY(`id`)
);
