import { google } from 'googleapis';

import { oauth2Client } from './auth';

export const firebaseAPI = google.firebase({
	auth: oauth2Client,
	version: 'v1beta1'
});

export const gcpAPI = google.cloudresourcemanager({
	auth: oauth2Client,
	version: 'v1'
});
