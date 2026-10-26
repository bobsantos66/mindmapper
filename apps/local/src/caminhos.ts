import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Pastas usadas pelo MindMapper Local. As variáveis de ambiente existem para os testes
 * rodarem numa pasta temporária, sem tocar no Claude Code de verdade.
 */
export function pastaMindMapper() {
  return process.env.MM_HOME ?? join(homedir(), ".mindmapper");
}

export function pastaClaude() {
  return process.env.MM_CLAUDE_HOME ?? join(homedir(), ".claude");
}

/** Pasta .claude do projeto, para o escopo "project". */
export function pastaClaudeProjeto(cwd = process.cwd()) {
  return join(cwd, ".claude");
}

export const arquivoConfig = () => join(pastaMindMapper(), "config.json");
export const arquivoInstalados = () => join(pastaMindMapper(), "instalados.json");
export const pastaLixeira = () => join(pastaMindMapper(), "lixeira");
