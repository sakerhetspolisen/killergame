![Killergame](https://github.com/sakerhetspolisen/killergame/blob/master/src/assets/logo.png)

# Killergame - Last man standing 🩸
This is the 5-year anniversary edition of Killergame at Procivitas. Killergame, which is a popular high school competition, is about "killing" as many as possible while you try to survive yourself. The players have certain "weapons" of choice, a leek for example, which they need to touch the target with. Once the target gets attacked and is touched by a "weapon", they are out of the game. The competition is usually only held once a year in connection with Halloween.

## The web app
All players register and play with the web app. They are assigned a 6-digit code which acts as a secret given by the target to the killer.

### Features
#### School-speicific sign-up
To avoid registering players that don't attend the school, the player needs to provide grade and the first characters in their school-email-address.
![image](https://user-images.githubusercontent.com/68159964/142431207-4304b672-655d-4b64-8146-a86768b50bf2.png)

#### Login with secret code

Players sign in with their secret code which got sent to them via email on registration.

#### Stats

Statistics that update in real-time. *Coming soon: Grades and list of fastest kills*

#### Admin Dashboard
Search for players, kill players, revive players, randomize targets, debug game and much more with the Killergame Admin dashboard.
![image](https://user-images.githubusercontent.com/68159964/142431947-9f502721-b3ef-48d1-811b-c8960f8eca01.png)

### Web technologies used
#### Frontend
- React.JS
- Chakra UI
- `firebase` package
- React router DOM
- `react-input-mask`
- `react-icons`

#### Backend
- Nodemailer
- `firebase-functions`
- `firebase-admin`
- `nodemailer-sendgrid`

## Steps for cloning the web app on your machine
1. Sign up to Google Firebase, more specifically the services Authentication, Realtime Database and Functions.
2. Replace the following code snippet with your own in `src/utils/firebase.js`:

```js
const firebaseConfig = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_AUTH_DOMAIN",
	databaseURL: "YOUR_DATABASE_URL",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_STORAGE_BUCKET",
	messagingSenderId: "YOUR_SENDER_ID",
	appId: "YOUR_APP_ID",
};
```
3. Clone the repo to your machine
4. Run `npm install`
5. Install and authenticate the Firebase CLI library `firebase-tools` by running `npm install -g firebase-tools` and then `firebase init`
6. Start a local development environment by following [this](https://firebase.google.com/docs/emulator-suite/connect_and_prototype) guide


## Do you want to contribute?
Create an issue if you want to highlight or suggest something, or open up a pull request if you've got code contributions! Thanks! 😍

## License
This project is licensed under the GNU Affero General Public License v3.0.
