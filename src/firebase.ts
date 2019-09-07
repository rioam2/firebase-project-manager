import { GoogleApis } from './apis.types';
import { ERRORS, EventCB, EVENTS } from './firebase.types';
import { getRandomHexLen, waitOnOperation } from './util';

export async function createFirebaseProject(googleapis: GoogleApis, name: string, cb: EventCB = () => {}) {
	const projectId = await createGCProject(googleapis, name, cb);
	await addFirebaseFeatures(googleapis, projectId, cb);
	return projectId;
}

export async function addFirebaseFeatures(googleapis: GoogleApis, projectId: string, cb: EventCB = () => {}) {
	const project = `projects/${projectId}`;
	cb(EVENTS.ADD_FIREBASE_FEATURES_STARTED, projectId);
	const response = await googleapis.firebase.projects.addFirebase({ project });
	const operationName = response.data.name as string;
	await waitOnOperation(googleapis.firebase, operationName);
	cb(EVENTS.ADD_FIREBASE_FEATURES_SUCCEEDED);
}

export async function createGCProject(googleapis: GoogleApis, name: string, cb: EventCB = () => {}): Promise<string> {
	return (async function attemptCreate(randSuffix = '') {
		const projectId = randSuffix ? `${name}-${randSuffix}` : name;
		cb(EVENTS.PROJECT_CREATION_ATTEMPT_STARTED, projectId);
		try {
			const request = { requestBody: { projectId, name } };
			const response = await googleapis.cloudresourcemanager.projects.create(request);
			const operationName = response.data.name as string;
			cb(EVENTS.PROJECT_CREATION_STARTED, projectId);
			const data = await waitOnOperation(googleapis.cloudresourcemanager, operationName);
			cb(EVENTS.PROJECT_CREATION_SUCCEEDED, projectId);
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
