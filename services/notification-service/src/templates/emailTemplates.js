module.exports = {
  welcomeTemplate: (name) => `<h1>Welcome to DevTinder, ${name || 'Developer'}!</h1><p>Start finding your perfect dev match today.</p>`,
  interestTemplate: (senderName) => `<h1>Good news!</h1><p>${senderName || 'Someone'} is interested in your profile.</p>`,
  matchTemplate: (name) => `<h1>It's a match!</h1><p>You and ${name || 'another developer'} liked each other's profiles.</p>`,
  paymentConfirmationTemplate: (membershipType) => `<h1>Payment Successful</h1><p>Thank you for subscribing to ${membershipType} membership.</p>`
};