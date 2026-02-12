import { Router, Request, Response } from 'express';
import { emailService } from '../services/emailService';
import { db } from '../database/unifiedDb';

const router = Router();

// Check email configuration status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConfigured = emailService.isConfigured();
    res.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'Email service is configured and ready' 
        : 'Email service is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and ADMIN_EMAILS environment variables.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check email status' });
  }
});

// Send test email
router.post('/test', async (req: Request, res: Response) => {
  try {
    const success = await emailService.sendToAdmins(
      '🧪 Тест мэдэгдэл - Remax HR',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981, #34D399); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Тест амжилттай!</h1>
          </div>
          <div style="padding: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0 0 10px 10px;">
            <p style="color: #065f46; font-size: 16px;">
              Имэйл мэдэгдэл зөв тохируулагдсан байна. Одоо та автомат мэдэгдлүүдийг хүлээн авах боломжтой.
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 15px;">
              Илгээсэн: ${new Date().toLocaleString('mn-MN')}
            </p>
          </div>
        </div>
      `
    );
    
    if (success) {
      res.json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to send test email. Check email configuration.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Trigger birthday notification check
router.post('/birthdays', async (req: Request, res: Response) => {
  try {
    const employees = await db.getEmployees();
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    // Filter employees with birthday today
    const birthdayEmployees = employees.filter(emp => {
      if (!emp.birthDate) return false;
      const birthDate = new Date(emp.birthDate);
      return birthDate.getMonth() === todayMonth && birthDate.getDate() === todayDay;
    });
    
    if (birthdayEmployees.length === 0) {
      return res.json({ success: true, message: 'No birthdays today', count: 0 });
    }
    
    const success = await emailService.notifyBirthdays(birthdayEmployees);
    res.json({
      success,
      message: success ? 'Birthday notification sent' : 'Failed to send notification',
      count: birthdayEmployees.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check birthdays' });
  }
});

// Trigger rank expiring notification check
router.post('/ranks', async (req: Request, res: Response) => {
  try {
    const ranks = await db.getAgentRanks();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get ranks expiring within 30 days or already expired
    const expiringRanks = ranks
      .filter(rank => {
        if (!rank.currentEndDate) return false;
        const endDate = new Date(rank.currentEndDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // Within 30 days or expired
      })
      .map(rank => {
        const endDate = new Date(rank.currentEndDate);
        const diffTime = endDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { rank, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
    
    if (expiringRanks.length === 0) {
      return res.json({ success: true, message: 'No expiring ranks', count: 0 });
    }
    
    const success = await emailService.notifyExpiringRanks(expiringRanks);
    res.json({
      success,
      message: success ? 'Rank expiration notification sent' : 'Failed to send notification',
      count: expiringRanks.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check expiring ranks' });
  }
});

// Trigger daily summary
router.post('/summary', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    
    // Get today's applications
    const applications = await db.getApplications();
    const newApplications = applications.filter(app => {
      if (!app.createdAt) return false;
      const createdDate = new Date(app.createdAt);
      return createdDate >= new Date(todayStart);
    }).length;
    
    // Get today's birthdays
    const employees = await db.getEmployees();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const birthdays = employees.filter(emp => {
      if (!emp.birthDate) return false;
      const birthDate = new Date(emp.birthDate);
      return birthDate.getMonth() === todayMonth && birthDate.getDate() === todayDay;
    });
    
    // Get expiring ranks (within 14 days)
    const ranks = await db.getAgentRanks();
    const expiringRanks = ranks
      .filter(rank => {
        if (!rank.currentEndDate) return false;
        const endDate = new Date(rank.currentEndDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14 && diffDays >= -7; // Within 14 days or expired up to 7 days ago
      })
      .map(rank => {
        const endDate = new Date(rank.currentEndDate);
        const diffTime = endDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { rank, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
    
    const success = await emailService.sendDailySummary({
      newApplications,
      birthdays,
      expiringRanks
    });
    
    res.json({
      success,
      data: {
        newApplications,
        birthdays: birthdays.length,
        expiringRanks: expiringRanks.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate daily summary' });
  }
});

export default router;
