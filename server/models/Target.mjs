/**
 * ES Module wrapper for Target model
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Target = require('./Target.js');

export default Target;
