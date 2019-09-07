import { google } from 'googleapis';

import { oauth2Client } from './auth';

export const googleapis = {
	cloudresourcemanager: google.cloudresourcemanager({
		auth: oauth2Client,
		version: 'v1'
	}),
	firebase: google.firebase({
		auth: oauth2Client,
		version: 'v1beta1'
	})
};
