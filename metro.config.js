const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Ensure JSX files are properly resolved
config.resolver.sourceExts = ['jsx', 'js', 'json', 'ts', 'tsx', 'cjs'];

module.exports = config;

