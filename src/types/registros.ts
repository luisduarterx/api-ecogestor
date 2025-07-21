export interface Pessoa {
  nome_razao?: string;
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
  nome: string;
  cpf: string;
  nascimento?: Date;
}

export interface PessoaJuridica extends Pessoa {
  razao: string;
  cnpj: string;
  ie?: string;
}
