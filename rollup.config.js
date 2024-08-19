import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";

export default {
  input: "src/server.ts",
  output: {
    file: "dist/main/server.js",
    format: "es",
  },
  plugins: [
    typescript(),
    resolve(), // Разрешение модулей из node_modules
    commonjs(), // Преобразование CommonJS модулей в ES6
    json(), // Поддержка импорта JSON файлов
    terser(), // Минификация кода
    copy({
      targets: [
        {
          src: "node_modules/node-datachannel/build/Release/node_datachannel.node",
          dest: "dist/build/Release",
        },
      ],
    }),
  ],
};
