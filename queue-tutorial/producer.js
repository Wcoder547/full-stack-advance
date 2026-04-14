const {Queue} = require('bullmq')

const notificationQueue = new Queue('email-notifications', {
  connection: {
    host: 'localhost',
    port: 6379
  }
})

async function sendEmailNotification(email, subject, message) {
  const job = await notificationQueue.add('send-email', {
    email,
    subject,
    message
  })
  console.log(`Email notification added to queue for ${email}`)
  console.log(`Job ID: ${job.id}`)
}


sendEmailNotification('malikwaseemshzad@example.com', 'Hi', 'Something to say.')