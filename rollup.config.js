import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/server.ts",
  output: {
    file: "dist/server.js",
    format: "es",
  },
  plugins: [
    typescript(),
    resolve(), // Разрешение модулей из node_modules
    commonjs(), // Преобразование CommonJS модулей в ES6
    json(), // Поддержка импорта JSON файлов
    terser(), // Минификация кода
  ],
};
