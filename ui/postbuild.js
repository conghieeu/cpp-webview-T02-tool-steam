#!/usr/bin/env node
import fs from "fs";
import path from "path";

if (process.argv.length !== 4) {
  console.error("Usage: node generateHtmlHeader.js <input.html> <output.h>");
  process.exit(1);
}

const inputPath = path.resolve(process.argv[2]);
const outputPath = path.resolve(process.argv[3]);

if (!fs.existsSync(inputPath)) {
  console.error(`Input file does not exist: ${inputPath}`);
  process.exit(1);
}

let html = fs.readFileSync(inputPath, "utf-8");

// MSVC limits narrow string literals to ~16380 bytes.
// Split into chunks and let the compiler concatenate adjacent literals.
const delim = "INDEX_HTML";
const maxChunk = 16000;
const chunks = [];
for (let i = 0; i < html.length; i += maxChunk) {
  chunks.push(html.slice(i, i + maxChunk));
}

const rawStr = chunks
  .map((c) => `R"${delim}(\n${c}\n)${delim}"`)
  .join("\n");

const header = `#pragma once
// Auto-generated from ${path.basename(inputPath)}
// Do not edit manually.

constexpr const char INDEX_HTML[] = ${rawStr};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, header);

console.log(`Generated header: ${outputPath}`);
