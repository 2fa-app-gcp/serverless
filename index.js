const functions = require('@google-cloud/functions-framework');
const mailgun = require('mailgun-js')
    ({ apiKey: "b2d21f7e33738398371dde198b4f2fc8-309b0ef4-b69a1ddf", domain: "csye6225-002277864.me" });
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.HOST,
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

const email = sequelize.define('email', {
    uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
});

sendMail = function (sender_email, receiver_email,
    email_subject, email_body) {
    const data = {
        "from": sender_email,
        "to": receiver_email,
        "subject": email_subject,
        "text": email_body
    };

    console.log("Email coming in",data);
    mailgun.messages().send(data, (error, body) => {
        console.log("Email coming inn");
        if (error) 
        {
            console.log("Error while sending email",error);
        }
        else {
            console.log("Mail sent",body);
        }
    });
}

functions.cloudEvent('helloPubSub', async (cloudEvent) => {

    const base64name = cloudEvent.data.message.data;
    const decodedString = Buffer.from(base64name, 'base64').toString('utf-8');
    const jsonData = JSON.parse(decodedString);
    let record;
    try {
        // Save username to MySQL using Sequelize
        record = await email.create({ email: jsonData.username,timestamp: new Date().toISOString() });
        console.log('Username saved to MySQL:', record.email);
    } catch (error) {
        console.error('Error saving username to MySQL:', error);
    }

    let sender_email = 'no-reply@csye6225-002277864.me'
    let receiver_email = jsonData.username
    let email_subject = 'Verification Email - Webapp'
    let email_body = `Hello there,\n\nThank you for registering with our web app. Please click on the following link to verify your email address:\n\nhttps://csye6225-002277864.me/verify-email?token=${record.uuid}\n\nBest regards,\nThe Web App Team`;
    sendMail(sender_email, receiver_email,email_subject, email_body)
    console.log(`Email Successfully queued ${receiver_email}`);
   
});

(async () => {
    try {
        await sequelize.sync();
        console.log('Sequelize models synced with database');
    } catch (error) {
        console.error('Error syncing Sequelize models with database:', error);
    }
})();

