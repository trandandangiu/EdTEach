// backend/src/services/email.service.js
import nodemailer from 'nodemailer';

// Bộ nhớ lưu trữ mã OTP trong RAM với TTL 5 phút
const otpStore = new Map();

// Cấu hình transporter (hỗ trợ cả Gmail App Password và Custom SMTP)
const createTransporter = () => {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || process.env.GMAIL_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');

  if (!user || !pass) return null;

  const isGmail = host === 'smtp.gmail.com' || !host;
  return nodemailer.createTransport({
    host: isGmail ? 'smtp.gmail.com' : host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Thêm để debug
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
  });
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
    let smtpError = null;

    if (transporter) {
      try {
        const sender = process.env.SMTP_USER || process.env.GMAIL_USER;
        await transporter.sendMail({
          from: `"VietTutor EdTech" <${sender}>`,
          to: cleanEmail,
          subject,
          html: htmlContent,
        });
        sentViaSmtp = true;
        console.log(`✅ [GMAIL SMTP] Đã gửi mã OTP đến ${cleanEmail} thành công qua tài khoản: ${sender}`);
      } catch (mailErr) {
        smtpError = mailErr.message;
        console.error('❌ [GMAIL SMTP ERROR]', {
          message: mailErr.message,
          code: mailErr.code,
          command: mailErr.command,
          response: mailErr.response,
          responseCode: mailErr.responseCode,
        });
      }
    } else {
      console.warn(`⚠️ [GMAIL WARNING] Chưa cấu hình GMAIL_USER và GMAIL_APP_PASS trong backend/.env nên email chưa được gửi đến máy chủ Gmail.`);
    }

    // In thông báo ra console máy chủ để dev/test luôn có thể xem ngay
    console.log('================================================================');
    console.log(`📬 [GMAIL OTP] Gửi mã xác thực về Gmail: ${cleanEmail}`);
    console.log(`🔑 MÃ XÁC THỰC (OTP): >>> ${otp} <<< (Hiệu lực: 5 phút)`);
    console.log(`📡 Kênh gửi: ${sentViaSmtp ? 'Gmail/SMTP Transporter (Thư thật đã gửi)' : 'Console Local Development (Chế độ Test)'}`);
    if (smtpError) console.log(`⚠️ Lỗi SMTP: ${smtpError}`);
    console.log('================================================================');

    const response = {
      success: true,
      message: sentViaSmtp
        ? `Mã xác thực 6 số đã được gửi trực tiếp đến hộp thư Gmail "${cleanEmail}". Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam)!`
        : `Mã OTP đã được tạo cho "${cleanEmail}". ${smtpError ? `(Lỗi gửi mail: ${smtpError})` : '(Hệ thống đang chạy chế độ Test do chưa điền GMAIL_USER/GMAIL_APP_PASS trong .env)'}`,
      sentViaSmtp,
      debugOtp: otp, // Luôn gửi kèm debugOtp để form tự điền/hiển thị cho tester
      ...(smtpError ? { smtpError } : {}),
    };
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

  /**
   * Gửi email đề thi khảo sát chuyên môn (file Word/Excel) cho gia sư
   * @param {string} email
   * @param {string} fullName
   * @param {object} examInfo
   */
  async sendExamInvitation(email, fullName, examInfo = {}) {
    if (!email || !email.includes('@')) return { success: false, message: 'Email không hợp lệ' };

    const cleanEmail = email.trim().toLowerCase();
    const candidateName = fullName || 'Thầy/Cô Gia Sư';
    const testTitle = examInfo.testTitle || 'Bài Khảo Sát Năng Lực Chuyên Môn & Nghiệp Vụ Sư Phạm';
    const examFileType = examInfo.examFileType || 'Word (.docx) / Excel (.xlsx)';
    const examFileUrl = examInfo.examFileUrl || 'https://docs.google.com/document/d/viettutor-test-sample';
    const deadlineHours = examInfo.deadlineHours || 48;
    const notes = examInfo.notes || 'Vui lòng hoàn thành bài làm trên file và nộp lại theo hướng dẫn.';

    const subject = `[VietTutor] Thông báo đạt sơ duyệt & Gửi đề thi Khảo sát Chuyên môn: ${testTitle}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #064e3b; margin: 0; font-size: 24px; font-weight: 800;">Viet<span style="color: #047857;">Tutor</span></h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Hội Đồng Tuyển Dụng & Đào Tạo Gia Sư Tinh Hoa</p>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <p style="color: #166534; font-size: 15px; margin: 0 0 8px 0; font-weight: 700;">Kính gửi Thầy/Cô ${candidateName},</p>
          <p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.6;">
            Ban Tuyển Dụng VietTutor xin chúc mừng: Hồ sơ ứng tuyển gia sư của Thầy/Cô đã <strong>VƯỢT QUA VÒNG SƠ TUYỂN</strong>.
            Để tiếp tục quy trình thẩm định, kính mời Thầy/Cô thực hiện <strong>Bài Khảo Sát Chuyên Môn</strong>.
          </p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <h4 style="color: #0f172a; margin: 0 0 12px 0; font-size: 14px;">📋 THÔNG TIN BÀI KHẢO SÁT CHUYÊN MÔN:</h4>
          <ul style="color: #475569; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>Tên bài khảo sát:</strong> ${testTitle}</li>
            <li><strong>Định dạng đề thi:</strong> ${examFileType}</li>
            <li><strong>Thời hạn hoàn thành:</strong> Trong vòng <strong>${deadlineHours} giờ</strong> kể từ khi nhận email này.</li>
            <li><strong>Ghi chú từ Ban Tuyển Dụng:</strong> ${notes}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${examFileUrl}" target="_blank" style="display: inline-block; background-color: #065f46; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px;">
            📥 Tải Đề Bài Khảo Sát (Word / Excel) & Hướng Dẫn
          </a>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #92400e; line-height: 1.6;">
          <strong>Hướng dẫn nộp bài:</strong> Sau khi hoàn thành trên file Word hoặc Excel, Thầy/Cô vui lòng tải file bài làm lên hệ thống ứng tuyển hoặc gửi phản hồi trực tiếp qua email này để Ban Chuyên Môn kiểm tra và lên lịch phỏng vấn sư phạm.
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          VietTutor EdTech System © ${new Date().getFullYear()} · Hotline Tuyển dụng: 1900 8866 · Email: tuyendung@viettutor.vn
        </div>
      </div>
    `;

    const transporter = createTransporter();
    let sentViaSmtp = false;
    let smtpError = null;

    if (transporter) {
      try {
        const sender = process.env.SMTP_USER || process.env.GMAIL_USER;
        await transporter.sendMail({
          from: `"Ban Tuyển Dụng VietTutor" <${sender}>`,
          to: cleanEmail,
          subject,
          html: htmlContent,
        });
        sentViaSmtp = true;
        console.log(`✅ [GMAIL SMTP] Đã gửi email đề thi khảo sát chuyên môn đến ${cleanEmail} thành công.`);
      } catch (err) {
        smtpError = err.message;
        console.error(`❌ [GMAIL SMTP ERROR] Gửi đề thi thất bại: ${err.message}`);
      }
    } else {
      console.warn(`⚠️ [GMAIL WARNING] Chưa cấu hình GMAIL_USER/GMAIL_APP_PASS. In nội dung đề thi gửi ứng viên ${cleanEmail} ra console.`);
    }

    console.log('================================================================');
    console.log(`📨 [GMAIL EXAM] Đã kích hoạt bài thi chuyên môn cho: ${candidateName} (${cleanEmail})`);
    console.log(`📄 Đề thi: ${testTitle} (${examFileType})`);
    console.log(`🔗 Link đề thi: ${examFileUrl}`);
    console.log(`📡 Trạng thái gửi: ${sentViaSmtp ? 'Đã gửi qua Gmail SMTP' : 'Console Local Fallback'}`);
    console.log('================================================================');

    return {
      success: true,
      sentViaSmtp,
      smtpError,
      message: sentViaSmtp
        ? `Đã gửi email đề thi chuyên môn trực tiếp đến hòm thư ${cleanEmail}!`
        : `Đã kích hoạt thi cho ứng viên ${candidateName} (Chế độ Local Console test).`,
    };
  },
};
