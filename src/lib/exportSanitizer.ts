export type ProviderId =
  | "agy_bridge"
  | "ollama_local"
  | "azoth_local"
  | "agy_cli"
  | "hermes_cli"
  | "grok_cli"
  | "codex_cli"
  | "claude_code"
  | "openai"
  | "anthropic"
  | "gemini_api"
  | "openrouter"
  | "xai_grok"
  | "ollama_cloud"
  | "custom_openai";

export type ProviderSettings = {
  provider: ProviderId;
  // Local Daemons & CLIs
  agyBridgeBaseUrl: string;
  agyBridgeModel: string;
  ollamaLocalBaseUrl: string;
  ollamaLocalModel: string;
  azothLocalBaseUrl: string;
  agyCliModel: string;
  hermesCliModel: string;
  grokCliModel: string;
  codexCliModel: string;
  claudeCodeModel: string;
  // Cloud & Custom APIs (all *ApiKey fields strictly redacted on export)
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  geminiApiKey: string;
  geminiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  xaiApiKey: string;
  xaiModel: string;
  ollamaCloudApiKey: string;
  ollamaCloudBaseUrl: string;
  ollamaCloudModel: string;
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;
};

export type SafeExportedProviderSettings = Omit<
  ProviderSettings,
  | "openaiApiKey"
  | "anthropicApiKey"
  | "geminiApiKey"
  | "openrouterApiKey"
  | "xaiApiKey"
  | "ollamaCloudApiKey"
  | "customApiKey"
> & {
  credentialsRedacted: true;
};

/**
 * Strip EVERY API key / credential field before serializing session JSON exports.
 */
export function sanitizeProviderSettingsForExport(
  settings: ProviderSettings
): SafeExportedProviderSettings {
  return {
    provider: settings.provider,
    agyBridgeBaseUrl: settings.agyBridgeBaseUrl,
    agyBridgeModel: settings.agyBridgeModel,
    ollamaLocalBaseUrl: settings.ollamaLocalBaseUrl,
    ollamaLocalModel: settings.ollamaLocalModel,
    azothLocalBaseUrl: settings.azothLocalBaseUrl,
    agyCliModel: settings.agyCliModel,
    hermesCliModel: settings.hermesCliModel,
    grokCliModel: settings.grokCliModel,
    codexCliModel: settings.codexCliModel,
    claudeCodeModel: settings.claudeCodeModel,
    openaiModel: settings.openaiModel,
    anthropicModel: settings.anthropicModel,
    geminiModel: settings.geminiModel,
    openrouterModel: settings.openrouterModel,
    xaiModel: settings.xaiModel,
    ollamaCloudBaseUrl: settings.ollamaCloudBaseUrl,
    ollamaCloudModel: settings.ollamaCloudModel,
    customBaseUrl: settings.customBaseUrl,
    customModel: settings.customModel,
    credentialsRedacted: true,
  };
}
