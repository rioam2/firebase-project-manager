import { cloudresourcemanager_v1, firebase_v1beta1 } from 'googleapis';

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
