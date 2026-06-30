export interface Pessoa {
  nome: string;
  tabelaID?: number;
  apelido?: string;
  email?: string;
  telefone?: string;
  pagamento?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    cpf?: string;
    pix?: string;
  };
  endereco?: {
    cep?: string;
    estado?: string;
    cidade?: string;
    bairro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
  };
}

export interface PessoaFisica extends Pessoa {
  tipo: "FISICA";
  cpf: string;
  nascimento?: Date;
}

export interface PessoaJuridica extends Pessoa {
  tipo: "JURIDICA";
  cnpj: string;
  ie?: string;
}
export interface RegistroUpdateInput {
  nome?: string;
  tabelaID?: number;
  apelido?: string;
  email?: string;
  telefone?: string;
  pagamento?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    cpf?: string;
    pix?: string;
  };
  endereco?: {
    cep?: string;
    estado?: string;
    cidade?: string;
    bairro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
  };
  fisica?: {
    cpf?: string;
  };
  juridica?: {
    cnpj?: string;
    ie?: string;
  };
}
export type RegistroCreateInput = PessoaFisica | PessoaJuridica;
