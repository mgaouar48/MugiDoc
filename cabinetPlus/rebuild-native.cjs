const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Reconstruction des modules natifs pour Electron...');

// Version figée dans package.json — évite qu'une réinstallation sans version
// explicite ne remonte vers une version plus récente sans binaire précompilé
// disponible pour Electron (forçant une compilation locale qui peut échouer
// si les outils de compilation C++ ne sont pas installés).
const pkg = require('./package.json');
const range = pkg.dependencies['better-sqlite3'];
const pinnedVersion = range.replace(/^[\^~]/, '');

try {
  // Supprimer le dossier node_modules/better-sqlite3/build
  const buildPath = path.join(__dirname, 'node_modules', 'better-sqlite3', 'build');
  console.log('🗑️ Suppression du dossier build existant...');

  try {
    execSync(`rmdir /s /q "${buildPath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log('ℹ️ Dossier build non trouvé, continuons...');
  }

  // Réinstaller better-sqlite3 à la version figée dans package.json
  console.log(`📦 Réinstallation de better-sqlite3@${pinnedVersion}...`);
  execSync('npm uninstall better-sqlite3', { stdio: 'inherit' });
  execSync(`npm install better-sqlite3@${pinnedVersion}`, { stdio: 'inherit' });

  // Reconstruire pour Electron
  console.log('🔨 Reconstruction pour Electron...');
  execSync('npx electron-rebuild -f -w better-sqlite3', { stdio: 'inherit' });

  console.log('✅ Reconstruction terminée avec succès!');
} catch (error) {
  console.error('❌ Erreur lors de la reconstruction:', error.message);
  console.log('\n💡 Solutions alternatives:');
  console.log('1. Essayez: npm run electron:rebuild');
  console.log('2. Ou supprimez node_modules et relancez npm install');
  process.exit(1);
}
