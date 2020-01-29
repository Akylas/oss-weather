const nsWebpack = require('nativescript-dev-webpack');
const { resolve } = require('path');
const projectRoot = resolve('./')
const platform = process.argv[2]
const dist = resolve(projectRoot, nsWebpack.getAppPath(platform, projectRoot));
console.log(dist);