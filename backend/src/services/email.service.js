// backend/src/services/email.service.js
import nodemailer from 'nodemailer';

// Bộ nhớ lưu trữ mã OTP trong RAM với TTL 5 phút
const otpStore = new Map();

// Cấu hình transporter (tương thích cả SMTP riêng hoặc Gmail App Password)
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || process.env.GMAIL_PASS;

  if (user && pass) {
    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  return null;
};

export const emailService = {
  /**
   * Tạo và gửi mã OTP 6 số về Gmail
   * @param {string} email - Địa chỉ email người nhận
   * @param {'PARENT_REGISTER' | 'TUTOR_APPLY' | 'RESET_PASSWORD'} type - Loại xác thực
   */
  async sendOtp(email, type = 'PARENT_REGISTER') {
    if (!email || !email.includes('@')) {
      throw { status: 400, message: 'Địa chỉ email không hợp lệ' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Sinh mã ngẫu nhiên 6 chữ số
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    otpStore.set(cleanEmail, {
      code: otp,
      expiresAt,
      verified: false,
      type,
    });

    const titleMap = {
      PARENT_REGISTER: 'Mã xác nhận đăng ký tài khoản Phụ huynh - VietTutor',
      TUTOR_APPLY: 'Mã xác thực đăng ký Gia sư Tinh Hoa - VietTutor',
      RESET_PASSWORD: 'Mã xác thực đổi mật khẩu tài khoản - VietTutor',
    };

    const subject = titleMap[type] || 'Mã xác thực tài khoản VietTutor';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800;">Viet<span style="color: #047857;">Tutor</span></h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Nền Tảng Giáo Dục & Gia Sư Tinh Hoa</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <p style="color: #166534; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Xin chào quý phụ huynh / thầy cô gia sư,</p>
          <p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.6;">
            Bạn đang thực hiện thao tác xác thực tài khoản tại <strong>VietTutor</strong>. Vui lòng nhập mã bảo mật dưới đây để hoàn tất:
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #065f46; background-color: #ecfdf5; border: 2px dashed #059669; padding: 14px 28px; border-radius: 12px;">
            ${otp}
          </div>
          <p style="color: #dc2626; font-size: 12px; margin-top: 10px; font-weight: 600;">
            ⏱ Mã có hiệu lực trong vòng 5 phút (300 giây).
          </p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          ⚠️ <em>Lưu ý: Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</em>
        </p>

        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
          VietTutor EdTech System © ${new Date().getFullYear()} · Hotline: 1900 8866
        </div>
      </div>
    `;

    // Thử gửi mail thực tế nếu transporter có cấu hình
    const transporter = createTransporter();
    let sentViaSmtp = false;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"VietTutor EdTech" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
          to: cleanEmail,
          subject,
          html: htmlContent,
        });
        sentViaSmtp = true;
        console.log(`✅ [GMAIL SMTP] Đã gửi mã OTP đến ${cleanEmail} thành công.`);
      } catch (mailErr) {
        console.warn(`⚠️ [GMAIL SMTP ERROR]: ${mailErr.message}. Chuyển sang console fallback.`);
      }
    }

    // In thông báo ra console máy chủ để dev/test luôn có thể xem ngay
    console.log('================================================================');
    console.log(`📬 [GMAIL OTP] Gửi mã xác thực về Gmail: ${cleanEmail}`);
    console.log(`🔑 MÃ XÁC THỰC (OTP): >>> ${otp} <<< (Hiệu lực: 5 phút)`);
    console.log(`📡 Kênh gửi: ${sentViaSmtp ? 'Gmail/SMTP Transporter' : 'Console Local Development'}`);
    console.log('================================================================');

    const response = {
      success: true,
      message: `Mã xác nhận 6 số đã được gửi về Gmail "${cleanEmail}". Vui lòng kiểm tra hộp thư!`,
      sentViaSmtp,
    };
    if (process.env.NODE_ENV === 'development') {
      response.debugOtp = otp;
    }
    return response;
  },

  /**
   * Kiểm tra tính hợp lệ của mã OTP
   * @param {string} email 
   * @param {string} code 
   */
  async verifyOtp(email, code) {
    if (!email || !code) {
      throw { status: 400, message: 'Vui lòng cung cấp email và mã xác nhận' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    const record = otpStore.get(cleanEmail);

    if (!record) {
      throw { status: 400, message: 'Chưa có mã xác nhận nào được gửi đến email này hoặc mã đã hết hạn. Vui lòng bấm gửi lại.' };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      throw { status: 400, message: 'Mã xác nhận đã hết hạn hiệu lực (quá 5 phút). Vui lòng yêu cầu mã mới.' };
    }

    if (record.code !== cleanCode) {
      throw { status: 400, message: 'Mã xác nhận không chính xác. Vui lòng kiểm tra lại Gmail.' };
    }

    // Đánh dấu đã xác thực thành công
    record.verified = true;
    otpStore.set(cleanEmail, record);

    return {
      success: true,
      message: 'Xác thực Gmail thành công!',
    };
  },

  /**
   * Kiểm tra xem email này đã được xác thực OTP hay chưa
   * @param {string} email 
   */
  isEmailVerified(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);
    return Boolean(record && record.verified && Date.now() <= record.expiresAt + 10 * 60 * 1000);
  },
};
