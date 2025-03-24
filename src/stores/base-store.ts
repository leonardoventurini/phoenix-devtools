import { makeObservable, observable, action } from 'mobx';

export class BaseStore {
	isLoading = false;
	error: string | null = null;

	constructor() {
		makeObservable(this, {
			isLoading: observable,
			error: observable,
			setLoading: action,
			setError: action,
			clearError: action
		});
	}

	setLoading(loading: boolean) {
		this.isLoading = loading;
	}

	setError(error: string | null) {
		this.error = error;
	}

	clearError() {
		this.error = null;
	}
}
