import * as bcrypt from 'bcryptjs';
import { DatabaseService } from './DatabaseService';
import { User, CreateUserRequest, UpdateUserRequest, UserRole } from '../../shared/types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeCredentialsRequest {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
}

export class AuthService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Hache un mot de passe avec bcrypt
   */
  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  /**
   * Ancien hachage SHA-256 (non salé), conservé uniquement pour vérifier
   * les mots de passe créés avant la migration vers bcrypt
   */
  private legacyHashPassword(password: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Vérifie un mot de passe contre un hash existant, qu'il soit au format
   * bcrypt (nouveau) ou SHA-256 (ancien, avant migration)
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    if (storedHash.startsWith('$2')) {
      return bcrypt.compareSync(password, storedHash);
    }
    return this.legacyHashPassword(password) === storedHash;
  }

  /**
   * Authentifie un utilisateur
   */
  public authenticateUser(loginData: LoginRequest): User | null {
    const db = this.dbService.getDatabase();

    if (!loginData.username || !loginData.password) {
      throw new Error('Nom d\'utilisateur et mot de passe requis');
    }

    const row = db.prepare(`
      SELECT id, username, first_name, last_name, email, phone, speciality, license_number, role, is_active, must_change_password, created_at, updated_at, password_hash
      FROM users
      WHERE username = ?
    `).get(loginData.username) as (User & { password_hash: string }) | undefined;

    if (!row || !this.verifyPassword(loginData.password, row.password_hash)) {
      return null;
    }

    // Migration transparente de l'ancien hachage SHA-256 vers bcrypt
    if (!row.password_hash.startsWith('$2')) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .run(this.hashPassword(loginData.password), row.id);
    }

    const { password_hash, ...user } = row;

    if (!user.is_active) {
      throw new Error('Ce compte a été désactivé par l\'administrateur');
    }

    return user;
  }

  /**
   * Récupère un utilisateur par son ID
   */
  public getUserById(id: number): User | null {
    const db = this.dbService.getDatabase();
    
    const user = db.prepare(`
      SELECT id, username, first_name, last_name, email, phone, speciality, license_number, role, is_active, must_change_password, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id) as User | undefined;

    return user || null;
  }

  /**
   * Récupère un utilisateur par son nom d'utilisateur
   */
  public getUserByUsername(username: string): User | null {
    const db = this.dbService.getDatabase();
    
    const user = db.prepare(`
      SELECT id, username, first_name, last_name, email, phone, speciality, license_number, role, is_active, must_change_password, created_at, updated_at
      FROM users
      WHERE username = ?
    `).get(username) as User | undefined;

    return user || null;
  }

  /**
   * Récupère tous les utilisateurs
   */
  public getAllUsers(): User[] {
    const db = this.dbService.getDatabase();
    return db.prepare(`
      SELECT id, username, first_name, last_name, email, phone, speciality, license_number, role, is_active, created_at, updated_at
      FROM users 
      ORDER BY id ASC
    `).all() as User[];
  }

  /**
   * Crée un nouvel utilisateur (Admin)
   */
  public createUser(userData: CreateUserRequest): User {
    const db = this.dbService.getDatabase();

    if (!userData.username || !userData.password || !userData.first_name || !userData.last_name || !userData.role) {
      throw new Error('Tous les champs requis doivent être remplis');
    }

    if (userData.username.length < 3) {
      throw new Error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }

    if (userData.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Vérifier l'unicité
    const existing = this.getUserByUsername(userData.username);
    if (existing) {
      throw new Error('Ce nom d\'utilisateur existe déjà');
    }

    const hashedPassword = this.hashPassword(userData.password);

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, first_name, last_name, email, phone, speciality, license_number, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      userData.username.trim(),
      hashedPassword,
      userData.first_name.trim(),
      userData.last_name.trim(),
      userData.email ? userData.email.trim() : null,
      userData.phone ? userData.phone.trim() : null,
      userData.speciality ? userData.speciality.trim() : null,
      userData.license_number ? userData.license_number.trim() : null,
      userData.role
    );

    const newUser = this.getUserById(result.lastInsertRowid as number);
    if (!newUser) throw new Error('Erreur lors de la création de l\'utilisateur');
    return newUser;
  }

  /**
   * Activer / Désactiver un utilisateur
   */
  public toggleUserActive(userId: number): void {
    const db = this.dbService.getDatabase();
    const user = this.getUserById(userId);
    if (!user) throw new Error('Utilisateur introuvable');

    const stmt = db.prepare(`
      UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(user.is_active ? 0 : 1, userId);
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur par l'admin
   */
  public resetPassword(userId: number, newPassword: string): void {
    const db = this.dbService.getDatabase();
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    const hashedPassword = this.hashPassword(newPassword);
    const stmt = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    const result = stmt.run(hashedPassword, userId);
    if (result.changes === 0) {
      throw new Error('Utilisateur introuvable');
    }
  }

  /**
   * Supprimer un utilisateur
   */
  public deleteUser(userId: number): void {
    const db = this.dbService.getDatabase();
    const user = this.getUserById(userId);
    if (!user) throw new Error('Utilisateur introuvable');

    // Vérifier si c'est le dernier médecin
    if (user.role === 'doctor') {
      const doctorCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "doctor" AND is_active = 1').get() as { count: number };
      if (doctorCount.count <= 1) {
        throw new Error('Impossible de supprimer le dernier médecin actif');
      }
    }

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
  }

  /**
   * Change le mot de passe d'un utilisateur (propre compte)
   */
  public changePassword(userId: number, passwordData: ChangePasswordRequest): void {
    const db = this.dbService.getDatabase();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      throw new Error('Mot de passe actuel et nouveau mot de passe requis');
    }

    if (passwordData.newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }

    // Vérifier le mot de passe actuel
    const currentUser = db.prepare('SELECT id, password_hash FROM users WHERE id = ?')
      .get(userId) as { id: number; password_hash: string } | undefined;

    if (!currentUser || !this.verifyPassword(passwordData.currentPassword, currentUser.password_hash)) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Mettre à jour avec le nouveau mot de passe
    const newHashedPassword = this.hashPassword(passwordData.newPassword);
    const stmt = db.prepare(`
      UPDATE users
      SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(newHashedPassword, userId);

    if (result.changes === 0) {
      throw new Error('Impossible de mettre à jour le mot de passe');
    }
  }

  /**
   * Change les identifiants de connexion (nom d'utilisateur et/ou mot de passe)
   */
  public changeCredentials(userId: number, credentialsData: ChangeCredentialsRequest): void {
    const db = this.dbService.getDatabase();

    if (!credentialsData.currentPassword) {
      throw new Error('Mot de passe actuel requis');
    }

    if (!credentialsData.newUsername && !credentialsData.newPassword) {
      throw new Error('Nouveau nom d\'utilisateur ou nouveau mot de passe requis');
    }

    // Vérifier le mot de passe actuel
    const currentUser = db.prepare('SELECT id, username, password_hash FROM users WHERE id = ?')
      .get(userId) as { id: number; username: string; password_hash: string } | undefined;

    if (!currentUser || !this.verifyPassword(credentialsData.currentPassword, currentUser.password_hash)) {
      throw new Error('Mot de passe actuel incorrect');
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Changer le nom d'utilisateur si fourni
    if (credentialsData.newUsername) {
      if (credentialsData.newUsername.length < 3) {
        throw new Error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      }

      const existingUser = this.getUserByUsername(credentialsData.newUsername);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Ce nom d\'utilisateur est déjà utilisé');
      }

      updates.push('username = ?');
      values.push(credentialsData.newUsername);
    }

    // Changer le mot de passe si fourni
    if (credentialsData.newPassword) {
      if (credentialsData.newPassword.length < 8) {
        throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      }

      const newHashedPassword = this.hashPassword(credentialsData.newPassword);
      updates.push('password_hash = ?');
      values.push(newHashedPassword);
      updates.push('must_change_password = 0');
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    const result = stmt.run(...values);

    if (result.changes === 0) {
      throw new Error('Impossible de mettre à jour les identifiants');
    }
  }

  /**
   * Met à jour les informations d'un utilisateur
   */
  public updateUser(userId: number, userData: UpdateUserRequest): User {
    const db = this.dbService.getDatabase();
    
    const existingUser = this.getUserById(userId);
    if (!existingUser) {
      throw new Error('Utilisateur introuvable');
    }

    if (userData.username && userData.username !== existingUser.username) {
      const existingUsername = this.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error('Ce nom d\'utilisateur est déjà utilisé');
      }
    }

    if (userData.email && !this.isValidEmail(userData.email)) {
      throw new Error('Format d\'email invalide');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (userData.username !== undefined) {
      updates.push('username = ?');
      values.push(userData.username.trim());
    }
    if (userData.first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(userData.first_name.trim());
    }
    if (userData.last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(userData.last_name.trim());
    }
    if (userData.email !== undefined) {
      updates.push('email = ?');
      values.push(userData.email.trim() || null);
    }
    if (userData.phone !== undefined) {
      updates.push('phone = ?');
      values.push(userData.phone.trim() || null);
    }
    if (userData.speciality !== undefined) {
      updates.push('speciality = ?');
      values.push(userData.speciality.trim() || null);
    }
    if (userData.license_number !== undefined) {
      updates.push('license_number = ?');
      values.push(userData.license_number.trim() || null);
    }
    if (userData.role !== undefined) {
      updates.push('role = ?');
      values.push(userData.role);
    }
    if (userData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(userData.is_active ? 1 : 0);
    }

    if (userData.password) {
      if (userData.password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }
      updates.push('password_hash = ?');
      values.push(this.hashPassword(userData.password));
    }

    if (updates.length === 0) {
      return existingUser;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      throw new Error('Impossible de mettre à jour l\'utilisateur');
    }

    const updatedUser = this.getUserById(userId);
    if (!updatedUser) {
      throw new Error('Erreur lors de la récupération de l\'utilisateur mis à jour');
    }

    return updatedUser;
  }

  /**
   * Initialise le compte médecin par défaut
   */
  public initializeDefaultAdmin(): void {
    const db = this.dbService.getDatabase();

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0) {
      const hashedPassword = this.hashPassword('admin');
      const stmt = db.prepare(`
        INSERT INTO users (username, password_hash, first_name, last_name, email, speciality, role, is_active, must_change_password)
        VALUES (?, ?, ?, ?, ?, ?, 'doctor', 1, 1)
      `);
      stmt.run('admin', hashedPassword, 'Dr.', 'Médecin', 'medecin@cabinet.fr', 'Médecine générale');
    }

    // Migration automatique : remplacer tout ancien rôle 'admin' par 'doctor'
    db.exec("UPDATE users SET role = 'doctor' WHERE role = 'admin' OR role IS NULL");
  }

  /**
   * Valide un format d'email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
