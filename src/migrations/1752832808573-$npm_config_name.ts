import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1752832808573 implements MigrationInterface {
    name = ' $npmConfigName1752832808573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat" ("id" SERIAL NOT NULL, "isGroup" boolean NOT NULL DEFAULT false, "name" character varying, CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "isOnline" boolean NOT NULL DEFAULT false, "googleId" character varying, "firstName" character varying, "lastName" character varying, "avatar" character varying, "refreshToken" text array, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "message" ("id" SERIAL NOT NULL, "content" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" integer, "chatId" integer, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_participants_user" ("chatId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_5dfe15692e289461b16eb668e68" PRIMARY KEY ("chatId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a65f083b45e9a271fc862c34f" ON "chat_participants_user" ("chatId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3c4f8082e87de9b6f0b65c21f1" ON "chat_participants_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_619bc7b78eba833d2044153bacc" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_participants_user" ADD CONSTRAINT "FK_5a65f083b45e9a271fc862c34ff" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat_participants_user" ADD CONSTRAINT "FK_3c4f8082e87de9b6f0b65c21f18" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_participants_user" DROP CONSTRAINT "FK_3c4f8082e87de9b6f0b65c21f18"`);
        await queryRunner.query(`ALTER TABLE "chat_participants_user" DROP CONSTRAINT "FK_5a65f083b45e9a271fc862c34ff"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_619bc7b78eba833d2044153bacc"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c4f8082e87de9b6f0b65c21f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a65f083b45e9a271fc862c34f"`);
        await queryRunner.query(`DROP TABLE "chat_participants_user"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "chat"`);
    }

}
