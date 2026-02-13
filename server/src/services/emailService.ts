import nodemailer from 'nodemailer';
import { Employee, Application, AgentRank } from '../types';
import { database } from '../database';

// Email configuration - will use environment variables
const createTransporter = () => {
  // Check for SMTP configuration
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || 'noreply@remaxsky.mn';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

// Get admin emails from environment AND from database admin users
const getAdminEmails = async (): Promise<string[]> => {
  const emails: Set<string> = new Set();

  // 1. From environment variable
  const envEmails = process.env.ADMIN_EMAILS || '';
  if (envEmails) {
    envEmails.split(',').map((e: string) => e.trim()).filter((e: string) => e).forEach((e: string) => emails.add(e.toLowerCase()));
  }

  // 2. From database admin users
  try {
    const users = await database.getUsers();
    users
      .filter(u => u.role === 'admin' && u.isActive && u.email)
      .forEach(u => emails.add(u.email.toLowerCase()));
  } catch (error) {
    console.error('Failed to fetch admin users from DB for email notifications:', error);
  }

  if (emails.size === 0) {
    console.warn('No admin emails found (env or DB). Notifications will not be sent.');
  }

  return Array.from(emails);
};

// Email templates
const templates = {
  newApplication: (application: Application) => ({
    subject: `🆕 Шинэ анкет: ${application.firstName} ${application.lastName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Шинэ анкет ирлээ!</h1>
        </div>
        <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e293b; margin-top: 0;">${application.firstName} ${application.lastName}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Оффис:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${application.interestedOffice || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Утас:</td>
              <td style="padding: 8px 0; color: #1e293b;">${application.phone || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Имэйл:</td>
              <td style="padding: 8px 0; color: #1e293b;">${application.email || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Бүртгүүлсэн:</td>
              <td style="padding: 8px 0; color: #1e293b;">${new Date(application.createdAt).toLocaleString('mn-MN')}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
            Системд нэвтэрч дэлгэрэнгүй мэдээллийг харна уу.
          </p>
        </div>
      </div>
    `
  }),

  birthdayReminder: (employees: Employee[]) => ({
    subject: `🎂 Өнөөдрийн төрсөн өдөрүүд (${employees.length} хүн)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #EC4899, #F472B6); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎂 Төрсөн өдрийн мэдэгдэл</h1>
        </div>
        <div style="padding: 20px; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 0 0 10px 10px;">
          <p style="color: #9d174d; font-size: 16px;">Өнөөдөр ${employees.length} ажилтны төрсөн өдөр!</p>
          <ul style="list-style: none; padding: 0;">
            ${employees.map(emp => `
              <li style="padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🎉</span>
                <div>
                  <strong style="color: #1e293b;">${emp.firstName} ${emp.lastName}</strong>
                  <span style="color: #64748b; font-size: 14px; margin-left: 10px;">${emp.officeName || ''}</span>
                </div>
              </li>
            `).join('')}
          </ul>
          <p style="margin-top: 15px; color: #9d174d; font-size: 14px;">
            Баяр хүргэж мэдэгдэхээ бүү мартаарай! 🎈
          </p>
        </div>
      </div>
    `
  }),

  rankExpiring: (ranks: { rank: AgentRank; daysLeft: number }[]) => ({
    subject: `⚠️ Цолны хугацаа дуусах мэдэгдэл (${ranks.length} агент)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F59E0B, #FBBF24); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">⚠️ Цолны хугацаа дуусаж байна</h1>
        </div>
        <div style="padding: 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0 0 10px 10px;">
          <p style="color: #92400e; font-size: 16px;">Дараах агентуудын цолны хугацаа удахгүй дуусна:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #fef3c7;">
              <th style="padding: 10px; text-align: left; color: #92400e;">Агент</th>
              <th style="padding: 10px; text-align: left; color: #92400e;">Цол</th>
              <th style="padding: 10px; text-align: left; color: #92400e;">Дуусах өдөр</th>
              <th style="padding: 10px; text-align: center; color: #92400e;">Үлдсэн</th>
            </tr>
            ${ranks.map(({ rank, daysLeft }) => `
              <tr style="border-bottom: 1px solid #fde68a;">
                <td style="padding: 10px; color: #1e293b;">${rank.agentName}</td>
                <td style="padding: 10px; color: #1e293b;">${rank.currentRank}</td>
                <td style="padding: 10px; color: #1e293b;">${rank.currentEndDate}</td>
                <td style="padding: 10px; text-align: center;">
                  <span style="background: ${daysLeft <= 7 ? '#ef4444' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                    ${daysLeft <= 0 ? 'Дууссан' : `${daysLeft} өдөр`}
                  </span>
                </td>
              </tr>
            `).join('')}
          </table>
          <p style="margin-top: 15px; color: #92400e; font-size: 14px;">
            Цолын гэрээг сунгах талаар холбогч байгаа холбогдоно уу.
          </p>
        </div>
      </div>
    `
  }),

  dailySummary: (data: {
    newApplications: number;
    birthdays: Employee[];
    expiringRanks: { rank: AgentRank; daysLeft: number }[];
  }) => ({
    subject: `📊 Өдрийн тойм - ${new Date().toLocaleDateString('mn-MN')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">📊 HR Өдрийн тойм</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">${new Date().toLocaleDateString('mn-MN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 10px 10px;">
          
          ${data.newApplications > 0 ? `
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #1e40af; margin: 0 0 5px 0;">🆕 Шинэ анкетууд</h3>
              <p style="color: #1e40af; font-size: 24px; font-weight: bold; margin: 0;">${data.newApplications}</p>
            </div>
          ` : ''}
          
          ${data.birthdays.length > 0 ? `
            <div style="background: #fce7f3; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #9d174d; margin: 0 0 10px 0;">🎂 Өнөөдрийн төрсөн өдрүүд</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${data.birthdays.map(emp => `
                  <li style="color: #9d174d; padding: 5px 0;">${emp.firstName} ${emp.lastName} - ${emp.officeName || ''}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${data.expiringRanks.length > 0 ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h3 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Цол дуусаж байгаа (${data.expiringRanks.length})</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${data.expiringRanks.slice(0, 5).map(({ rank, daysLeft }) => `
                  <li style="color: #92400e; padding: 5px 0;">${rank.agentName} - ${daysLeft <= 0 ? 'Дууссан' : `${daysLeft} өдөр үлдсэн`}</li>
                `).join('')}
                ${data.expiringRanks.length > 5 ? `<li style="color: #92400e; font-style: italic;">+${data.expiringRanks.length - 5} бусад...</li>` : ''}
              </ul>
            </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            Энэ мэдэгдэл автоматаар илгээгдсэн. Дэлгэрэнгүй мэдээлэл авахыг хүсвэл HR системд нэвтэрнэ үү.
          </p>
        </div>
      </div>
    `
  })
};

// Email sending functions
export const emailService = {
  // Send email to admins
  sendToAdmins: async (subject: string, html: string): Promise<boolean> => {
    const transporter = createTransporter();
    const adminEmails = await getAdminEmails();

    if (!transporter || adminEmails.length === 0) {
      console.log('Email not sent: Service not configured');
      return false;
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@remaxsky.mn',
        to: adminEmails.join(', '),
        subject,
        html
      });
      console.log(`Email sent to ${adminEmails.length} admins: ${subject}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  },

  // Notify about new application
  notifyNewApplication: async (application: Application): Promise<boolean> => {
    const template = templates.newApplication(application);
    return emailService.sendToAdmins(template.subject, template.html);
  },

  // Send birthday reminders
  notifyBirthdays: async (employees: Employee[]): Promise<boolean> => {
    if (employees.length === 0) return false;
    const template = templates.birthdayReminder(employees);
    return emailService.sendToAdmins(template.subject, template.html);
  },

  // Send rank expiring notifications
  notifyExpiringRanks: async (ranks: { rank: AgentRank; daysLeft: number }[]): Promise<boolean> => {
    if (ranks.length === 0) return false;
    const template = templates.rankExpiring(ranks);
    return emailService.sendToAdmins(template.subject, template.html);
  },

  // Send daily summary
  sendDailySummary: async (data: {
    newApplications: number;
    birthdays: Employee[];
    expiringRanks: { rank: AgentRank; daysLeft: number }[];
  }): Promise<boolean> => {
    // Only send if there's something to report
    if (data.newApplications === 0 && data.birthdays.length === 0 && data.expiringRanks.length === 0) {
      console.log('Daily summary: Nothing to report');
      return false;
    }
    const template = templates.dailySummary(data);
    return emailService.sendToAdmins(template.subject, template.html);
  },

  // Check if email service is configured
  isConfigured: (): boolean => {
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    return !!(smtpHost && smtpUser && smtpPass);
  },

  // Get admin emails (for status endpoint)
  getAdminEmails: async (): Promise<string[]> => {
    return getAdminEmails();
  }
};
