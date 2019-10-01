module.exports = {
  "comments": false,
  "env": {
    "main": {
      "presets": [
        ["@babel/preset-env", {
          "targets": { "node": 12 }
        }]
      ]
    },
    "renderer": {
      "presets": [
        ["@babel/preset-env", {
          "modules": false
        }]
      ]
    },
    "reporters": {
      "presets": [
        ["@babel/preset-env", {
          "modules": false
        }]
      ],
      "plugins": ["@babel/plugin-transform-modules-commonjs"]
    },
    "test": {
      "presets": [
        ["@babel/preset-env", {
          "modules": false
        }]
      ],
      "plugins": ["@babel/plugin-transform-modules-commonjs"]
    }
  },
  "plugins": ["lodash", "@babel/plugin-transform-runtime"]
}
