# Dúvidas frequentes e solução de problemas

**`npm start` não funciona:** rode `node --version`. O laboratório exige Node >= 22.16.0. Reinicie o VS Code após instalar Node.

**Aviso `ExperimentalWarning: SQLite`:** aviso esperado do Node 22. Os comandos já ativam o módulo necessário.

**Porta 8787 ocupada:** finalize a instância anterior com Ctrl+C. Você pode executar com `LAB_PORT=8788 npm start` em macOS/Linux, ou `$env:LAB_PORT=8788; npm start` no PowerShell.

**Os registros desapareceram:** confira se está executando na mesma pasta e se `.data/ld_laboratorio.sqlite` permanece presente. Testes `npm run load` criam bancos *temporários* separados e não modificam seu banco da interface.

**Sem Docker / sem Supabase:** ambos são dispensáveis para esta etapa.

**O JMeter não mostra os números deste relatório:** as medições de referência são do executor Node HTTP, não do JMeter. O arquivo JMX é exemplo adicional para exercício.

**O site não abre para meus colegas pela internet:** propositalmente o servidor é restrito à própria máquina. Para compartilhar, envie o repositório GitHub e cada colega roda localmente. Não exponha a API sem autenticação.

**Posso usar notas fiscais verdadeiras?** Não. Pré-notas são registros fictícios. O laboratório não emite documento fiscal nem integra com autoridade tributária.

**Como limpar os dados de demonstração?** Pare o servidor, faça backup se desejar e apague somente `.data/ld_laboratorio.sqlite` do repositório do laboratório. Não apague banco de produção.
