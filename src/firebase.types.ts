export enum ERRORS {
	PROJECTID_TAKEN = 'Requested entity already exists',
	GCP_TERMS_OF_SERVICE = 'Callers must accept Terms of Service',
	FIREBASE_TERMS_OF_SERVICE = 'The caller does not have permission'
}

export enum EVENTS {
	PROJECT_CREATION_ATTEMPT_STARTED,
	PROJECT_CREATION_STARTED,
	PROJECT_CREATION_SUCCEEDED,
	ADD_FIREBASE_FEATURES_STARTED,
	ADD_FIREBASE_FEATURES_SUCCEEDED
}

export type EventCB = (event: EVENTS, data?: any) => void;
