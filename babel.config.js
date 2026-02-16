module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@/i18n': './src/i18n/index',
            '@/hooks': './hooks',
            '@/src': './src',
            '@/app': './app',
            '@/firebaseConfig': './firebaseConfig',
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
