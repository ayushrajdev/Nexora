const { SendEmailCommand } = require('@aws-sdk/client-ses');
const sesClient = require('../config/ses');
const templates = require('../templates/emailTemplates');

class EmailService {
  async sendEmail(toAddress, subject, bodyHtml) {
    const params = {
      Source: process.env.SES_FROM_EMAIL || 'dummy@example.com',
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: bodyHtml } },
      },
    };

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Mock sending email to ${toAddress}: ${subject}`);
        return;
      }
      const command = new SendEmailCommand(params);
      await sesClient.send(command);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendWelcomeEmail(email, firstName) {
    await this.sendEmail(
      email,
      'Welcome to DevTinder!',
      templates.welcomeTemplate(firstName)
    );
  }

  async sendInterestEmail(email, senderName) {
    await this.sendEmail(
      email,
      'Someone is interested in your profile!',
      templates.interestTemplate(senderName)
    );
  }

  async sendMatchEmail(email1, email2, name1, name2) {
    await this.sendEmail(email1, 'You have a new match!', templates.matchTemplate(name2));
    await this.sendEmail(email2, 'You have a new match!', templates.matchTemplate(name1));
  }

  async sendPaymentConfirmationEmail(email, membershipType) {
    await this.sendEmail(
      email,
      'Payment Confirmation',
      templates.paymentConfirmationTemplate(membershipType)
    );
  }
}

module.exports = new EmailService();