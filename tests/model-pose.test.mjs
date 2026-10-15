import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_MODEL_YAW} from '../dist/model-pose.mjs';
test('default is side view',()=>assert.equal(DEFAULT_MODEL_YAW,Math.PI/2));
