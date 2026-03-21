const nodemailer = require('nodemailer');

// Cấu hình transporter cho nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email
    pass: process.env.EMAIL_PASSWORD // Mật khẩu ứng dụng (App Password)
  }
});

// Template email đẹp hơn với HTML và CSS inline
const getEmailTemplate = (email) => {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Chào mừng bạn đến với IconDenim</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://res.cloudinary.com/dm8a7wa1j/image/upload/v1761228354/logo_kwt0kt.png" alt="IconDenim Logo" style="max-width: 150px;">
                <h1 style="color: #333; margin: 20px 0 10px;">Chào Mừng Đến Với IconDenim! 🎉</h1>
              </div>

              <!-- Main Content -->
              <div style="margin-bottom: 30px;">
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Xin chào quý khách,
                </p>
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Cảm ơn bạn đã đăng ký nhận thông tin từ IconDenim. Chúng tôi rất vui mừng được chào đón bạn tham gia cùng cộng đồng thời trang của chúng tôi!
                </p>

                <!-- Benefits Box -->
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Đặc quyền dành cho bạn:</h3>
                  <ul style="color: #666; padding-left: 20px; margin: 10px 0;">
                    <li style="margin-bottom: 10px;">Giảm 10% cho đơn hàng đầu tiên</li>
                    <li style="margin-bottom: 10px;">Thông tin sớm nhất về sản phẩm mới</li>
                    <li style="margin-bottom: 10px;">Ưu đãi độc quyền cho thành viên</li>
                    <li style="margin-bottom: 10px;">Mã giảm giá hấp dẫn hàng tháng</li>
                  </ul>
                </div>

                <!-- Coupon Code -->
                <div style="text-align: center; background: #ff4444; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px;">Mã Giảm Giá Chào Mừng</h3>
                  <div style="background: white; color: #ff4444; padding: 10px; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">
                    WELCOME2025
                  </div>
                  <p style="margin: 10px 0 0; font-size: 14px;">Giảm 10% cho đơn hàng đầu tiên</p>
                </div>

                <!-- Contact Info -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <h3 style="color: #333; margin-bottom: 15px;">Liên Hệ Với Chúng Tôi</h3>
                  <p style="color: #666; line-height: 1.6; margin: 5px 0;">
                    📞 Hotline: 1900 xxxx<br>
                    📧 Email: support@kttstore.com<br>
                    🌐 Website: www.kttstore.com<br>
                    📍 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM
                  </p>
                </div>

                <!-- Social Media -->
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #666; margin-bottom: 10px;">Theo dõi chúng tôi tại:</p>
                  <a href="#" style="text-decoration: none; margin: 0 10px;">Facebook</a>
                  <a href="#" style="text-decoration: none; margin: 0 10px;">Instagram</a>
                  <a href="#" style="text-decoration: none; margin: 0 10px;">TikTok</a>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">
                  Email đăng ký của bạn: ${email}<br>
                  Ngày đăng ký: ${currentDate}
                </p>
                <p style="color: #999; font-size: 12px;">
                  © 2025 IconDenim. All rights reserved.<br>
                  Nếu bạn không muốn nhận email từ chúng tôi, vui lòng <a href="#" style="color: #666;">nhấn vào đây</a>
                </p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const SubscriptionController = {
  // Đăng ký nhận tin
  subscribe: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is required' 
        });
      }

      // Gửi email xác nhận
      const mailOptions = {
        from: {
          name: 'IconDenim',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: '🎉 Chào mừng bạn đến với IconDenim!',
        html: getEmailTemplate(email)
      };

      await transporter.sendMail(mailOptions);

      // Lưu email vào database nếu cần
      // await Subscription.create({ email });

      res.status(200).json({
        success: true,
        message: 'Subscription successful'
      });

    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = SubscriptionController; 