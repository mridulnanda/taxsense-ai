module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', '@babel/preset-typescript'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
            '@screens': './src/screens',
            '@components': './src/components',
            '@services': './src/services',
            '@stores': './src/stores',
            '@types': './src/types',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
            '@assets': './assets',
          },
        },
      ],
      [
        'react-native-svg-transformer',
        {
          svgRegex: /\.svg$/,
        },
      ],
    ],
  };
};
