/**
 * WordPress dependencies
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import { useSelect } from '@wordpress/data';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';

function addSchemaAttribute( settings, name ) {
	return {
		...settings,
		attributes: {
			...settings.attributes,
			schemaType: {
				type: 'string',
				default: '',
			},
			schemaProp: {
				type: 'string',
				default: '',
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'schema-builder/schema-type/core-block',
	addSchemaAttribute
);

// Variations
registerBlockVariation( 'core/group', {
	name: 'schema-builder/job-posting',
	title: __( 'Job Posting', 'schema-builder' ),
	attributes: {
		schemaType: 'JobPosting',
		layout: { type: 'constrained' },
	},
	// isActive: ['schemaType', 'layout.type'],
	isActive: ( blockAttributes, variationAttributes ) =>
		blockAttributes.schemaType === variationAttributes.schemaType &&
		blockAttributes.layout.type === variationAttributes.layout.type,
} );

registerBlockVariation( 'core/paragraph', {
	name: 'schema-builder/job-posting-title',
	title: __( 'Job Description', 'schema-builder' ),
	attributes: {
		schemaProp: 'schema:description',
	},
	isActive: ( blockAttributes, variationAttributes ) =>
		blockAttributes.schemaProp === variationAttributes.schemaProp,
} );

const SchemaBuilder = ( props ) => {
	const parentBlock = useSelect(
		( select ) => select( 'core/block-editor' ).getBlock( props.clientId ),
		[]
	);

	console.log( parentBlock.innerBlocks );
	return <>Schema goes here</>;
};

const withMyPluginControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		const { name } = props;
		if ( name !== 'core/group' ) {
			return <BlockEdit { ...props } />;
		}
		return (
			<>
				<BlockEdit key="edit" { ...props } />
				<InspectorControls>
					<PanelBody>
						<SchemaBuilder { ...props } />
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'withMyPluginControls' );

addFilter(
	'editor.BlockEdit',
	'my-plugin/with-inspector-controls',
	withMyPluginControls
);
