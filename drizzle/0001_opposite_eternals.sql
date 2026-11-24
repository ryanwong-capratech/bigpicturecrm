CREATE TABLE `coach_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`content` text NOT NULL,
	`sessionLabel` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coach_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`label` varchar(200) NOT NULL,
	`fieldType` enum('text','textarea','number','date','select') NOT NULL DEFAULT 'text',
	`options` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_fields_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_fields_fieldKey_unique` UNIQUE(`fieldKey`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `student_custom_values` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`fieldId` int NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_custom_values_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nickname` varchar(100),
	`fullNameChinese` varchar(100),
	`gender` varchar(10),
	`photoUrl` text,
	`birthday` varchar(50),
	`igFb` varchar(200),
	`email` varchar(320),
	`phone` varchar(50),
	`favoriteSongs` text,
	`businessModel` text,
	`partnersEmployees` varchar(100),
	`companyInfo` text,
	`nextGoal` text,
	`businessBottleneck` text,
	`wantToImprove` text,
	`mainIncome` text,
	`mainExpense` text,
	`financialSatisfaction` varchar(200),
	`financialControl` varchar(50),
	`incomeLevel` varchar(100),
	`maritalStatus` varchar(50),
	`familyMembers` text,
	`mostImportantPerson` text,
	`whyJoin` text,
	`courseExpectation` text,
	`wantToTakeAway` text,
	`otherCourses` text,
	`interestedWorkshops` text,
	`attendanceConfirmed` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
