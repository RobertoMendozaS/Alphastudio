const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for Windows OneDrive Reparse Point issues with Metro:
// Disabling symlinks prevents Metro from calling fs.readlink() on OneDrive files
// which causes a fatal EINVAL crash in the dependency graph.
config.resolver.unstable_enableSymlinks = false;

// Ignore backup/locked node_modules folders that cause readlink errors
config.resolver.blockList = [
  /node_modules_locked_.*/,
  /node_modules_old_.*/,
];

module.exports = config;
