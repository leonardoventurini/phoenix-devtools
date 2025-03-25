import { observable, action, makeObservable } from 'mobx';

export class BaseStore {
	@observable isLoading = false;
	@observable error: string | null = null;

	constructor() {
		makeObservable(this);
	}

	@action
	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	@action
	setError(error: string | null) {
		this.error = error;
	}

	@action
	clearError() {
		this.error = null;
	}
}
