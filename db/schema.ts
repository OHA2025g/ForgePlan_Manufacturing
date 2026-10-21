import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const workspaces=sqliteTable('manufacturing_workspaces',{userId:text('user_id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()});
export const drawingFiles=sqliteTable('drawing_files',{id:text('id').primaryKey(),userId:text('user_id').notNull(),key:text('object_key').notNull(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),createdAt:text('created_at').notNull()});
