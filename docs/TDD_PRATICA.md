# Aula 03 — TDD (Red → Green → Refactor)

Esta é uma prática guiada. **Os testes atuais foram escritos e executados; não há evidência de que todo o projeto original seguiu TDD desde o primeiro commit.**

## Exercício: não permitir pré-notas com total acima de R$ 1 milhão

**Red:** escreva em `tests/unit.test.mjs` um teste que espera erro `LIMIT_EXCEEDED` ao tentar criar pré-nota com total de R$ 1.000.000,01. Execute `npm test` e observe a falha.

**Green:** acrescente em `src/domain.mjs` a validação mínima necessária para passar no teste. Não modifique código que não seja necessário.

**Refactor:** reorganize a validação para uma função separada, preservando o teste verde.

**Discussão:** o limite de R$ 1 milhão é **hipotético para ensino**, não é regra fiscal ou comercial real da LD Engenharia. Qual profissional da empresa aprovaria essa regra no domínio?
