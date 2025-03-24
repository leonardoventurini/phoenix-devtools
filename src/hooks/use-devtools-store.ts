import { useContext } from 'react';
import { StoreContext } from '../contexts/store-context';

export const useDevToolsStore = () => {
	const context = useContext(StoreContext);

	if (!context) {
		throw new Error('useDevToolsStore must be used within a StoreProvider');
	}

	return context.devToolsStore;
};
