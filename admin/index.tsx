import domReady from '@wordpress/dom-ready';
import { createRoot } from '@wordpress/element';

import App from './app';


domReady( () => {
	const root = createRoot(
		document.getElementById( 'schema-pattern-builder' )!
	);
	root.render( <App /> );
} );
