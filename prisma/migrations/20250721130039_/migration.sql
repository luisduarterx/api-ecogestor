-- AlterTable
CREATE SEQUENCE pessoajuridica_id_seq;
ALTER TABLE "PessoaJuridica" ALTER COLUMN "id" SET DEFAULT nextval('pessoajuridica_id_seq');
ALTER SEQUENCE pessoajuridica_id_seq OWNED BY "PessoaJuridica"."id";
