import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SourceMap } from "node:module";
import { parse, transform } from "@astrojs/compiler-rs";
import ts from "typescript";
import { test } from "node:test";

const componentPath = "src/components/SiteFooter.astro";

function visitAstro(node, callback) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) visitAstro(child, callback);
    } else if (value && typeof value === "object") {
      visitAstro(value, callback);
    }
  }
}

function visitJavaScript(node, callback) {
  callback(node);
  ts.forEachChild(node, (child) => visitJavaScript(child, callback));
}

function findGeneratedAnd(sourceFile, operatorKind) {
  const matches = [];
  visitJavaScript(sourceFile, (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === operatorKind &&
      ts.isIdentifier(node.left) &&
      node.left.text === "releaseVersion"
    ) {
      matches.push(node);
    }
  });
  assert.equal(matches.length, 1);
  return matches[0];
}

function sourcePosition(source, offset) {
  const before = source.slice(0, offset);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines.at(-1).length };
}

function generatedPosition(source, offset) {
  const position = sourcePosition(source, offset);
  return { line: position.line - 1, column: position.column };
}

function evaluateExpression(expression, releaseVersion) {
  const renderCalls = [];
  const branchOutcomes = [];
  const render = (strings, ...values) => {
    renderCalls.push({ strings: [...strings], values });
    return String.raw(strings, ...values);
  };
  const probeAnd = (branchId, left, evaluateRight) => {
    const taken = Boolean(left);
    branchOutcomes.push({ branchId, outcome: taken ? "taken" : "not-taken" });
    return taken ? evaluateRight() : left;
  };
  const result = new Function(
    "__probeAnd",
    "releaseVersion",
    "$$render",
    `return (${expression});`
  )(probeAnd, releaseVersion, render);
  return { result, renderCalls, branchOutcomes };
}

test("compiler-mapped SiteFooter probe detects operator mutation and preserves outcomes and captured $$render calls", async () => {
  const source = await readFile(new URL(`../${componentPath}`, import.meta.url), "utf8");
  const astroAst = parse(source).ast;
  const astroExpressions = [];
  visitAstro(astroAst, (node) => {
    if (
      node.type === "LogicalExpression" &&
      node.operator === "&&" &&
      node.left?.name === "releaseVersion"
    ) {
      astroExpressions.push(node);
    }
  });
  assert.equal(astroExpressions.length, 1);
  const astroExpression = astroExpressions[0];
  const originalPosition = sourcePosition(source, astroExpression.start);

  const compiled = transform(source, {
    filename: componentPath,
    normalizedFilename: `/${componentPath}`,
    sourcemap: "both",
  });
  const generatedFile = ts.createSourceFile(
    `${componentPath}.js`,
    compiled.code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
  const generatedAnd = findGeneratedAnd(generatedFile, ts.SyntaxKind.AmpersandAmpersandToken);
  const sourceMap = new SourceMap(JSON.parse(compiled.map));
  const startMapping = sourceMap.findEntry(
    ...Object.values(generatedPosition(compiled.code, generatedAnd.getStart(generatedFile)))
  );
  const rightMapping = sourceMap.findEntry(
    ...Object.values(generatedPosition(compiled.code, generatedAnd.right.getStart(generatedFile)))
  );
  for (const mapping of [startMapping, rightMapping]) {
    assert.equal(mapping.originalSource, componentPath);
    assert.equal(mapping.originalLine + 1, originalPosition.line);
    assert.equal(mapping.originalColumn, originalPosition.column);
  }

  const branchId = `${componentPath}:${originalPosition.line}:${originalPosition.column}:&&`;
  const left = compiled.code.slice(
    generatedAnd.left.getStart(generatedFile),
    generatedAnd.left.getEnd()
  );
  const right = compiled.code.slice(
    generatedAnd.right.getStart(generatedFile),
    generatedAnd.right.getEnd()
  );
  const instrumentedExpression = `__probeAnd(${JSON.stringify(branchId)}, ${left}, () => (${right}))`;
  const originalExpression = compiled.code.slice(
    generatedAnd.getStart(generatedFile),
    generatedAnd.getEnd()
  );

  for (const releaseVersion of [undefined, null, ""]) {
    const original = evaluateExpression(originalExpression, releaseVersion);
    const instrumented = evaluateExpression(instrumentedExpression, releaseVersion);
    assert.equal(instrumented.result, original.result);
    assert.deepEqual(instrumented.renderCalls, original.renderCalls);
    assert.equal(instrumented.renderCalls.length, 0);
    assert.deepEqual(instrumented.branchOutcomes, [{ branchId, outcome: "not-taken" }]);
  }

  const originalTaken = evaluateExpression(originalExpression, "1.2.3");
  const instrumentedTaken = evaluateExpression(instrumentedExpression, "1.2.3");
  assert.equal(instrumentedTaken.result, originalTaken.result);
  assert.deepEqual(instrumentedTaken.renderCalls, originalTaken.renderCalls);
  assert.match(instrumentedTaken.result, /Release v1\.2\.3/);
  assert.equal(instrumentedTaken.renderCalls.length, 1);
  assert.deepEqual(instrumentedTaken.branchOutcomes, [{ branchId, outcome: "taken" }]);

  const mutatedCode =
    compiled.code.slice(0, generatedAnd.operatorToken.getStart(generatedFile)) +
    "||" +
    compiled.code.slice(generatedAnd.operatorToken.getEnd());
  const mutatedFile = ts.createSourceFile(
    `${componentPath}.mutated.js`,
    mutatedCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
  const mutatedOr = findGeneratedAnd(mutatedFile, ts.SyntaxKind.BarBarToken);
  const mutatedExpression = mutatedCode.slice(mutatedOr.getStart(mutatedFile), mutatedOr.getEnd());
  assert.notEqual(evaluateExpression(mutatedExpression, undefined).result, undefined);
  assert.notEqual(evaluateExpression(mutatedExpression, "1.2.3").result, originalTaken.result);
});
