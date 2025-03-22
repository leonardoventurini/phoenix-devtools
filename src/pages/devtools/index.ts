import Browser from 'webextension-polyfill';

Browser.devtools.panels.create('Dev Tools', 'icon-32.png', 'src/pages/devtools/index.html').catch(console.error);

let port = chrome.runtime.connect({ name: 'devtools' });
let messagesList = document.getElementById('messages') as HTMLUListElement;
let clearButton = document.getElementById('clear') as HTMLButtonElement;

port.postMessage({ action: 'attachDebugger' });
port.postMessage({ action: 'getMessages' });

port.onMessage.addListener(function(response) {
	if (response.messages) {
		messagesList.innerHTML = '';
		response.messages.forEach(function(message: any) {
			let listItem = document.createElement('li');

			// Create message direction indicator
			let direction = document.createElement('span');
			direction.textContent = message.method === 'Network.webSocketFrameReceived' ? '← Received: ' : '→ Sent: ';
			direction.style.fontWeight = 'bold';
			direction.style.color = message.method === 'Network.webSocketFrameReceived' ? 'blue' : 'green';

			// Create content element
			let content = document.createElement('span');
			try {
				// Try to parse as JSON
				let jsonData = JSON.parse(message.data);
				content.textContent = JSON.stringify(jsonData, null, 2);
			} catch (e) {
				// If not JSON, display as plain text
				content.textContent = message.data;
			}

			// Append to list item
			listItem.appendChild(direction);
			listItem.appendChild(content);
			messagesList.appendChild(listItem);
		});
	}
});

clearButton.addEventListener('click', function() {
	port.postMessage({ action: 'clearMessages' });
	messagesList.innerHTML = '';
});

// Poll for messages every second
setInterval(function() {
	port.postMessage({ action: 'getMessages' });
}, 1000);
