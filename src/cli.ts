#!/usr/bin/env node
import { Spinner } from 'cli-spinner';

import { authenticate, deauthenticate } from './auth';
import { createFirebaseProject, ERRORS, EVENTS } from './firebase';
import { displayHelp } from './help';

Spinner.setDefaultSpinnerString(18);
const spinner = new Spinner();

export enum COMMANDS {
	HELP = 'help',
	LOGIN = 'login',
	LOGOUT = 'logout',
	PROJECT = 'project'
}

export enum PROJECT_OPERATIONS {
	CREATE = 'create',
	ADD = 'add'
}

export enum EXIT_CODE {
	SUCCESS,
	INVALID_COMMAND,
	INVALID_ARGUMENTS,
	UNHANDLED_ERROR
}

(async function main([command, ...args]: [COMMANDS, ...any[]]) {
	try {
		switch (command) {
			case COMMANDS.LOGIN:
				await authenticate(true);
				break;
			case COMMANDS.LOGOUT:
				deauthenticate(true);
				break;
			case COMMANDS.PROJECT:
				const [operation, ...rest] = args;
				await handleProject(operation, ...rest);
				break;
			case COMMANDS.HELP:
				const [cmd] = args;
				displayHelp(cmd);
				break;
			default:
				displayHelp(COMMANDS.HELP);
				process.exit(EXIT_CODE.INVALID_COMMAND);
		}
	} catch (e) {
		const handle = msg => {
			spinner.stop(true);
			console.error(`ERROR: ${msg}`);
			if (msg === ERRORS.GCP_TERMS_OF_SERVICE) {
				console.info(
					'Please view the GCP console to review:',
					'https://console.cloud.google.com'
				);
			} else if (msg === ERRORS.FIREBASE_TERMS_OF_SERVICE) {
				console.info(
					'Did you accept the Firebase terms of service? Visit this link and click, "Explore a demo project":',
					'https://console.firebase.google.com'
				);
			}
			process.exit(EXIT_CODE.UNHANDLED_ERROR);
		};
		if (e instanceof Error) {
			handle(e.message);
		} else {
			handle(e);
		}
	}
})(process.argv.slice(2) as [COMMANDS, ...any[]]);

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

async function handleProject(operation: PROJECT_OPERATIONS, ...args: any[]) {
	switch (operation) {
		case PROJECT_OPERATIONS.CREATE:
			const [name] = args;
			await handleCreate(name);
			break;
		case PROJECT_OPERATIONS.ADD:
			console.info('Not yet implemented.');
		default:
			displayHelp(COMMANDS.PROJECT);
			process.exit(EXIT_CODE.INVALID_COMMAND);
	}
}

async function handleCreate(name?: string) {
	if (name) {
		const projectId = await createFirebaseProject(name, handleProgress);
		console.log(`Successfully created new firebase project: ${projectId}`);
	} else {
		displayHelp(COMMANDS.PROJECT);
		process.exit(EXIT_CODE.INVALID_ARGUMENTS);
	}
}
