import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as crypto from 'crypto';
import { DatabaseService } from './DatabaseService';
import { AuthService } from './AuthService';

const legacyHash = (password: string): string =>
  crypto.createHash('sha256').update(password).digest('hex');

describe('AuthService', () => {
  let dbService: DatabaseService;
  let authService: AuthService;

  beforeEach(() => {
    dbService = new DatabaseService(':memory:');
    dbService.initialize();
    authService = new AuthService(dbService);
  });

  afterEach(() => {
    dbService.close();
  });

  it('creates the default admin with must_change_password=1 only when no users exist', () => {
    authService.initializeDefaultAdmin();
    const admin = authService.getUserByUsername('admin');
    expect(admin).not.toBeNull();
    expect(admin?.must_change_password).toBeTruthy();

    // Un second appel ne doit pas recréer/dupliquer l'admin
    authService.initializeDefaultAdmin();
    const allUsers = authService.getAllUsers();
    expect(allUsers.filter(u => u.username === 'admin').length).toBe(1);
  });

  it('authenticates with correct credentials and rejects incorrect ones', () => {
    authService.initializeDefaultAdmin();

    const ok = authService.authenticateUser({ username: 'admin', password: 'admin' });
    expect(ok).not.toBeNull();

    const bad = authService.authenticateUser({ username: 'admin', password: 'wrong-password' });
    expect(bad).toBeNull();
  });

  it('rejects login for a deactivated user', () => {
    authService.initializeDefaultAdmin();
    const admin = authService.getUserByUsername('admin')!;
    authService.toggleUserActive(admin.id);

    expect(() => authService.authenticateUser({ username: 'admin', password: 'admin' })).toThrow();
  });

  it('transparently migrates a legacy SHA-256 password hash to bcrypt on successful login', () => {
    const db = dbService.getDatabase();
    db.prepare(`
      INSERT INTO users (username, password_hash, first_name, last_name, role, is_active)
      VALUES (?, ?, ?, ?, 'doctor', 1)
    `).run('legacyuser', legacyHash('oldpass123'), 'Legacy', 'User');

    const before = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('legacyuser') as { password_hash: string };
    expect(before.password_hash.startsWith('$2')).toBe(false);

    const user = authService.authenticateUser({ username: 'legacyuser', password: 'oldpass123' });
    expect(user).not.toBeNull();

    const after = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('legacyuser') as { password_hash: string };
    expect(after.password_hash.startsWith('$2')).toBe(true);

    // Le mot de passe doit continuer à fonctionner après la migration transparente
    const secondLogin = authService.authenticateUser({ username: 'legacyuser', password: 'oldpass123' });
    expect(secondLogin).not.toBeNull();
  });

  it('rejects a new password shorter than 8 characters on user creation', () => {
    expect(() => authService.createUser({
      username: 'newdoc',
      password: 'short',
      first_name: 'New',
      last_name: 'Doc',
      role: 'doctor',
    })).toThrow();
  });

  it('rejects creating a user with a duplicate username', () => {
    authService.createUser({
      username: 'dupuser',
      password: 'longenoughpassword',
      first_name: 'A',
      last_name: 'B',
      role: 'secretary',
    });

    expect(() => authService.createUser({
      username: 'dupuser',
      password: 'anotherlongpassword',
      first_name: 'C',
      last_name: 'D',
      role: 'secretary',
    })).toThrow();
  });

  it('rejects changePassword when the current password is incorrect, and clears must_change_password on success', () => {
    authService.initializeDefaultAdmin();
    const admin = authService.getUserByUsername('admin')!;

    expect(() => authService.changePassword(admin.id, {
      currentPassword: 'wrong',
      newPassword: 'newlongpassword123',
    })).toThrow();

    authService.changePassword(admin.id, {
      currentPassword: 'admin',
      newPassword: 'newlongpassword123',
    });

    const updated = authService.getUserById(admin.id);
    expect(updated?.must_change_password).toBeFalsy();

    const loginWithNewPassword = authService.authenticateUser({ username: 'admin', password: 'newlongpassword123' });
    expect(loginWithNewPassword).not.toBeNull();
  });
});
