import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './stylesheets/style.css';

const root = ReactDOM.createRoot(document.querySelector('body'));
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
);
