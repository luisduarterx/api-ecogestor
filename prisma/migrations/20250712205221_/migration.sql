-- AlterTable
CREATE SEQUENCE pessoafisica_id_seq;
ALTER TABLE "PessoaFisica" ALTER COLUMN "id" SET DEFAULT nextval('pessoafisica_id_seq');
ALTER SEQUENCE pessoafisica_id_seq OWNED BY "PessoaFisica"."id";
