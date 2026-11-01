# Resultados medidos — ambiente local isolado

Executado em 01/11/2026 com **Node 22.16.0 + SQLite nativo** e requisições HTTP locais.
As execuções usam **quatro bancos SQLite temporários independentes**, que são removidos após cada cenário.
Não houve conexão a APIs fiscais, ao sistema empresarial original ou ao Supabase.

## Sumário

- **42/42** testes automatizados passaram (`npm test`).
- **7.650** pré-notas fictícias criadas em conjunto nos quatro cenários (cada perfil começa com banco vazio).
- **0** erros HTTP inesperados nos cenários medidos.

## Carga e estresse

| Cenário | Clientes | Usuários virtuais | Pré-notas | Erros | p95 | p99 | Throughput |
|---|---:|---:|---:|---:|---:|---:|---:|
| leve | 25 | 10 | 250 | 0 | 19.25 ms | 44.24 ms | 654.29 req/s |
| normal | 80 | 25 | 800 | 0 | 43.43 ms | 175.31 ms | 740.3 req/s |
| pico | 150 | 50 | 1,600 | 0 | 73.29 ms | 571.15 ms | 803.52 req/s |
| estresse-controlado | 100 | 100 | 5,000 | 0 | 103.4 ms | 1873.53 ms | 754.63 req/s |

## Observação técnica

Embora todas as requisições tenham sido concluídas, o **p99 subiu bastante** nos cenários pico e estresse. Isso indica uma cauda de latência que merece análise em máquinas e condições variadas; não é prova de indisponibilidade nem garantia de desempenho futuro.

Os dados são uma referência **local**, não um benchmark oficial do LD Gestão real. Para testar produção ou banco remoto, é necessário montar homologação autenticada e isolada com métricas reais e governança.

## Reprodutibilidade

```bash
npm test
npm run load
npm run load:stress
```

Resultados originais em `results/exemplo-carga.json` e `results/exemplo-estresse.json`. Ao repetir os comandos, novos resultados são gerados em arquivos `.local.json`, ignorados pelo Git.
