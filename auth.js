const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple in-memory user storage (replace with database in production)
const users = [
  {
    id: 1,
    email: 'user@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Demo User'
  }
];

class AuthService {
  // Hash password
  static async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Find user by email
  static findUserByEmail(email) {
    return users.find(user => user.email === email);
  }

  // Find user by ID
  static findUserById(id) {
    return users.find(user => user.id === id);
  }

  // Register new user
  static async register(userData) {
    const { email, password, name } = userData;
    
    if (this.findUserByEmail(email)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name
    };

    users.push(newUser);
    return newUser;
  }

  // Login user
  static async login(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    return user;
  }
}

module.exports = AuthService;