import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseArgs } from "node:util";
import { buscar, conectar, espelharInstalacao, exigirLogin, ficha, lerConfig, salvarConfig } from "./biblioteca";
import { iniciarServidorMcp } from "./mcp";
import { abrir, backupAgora, importar, definirPastaBackup, lerAjustes, restaurarBackup } from "./modo-local";
import { incluir, instalar, previaInclusao, previaInstalacao, previaRemocao, remover } from "./operacoes";
import { garantirPasta, listarInstalados, listarLixeira, registrarInstalado, restaurarDaLixeira, type Escopo } from "./registro";

const AJUDA = `MindMapper Local: instala no Claude Code os itens aprovados da sua biblioteca.

Modo local (a plataforma inteira neste computador):
  mm abrir [--celular] [--porta 3000]        abre o MindMapper no navegador
                                             --celular libera o acesso pelo iPhone na mesma rede Wi-Fi
  mm importar <biblioteca.json>              importa prompts de um arquivo (entram "em revisão")
  mm backup-pasta <pasta>                    onde guardar os backups (ex.: uma pasta do Google Drive)
  mm backup                                  faz um backup agora (com o MindMapper fechado)
  mm restaurar-backup <arquivo.tar.gz>       volta a um backup (o banco atual é guardado, não apagado)

Biblioteca em outro endereço:
  mm configurar <endereço> <chave pública>   liga este computador à sua biblioteca
  mm entrar [e-mail]                         entra com o seu login (senha pedida aqui)
  mm sair
  mm buscar <o que você quer fazer>          busca itens compatíveis com Claude
  mm ver <nome>                              mostra a ficha
  mm instalar <nome> [--projeto]             instala (mostra o plano e pede confirmação)
  mm remover <nome> [--projeto]              remove o que o MindMapper instalou (vai para a lixeira)
  mm instalados                              lista o que o MindMapper instalou
  mm lixeira                                 lista o que foi removido
  mm restaurar <id>                          devolve um item da lixeira ao lugar
  mm incluir <pasta-da-skill | comando.md>   envia para a biblioteca como rascunho (só admin)
  mm mcp                                     inicia o servidor MCP (para o Claude Code)

Opções:
  --projeto     instala só na pasta atual (.claude/ do projeto) em vez de para o usuário
  --simular     mostra o plano e não altera nada
  --sim         não pergunta antes de executar (o plano continua sendo mostrado)

Para usar dentro do Claude Code:
  claude mcp add --scope user mindmapper -- mm mcp`;

// Um único leitor para a sessão inteira: com entrada redirecionada, um leitor novo por
// pergunta perderia as linhas que o anterior já leu.
let leitor: ReturnType<typeof createInterface> | undefined;
let linhas: AsyncIterator<string> | undefined;

async function perguntar(pergunta: string, oculta = false): Promise<string> {
  leitor ??= createInterface({ input: stdin, output: stdout, terminal: !!stdin.isTTY });
  if (!stdin.isTTY) {
    // Entrada redirecionada: lê da fila de linhas, que não perde as que chegaram antes.
    linhas ??= leitor[Symbol.asyncIterator]();
    stdout.write(pergunta);
    const r = await linhas.next();
    stdout.write("\n");
    if (r.done) throw new Error("A entrada terminou antes da resposta.");
    return String(r.value).trim();
  }
  const rl = leitor as unknown as { _writeToOutput: (s: string) => void };
  const escrever = rl._writeToOutput;
  if (oculta) {
    // Não ecoa a senha: escreve só o rótulo e descarta o resto da saída enquanto se digita.
    rl._writeToOutput = (s: string) => {
      if (s.startsWith(pergunta)) escrever.call(rl, pergunta);
    };
  }
  try {
    const r = await leitor.question(pergunta);
    if (oculta) stdout.write("\n");
    return r.trim();
  } finally {
    rl._writeToOutput = escrever;
  }
}

async function confirmar(pergunta: string, opcoes: { sim?: boolean }) {
  if (opcoes.sim) return true;
  if (!stdin.isTTY) throw new Error("Sem terminal para confirmar. Rode de novo com --sim se tiver certeza.");
  const r = (await perguntar(`${pergunta} [s/N] `)).toLowerCase();
  return r === "s" || r === "sim";
}

function lista(titulo: string, itens: string[]) {
  console.log(`\n${titulo}`);
  for (const i of itens) console.log(`  • ${i}`);
}

