import * as fs from 'fs';
import * as path from 'path';
import { compareTwoStrings } from 'string-similarity';

import { COMMANDS } from '../cli';

export function displayHelp(type?: COMMANDS) {
	const isValidCommand = Object.values(COMMANDS).includes(type as COMMANDS);
	if (!isValidCommand) {
		let similarCommand;
		Object.values(COMMANDS).forEach(command => {
			if (compareTwoStrings(command, type) >= 0.8) {
				similarCommand = command;
			}
		});
		if (similarCommand) {
			console.log(`No command, ${type}, did you mean ${similarCommand}? \n`);
			type = similarCommand;
		} else {
			console.log(`No command, ${type}. \n`);
			type = undefined;
		}
	}
	(function printFile(type = COMMANDS.HELP) {
		const fileData = fs.readFileSync(path.resolve(__dirname, `${type}.txt`));
		console.log(fileData.toString());
	})(type);
}
