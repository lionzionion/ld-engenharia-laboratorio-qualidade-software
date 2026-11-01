# Roteiro para apresentar aos colegas (4–6 minutos)

## Introdução (30 s)
"Pessoal, eu usei um cenário da minha empresa de engenharia para montar um laboratório de qualidade de software. A ideia é gerar clientes e pré-notas fictícias e ver como a API e o banco se comportam com muitos registros. Não conecta com meu sistema real, então dá para qualquer um reproduzir no VS Code."

## Demonstração (2 min)
1. Abrir o painel e gerar 10 clientes e 30 documentos.
2. Mostrar a tabela de pré-notas e os valores.
3. Atualizar o navegador para comprovar persistência do SQLite.
4. Criar um documento com chave própria, repetir e mostrar que não duplicou.

## Qualidade e testes (2 min)
1. No terminal rodar `npm test`, explicar o que cada camada valida.
2. Rodar `npm run load` e mostrar os resultados de p95, p99 e taxa de erro.
3. Destacar que o teste de carga é da API local; não é prova de escala do LD Gestão real.

## Convite (30 s)
"Deixei tudo no GitHub para vocês clonarem, alterarem as regras e testarem. Não precisa de banco pago nem de login. O desafio que sugiro é incluir uma nova regra seguindo o ciclo Red–Green–Refactor e comparar os resultados do teste de carga na máquina de vocês."
