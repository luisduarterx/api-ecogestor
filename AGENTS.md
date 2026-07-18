# AGENTS.md — EcoGestor

## Objetivo

Este repositório contém o backend do EcoGestor, um sistema de gestão
para empresas de compra e venda de materiais recicláveis.

## Tecnologias

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- Vitest
- Supertest

## Regras obrigatórias

1. Não alterar o schema Prisma sem explicar a necessidade.
2. Não gerar migration automaticamente sem autorização.
3. Não remover validações existentes.
4. Não modificar contratos de resposta sem atualizar testes.
5. Operações financeiras e de estoque relacionadas devem ser atômicas.
6. Usar prisma.$transaction quando uma operação modificar múltiplas entidades.
7. Não usar `any`.
8. Não ocultar erros com catch genérico.
9. Erros de negócio devem utilizar as classes de erro existentes.
10. Toda nova funcionalidade deve possuir testes.
11. Antes de concluir uma tarefa, executar:
    - lint;
    - typecheck;
    - testes relacionados;
    - suíte completa, quando possível.

## Regras financeiras

- Valores monetários são armazenados com Prisma Decimal.
- Ao fechar o caixa, se houver diferença, deve ser criado uma movimentacao de correção de caixa com motivo obrigatório.
- Somente um caixa pode estar aberto por vez.
- Um caixa so pode ser aberto com uma conta padrao definida
- Não pode haver movimentacoes na conta padrão sem um caixa aberto.
- Movimentacoes que alterarem a conta padrão, são atreladas ao caixa aberto no momento.
- Nunca usar operações imprecisas de ponto flutuante para cálculos monetários.
- Transferências devem gerar movimentação de saída e entrada.
- Estornos devem gerar movimentos inversos e preservar histórico.
- Não apagar movimentações financeiras para representar um estorno.
- Respostas de endpoint que são relacionados a valor monetario e peso devem ser retornados em tipo numérico
- Não haverá baixa parcial e nem uso do saldo do Registro na V1.

## Regras de pedidos

- Pedido em rascunho não movimenta estoque nem financeiro.
- Pedido só pode ser aberto com um caixa aberto e deve ser vinculado a ele.
- Pedido pode ser aberto sem definir um Registro.
- Pedido ao ser reaberto, as movimentacoes(financeiras,estoque) referentes a ele devem ser estornadas mantendo a rastreabilidade.
- A tabela de precos do registro informado deve ser utilizada, na falta de uma tabela, utilizar a tabela padrao.
- O fechamento deve validar itens e pagamentos.
- A soma dos pagamentos deve corresponder ao total do pedido.
- Cancelamentos e estornos devem preservar rastreabilidade.
- Pedido nasce em rascunho sem registro, vinculado obrigatoriamente ao caixa aberto.
- Registro é obrigatorio no fechamento.
- Cada pedido gera um ou mais lancamentos integrais.
- Cada lancamento pode ser baixado imediatamente ou permanecer aberto.
- O caixa não pode ser fechado enquanto possuir pedido aberto.
- Pedido cancelado deve permanecer armazenado para preservar histórico.
- Cancelamento é permitido somente para pedido aberto e com seu caixa ainda aberto.
- Reabertura é permitida somente para pedido fechado e com seu caixa ainda aberto.
- Pedido vinculado a caixa fechado não pode ser cancelado nem reaberto.
- Peso bruto, tara, percentual de impureza e preço são informados pelo usuário.
- A quantidade do item é o peso após tara e desconto percentual da impureza.
- O backend valida o preço informado, mas não escolhe nem recalcula o preço do item.
- Ao finalizar, todos os lançamentos devem ser vinculados ao caixa do pedido, mesmo quando permanecerem abertos.
- Pode conter mais de um mesmo material por pedido.

## Regras de Estoque

- Conversão terá quantidades distintas de origem e destino.
- Estoque negativo será permitido temporariamente.
- Reabertura de pedido ou cancelamento de conversão preservará historico por movimentos inversos.
- Entradas/Saidas Avulsas são permitidas com motivo obrigatório.

## Forma de trabalho

- Fazer alterações pequenas e focadas.
- Não refatorar arquivos não relacionados à tarefa.
- Informar todos os arquivos modificados.
- Explicar decisões importantes.
- Não implementar regras de negócio por suposição.
- Quando uma regra não estiver clara, registrar a dúvida no relatório da tarefa.

## Antes de implementar:

- Analise os arquivos existentes.
- Descreva o comportamento atual.
- Liste os problemas encontrados.
- Apresente um plano curto.
