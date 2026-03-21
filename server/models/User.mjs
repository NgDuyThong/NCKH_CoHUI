/**
 * ES Module wrapper for User model
 * Để sử dụng trong tests với ES modules
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const User = require('./User.js');

export default User;
