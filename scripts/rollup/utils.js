import path from 'path';
import fs from 'fs';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';

// 子包的路径
const packagesPath = path.resolve(__dirname, '../../packages');
// 产物路径
const distPath = path.resolve(__dirname, '../../dist/node_modules');

/**
 * 解析指定包的路径
 * @example react => /xxx/packages/react
 * @param {string} pkgName 包名
 * @param {boolean} isDist 是否寻找产物包的路径
 * @returns
 */
export function resolvePkgPath(pkgName, isDist) {
  if (isDist) {
    return `${distPath}/${pkgName}`;
  }
  return `${packagesPath}/${pkgName}`;
}

/**
 * 解析 package.json
 * @param {string} pkgName 包名
 * @returns package.json 对象
 */
export function getPackageJSON(pkgName) {
  // 指定包的 package.json 路径
  const pkgJSONPath = `${resolvePkgPath(pkgName)}/package.json`;
  return JSON.parse(fs.readFileSync(pkgJSONPath, 'utf-8'));
}

export function getBaseRollupPlugins({ typescriptOpts = {} } = {}) {
  return [commonjs(), typescript(typescriptOpts)];
}
