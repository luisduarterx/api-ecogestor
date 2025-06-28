export class BaseError extends Error {
  public nome: string;
  public acao: string;
  public statusCode: number;
  public mensagem: string;

  constructor(nome: string, mensagem: string, acao: string, statusCode = 400) {
    super(mensagem);
    this.nome = nome;
    this.mensagem = mensagem;
    this.acao = acao;
    this.statusCode = statusCode;
  }
}

export class BadRequest extends BaseError {
  constructor(
    mensagem = "Não conseguimos validar os dados enviados, verifique os campos."
  ) {
    super(
      "Erro na Requisição",
      mensagem,
      "Verifiqe os dados enviados e tente novamente.",
      400
    );
  }
}

export class UserNotFound extends BaseError {
  constructor(mensagem = "Não foi encontrado nenhum usuario.") {
    super(
      "Usuario não Encontrado",
      mensagem,
      "Verifique os dados e tente novamente",
      404
    );
  }
}
export class UnAuthorized extends BaseError {
  constructor(mensagem = "Você não tem permissão para acessar essa página") {
    super(
      "Acesso não Autorizado",
      mensagem,
      "Verifique suas permissões ou contate um administrador",
      403
    );
  }
}
