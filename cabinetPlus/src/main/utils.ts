import { app } from 'electron';

/**
 * Détermine si l'application est en mode développement
 */
export const isDev = !app.isPackaged;

/**
 * Obtient le chemin vers les ressources de l'application
 */
export const getResourcesPath = (): string => {
  if (isDev) {
    return process.cwd();
  }
  return process.resourcesPath;
};

/**
 * Obtient le chemin vers les assets
 */
export const getAssetsPath = (...paths: string[]): string => {
  const RESOURCES_PATH = getResourcesPath();
  return isDev
    ? require('path').join(RESOURCES_PATH, 'assets', ...paths)
    : require('path').join(RESOURCES_PATH, 'assets', ...paths);
};
