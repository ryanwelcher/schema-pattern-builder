/**
 * WordPress dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useEntityRecords, useEntityProp } from '@wordpress/core-data';
import { SelectControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

const defaultLayouts = {
	table: {
		layout: {
			primaryField: 'property',
		},
	},
};
const SelectedPattern = ( { pattern } ) => {
	// Properties.
	const { records: properties, isResolving } = useEntityRecords(
		'taxonomy',
		'property',
		{
			per_page: 100,
			include: pattern.property,
		}
	);

	// Post meta for the pattern.
	const [ meta ] = useEntityProp( 'postType', 'schema', 'meta', pattern.id );

	// "view" and "setView" definition.
	const [ view, setView ] = useState( {
		type: 'table',
		perPage: 100,
		layout: defaultLayouts.table.layout,
		fields: [ 'property', 'type' ],
	} );

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( 'core' );

	const allMappings = meta?.mapping.split( ',' );

	const fields = [
		{
			id: 'property',
			label: __( 'Property' ),
			getValue: ( { item } ) => item.name.replace( 'schema:', '' ),
			enableGlobalSearch: true,
		},
		{
			id: 'type',
			label: __( 'Mapped to Type' ),
			render: ( { item } ) => {
				const { allowed_types: allowedTypes } = item.meta;
				const types = allowedTypes.split( ',' );
				const selectedMapping = allMappings
					.map( ( mapping ) => {
						const nameValue = mapping.split( '-' );

						if ( nameValue[ 0 ] === item.name ) {
							return nameValue[ 1 ];
						}
					} )
					.filter( Boolean )[ 0 ];

				if ( types.length > 1 ) {
					// select dropdown
					return (
						<SelectControl
							options={ [
								{ label: 'Not Mapped', value: '' },
								...types.map( ( type ) => ( {
									label: type,
									value: type,
								} ) ),
							] }
							value={ selectedMapping }
							onChange={ ( value ) => {
								const newMappings = [
									...allMappings,
									`${ item.name }-${ value }`,
								];
								editEntityRecord(
									'postType',
									'schema',
									pattern.id,
									{
										meta: {
											...meta,
											mapping: newMappings.join( ',' ),
										},
									}
								);
								saveEditedEntityRecord(
									'postType',
									'schema',
									pattern.id
								);
							} }
						/>
					);
				} else {
					return types[ 0 ];
				}
			},
			enableSorting: false,
			enableHiding: false,
		},
	];

	// "processedData" and "paginationInfo" definition
	const { data: processedData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( properties, view, fields );
	}, [ view, properties ] );

	return (
		<DataViews
			isLoading={ isResolving }
			data={ processedData }
			fields={ fields }
			view={ view }
			onChangeView={ ( data ) => {
				setView( data );
			} }
			defaultLayouts={ defaultLayouts }
			paginationInfo={ paginationInfo }
		/>
	);
};

export default SelectedPattern;
