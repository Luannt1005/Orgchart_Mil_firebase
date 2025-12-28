import bcrypt from 'bcryptjs';

/**
 * Hash password using bcrypt with salt rounds = 10
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
}
