const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'SendinBlue',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDINBLUE_PASSWORD,
    },
  });
  if(options.type === 'REFER'){
    await transporter.sendMail({
      from: `Multiplayr - ${process.env.SENDER_EMAIL}`,
      to: options.to,
      subject: options.subject,
      text: options.text
    })
  } else {

  await transporter.sendMail({
    from: `Multiplayr - ${process.env.SENDER_EMAIL}`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

};

module.exports = sendEmail;
