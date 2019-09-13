import { googleapis } from './apis';
import * as firebase from './firebase';
import { ShiftArgs } from './util';

export { ERRORS, EVENTS } from './firebase.types';
export { oauth2Client, authenticate, deauthenticate } from './auth';

export const createFirebaseProject = (...args: ShiftArgs<typeof firebase.createFirebaseProject>) =>
	firebase.createFirebaseProject(googleapis, ...args);

export const createGCProject = (...args: ShiftArgs<typeof firebase.createGCProject>) =>
	firebase.createGCProject(googleapis, ...args);

export const addFirebaseFeatures = (...args: ShiftArgs<typeof firebase.addFirebaseFeatures>) =>
	firebase.addFirebaseFeatures(googleapis, ...args);

export const listFirebaseProjects = (...args: ShiftArgs<typeof firebase.listFirebaseProjects>) =>
	firebase.listFirebaseProjects(googleapis, ...args);

export const listAvailableProjects = (...args: ShiftArgs<typeof firebase.listAvailableProjects>) =>
	firebase.listAvailableProjects(googleapis, ...args);

export const getFirebaseProject = (...args: ShiftArgs<typeof firebase.getFirebaseProject>) =>
	firebase.getFirebaseProject(googleapis, ...args);

export const listFirebaseProjectApps = (...args: ShiftArgs<typeof firebase.listFirebaseProjectApps>) =>
	firebase.listFirebaseProjectApps(googleapis, ...args);

export const createFirebaseWebapp = (...args: ShiftArgs<typeof firebase.createFirebaseWebapp>) =>
	firebase.createFirebaseWebapp(googleapis, ...args);

export const getFirebaseWebapp = (...args: ShiftArgs<typeof firebase.getFirebaseWebapp>) =>
	firebase.getFirebaseWebapp(googleapis, ...args);

export const getFirebaseWebappConfig = (...args: ShiftArgs<typeof firebase.getFirebaseWebappConfig>) =>
	firebase.getFirebaseWebappConfig(googleapis, ...args);
