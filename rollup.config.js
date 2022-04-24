import typescript from 'rollup-plugin-ts';

const distFolder = './dist/proxytown';

export default [
	{
		input: './src/main/main.ts',
		output: {
			file: `${distFolder}/main.js`,
			format: 'iife',
			name: 'proxytownMain',
		},
		plugins: [typescript()],
	},
	{
		input: './src/worker/worker.ts',
		output: {
			file: `${distFolder}/worker.js`,
			format: 'iife',
			name: 'proxytownWorker',
		},
		plugins: [typescript()],
	},
	{
		input: './src/sw/sw.ts',
		plugins: [typescript()],
		output: {
			file: `${distFolder}/sw.js`,
			format: 'iife',
			name: 'proxytownSW',
		},
	},
];
