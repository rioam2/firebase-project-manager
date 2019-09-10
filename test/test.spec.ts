import chai = require('chai');
import { GaxiosPromise } from 'gaxios';
import { cloudresourcemanager_v1, firebase_v1beta1 } from 'googleapis';
import mocha = require('mocha');
import * as sinon from 'sinon';

import { CloudResourceManagerApi, FirebaseApi, GoogleApis } from '../src/apis.types';
import { addFirebaseFeatures, createFirebaseProject, createGCProject } from '../src/firebase';
import { ERRORS, EVENTS } from '../src/firebase.types';
import { DeepPartial } from '../src/util';

const { describe, it } = mocha;
const { expect, assert } = chai;

class APIStub implements GoogleApis {
	private defaultResponse = {
		config: {},
		data: {},
		headers: {},
		status: 200,
		statusText: 'OK'
	};
	public resolveTicks = 0;

	public cloudresourcemanager$operations$get$throw = {
		message: '',
		remaining: 0
	};
	public cloudresourcemanager$operations$get$response = {
		...this.defaultResponse,
		data: { done: true, response: { projectId: '' } }
	};
	public cloudresourcemanager$projects$create$throw = {
		message: '',
		remaining: 0
	};
	public cloudresourcemanager$projects$create$response = {
		...this.defaultResponse,
		data: { name: '' }
	};
	public cloudresourcemanager: CloudResourceManagerApi = ({
		operations: {
			get: (): GaxiosPromise<cloudresourcemanager_v1.Schema$Operation> => {
				if (this.cloudresourcemanager$operations$get$throw.remaining > 0) {
					this.cloudresourcemanager$operations$get$throw.remaining--;
					throw new Error(this.cloudresourcemanager$operations$get$throw.message);
				}
				return new Promise(res =>
					setTimeout(() => {
						res({ ...this.cloudresourcemanager$operations$get$response });
					}, this.resolveTicks)
				);
			}
		},
		projects: {
			create: (request): GaxiosPromise<cloudresourcemanager_v1.Schema$Operation> => {
				const projectId = request.requestBody.projectId;
				if (this.cloudresourcemanager$projects$create$throw.remaining > 0) {
					this.cloudresourcemanager$projects$create$throw.remaining--;
					throw new Error(this.cloudresourcemanager$projects$create$throw.message);
				}
				this.cloudresourcemanager$projects$create$response.data.name = `operations/${projectId}`;
				this.cloudresourcemanager$operations$get$response.data.response.projectId = projectId;
				return new Promise(res =>
					setTimeout(() => {
						res({ ...this.cloudresourcemanager$projects$create$response });
					}, this.resolveTicks)
				);
			}
		}
	} as DeepPartial<CloudResourceManagerApi>) as any;

	public firebase$operations$get$throw = {
		message: '',
		remaining: 0
	};
	public firebase$operations$get$response = {
		...this.defaultResponse,
		data: { done: true, response: { projectId: '' } }
	};
	public firebase$projects$addFirebase$throw = {
		message: '',
		remaining: 0
	};
	public firebase$projects$addFirebase$response = {
		...this.defaultResponse,
		data: { name: '' }
	};
	public firebase: FirebaseApi = ({
		operations: {
			get: (): GaxiosPromise<firebase_v1beta1.Schema$Operation> => {
				if (this.firebase$operations$get$throw.remaining > 0) {
					this.firebase$operations$get$throw.remaining--;
					throw new Error(this.firebase$operations$get$throw.message);
				}
				return new Promise(res =>
					setTimeout(() => {
						res({ ...this.firebase$operations$get$response });
					}, this.resolveTicks)
				);
			}
		},
		projects: {
			addFirebase: (request): GaxiosPromise<firebase_v1beta1.Schema$Operation> => {
				const projectName = request.project;
				if (this.firebase$projects$addFirebase$throw.remaining > 0) {
					this.firebase$projects$addFirebase$throw.remaining--;
					throw new Error(this.firebase$projects$addFirebase$throw.message);
				}
				this.firebase$projects$addFirebase$response.data.name = `operations/${projectName}`;
				this.firebase$operations$get$response.data.response.projectId = projectName;
				return new Promise(res =>
					setTimeout(() => {
						res({ ...this.firebase$projects$addFirebase$response });
					}, this.resolveTicks)
				);
			}
		}
	} as DeepPartial<FirebaseApi>) as any;
}

