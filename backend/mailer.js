const nodemailer = require('nodemailer');

async function sendUnlockCode({ email, nombre, code }) {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') throw new Error('SMTP_HOST no está configurado.');
    console.info(`GameShelf: código de desbloqueo para ${email}: ${code}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Código para desbloquear tu cuenta de GameShelf',
    text: `Hola ${nombre}, tu código de desbloqueo es ${code}.`
  });
}

module.exports = { sendUnlockCode };
