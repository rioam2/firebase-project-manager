import { googleapis } from './apis';
import * as firebase from './firebase';
import { ShiftArgs } from './util';

export { ERRORS, EVENTS } from './firebase.types';
export { oauth2Client, authenticate, deauthenticate } from './auth';

export const addFirebaseFeatures = (...args: ShiftArgs<typeof firebase.addFirebaseFeatures>) =>
	firebase.addFirebaseFeatures(googleapis, ...args);

export const createFirebaseProject = (...args: ShiftArgs<typeof firebase.createFirebaseProject>) =>
	firebase.createFirebaseProject(googleapis, ...args);

export const createGCProject = (...args: ShiftArgs<typeof firebase.createGCProject>) =>
	firebase.createGCProject(googleapis, ...args);
