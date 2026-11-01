# Aula 06 — Testes de carga: prática com o LD LAB

## Objetivo da demonstração (10–15 minutos)

Avaliar se um sistema fictício consegue receber muitas operações simultâneas e persistir corretamente milhares de pré-notas **sem emissão fiscal**.

## Conceitos da aula

- **Carga**: desempenho com demanda típica esperada.
- **Estresse**: demanda acima da normal para entender degradacão e ponto de falha.
- **Usuários virtuais**: tarefas concorrentes que simulam operações HTTP, não pessoas reais logadas.
- **Throughput**: número de requisições concluídas por segundo.
- **Latência p95**: 95% das requisições têm tempo menor/igual ao valor medido.
- **Latência p99**: mostra parte da cauda mais lenta. Mesmo com 0 erros, uma cauda longa merece investigação.
- **Erros esperados × inesperados**: a validação 400/409 pode ser correta; 500 e requisições falhas são indícios de defeito.

## Demonstração

1. Abra dois terminais no VS Code.
2. Terminal A: `npm start` e abra a aplicação.
3. Na aba Clientes fictícios, gere 100 clientes e 5 pré-notas cada.
4. Recarregue a página e confirme persistência.
5. Teste propositalmente uma chave repetida e altere seu valor (deve retornar 409).
6. Terminal B: rode `npm test`; mostre os testes.
7. Rode `npm run load`; observe as três métricas. Depois, opcionalmente, `npm run load:stress`.
8. Abra `results/load-measured.local.json` e explique como interpretar p95, p99 e erros.
9. Não compare máquinas diferentes como se fosse benchmark oficial.

## O que a aplicação demonstra

**Positivo:** todos os documentos contam uma vez, continuam após reiniciar o servidor e pertencem ao cliente correto. **Negativo:** idempotência, dados inválidos e inexistência de cliente produzem rejeição controlada. **Carga:** muitas requisições são enviadas em paralelo a uma API real com gravação no banco SQLite.

## Limites metodológicos

- Um processo Node.js e banco SQLite local. Não representa um cluster Supabase/PostgreSQL.
- Os trabalhadores virtuais enviam requisições HTTP; não testam autenticação ou emissão legal de NFS-e.
- Os testes de carga medem somente o próprio computador e não a rede externa.
- Para medir produção, seria preciso cenário representativo, limites aprovados, observabilidade, infraestrutura equivalente e dados adequados, nunca sobrecarga improvisada no ERP.

## Desafio para colegas

1. Adicionar uma regra que bloqueie itens acima de 100 diárias (escrever teste antes da implementação).
2. Exibir no frontend a diferença entre p95 e p99.
3. Simular duas solicitações simultâneas com a mesma chave de idempotência.
4. Rodar os quatro perfis três vezes e registrar mediana e variabilidade dos tempos.
5. Discutir o que mudaria na modelagem para um Postgres multiusuário com RLS e autenticação.

## Ferramentas opcionais da aula

O material do curso cita **Apache JMeter** e **k6**. O pacote inclui exemplos nos arquivos `load/jmeter-local.jmx` e `load/k6-local.js`, sempre para o localhost. O relatório do projeto baseia-se no executor HTTP implementado em Node.js, e não em medições dessas ferramentas.
