import * as Configstore from 'configstore';
import { google } from 'googleapis';
import * as http from 'http';
import * as open from 'open';

const CONFIGSTORE_NAME = 'create_firebase';
const CALLBACK_SERVER = {
	HOST: 'localhost',
	PORT: 9005,
	URL: `http://localhost:9005`
};
const OAUTH = {
	CLIENT_ID: '514670030483-l26u9lmdeidnfdfid3cfmjiu3p84r9ea.apps.googleusercontent.com',
	CLIENT_SECRET: 'esSSrnwU2_CVBkSUd9zaZC80',
	SCOPE: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
};

export const oauth2Client = new google.auth.OAuth2(OAUTH.CLIENT_ID, OAUTH.CLIENT_SECRET, CALLBACK_SERVER.URL);

const conf = new Configstore(CONFIGSTORE_NAME);
(function credentialManager() {
	const storedCred = conf.get('tokens');
	if (storedCred) {
		oauth2Client.credentials = storedCred;
		oauth2Client.setCredentials(storedCred);
	}
	oauth2Client.on('tokens', tokens => {
		conf.set('tokens', tokens);
	});
})();

async function getGoogleAuthCode(): Promise<string> {
	return new Promise((resolve, reject) => {
		let timeout;
		const url = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: OAUTH.SCOPE
		});
		console.info('Waiting for authentication...\n');
		console.info(url, '\n');
		open(url);
		const server = http
			.createServer((req, res) => {
				if (req.url) {
					req.connection.ref();
					if (req.url.includes('error=')) {
						reject('User declined authentication');
					}
					resolve(decodeURIComponent(req.url.slice(7, 96)));
					clearTimeout(timeout);
					res.end(() => req.connection.unref());
					server.close();
				}
			})
			.listen(CALLBACK_SERVER.PORT)
			.on('connection', socket => socket.unref());
		timeout = setTimeout(() => {
			reject('Timed out waiting for user authentication.');
			server.close();
		}, 60000);
	});
}

export async function authenticate(verbose = false) {
	if (oauth2Client.credentials.refresh_token) {
		verbose && console.info('You are already logged in. \n');
	} else {
		const authorizationCode = await getGoogleAuthCode();
		const { tokens } = await oauth2Client.getToken(authorizationCode);
		oauth2Client.credentials = tokens;
		oauth2Client.setCredentials(tokens);
		verbose && console.log('You are now logged in. \n');
	}
}

export async function deauthenticate(verbose = false) {
	if (oauth2Client.credentials.access_token) {
		conf.delete('tokens');
		await oauth2Client.revokeCredentials();
		verbose && console.info('You are now logged out. \n');
	} else {
		verbose && console.info('You are already logged out. \n');
	}
}
