import { firebaseAPI, gcpAPI } from './apis';
import { getRandomHexLen, waitOnOperation } from './util';

export enum ERRORS {
	PROJECTID_TAKEN = 'Requested entity already exists'
}

export enum EVENTS {
	PROJECT_CREATION_ATTEMPT_STARTED,
	PROJECT_CREATION_STARTED,
	PROJECT_CREATION_SUCCEEDED,
	ADD_FIREBASE_FEATURES_STARTED,
	ADD_FIREBASE_FEATURES_SUCCEEDED
}
type EventCB = (event: EVENTS, data?: any) => void;

export async function createFirebaseProject(name: string, cb?: EventCB) {
	const projectId = await createGCProject(name, cb);
	await addFirebaseFeatures(projectId, cb);
	return projectId;
}

export async function addFirebaseFeatures(projectId: string, cb?: EventCB) {
	const project = `projects/${projectId}`;
	cb && cb(EVENTS.ADD_FIREBASE_FEATURES_STARTED, projectId);
	const response = await firebaseAPI.projects.addFirebase({ project });
	const operationName = response.data.name as string;
	await waitOnOperation(firebaseAPI, operationName);
	cb && cb(EVENTS.ADD_FIREBASE_FEATURES_SUCCEEDED);
}

export async function createGCProject(
	name: string,
	cb?: EventCB
): Promise<string> {
	return (async function attemptCreate(randSuffix = '') {
		const projectId = randSuffix ? `${name}-${randSuffix}` : name;
		cb && cb(EVENTS.PROJECT_CREATION_ATTEMPT_STARTED, projectId);
		try {
			const request = { requestBody: { projectId, name } };
			const response = await gcpAPI.projects.create(request);
			const operationName = response.data.name as string;
			cb && cb(EVENTS.PROJECT_CREATION_STARTED, projectId);
			const data = await waitOnOperation(gcpAPI, operationName);
			cb && cb(EVENTS.PROJECT_CREATION_SUCCEEDED, projectId);
			return (data.response as any).projectId as string;
		} catch (e) {
			if (e.message === ERRORS.PROJECTID_TAKEN) {
				return attemptCreate(randSuffix + getRandomHexLen(4));
			} else {
				throw e;
			}
		}
	})();
}