describe('Cloud Resource Manager', function() {
	this.timeout(0);

	describe('createGCProject', () => {
		it('successfully creates project with unique name', async () => {
			const api = new APIStub();

			const projectName = 'test';
			const callback = sinon.fake();
			const projectId = await createGCProject(api, projectName, callback);

			assert.isTrue(callback.calledWith(EVENTS.PROJECT_CREATION_ATTEMPT_STARTED, projectName));
			assert.isTrue(callback.calledWith(EVENTS.PROJECT_CREATION_STARTED, projectName));
			assert.isTrue(callback.calledWith(EVENTS.PROJECT_CREATION_SUCCEEDED, projectName));
			expect(projectId).equals(projectName);
		});

		it('generates a unique projectId if provided name is taken', async () => {
			for (const numFails of [1, 2, 4]) {
				const api = new APIStub();
				api.cloudresourcemanager$projects$create$throw.message = ERRORS.PROJECTID_TAKEN;
				api.cloudresourcemanager$projects$create$throw.remaining = numFails;

				const projectName = 'test';
				const callback = sinon.fake();
				const projectId = await createGCProject(api, projectName, callback);
				const [name, randSuffix] = projectId.split('-');

				expect(name).equals(projectName);
				expect(randSuffix.length).equals(numFails * 4);
				assert.isTrue(callback.calledWith(EVENTS.PROJECT_CREATION_NAME_TAKEN));
			}
		});

		it('throws unhandled errors to caller', async () => {
			const errorMessage = 'not specially handled';
			try {
				const api = new APIStub();
				api.cloudresourcemanager$projects$create$throw.message = errorMessage;
				api.cloudresourcemanager$projects$create$throw.remaining = 1;

				await createGCProject(api, '');
				assert.fail('Arbitrary errors should not be caught in createCGProject');
			} catch (e) {
				expect(e.message).equals(errorMessage, 'Errors is passed through as-is');
			}
		});
	});
});

describe('Firebase', function() {
	this.timeout(0);

	describe('addFirebaseFeatures', () => {
		it('successfully adds firebase features to an existing project', async () => {
			const api = new APIStub();

			const projectName = 'test-project';
			const callback = sinon.fake();
			await addFirebaseFeatures(api, projectName, callback);

			assert.isTrue(
				callback.calledWith(EVENTS.ADD_FIREBASE_FEATURES_STARTED),
				'operation was started and callback was invoked'
			);
			assert.isTrue(
				callback.calledWith(EVENTS.ADD_FIREBASE_FEATURES_SUCCEEDED),
				'operation succeeded and callback was invoked'
			);
		});

		it('throws when addFirebase API Call fails', async () => {
			const errorMessage = 'unhandled error';
			const projectName = 'test-project';
			const callback = sinon.fake();

			const api = new APIStub();
			api.firebase$projects$addFirebase$throw.message = errorMessage;
			api.firebase$projects$addFirebase$throw.remaining = 1;

			try {
				await addFirebaseFeatures(api, projectName, callback);
				assert.fail('Errors should not be caught by addFirebaseFeatures');
			} catch (e) {
				expect(e.message).equals(errorMessage, 'Error is passed through as-is');
				assert.isTrue(
					callback.calledWith(EVENTS.ADD_FIREBASE_FEATURES_STARTED),
					'operation was started and callback was invoked'
				);
				assert.isFalse(
					callback.calledWith(EVENTS.ADD_FIREBASE_FEATURES_SUCCEEDED),
					'operation did not succeed and callback was not invoked'
				);
			}
		});
	});

	describe('createFirebaseProject', () => {
		it('creates a new GC Project and adds Firebase features', async () => {
			const projectName = 'test-project';
			const callback = sinon.fake();
			const api = new APIStub();

			const projectId = await createFirebaseProject(api, projectName, callback);
			expect(projectId).equals(projectName);
		});
	});
});
