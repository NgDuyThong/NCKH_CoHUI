/**
 * ES Module wrapper for Category model
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Category = require('./Category.js');

export default Category;
