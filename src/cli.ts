#!/usr/bin/env node
import { Spinner } from 'cli-spinner';

import { authenticate, deauthenticate } from './auth';
import { createFirebaseProject, EVENTS } from './firebase';
import { CLI } from './util';

const program = new CLI();

Spinner.setDefaultSpinnerString(18);
const spinner = new Spinner();

function handleProgress(event: EVENTS, data: any) {
	if (!spinner.isSpinning()) {
		spinner.start();
	}
	switch (event) {
		case EVENTS.PROJECT_CREATION_ATTEMPT_STARTED:
			spinner.setSpinnerTitle(`Attempting to claim ${data}`);
			break;
		case EVENTS.PROJECT_CREATION_STARTED:
			spinner.setSpinnerTitle(`Provisioning ${data}`);
			break;
		case EVENTS.PROJECT_CREATION_SUCCEEDED:
			spinner.setSpinnerTitle(`Finished creating ${data}`);
			break;
		case EVENTS.ADD_FIREBASE_FEATURES_STARTED:
			spinner.setSpinnerTitle('Setting up Firebase features');
			break;
		case EVENTS.ADD_FIREBASE_FEATURES_SUCCEEDED:
			spinner.stop(true);
			break;
	}
}

program
	.command('create <name=new-firebase-project>(New project name)')
	.description('Create a new Firebase Project')
	.action(async ({ name }) => {
		const projectId = await createFirebaseProject(name, handleProgress);
		console.log(`Successfully created new firebase project: ${projectId}`);
	});

program
	.command('login')
	.description('Login and save credentials')
	.action(async () => {
		await authenticate();
		program.run();
	});

program
	.command('logout')
	.description('Logout and clear saved credentials')
	.action(async () => {
		await deauthenticate();
		program.run();
	});

program.root().title('What would you like to do?');
program.root().run();
