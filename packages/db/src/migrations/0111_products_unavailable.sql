ALTER TABLE `products` ADD `is_unavailable` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `unavailable_note` varchar(255);
