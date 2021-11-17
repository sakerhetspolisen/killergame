const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
const config = functions.config().env;

const transport = nodemailer.createTransport(
	nodemailerSendgrid({
		apiKey: config.sendgrid.apiKey,
	})
);

/**
 * Firebase Cloud Functions for game execution
 * @exports sendEmailConfirmation Sends an email every time a new player signs up
 * @exports sendClientSideEmail Sends an email on request
 * 
 */

/**
 * sendEmailConfirmation()
 * @param uid {string} userId of player
 * 
 */
exports.sendEmailConfirmation = functions.database
	.ref("/users/{uid}/email")
	.onCreate((snap, context) => {
		const email = snap.val();
		const userId = context.params.uid;
		var buildEmail = {
			from: {
				name: "Killergame",
				address: config.sendgrid.email,
			},
			to: email,
			subject: "Dags att dräpa.",
			text: "Ditt användarnummer är: " + userId,
			html:
				`<h1>Välkommen till Killergame.</h1><h2>Nu är det dags att dräpa.</h2><h3>Ditt användarnummer är: <b>${userId}</b></h3>`,
		};
		return transport.sendMail(buildEmail, function (err, info) {
			if (err) {
				return console.log(err);
			} else {
				return console.log("Message sent: " + info.response);
			}
		});
	});

/**
 * sendClientSideEmail()
 * @param email {string} email of player
 * @param userId {string} userId of player
 * 
 */
exports.sendClientSideEmail = functions.https.onCall((data, context) => {
	console.log(
		"from sendEmail function. The request object is:",
		JSON.stringify(data)
	);
	const email = data.email;
	const userId = data.userId;
	var buildEmail = {
		from: {
			name: "Killergame",
			address: config.sendgrid.email,
		},
		to: email,
		subject: "Dags att dräpa.",
		text: "Ditt användarnummer är: " + userId,
		html:
			"<h1>Välkommen till Killergame.</h1><h2>Nu är det dags att dräpa.</h2><h3>Ditt användarnummer är: <b>" +
			userId +
			"</b></h3>",
	};

	return transport.sendMail(buildEmail, function (err, info) {
		if (err) {
			throw new functions.https.HttpsError("unknown", err);
		}
		return { text: "Message sent" };
	});
});