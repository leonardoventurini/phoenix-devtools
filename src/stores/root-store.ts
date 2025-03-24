import { DevToolsStore } from './devtools-store';

export class RootStore {
	devToolsStore: DevToolsStore;

	constructor() {
		this.devToolsStore = new DevToolsStore();
	}
}
