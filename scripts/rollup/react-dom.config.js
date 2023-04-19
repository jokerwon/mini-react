import { defineConfig } from 'rollup';
import alias from '@rollup/plugin-alias';
import generatePkgJson from 'rollup-plugin-generate-package-json';
import { getBaseRollupPlugins, getPackageJSON, resolvePkgPath } from './utils';

const { name, module, peerDependencies } = getPackageJSON('react-dom');
// react-dom 包路径
const pkgPath = resolvePkgPath(name);
// react-dom 产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default defineConfig([
  // react-dom
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: 'reactDOM',
        format: 'umd'
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: 'client',
        format: 'umd'
      }
    ],
    // 避免将 react 等代码打包进来
    external: [...Object.keys(peerDependencies)],
    plugins: [
      ...getBaseRollupPlugins(),
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`
        }
      }),
      generatePkgJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({ name, description, version }) => ({
          name,
          description,
          version,
          peerDependencies: {
            react: version
          },
          main: 'index.js'
        })
      })
    ]
  },
  // react-test-utils
  {
    input: `${pkgPath}/test-utils.ts`,
    output: [
      {
        file: `${pkgDistPath}/test-utils.js`,
        name: 'test-utils',
        format: 'umd'
      }
    ],
    // 避免将 react 等代码打包进来
    external: ['react-dom', 'react'],
    plugins: getBaseRollupPlugins()
  }
]);
