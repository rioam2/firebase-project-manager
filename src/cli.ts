#!/usr/bin/env node
import chalk from 'chalk';
import { Spinner } from 'cli-spinner';
import { firebase_v1beta1 } from 'googleapis';

import {
    createFirebaseProject,
    createFirebaseWebapp,
    EVENTS,
    listAvailableProjects,
    listFirebaseProjects,
} from '.';
import { authenticate, deauthenticate } from './auth';
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
	.description('Create a project')
	.action(async ({ name }) => {
		await authenticate();
		const projectId = await createFirebaseProject(name, handleProgress);
		console.log(`Successfully created new firebase project: ${projectId}`);
	});

program
	.command('list [filter=firebase,gcp,all](Filter by project type [firebase, gcp, all])')
	.description('List projects')
	.action(async ({ filter }) => {
		await authenticate();
		const listFirebase = ['firebase', 'all'].includes(filter) || undefined;
		const listGCP = ['gcp', 'all'].includes(filter) || undefined;
		const sources = [listFirebase && listFirebaseProjects(), listGCP && listAvailableProjects()];
		const nested = await Promise.all(sources);
		const data = (nested.reduce((prev = [], curr = []) => {
			curr = curr.map((project: any) => {
				return { ...project, projectId: project.projectId || project.project };
			});
			return prev.concat(curr);
		}) || []) as firebase_v1beta1.Schema$FirebaseProject[];
		data.forEach(project => {
			const { projectId, displayName } = project;
			const projectName = displayName || projectId || '';
			const line = `${projectName} ${chalk.grey(`(${projectId})`)}`;
			console.log(line);
		});
	});

program
	.command('add-webapp <name>(Name of new webapp) [parent](Parent project-id of new webapp)')
	.description('Create a webapp')
	.action(async ({ name, parent }) => {
		await authenticate();
		await createFirebaseWebapp(parent, name);
		console.log(`New webapp ${name} was created for ${parent}`);
	});

program
	.command('login')
	.description('Login')
	.action(async () => {
		await authenticate(true);
		program.run();
	});

program
	.command('logout')
	.description('Logout')
	.action(async () => {
		await deauthenticate(true);
		program.run();
	});

program.root().title('What would you like to do?');
program.root().run();
