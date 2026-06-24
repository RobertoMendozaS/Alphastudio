const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for Windows OneDrive Reparse Point issues with Metro:
// Disabling symlinks prevents Metro from calling fs.readlink() on OneDrive files
// which causes a fatal EINVAL crash in the dependency graph.
config.resolver.unstable_enableSymlinks = false;

module.exports = config;
