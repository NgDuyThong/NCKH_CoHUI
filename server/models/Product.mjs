/**
 * ES Module wrapper for Product model
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Product = require('./Product.js');

export default Product;
