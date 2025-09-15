import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";

export default {
    input: "src/index.ts",
    output: [
        {
            file: "dist/index.esm.js",
            format: "esm",
            sourcemap: true
        },
        {
            file: "dist/index.cjs.js",
            format: "cjs",
            sourcemap: true,
            exports: "auto"
        }
    ],
    external: ["react", "react-dom"],
    plugins: [
        resolve(),
        commonjs(),
        typescript({ tsconfig: "./tsconfig.json" })
    ]
};