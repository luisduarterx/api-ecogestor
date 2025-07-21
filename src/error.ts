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
export class InternalError extends BaseError {
  constructor(mensagem = "Tivemos um problema em completar sua ação") {
    super(
      "Erro Interno",
      mensagem,
      "Tente novamento, case persistir, contate um administrador",
      500
    );
  }
}
export class BadRequest extends BaseError {
  constructor(
    mensagem = "Não conseguimos validar os dados enviados, verifique os campos."
  ) {
    super(
      "Erro na Requisição",
      mensagem,
      "Verifique os dados enviados e tente novamente.",
      400
    );
  }
}
export class NotFound extends BaseError {
  constructor(mensagem = "Não foi encontrado nenhum registro") {
    super(
      "Registro não encontrado",
      mensagem,
      "Verifique os dados e tente novamente",
      404
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
export class NotPossible extends BaseError {
  constructor(
    mensagem = "Por motivos desconhecidos não conseguimos realizar essa operação"
  ) {
    super(
      "Não foi possivel realizar a operação",
      mensagem,
      "Verifique os dados enviados e tente novamente, caso persistir, contate um administrador.",
      403
    );
  }
}
