# LD Engenharia — Laboratório Full Stack de Qualidade de Software

[![Node.js](https://img.shields.io/badge/Node.js-22.16%2B-346d35)](https://nodejs.org/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue)](LICENSE)
![Simulação](https://img.shields.io/badge/Dados-100%25%20Fict%C3%ADcios-orange)

> **Projeto educacional independente**, desenvolvido como estudo de caso para a Pós-Tech Full Stack Development. Não é o ERP original da LD Engenharia nem possui integrações fiscais ou conexões com a produção.

Uma aplicação web completa para criar **clientes fictícios**, registrar **pré-notas sem valor fiscal** em banco SQLite persistente e executar **testes automatizados, BDD e testes de carga HTTP**, relacionando o aprendizado às seis aulas de Qualidade de Software.

## 1. Comece por aqui: 2 comandos

Pré-requisito: **Node.js 22.16.0 ou superior** instalado (recomendado Node 24 LTS, quando disponível). Git e VS Code são recomendados, mas não obrigatórios. **Não precisa de Docker, Supabase, credenciais, cartão ou conta.**

No terminal dentro da pasta:

```bash
npm start
```

Abra no navegador:

**http://127.0.0.1:8787**

O projeto cria o banco local em `.data/ld_laboratorio.sqlite` no primeiro uso. Para testar as regras em outro terminal:

```bash
npm test
```

**Se aparecer aviso `ExperimentalWarning: SQLite`:** é esperado no Node.js 22 e não significa falha. O recurso `node:sqlite` é nativo e requer a flag `--experimental-sqlite`, já incluída nos scripts. Recomendamos reproduzir os exemplos na mesma versão do Node.

## 2. Faça a simulação pela interface

1. **Visão geral:** clique em gerar 10 clientes + 30 pré-notas, ou personalize em **Clientes fictícios**.
2. **Clientes fictícios:** cadastre uma empresa inventada. Os registros ficam gravados em SQLite no computador.
3. **Pré-notas simuladas:** selecione cliente, informe descrição, quantidade e valor. Crie uma pré-nota, recarregue a página e confira que permanece no banco.
4. **Testes de carga:** escolha **Leve**, **Normal** ou **Pico controlado**; execute e observe p95, taxa de erro e throughput. Baixe o JSON para comparar.
5. **Guia da turma:** acompanha o passo a passo dentro da aplicação.

### Visualizar uma falha proposital

- Crie uma pré-nota com `idempotencyKey = EXEMPLO-1`.
- Envie novamente exatamente os mesmos dados: o backend retorna **HTTP 200**, sem criar outro documento.
- Envie a mesma chave mudando o preço: o backend retorna **HTTP 409 — IDEMPOTENCY_CONFLICT**.
- Tente cadastrar preço negativo: operação é rejeitada. O banco preserva a integridade.

O erro **409 é esperado** nesse caso e não deve ser contabilizado como falha inesperada da infraestrutura.

## 3. Testes reproduzíveis no terminal

```bash
npm test                # 42 testes de unidade, banco, HTTP e comportamentais
npm run load            # 3 perfis independentes: 250 / 800 / 1.600 requisições
npm run load:stress     # 5.000 requisições e 100 trabalhadores virtuais
npm run seed -- --clients 100 --drafts-per-client 5
```

**Atenção:** `npm run seed` modifica apenas o banco fictício local. Já `npm run load` e `npm run load:stress` criam **bancos temporários exclusivos** e removem tudo ao finalizar. Isso impede que medições alterem registros de outro ambiente.

JMeter e k6 (opcionais):

```bash
# Terminal A: npm start
# Terminal B, se k6 estiver instalado:
k6 run load/k6-local.js
```

Para JMeter, importe `load/jmeter-local.jmx`, usando o endereço fixo **127.0.0.1:8787**. Esses roteiros são fornecidos para exercício e **não foram executados nesta entrega**; os resultados registrados foram medidos com o executor Node HTTP.

## 4. Como os dados são guardados

```text
Cliente fictício 1 ──── N pré-notas fictícias ──── N itens por pré-nota
                               │
                               └── Evento de domínio (auditoria)
```

O banco contém `clients`, `draft_invoices`, `draft_items`, `domain_events`. Há índices, chave estrangeira, checagens SQL e restrição única `(client_id, idempotency_key)`. Dinheiro é representado em **centavos inteiros**, nunca como `float` dentro do banco. As operações de criação de pré-nota usam **transação SQL**.

⚠️ **Sem autenticação multiusuário:** o laboratório fica restrito a `127.0.0.1`; a separação de documentos por cliente é associativa, mas **não é autorização nem controle de acesso a terceiros**. Não exponha este backend na internet e não use dados pessoais reais.

## 5. As seis aulas aplicadas

| Aula | Prática realizada |
|---|---|
| 01 — Conceitos | Classificação de riscos, cenários positivos e negativos |
| 02 — Unidade | Funções independentes: dinheiro, itens, validações, p95 |
| 03 — TDD | Exercício orientado Red–Green–Refactor em `docs/TDD_PRATICA.md` |
| 04 — Integração | HTTP → banco SQLite → consulta e auditoria |
| 05 — BDD | Cenários Gherkin em `docs/cenarios.feature` e equivalentes executáveis em `tests/bdd.test.mjs` |
| 06 — Carga | 10/25/50 e 100 usuários HTTP virtuais, p95/p99, taxa de erros, throughput |

**Nota:** a abordagem TDD está documentada com uma prática guiada; ela não pode ser comprovada retrospectivamente apenas pela existência de testes. O arquivo `.feature` é especificação e **não usa um executor Cucumber**, mas seus cenários são verificados pelos testes comportamentais JavaScript.

## 6. Resultados de referência

No ambiente local de execução utilizado para criar este pacote, **42/42 testes** passaram. Carga mediu quatro cenários com **7.650 documentos fictícios no total**, em **quatro bancos temporários independentes**, com **zero falhas inesperadas**. Consulte `results/exemplo-carga.json`, `results/exemplo-estresse.json` e `docs/RESULTADOS_MEDIDOS.md`.

Isso **não** demonstra capacidade do sistema LD Gestão real, do Supabase ou de qualquer serviço de NFS-e: é a linha de base do **laboratório Node + SQLite de processo único**. Os valores p99 do pico e do estresse indicaram latências de cauda relevantes, mesmo sem falhas HTTP.

## 7. Estrutura do repositório

```text
src/        domínio, repositório SQLite, servidor HTTP
public/     aplicação web (HTML, CSS e JavaScript)
tests/      unidade, banco persistente, API e BDD
load/       carga Node, scripts opcionais k6/JMeter
docs/       aulas, arquitetura, TDD, apresentação e critérios
results/    exemplos de resultados medidos com dados fictícios
scripts/    geração de massa de dados no SQLite
```

## 8. Integração futura com o LD Gestão real

Esta aplicação **não grava em Supabase**. A integração exigirá: backup, diagnóstico do schema, API autenticada, segregação por usuário/empresa, RLS, migrations revisadas e homologação em ambiente próprio. Nunca rode `npm run load` ou JMeter em produção.

### Para uso em GitHub

Nome sugerido: `ld-engenharia-laboratorio-qualidade-software`

Descrição sugerida: `Laboratório Full Stack de qualidade de software: clientes e pré-notas fictícias, Node.js + SQLite, testes unitários, TDD, BDD, integração e carga HTTP (k6/JMeter). Projeto educacional Pós-Tech FIAP.`

Autor do estudo de caso: LD Engenharia. Código disponibilizado para fins educacionais sob licença MIT. As referências às aulas FIAP identificam a inspiração pedagógica; este projeto não é material oficial da instituição.
