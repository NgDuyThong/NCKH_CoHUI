/**
 * ES Module wrapper for Order model
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const Order = require('./Order.js');

export default Order;
