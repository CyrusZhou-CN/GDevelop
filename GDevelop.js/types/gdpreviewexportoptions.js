// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdPreviewExportOptions {
  constructor(project: gdProject, outputPath: string): void;
  useWebsocketDebuggerClientWithServerAddress(address: string, port: string): gdPreviewExportOptions;
  useWindowMessageDebuggerClient(): gdPreviewExportOptions;
  useMinimalDebuggerClient(): gdPreviewExportOptions;
  setInAppTutorialMessageInPreview(message: string, position: string): gdPreviewExportOptions;
  setLayoutName(layoutName: string): gdPreviewExportOptions;
  setFallbackAuthor(id: string, username: string): gdPreviewExportOptions;
  setAuthenticatedPlayer(playerId: string, playerUsername: string, playerToken: string): gdPreviewExportOptions;
  setExternalLayoutName(externalLayoutName: string): gdPreviewExportOptions;
  setIncludeFileHash(includeFile: string, hash: number): gdPreviewExportOptions;
  setProjectDataOnlyExport(enable: boolean): gdPreviewExportOptions;
  setNativeMobileApp(enable: boolean): gdPreviewExportOptions;
  setFullLoadingScreen(enable: boolean): gdPreviewExportOptions;
  setIsDevelopmentEnvironment(enable: boolean): gdPreviewExportOptions;
  setIsInGameEdition(enable: boolean): gdPreviewExportOptions;
  setNonRuntimeScriptsCacheBurst(value: number): gdPreviewExportOptions;
  setElectronRemoteRequirePath(electronRemoteRequirePath: string): gdPreviewExportOptions;
  setGDevelopResourceToken(gdevelopResourceToken: string): gdPreviewExportOptions;
  setAllowAuthenticationUsingIframeForPreview(enable: boolean): gdPreviewExportOptions;
  setCrashReportUploadLevel(crashReportUploadLevel: string): gdPreviewExportOptions;
  setPreviewContext(previewContext: string): gdPreviewExportOptions;
  setGDevelopVersionWithHash(gdevelopVersionWithHash: string): gdPreviewExportOptions;
  setProjectTemplateSlug(projectTemplateSlug: string): gdPreviewExportOptions;
  setSourceGameId(sourceGameId: string): gdPreviewExportOptions;
  addScreenshotCapture(delayTimeInSeconds: number, signedUrl: string, publicUrl: string): gdPreviewExportOptions;
  delete(): void;
  ptr: number;
};