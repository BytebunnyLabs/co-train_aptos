import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBasicTables1751639300000 implements MigrationInterface {
    name = 'CreateBasicTables1751639300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable uuid extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        
        // Create enum types
        await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('user', 'admin', 'moderator')`);
        await queryRunner.query(`CREATE TYPE "user_status_enum" AS ENUM('active', 'inactive', 'suspended', 'pending')`);
        await queryRunner.query(`CREATE TYPE "training_session_status_enum" AS ENUM('pending', 'active', 'completed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "training_session_type_enum" AS ENUM('individual', 'collaborative', 'competitive')`);
        await queryRunner.query(`CREATE TYPE "training_session_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'expert')`);
        await queryRunner.query(`CREATE TYPE "transaction_status_enum" AS ENUM('pending', 'confirmed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "transaction_type_enum" AS ENUM('reward', 'fee', 'stake', 'unstake', 'transfer')`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying,
                "firstName" character varying,
                "lastName" character varying,
                "avatar" character varying,
                "walletAddress" character varying,
                "tokenBalance" numeric(18,8) NOT NULL DEFAULT '0',
                "reputationScore" integer NOT NULL DEFAULT '0',
                "totalContributions" integer NOT NULL DEFAULT '0',
                "role" "user_role_enum" NOT NULL DEFAULT 'user',
                "status" "user_status_enum" NOT NULL DEFAULT 'active',
                "lastLoginAt" TIMESTAMP,
                "emailVerified" boolean NOT NULL DEFAULT false,
                "emailVerificationToken" character varying,
                "passwordResetToken" character varying,
                "passwordResetExpires" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_username" UNIQUE ("username"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "UQ_users_walletAddress" UNIQUE ("walletAddress")
            )
        `);

        // Create training_sessions table
        await queryRunner.query(`
            CREATE TABLE "training_sessions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text,
                "type" "training_session_type_enum" NOT NULL DEFAULT 'individual',
                "status" "training_session_status_enum" NOT NULL DEFAULT 'pending',
                "difficulty" "training_session_difficulty_enum" NOT NULL DEFAULT 'beginner',
                "progress" numeric(5,2) NOT NULL DEFAULT '0',
                "estimatedDurationMinutes" integer NOT NULL DEFAULT '0',
                "actualDurationMinutes" integer NOT NULL DEFAULT '0',
                "maxParticipants" integer NOT NULL DEFAULT '1',
                "currentParticipants" integer NOT NULL DEFAULT '0',
                "rewards" jsonb,
                "configuration" jsonb,
                "metrics" jsonb,
                "logs" jsonb,
                "startedAt" TIMESTAMP,
                "completedAt" TIMESTAMP,
                "failedAt" TIMESTAMP,
                "failureReason" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_training_sessions" PRIMARY KEY ("id")
            )
        `);

        // Create blockchain_transactions table
        await queryRunner.query(`
            CREATE TABLE "blockchain_transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "hash" character varying,
                "amount" numeric(18,8) NOT NULL DEFAULT '0',
                "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
                "type" "transaction_type_enum" NOT NULL DEFAULT 'transfer',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_blockchain_transactions" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_blockchain_transactions_hash" UNIQUE ("hash")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_username" ON "users" ("username")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_createdAt" ON "users" ("createdAt")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_training_sessions_userId" ON "training_sessions" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_training_sessions_status" ON "training_sessions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_training_sessions_type" ON "training_sessions" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_training_sessions_createdAt" ON "training_sessions" ("createdAt")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_blockchain_transactions_hash" ON "blockchain_transactions" ("hash")`);
        await queryRunner.query(`CREATE INDEX "IDX_blockchain_transactions_status" ON "blockchain_transactions" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_blockchain_transactions_type" ON "blockchain_transactions" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_blockchain_transactions_createdAt" ON "blockchain_transactions" ("createdAt")`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "training_sessions" ADD CONSTRAINT "FK_training_sessions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "training_sessions" DROP CONSTRAINT "FK_training_sessions_userId"`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_blockchain_transactions_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_blockchain_transactions_type"`);
        await queryRunner.query(`DROP INDEX "IDX_blockchain_transactions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_blockchain_transactions_hash"`);
        await queryRunner.query(`DROP INDEX "IDX_training_sessions_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_training_sessions_type"`);
        await queryRunner.query(`DROP INDEX "IDX_training_sessions_status"`);
        await queryRunner.query(`DROP INDEX "IDX_training_sessions_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_users_createdAt"`);
        await queryRunner.query(`DROP INDEX "IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "IDX_users_status"`);
        await queryRunner.query(`DROP INDEX "IDX_users_username"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "blockchain_transactions"`);
        await queryRunner.query(`DROP TABLE "training_sessions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        
        // Drop enum types
        await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "training_session_difficulty_enum"`);
        await queryRunner.query(`DROP TYPE "training_session_type_enum"`);
        await queryRunner.query(`DROP TYPE "training_session_status_enum"`);
        await queryRunner.query(`DROP TYPE "user_status_enum"`);
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
    }
}