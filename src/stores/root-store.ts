import { makeObservable } from 'mobx';
import { DevToolsStore } from './devtools-store';

export class RootStore {
	devToolsStore: DevToolsStore;

	constructor() {
		makeObservable(this);
		this.devToolsStore = new DevToolsStore();
	}
}
