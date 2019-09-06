import chalk from 'chalk';
import { Command } from 'commander';
import { textSync as figlet } from 'figlet';
import { cloudresourcemanager_v1, firebase_v1beta1 } from 'googleapis';
import * as inquirer from 'inquirer';

export async function waitOnOperation(
	api: cloudresourcemanager_v1.Cloudresourcemanager | firebase_v1beta1.Firebase,
	name: string
): Promise<
	cloudresourcemanager_v1.Schema$Operation | firebase_v1beta1.Schema$Operation
> {
	return new Promise((res, rej) => {
		const checkupInterval = setInterval(async () => {
			const result = await api.operations.get({ name });
			if (result.data.done) {
				clearInterval(checkupInterval);
				clearTimeout(timeoutId);
				result.data.error ? rej(result.data.error.message) : res(result.data);
			}
		}, 1000);
		const timeoutId = setTimeout(() => {
			clearInterval(checkupInterval);
			rej(`Timed out waiting on ${name}`);
		}, 20000);
	});
}

export function getRandomHexLen(length: number) {
	let rand = '';
	while (rand.length < length) {
		rand += Math.floor(Math.random() * 0xf).toString(16);
	}
	return rand;
}

interface CommandArg {
	name: string;
	initialValue: string;
	message: string;
	required: boolean;
}

interface InquirerConfig {
	[key: string]: Function | inquirer.ListQuestion<inquirer.Answers>;
}

export class CLI {
	private args = process.argv;
	private initialRun = true;
	private prog = new Command();
	private isInteractive = this.args.length < 3;
	private currentCmdPathStr = '';
	private currentCommand = this.prog;
	private currentCommandArgs: CommandArg[] = [];
	private inquirerConfig: InquirerConfig = {
		'': {
			choices: [{ name: 'Exit', value: 'exit' }],
			type: 'list'
		},
		exit: () => {
			process.exit();
		}
	};

	public async run() {
		if (this.isInteractive) {
			this.formalizeCommandTree();
			if (this.inquirerConfig) {
				let configPath = '';
				while (typeof this.inquirerConfig[configPath] !== 'function') {
					console.clear();
					const header = figlet('Firebase PM', 'Slant');
					console.log(chalk.yellowBright(header));
					const config = this.inquirerConfig[configPath];
					configPath = ((await inquirer.prompt({
						...config,
						name: 'value'
					})) as any).value;
				}
				await (this.inquirerConfig[configPath] as Function)();
			}
		} else {
			if (this.initialRun) {
				this.initialRun = false;
				this.prog.parse(this.args);
			}
		}
	}

	public command(commandStr: string) {
		this.parseCommandString(commandStr);
		if (this.inquirerConfig[this.currentCmdPathStr] === undefined) {
			const parentPath = this.getParentCmdPath();
			const parent = this.inquirerConfig[parentPath];
			if (typeof parent !== 'function') {
				(parent.choices as any).push({
					name: this.currentCmdPathStr,
					value: this.currentCmdPathStr
				});
			}
			this.inquirerConfig[this.currentCmdPathStr] = {
				choices: [{ name: 'Back', value: parentPath }],
				type: 'list'
			};
		}
		return this;
	}

	public menu(menuName: string) {
		return this.command(menuName);
	}

	public root() {
		return this.command('');
	}

	public description(description: string) {
		const parent = this.inquirerConfig[this.getParentCmdPath()];
		if (typeof parent !== 'function') {
			const choice = (parent.choices as any[]).find(
				elt => elt.value === this.currentCmdPathStr
			);
			choice.name = description;
		}
		this.currentCommand.description(description);
		return this;
	}

	public title(title: string) {
		(this.inquirerConfig[this.currentCmdPathStr] as any).message = title;
		return this;
	}

	public action(fn: (...args: any[]) => any) {
		const cmdArgsCopy = this.currentCommandArgs.slice();

		if (this.isInteractive) {
			this.inquirerConfig[this.currentCmdPathStr] = async () => {
				const argValues = {};
				for (const arg of cmdArgsCopy) {
					const config: inquirer.QuestionCollection = {
						default: arg.initialValue,
						message: arg.message,
						name: arg.name,
						validate(answer) {
							return !arg.required || (arg.required && answer)
								? true
								: 'This is required';
						}
					};
					argValues[arg.name] = (await inquirer.prompt(config))[arg.name];
				}
				return fn(argValues);
			};
		} else {
			this.inquirerConfig[this.currentCmdPathStr] = fn;
			this.currentCommand.action((...fnArgs) => {
				const argMap = {};
				cmdArgsCopy.forEach((arg, idx) => {
					argMap[arg.name] = fnArgs[idx];
				});
				fn(argMap);
			});
		}
		return this;
	}

	private parseCommandString(cmdStr: string) {
		const cmdArgs: CommandArg[] = [];
		const reqArgReg = /\<([^\>=]*)(?:=([^\>]*))?\>(?:\(([^)]*)\))?/g;
		const optArgReg = /\[([^\]=]*)(?:=([^\]]*))?\](?:\(([^)]*)\))?/g;
		cmdStr = cmdStr.replace(reqArgReg, (...matches: any[]) => {
			const [name, initialValue, message] = matches.slice(1, -2);
			cmdArgs.push({ name, initialValue, message, required: true });
			return `<${name}>`;
		});
		cmdStr = cmdStr.replace(optArgReg, (...matches: any[]) => {
			const [name, initialValue, message] = matches.slice(1, -2);
			cmdArgs.push({ name, initialValue, message, required: false });
			return `[${name}]`;
		});

		this.currentCommand = this.prog.command(cmdStr);
		this.currentCommandArgs = cmdArgs;
		this.currentCmdPathStr = cmdStr
			.split('<')[0]
			.split('[')[0]
			.trim()
			.replace(' ', '.');
	}

	private getParentCmdPath() {
		const pathArr = this.currentCmdPathStr.split('.');
		if (pathArr.length <= 1) {
			return '';
		} else {
			pathArr.pop();
			return pathArr.join('.');
		}
	}

	private formalizeCommandTree() {
		Object.entries(this.inquirerConfig).forEach(([key, value]) => {
			if (typeof value === 'object') {
				if ((value.choices as any).length === 0) {
					this.inquirerConfig[key] = () => {};
				} else {
					const config = this.inquirerConfig[key] as any;
					config.choices = config.choices.sort((a, b) => {
						const aWeight = ['Exit', 'Back'].includes(a.name) ? -999 : 0;
						const bWeight = ['Exit', 'Back'].includes(b.name) ? -999 : 0;
						return bWeight - aWeight;
					});
				}
			}
		});
	}
}
