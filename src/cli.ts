#!/usr/bin/env node
import { Spinner } from 'cli-spinner';

import { authenticate, deauthenticate } from './auth';
import { createFirebaseProject, EVENTS } from './firebase';
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
	INVALID_ARGUMENTS
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
		if (e instanceof Error) {
			console.error(e.message);
		} else {
			console.error(e);
		}
	}
})(process.argv.slice(2) as [COMMANDS, ...any[]]);

function handleProgress(event: EVENTS, data: any) {
	spinner.start();
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
