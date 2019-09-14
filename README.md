# firebase-project-manager

[![Build Status](https://travis-ci.com/rioam2/firebase-project-manager.svg?branch=master)](https://travis-ci.com/rioam2/firebase-project-manager)
[![Coverage Status](https://coveralls.io/repos/github/rioam2/firebase-project-manager/badge.svg?branch=master)](https://coveralls.io/github/rioam2/firebase-project-manager?branch=master)
[![TypeScript](https://badges.frapsoft.com/typescript/version/typescript-next.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![NPM Version](https://img.shields.io/npm/v/firebase-project-manager.svg)](https://github.com/rioam2/firebase-project-manager)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://img.shields.io/badge/license-MIT-blue.svg)

Create and manage your Firebase projects from the command line or with code! 

## Example Usage

#### As a Command-Line Tool
```bash
$ firebase-project-manager login
$ firebase-project-manager create my-new-project
```

#### As a Node.JS Dependency
```javascript
const { authenticate, createFirebaseProject } = require('firebase-project-manager');

await authenticate();
const createdProjectId = await createFirebaseProject('my-new-project');
console.log('Successfully created new Firebase project:', createdProjectId);
```

## Installation

As a package dependency:

```bash
$ yarn add firebase-project-manager 
# OR
$ npm i firebase-project-manager
```

As a global binary tool:

```bash
$ yarn global add firebase-project-manager
# OR
$ npm i -g firebase-project-manager
```

## CLI Usage

This utility can either be used in an interactive mode, or single-command/single-action mode.   
To access the interactive tool, use the following command:

```bash
$ firebase-project-manager
```

To utilize a single function of the executable, run the following to view all options (API is subject to change):

```bash
$ firebase-project-manager --help
```

Note: You may need to use `$ yarn firebase-project-manager` if you do not have the package installed globally.

## Node.JS API Usage

Embedded below are all of the functions available for import through this package currently. Since the APIs are subject to heavy change right now, official documentation will not be produced until the package is ready for an initial major release. Using exact symver numbers in your `package.json` recommended until then as any changes up until `v1.0.0` can be considered breaking changes.

```ts
// src/index.ts

import { googleapis } from './apis';
import * as auth from './auth';
import * as firebase from './firebase';
import { EventCB } from './firebase.types';
import { noop } from './util';

export { ERRORS, EVENTS, EventCB } from './firebase.types';

/** Static OAuth client managed by `authenticate` and `deauthenticate` */
export const oauth2Client = auth.oauth2Client;

/**
 * Authenticates client with Firebase Project Manager and retains a refresh token in the
 * system's configuration store for later usage.
 * @param verbose If true, authentication status will be logged with `console.log`.
 * @return Void promise resolved upon completion
 */
export const authenticate = auth.authenticate;

/**
 * Deauthenticates the currently logged in user, revokes and deletes the currently cached
 * refresh_token stored in the system's configuration store.
 * @param verbose If true, authentication status will be logged with `console.log`.
 * @return Void promise resolved upon completion
 */
export const deauthenticate = auth.deauthenticate;

/**
 * Creates a new Firebase Project via a two step process of first creating a CGP Project
 * and then secondly adding Firebase resources to it.
 * @param name Desired display name for the underlying GCP project. If available, this name
 * will also be used as a `projectId` by replacing all non-whitespace characters with '-'
 * and making all alphabetic characters lower-case.
 * @param cb function called with progress of project creation.
 * @return Promise to the newly created project's `projectId`.
 */
export function createFirebaseProject(name: string, cb: EventCB = noop) {
	return firebase.createFirebaseProject(googleapis, name, cb);
}

/**
 * Creates a new GCP project using Google `cloudresourcemanager`.
 * @param name Desired display name for the underlying GCP project. If available, this name
 * will also be used as a `projectId` by replacing all non-whitespace characters with `-`
 * and making all alphabetic characters lower-case.
 * @param cb function called with progress of project creation.
 * @return Promise to the newly created project's `projectId`.
 */
export function createGCProject(name: string, cb: EventCB = noop) {
	return firebase.createGCProject(googleapis, name, cb);
}

/**
 * Adds Firebase resources to a GCP Project
 * @param projectId projectId of the GCP Project to add Firebase features to.
 * @param cb function called with progress of project creation.
 * @return Void promise resolved upon completion
 */
export function addFirebaseFeatures(projectId: string, cb: EventCB = noop) {
	return firebase.addFirebaseFeatures(googleapis, projectId, cb);
}

/**
 * Lists all GCP Projects with Firebase resources.
 * @param pageSize The maximum number of Projects to return
 * @param pageToken Token returned from a previous call indicating where in the
 * set of Projects to resume listing.
 * @return Promise to an array of Firebase Projects
 */
export function listFirebaseProjects(pageSize?: number, pageToken?: string) {
	return firebase.listFirebaseProjects(googleapis, pageSize, pageToken);
}
/**
 * Lists all GCP Projects lacking Firebase resources, but that are available to become Firebase
 * projects.
 * @param pageSize The maximum number of Projects to return
 * @param pageToken Token returned from a previous call indicating where in the
 * set of Projects to resume listing.
 * @return Promise to an array of GCP Projects
 */
export function listAvailableProjects(pageSize?: number, pageToken?: string) {
	return firebase.listAvailableProjects(googleapis, pageSize, pageToken);
}

/**
 * Retrieves information for a given Firebase project.
 * @param projectId projectId of the Firebase project to retrieve
 * @return Promise to a Firebase Project
 */
export function getFirebaseProject(projectId: string) {
	return firebase.getFirebaseProject(googleapis, projectId);
}

/**
 * Lists all applications associated with a Firebase Project.
 * @param projectId projectId of the Firebase project to retrieve apps of
 * @param pageSize The maximum number of Apps to return
 * @param pageToken Token returned from a previous call indicating where in the
 * set of Apps to resume listing.
 */
export function listFirebaseProjectApps(projectId: string, pageSize?: number, pageToken?: string) {
	return firebase.listFirebaseProjectApps(googleapis, projectId, pageSize, pageToken);
}

/**
 * Creates a new web application under a given Firebase Project.
 * @param projectId projectId of the parent Firebase project to create an application for
 * @param displayName User-assigned display name of the App.
 * @param appUrls Fully qualified URLs where the App is hosted.
 */
export function createFirebaseWebapp(projectId: string, displayName?: string, appUrls?: string[]) {
	return firebase.createFirebaseWebapp(googleapis, projectId, displayName, appUrls);
}

/**
 * Retrieves information for a given Firebase Project's app.
 * @param name Fully qualified identifier for the webapp (Eg: `/projects/.../webApp/...`)
 */
export function getFirebaseWebapp(name: string): ReturnType<typeof firebase.getFirebaseWebapp>;
/**
 * Retrieves information for a given Firebase Project's app.
 * @param projectId projectId of the parent Firebase project
 * @param appId The webapp's ID.
 */
export function getFirebaseWebapp(projectId: string, appId?: string): ReturnType<typeof firebase.getFirebaseWebapp>;
export function getFirebaseWebapp(projectId: string, appId?: string) {
	return firebase.getFirebaseWebapp(googleapis, projectId, appId);
}

/**
 * Retrieves configuration information for a given Firebase Project's app.
 * @param name Fully qualified identifier for the webapp (Eg: `/projects/.../webApp/...`)
 */
export function getFirebaseWebappConfig(name: string): ReturnType<typeof firebase.getFirebaseWebappConfig>;
/**
 * Retrieves configuration information for a given Firebase Project's app.
 * @param projectId projectId of the parent Firebase project
 * @param appId The webapp's ID.
 */
export function getFirebaseWebappConfig(
	projectId: string,
	appId?: string
): ReturnType<typeof firebase.getFirebaseWebappConfig>;
export function getFirebaseWebappConfig(projectId: string, appId?: string) {
	return firebase.getFirebaseWebappConfig(googleapis, projectId, appId);
}

```