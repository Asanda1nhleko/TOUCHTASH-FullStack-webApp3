const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    // For Gmail
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    
    // For general SMTP (works with any email)
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send booking confirmation email
async function sendBookingConfirmation(booking, user, barber, service) {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"touchTash Barber" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '✅ Booking Confirmation - touchTash Barber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333;">
                        <h1 style="color: #c9a84c;">touch<span style="color: #fff;">Tash</span></h1>
                        <p style="color: #aaa;">Your appointment is confirmed!</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="color: #c9a84c;">Hello ${user.full_name},</h3>
                        <p>Your booking has been confirmed. Here are the details:</p>
                        
                        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Service:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${service.service_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Barber:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${barber.barber_name}</td>
                            </tr>
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Date:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${booking.booking_date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Time:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${booking.booking_time}</td>
                            </tr>
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Price:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">R${service.price}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Status:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;"><span style="color: #28a745;">${booking.status}</span></td>
                            </tr>
                        </table>
                        
                        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                        
                        <hr style="border-color: #333; margin: 20px 0;">
                        
                        <p style="color: #aaa; font-size: 12px;">Need to cancel or reschedule? Log into your dashboard to manage your bookings.</p>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="http://localhost:5500/dashboard.html" style="background: #c9a84c; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View My Bookings</a>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px;">
                        <p>123 Barber Street, Durban | +27 123 456 789 | hello@touchtash.co.za</p>
                        <p>&copy; 2025 touchTash. All rights reserved.</p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to: ${user.email}`);
        return true;
        
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

// Send cancellation email
async function sendCancellationEmail(booking, user, barber, service) {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"touchTash Barber" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '❌ Booking Cancelled - touchTash Barber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333;">
                        <h1 style="color: #c9a84c;">touch<span style="color: #fff;">Tash</span></h1>
                        <p style="color: #aaa;">Your appointment has been cancelled</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="color: #c9a84c;">Hello ${user.full_name},</h3>
                        <p>Your booking has been cancelled as requested.</p>
                        
                        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Service:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${service.service_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Barber:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${barber.barber_name}</td>
                            </tr>
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Date:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${booking.booking_date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Time:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${booking.booking_time}</td>
                            </tr>
                        </table>
                        
                        <p><strong>Status:</strong> <span style="color: #dc3545;">Cancelled</span></p>
                        
                        <hr style="border-color: #333; margin: 20px 0;">
                        
                        <p>We hope to see you again soon! <a href="http://localhost:5500/booking.html" style="color: #c9a84c;">Book a new appointment</a></p>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`📧 Cancellation email sent to: ${user.email}`);
        return true;
        
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

// Send reschedule confirmation email
async function sendRescheduleEmail(booking, user, barber, service, oldDate, oldTime) {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"touchTash Barber" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔄 Booking Rescheduled - touchTash Barber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; padding: 20px; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333;">
                        <h1 style="color: #c9a84c;">touch<span style="color: #fff;">Tash</span></h1>
                        <p style="color: #aaa;">Your appointment has been rescheduled</p>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h3 style="color: #c9a84c;">Hello ${user.full_name},</h3>
                        <p>Your booking has been rescheduled to a new time.</p>
                        
                        <h4 style="color: #c9a84c;">Previous Appointment:</h4>
                        <table style="width: 100%; margin: 10px 0; border-collapse: collapse;">
                            <tr><td style="padding: 5px;"><strong>Date:</strong></td><td>${oldDate}</td></tr>
                            <tr><td style="padding: 5px;"><strong>Time:</strong></td><td>${oldTime}</td></tr>
                        </table>
                        
                        <h4 style="color: #c9a84c;">New Appointment Details:</h4>
                        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Service:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${service.service_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>Barber:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${barber.barber_name}</td>
                            </tr>
                            <tr style="background: #2a2a2a;">
                                <td style="padding: 10px; border: 1px solid #333;"><strong>New Date:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${booking.booking_date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #333;"><strong>New Time:</strong></td>
                                <td style="padding: 10px; border: 1px solid #333;">${booking.booking_time}</td>
                            </tr>
                        </table>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <a href="http://localhost:5500/dashboard.html" style="background: #c9a84c; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View My Bookings</a>
                        </div>
                    </div>
                </div>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`📧 Reschedule email sent to: ${user.email}`);
        return true;
        
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
}

module.exports = { sendBookingConfirmation, sendCancellationEmail, sendRescheduleEmail };