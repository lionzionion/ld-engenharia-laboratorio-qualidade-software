# BDD | Qualidade de Software, Aula 05 | Cenários do laboratório, NÃO da emissão real.
# Os cenários equivalentes são automatizados com node:test em tests/bdd.test.mjs.
# Este .feature é especificação legível; não usa runner Cucumber por padrão.
# language: pt
Funcionalidade: Pré-notas fictícias da LD Engenharia
  Como pessoa desenvolvedora da Pós-Tech
  Quero registrar documentos simulados para clientes fictícios
  Para avaliar regras de negócio e testes sem emitir nota fiscal real

  Cenário: Registrar pré-nota fictícia para cliente cadastrado
    Dado que existe um cliente fictício cadastrado
    Quando registro uma pré-nota com duas visitas de R$ 500,00
    Então a pré-nota deve ser criada como rascunho
    E seu valor total deve ser R$ 1.000,00

  Cenário: Reenviar a mesma requisição
    Dado que existe uma pré-nota cadastrada com uma chave de idempotência
    Quando envio novamente a mesma chave com o mesmo conteúdo
    Então o sistema deve devolver o mesmo documento
    E não deve criar duplicidade

  Cenário: Bloquear preço negativo
    Dado que existe um cliente fictício cadastrado
    Quando envio uma pré-nota com preço negativo
    Então a operação deve ser rejeitada
    E nenhum documento deve ser criado

  Cenário: Chaves iguais em clientes distintos
    Dado que existem dois clientes fictícios diferentes
    Quando cada cliente envia a mesma chave de idempotência
    Então cada um deve possuir seu próprio documento
