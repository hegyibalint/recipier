import assert from 'node:assert/strict';
import { test } from 'vitest';
import { renderStep } from './display.ts';
import { example } from '../../../tests/support/recipe-example.ts';

test('recipe display resolves ingredient and component names with optional quantities', () => {
  assert.equal(renderStep('Beat ${i:butter:250:g} and ${i:powdered-sugar:300:g}.', example),
    'Beat 250 g butter and 300 g powdered sugar.');
  assert.equal(renderStep('Use ${i:butter}, ${c:cake-layers:2}, then ${c:buttercream:100:ml}.', example),
    'Use butter, 2 Cake Layers, then 100 ml Buttercream.');
  assert.equal(renderStep('Add ${i:butter:1e2:g} or ${i:butter:0.5:cuillère à soupe}.', example),
    'Add 1e2 g butter or 0.5 cuillère à soupe butter.');
});

test('recipe display preserves escaped openers and ordinary backslashes', () => {
  assert.equal(renderStep('Show \\${i:butter} then add ${i:butter:10:g}.', example),
    'Show ${i:butter} then add 10 g butter.');
  assert.equal(renderStep('C:\\recipes\\notes', example), 'C:\\recipes\\notes');
  assert.equal(renderStep('Show \\${not-a-reference} and \\${unclosed.', example),
    'Show ${not-a-reference} and ${unclosed.');
});

test('recipe display uses component IDs when optional titles are absent', () => {
  const recipe = { ...example, components: [{ id: 'main', steps: [{ text: 'Cook.' }] }] };
  assert.equal(renderStep('Serve ${c:main}.', recipe), 'Serve main.');
});

test('recipe display leaves unknown or malformed references visible and never interprets HTML', () => {
  const text = '<script>alert(1)</script> ${i:missing} ${c:missing} ${x:butter} ${i:butter:0:g} ${unclosed';
  assert.equal(renderStep(text, example), text);
  const recipe = { ...example, ingredients: [{ id: 'butter', name: '<img src=x onerror=alert(1)>' }] };
  assert.equal(renderStep('${i:butter}', recipe), '<img src=x onerror=alert(1)>');
});
