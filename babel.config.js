module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      ['@babel/preset-react', {
        runtime: 'automatic'
      }]
    ],
    plugins: [
      'react-native-worklets/plugin'
    ],
    // Handle mixed module systems
    sourceType: 'unambiguous'
  };
};