async function principal() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      projeto: { type: "boolean", default: false },
      simular: { type: "boolean", default: false },
      sim: { type: "boolean", default: false },
      ajuda: { type: "boolean", short: "h", default: false },
      celular: { type: "boolean", default: false },
      porta: { type: "string", default: "3000" },
      "sem-navegador": { type: "boolean", default: false },
    },
  });
  const [comando, ...resto] = positionals;
  const escopo: Escopo = values.projeto ? "project" : "user";
  const opcoes = { escopo, projeto: process.cwd() };

  if (!comando || values.ajuda || comando === "ajuda") {
    console.log(AJUDA);
    return;
  }
  if (comando !== "mcp") await garantirPasta();

  switch (comando) {
    case "abrir": {
      const porta = Number(values.porta);
      if (!Number.isInteger(porta) || porta < 1024 || porta > 65535) throw new Error("Porta inválida.");
      await abrir({ porta, celular: values.celular, navegador: !values["sem-navegador"], perguntar });
      return;
    }
    case "backup-pasta": {
      const pasta = resto.join(" ");
      if (!pasta) {
        const { pastaBackup } = await lerAjustes();
        console.log(pastaBackup ? `Backups em: ${pastaBackup}` : "Nenhuma pasta escolhida. Uso: mm backup-pasta <pasta>");
        return;
      }
      await definirPastaBackup(pasta);
      console.log(`Backups serão gravados em: ${pasta}`);
      return;
    }
    case "importar": {
      const arquivo = resto.join(" ");
      if (!arquivo) throw new Error("Uso: mm importar <biblioteca.json> [--simular]");
      await importar(arquivo, values.simular);
      return;
    }
    case "backup": {
      console.log(`Backup gravado: ${await backupAgora()}`);
      return;
    }
    case "restaurar-backup": {
      const arquivo = resto.join(" ");
      if (!arquivo) throw new Error("Uso: mm restaurar-backup <arquivo.tar.gz>");
      if (!(await confirmar(`Restaurar ${arquivo}? O banco atual será guardado numa pasta ao lado.`, values))) {
        console.log("Cancelado. Nada foi alterado.");
        return;
      }
      const r = await restaurarBackup(arquivo);
      console.log(`Restaurado: ${r.itens} itens.${r.guardado ? ` O banco anterior ficou em ${r.guardado}` : ""}`);
      return;
    }
    case "configurar": {
      const [url, chave] = resto;
      if (!url || !chave) throw new Error("Uso: mm configurar <endereço> <chave pública>");
      await salvarConfig({ url, chave });
      console.log("Configurado. Agora rode: mm entrar");
      return;
    }
    case "entrar": {
      if (!(await lerConfig())) throw new Error("Configure antes: mm configurar <endereço> <chave pública>");
      const email = resto[0] ?? (await perguntar("E-mail: "));
      const senha = await perguntar("Senha: ", true);
      const sb = await conectar();
      const { error } = await sb.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error("E-mail ou senha incorretos, ou acesso revogado.");
      const u = await exigirLogin(sb);
      console.log(`Conectado como ${u.nome || u.email}${u.admin ? " (administrador)" : ""}.`);
      return;
    }
    case "sair": {
      const sb = await conectar();
      await sb.auth.signOut({ scope: "local" });
      console.log("Desconectado deste computador.");
      return;
    }
    case "buscar": {
      const q = resto.join(" ");
      if (!q) throw new Error("Diga o que você quer fazer. Ex.: mm buscar transformar planilha em gráfico");
      const achados = await buscar(await conectar(), q);
      if (!achados.length) {
        console.log("Nada encontrado. Tente descrever o que quer fazer com outras palavras.");
        return;
      }
      for (const a of achados) {
        console.log(`\n${a.titulo}  [${a.tipo}]${a.instalavel ? "  instalável" : ""}`);
        if (a.resumo) console.log(`  ${a.resumo}`);
        console.log(`  mm ${a.instalavel ? "instalar" : "ver"} ${a.slug}`);
      }
      return;
    }
    case "ver": {
      const r = await ficha(await conectar(), resto[0] ?? "");
      console.log(`\n${r.titulo}  [${r.resource_types?.nome ?? ""}]`);
      if (r.descricao?.resumo) console.log(`\n${r.descricao.resumo}`);
      if (r.descricao?.o_que_faz) lista("O que faz", [r.descricao.o_que_faz]);
      if (r.descricao?.para_que_serve) lista("Para que serve", [r.descricao.para_que_serve]);
      const cmds = (r.resource_commands ?? []).map(
        (c) => `${c.comando}  (${c.platform_environments?.nome ?? ""}, ${c.verificacao.replace(/_/g, " ")})`,
      );
      if (cmds.length) lista("Comandos", cmds);
      if (r.link_oficial) lista("Link oficial", [r.link_oficial]);
      const pacote = (r.install_packages ?? []).some((p) => p.aprovado_em);
      console.log(pacote ? `\nPara instalar: mm instalar ${r.slug}` : "\nSem pacote aprovado: instalação manual, veja o link oficial.");
      return;
    }
    case "instalar": {
      const nome = resto[0];
      if (!nome) throw new Error("Uso: mm instalar <nome>");
      const sb = await conectar();
      const variaveis: Record<string, string> = {};
      let previa = await previaInstalacao(sb, nome, opcoes);
      const m = previa.pacote.manifesto;
      if (m.tipo === "mcp" && m.variaveis.length && !values.simular) {
        console.log("Este MCP Server precisa de valores que ficam só neste computador:");
        for (const v of m.variaveis) variaveis[v] = await perguntar(`${v}: `, true);
        previa = await previaInstalacao(sb, nome, { ...opcoes, variaveis });
      }
      lista(`Plano para "${previa.pacote.titulo}" (pacote v${previa.pacote.versao}, escopo ${escopo === "user" ? "usuário" : "projeto"}):`, previa.mudancas);
      const execs = previa.plano.acoes.flatMap((a) => (a.tipo === "claude" ? [a.exibicao] : []));
      if (execs.length) lista("Comandos que serão executados:", execs);
      if (previa.jaInstalado) console.log("\nAtenção: já consta como instalado por aqui.");
      if (previa.plano.conflitos.length) {
        lista("Não dá para instalar:", previa.plano.conflitos.map((c) => `já existe ${c}`));
        process.exitCode = 1;
        return;
      }
      if (values.simular) {
        console.log("\nSimulação: nada foi alterado.");
        return;
      }
      if (!(await confirmar("\nInstalar?", values))) {
        console.log("Cancelado. Nada foi alterado.");
        return;
      }
      await instalar(sb, previa, { ...opcoes, variaveis, interativo: true });
      console.log(`\nInstalado: ${previa.pacote.titulo}. Reinicie o Claude Code se ele estiver aberto.`);
      return;
    }
    case "remover": {
      const nome = resto[0];
      if (!nome) throw new Error("Uso: mm remover <nome>");
      const previa = await previaRemocao(nome, opcoes);
      lista(`Remover "${previa.item.titulo}":`, previa.mudancas);
      if (values.simular) {
        console.log("\nSimulação: nada foi alterado.");
        return;
      }
      if (!(await confirmar("\nRemover?", values))) {
        console.log("Cancelado. Nada foi alterado.");
        return;
      }
      const sb = await conectar().catch(() => null);
      const lixo = await remover(sb, previa, { interativo: true });
      console.log(`\nRemovido.${lixo ? ` Para desfazer: mm restaurar ${lixo.id}` : ""}`);
      return;
    }
    case "instalados": {
      const itens = await listarInstalados();
      if (!itens.length) return console.log("Nada instalado pelo MindMapper ainda.");
      for (const i of itens) {
        console.log(`${i.slug}  ${i.titulo}  [${i.manifesto.tipo}, ${i.escopo === "user" ? "usuário" : `projeto ${i.projeto}`}]  v${i.versao}`);
      }
      return;
    }
    case "lixeira": {
      const itens = await listarLixeira();
      if (!itens.length) return console.log("A lixeira do MindMapper está vazia.");
      for (const i of itens) console.log(`${i.id}  ${i.registro.titulo}`);
      console.log("\nPara restaurar: mm restaurar <id>");
      return;
    }
    case "restaurar": {
      const item = (await listarLixeira()).find((i) => i.id === resto[0]);
      if (!item) throw new Error("Item não encontrado. Veja os ids com: mm lixeira");
      await restaurarDaLixeira(item);
      await registrarInstalado(item.registro);
      const r = item.registro;
      const sb = await conectar().catch(() => null);
      if (sb) {
        await espelharInstalacao(sb, { resourceId: r.resourceId, pacoteId: r.pacoteId, escopo: r.escopo, caminho: r.caminhos[0], status: "instalado" });
      }
      console.log(`Restaurado: ${item.registro.titulo}.`);
      return;
    }
    case "incluir": {
      const p = await previaInclusao(resto[0] ?? "");
      const arquivos = p.manifesto.tipo === "skill" ? Object.keys(p.manifesto.arquivos) : [`${p.slug}.md`];
      lista(`Incluir ${p.tipo} "${p.titulo}" na biblioteca como rascunho:`, arquivos);
      if (values.simular) return console.log("\nSimulação: nada foi enviado.");
      if (!(await confirmar("\nEnviar?", values))) return console.log("Cancelado.");
      const r = await incluir(await conectar(), p);
      console.log(`\nIncluído como rascunho: ${r.slug}${r.existia ? " (o nome já existia; ganhou um sufixo)" : ""}. Revise e aprove na web.`);
      return;
    }
    case "mcp":
      await iniciarServidorMcp();
      return;
    default:
      throw new Error(`Comando desconhecido: ${comando}. Veja: mm ajuda`);
  }
}

principal()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  })
  .finally(() => leitor?.close());
