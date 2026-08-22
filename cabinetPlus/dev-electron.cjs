#!/usr/bin/env node

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🚀 Démarrage de MediMemo Cabinet Desktop...\n');

// Fonction pour exécuter une commande
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

// Fonction pour vérifier si les fichiers existent
function checkFiles() {
  const files = [
    'dist/main/main.cjs',
    'dist/preload/preload.cjs',
    'dist/renderer/index.html'
  ];

  return files.every(file => {
    const exists = existsSync(file);
    if (!exists) {
      console.log(`❌ Fichier manquant: ${file}`);
    }
    return exists;
  });
}

async function main() {
  try {
    // 1. Build du processus principal
    console.log('📦 Compilation du processus principal...');
    await runCommand('npm', ['run', 'build:main']);
    console.log('✅ Processus principal compilé\n');

    // 2. Build du preload
    console.log('📦 Compilation du preload...');
    await runCommand('npm', ['run', 'build:preload']);
    console.log('✅ Preload compilé\n');

    // 3. Build du renderer
    console.log('📦 Compilation du renderer...');
    await runCommand('npm', ['run', 'build:renderer']);
    console.log('✅ Renderer compilé\n');

    // 4. Vérifier que tous les fichiers sont présents
    if (!checkFiles()) {
      throw new Error('Certains fichiers sont manquants après la compilation');
    }

    // 5. Lancer Electron
    console.log('🖥️  Lancement d\'Electron...\n');
    await runCommand('npx', ['electron', '.']);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
