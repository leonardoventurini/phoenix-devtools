import { DevToolsPanel as DevToolsPanelComponent } from '../../components/devtools/devtools-panel';
import { StoreProvider } from '../../stores/store-context';
import '../../styles/index.scss';

export function DevToolsPanel() {
  return (
    <StoreProvider>
      <DevToolsPanelComponent />
    </StoreProvider>
  );
} 