import { firebase_v1beta1 } from 'googleapis';

import { GoogleApis } from './apis.types';
import { ERRORS, EventCB, EVENTS } from './firebase.types';
import { getRandomHexLen, noop, waitOnOperation } from './util';

export async function getFirebaseWebappConfig(googleapis: GoogleApis, projectId: string, appId?: string) {
	const isFullPath = projectId.includes('/');
	const name = isFullPath ? projectId : `projects/${projectId}/webApps/${appId}/config`;
	const { data } = await googleapis.firebase.projects.webApps.getConfig({ name });
	return data;
}

export async function getFirebaseWebapp(googleapis: GoogleApis, projectId: string, appId?: string) {
	const isFullPath = projectId.includes('/');
	const name = isFullPath ? projectId : `projects/${projectId}/webApps/${appId}`;
	const { data } = await googleapis.firebase.projects.webApps.get({ name });
	return data;
}

export async function createFirebaseWebapp(
	googleapis: GoogleApis,
	projectId: string,
	displayName?: string,
	appUrls?: string[]
) {
	const parent = `projects/${projectId}`;
	const appRequest = { parent, requestBody: { displayName, appUrls } };
	const operation = await googleapis.firebase.projects.webApps.create(appRequest);
	const data = await waitOnOperation(googleapis.firebase, operation);
	return data.response as firebase_v1beta1.Schema$WebApp;
}

export async function listFirebaseProjectApps(
	googleapis: GoogleApis,
	projectId: string,
	pageSize?: number,
	pageToken?: string
) {
	const parent = `projects/${projectId}`;
	const { data } = await googleapis.firebase.projects.searchApps({ pageSize, pageToken, parent });
	return data.apps;
}

export async function getFirebaseProject(googleapis: GoogleApis, projectId: string) {
	const name = `projects/${projectId}`;
	const { data } = await googleapis.firebase.projects.get({ name });
	return data;
}

export async function listAvailableProjects(googleapis: GoogleApis, pageSize?: number, pageToken?: string) {
	const { data } = await googleapis.firebase.availableProjects.list({ pageSize, pageToken });
	return data.projectInfo;
}

export async function listFirebaseProjects(googleapis: GoogleApis, pageSize?: number, pageToken?: string) {
	const { data } = await googleapis.firebase.projects.list({ pageSize, pageToken });
	return data.results || [];
}

export async function createFirebaseProject(googleapis: GoogleApis, name: string, cb: EventCB = noop) {
	const projectId = await createGCProject(googleapis, name, cb);
	await addFirebaseFeatures(googleapis, projectId, cb);
	return projectId;
}

export async function addFirebaseFeatures(googleapis: GoogleApis, projectId: string, cb: EventCB = noop) {
	const project = `projects/${projectId}`;
	cb(EVENTS.ADD_FIREBASE_FEATURES_STARTED);
	const operation = await googleapis.firebase.projects.addFirebase({ project });
	await waitOnOperation(googleapis.firebase, operation);
	cb(EVENTS.ADD_FIREBASE_FEATURES_SUCCEEDED);
}

export async function createGCProject(googleapis: GoogleApis, name: string, cb: EventCB = noop): Promise<string> {
	const projectIdBase = name
		.replace(/\s/g, '-') /* replace whitespace with dashes */
		.replace(/[^A-z0-9\-]|\[|\]|\^|\_|\`|\\/g, '') /* Remove all non-alphanumeric characters */
		.toLowerCase();
	return (async function attemptCreate(randSuffix = '') {
		const projectId = randSuffix ? `${projectIdBase}-${randSuffix}` : projectIdBase;
		cb(EVENTS.PROJECT_CREATION_ATTEMPT_STARTED, projectId);
		try {
			const request = { requestBody: { projectId, name } };
			const operation = await googleapis.cloudresourcemanager.projects.create(request);
			cb(EVENTS.PROJECT_CREATION_STARTED, projectId);
			const data = await waitOnOperation(googleapis.cloudresourcemanager, operation);
			cb(EVENTS.PROJECT_CREATION_SUCCEEDED, projectId);
			return (data.response as any).projectId as string;
		} catch (e) {
			if (e.message === ERRORS.PROJECTID_TAKEN) {
				cb(EVENTS.PROJECT_CREATION_NAME_TAKEN, projectId);
				return attemptCreate(randSuffix + getRandomHexLen(4));
			} else {
				throw e;
			}
		}
	})();
}
