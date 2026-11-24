CREATE TABLE `edit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`fieldName` varchar(200) NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `edit_logs_id` PRIMARY KEY(`id`)
);
