import bcrypt from 'bcrypt';

const password = 'admin123';
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Password hash:', hash);
