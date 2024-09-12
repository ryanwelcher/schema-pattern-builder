/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

const Header = ( { pattern, onClick } ) => {
	return (
		<div id="schema-pattern-builder__header">
			{ pattern ? (
				<>
					<h1>
						Schema Builder { `-> ${ pattern?.title?.rendered }` }
					</h1>
					<Button
						variant="secondary"
						className="go-back"
						onClick={ () => onClick( null ) }
					>
						Go back
					</Button>
				</>
			) : (
				<h1>Schema Builder</h1>
			) }
		</div>
	);
};

export default Header;
