# Plano de qualidade — requisitos, riscos e aceitação

| Código | Cenário | Resultado esperado | Camada |
|---|---|---|---|
| RN-01 | Cliente válido | Cadastro único | Banco/HTTP |
| RN-02 | Cliente inexistente | 404, sem pré-nota | Banco/HTTP |
| RN-03 | Rascunho válido | 201, valor coerente | Unitário/HTTP |
| RN-04 | Preço negativo | 400, sem alterações | Unitário/BDD |
| RN-05 | Mesmo cliente + chave + corpo | 200, mesmo ID, sem duplicar | Banco/HTTP/BDD |
| RN-06 | Mesma chave + corpo diferente | 409, sem duplicar | Banco/HTTP |
| RN-07 | Clientes diferentes, mesma chave | Documentos diferentes | Banco/BDD |
| RN-08 | Reinício do servidor | Dados persistentes | Banco |
| RN-09 | 1.000 documentos no banco | Sem perda de FK/itens | Banco |
| RN-10 | 100 usuários virtuais, 5.000 pré-notas | Sem HTTP 5xx; total consistente | Carga |

## Critérios didáticos de aceitação

- Testes automatizados: 100% passando nas regras cobertas.
- Carga local: 0 erros **inesperados**; total de documentos = total de respostas novas `201`.
- p95 local: meta de laboratório 500 ms (não SLA real).
- Sempre conferir p99 e não só p95.
- Nenhum dado pessoal, fiscal ou credencial de produção dentro dos testes.
- Nunca executar testes de carga em APIs fiscais externas ou produção sem governança e autorização explícita.

## Aspectos não cobertos

Autenticação real, segregação por tenant em backend remoto, políticas RLS Supabase, múltiplas instâncias Node, comunicação com prefeitura, NFS-e jurídica, disponibilidade global, backup de nuvem, qualidade fiscal e pagamentos reais.
