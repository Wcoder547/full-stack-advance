const {Worker} = require('bullmq')

const worker= new Worker('email-notifications', async job => {
  if (job.name === 'send-email') {
    const {email, subject, message} = job.data
    console.log(`Sending email to ${email} with subject "${subject}" and message "${message}"`)
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log(`Email sent to ${email}`)
  }
}, {
  connection: {
    host: 'localhost',
    port: 6379
  }
})

worker.on('completed', job => {
  console.log(`Job ${job.id} completed successfully.`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`)
})

console.log('Worker is running and waiting for jobs...')