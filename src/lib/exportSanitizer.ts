export type ProviderId = "openai" | "ollama_cloud" | "ollama_local";

export type ProviderSettings = {
  provider: ProviderId;
  openaiApiKey: string;
  openaiModel: string;
  ollamaCloudApiKey: string;
  ollamaCloudBaseUrl: string;
  ollamaCloudModel: string;
  ollamaLocalBaseUrl: string;
  ollamaLocalModel: string;
};

export type SafeExportedProviderSettings = {
  provider: ProviderId;
  openaiModel: string;
  ollamaCloudBaseUrl: string;
  ollamaCloudModel: string;
  ollamaLocalBaseUrl: string;
  ollamaLocalModel: string;
  credentialsRedacted: true;
};

/**
 * Strip all API keys / credentials before writing session JSON exports.
 */
export function sanitizeProviderSettingsForExport(
  settings: ProviderSettings
): SafeExportedProviderSettings {
  return {
    provider: settings.provider,
    openaiModel: settings.openaiModel,
    ollamaCloudBaseUrl: settings.ollamaCloudBaseUrl,
    ollamaCloudModel: settings.ollamaCloudModel,
    ollamaLocalBaseUrl: settings.ollamaLocalBaseUrl,
    ollamaLocalModel: settings.ollamaLocalModel,
    credentialsRedacted: true,
  };
}
