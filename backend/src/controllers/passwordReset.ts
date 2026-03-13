import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from '../services/email';
import crypto from 'crypto';

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists, a reset email has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send email
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const validateResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token as string,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    res.json({ valid: !!user });
  } catch (error) {
    next(error);
  }
};
