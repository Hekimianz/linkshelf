import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1782274863035 implements MigrationInterface {
  name = 'InitialSchema1782274863035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "display_name" character varying NOT NULL, "bio" text, "theme_config" jsonb NOT NULL DEFAULT '{}', "avatar_url" text, "og_image_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "UQ_db923a19f15d5ceaa2b27ecb58c" UNIQUE ("slug"), CONSTRAINT "UQ_9e432b7df0d182f8d292902d1a2" UNIQUE ("user_id"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "title" character varying NOT NULL, "url" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "position" integer NOT NULL, "click_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP WITH TIME ZONE, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ecf17f4a741d3c5ba0b4c5ab4b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "click_events" ("id" BIGSERIAL NOT NULL, "link_id" uuid NOT NULL, "profile_id" uuid NOT NULL, "visitor_ip_hash" text, "referrer" text, "user_agent" text, "country_code" character(2), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2e3b14f5049a9fdbd8c9b1b10bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" ADD CONSTRAINT "FK_e683e4f9953d7e2e539fe398427" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_e27e2d62deabf3c458aa8d0e456" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" ADD CONSTRAINT "FK_877a6359d46e6552794c603ef29" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE INDEX ON profiles(user_id);`);
    await queryRunner.query(
      `CREATE INDEX ON links(profile_id) WHERE deleted_at IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX ON links(expires_at) WHERE expires_at IS NOT NULL AND is_active = true;`,
    );
    await queryRunner.query(
      `CREATE INDEX ON click_events(link_id, created_at DESC);`,
    );
    await queryRunner.query(
      `CREATE INDEX ON click_events(profile_id, created_at DESC);`,
    );

    await queryRunner.query(`CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $$ language 'plpgsql';`);
    await queryRunner.query(
      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    );

    await queryRunner.query(`CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION
  update_updated_at_column();`);
    await queryRunner.query(
      `CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_877a6359d46e6552794c603ef29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "click_events" DROP CONSTRAINT "FK_e27e2d62deabf3c458aa8d0e456"`,
    );
    await queryRunner.query(
      `ALTER TABLE "links" DROP CONSTRAINT "FK_e683e4f9953d7e2e539fe398427"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profiles" DROP CONSTRAINT "FK_9e432b7df0d182f8d292902d1a2"`,
    );
    await queryRunner.query(`DROP TABLE "click_events"`);
    await queryRunner.query(`DROP TABLE "links"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;`,
    );
  }
}
