/**
 * WordPress dependencies
 */
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { useEntityRecords, useEntityProp } from '@wordpress/core-data';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch, store as coreDataStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './styles.scss';

const defaultLayouts = {
	table: {
		layout: {
			primaryField: 'title',
		},
	},
};

const fields = [
	{
		id: 'id',
		label: __( 'ID' ),
		enableSorting: false,
	},
	{
		id: 'title',
		label: __( 'Name' ),
		getValue: ( { item } ) => item.title.rendered,
		enableGlobalSearch: true,
		enableSorting: true,
		enableHiding: false,
	},
	{
		id: 'enabled',
		label: __( 'Status' ),
		elements: [
			{ label: 'Enabled', value: true },
			{ label: 'Disabled', value: false },
		],
		render: ( { item } ) => {
			const [ meta ] = useEntityProp(
				'postType',
				'schema',
				'meta',
				item.id
			);
			const { editEntityRecord, saveEditedEntityRecord } =
				useDispatch( 'core' );
			return (
				<>
					<CheckboxControl
						checked={ meta?.enabled }
						label={
							meta?.enabled ? __( 'Enabled' ) : __( 'Disabled' )
						}
						onChange={ () => {
							editEntityRecord( 'postType', 'schema', item.id, {
								meta: {
									...meta,
									enabled: ! meta?.enabled,
								},
							} );
							saveEditedEntityRecord(
								'postType',
								'schema',
								item.id
							);
						} }
					/>
				</>
			);
		},
		getValue: ( { item } ) => {
			return item.meta?.enabled;
		},
		enableSorting: false,
		enableHiding: false,
		filterBy: {
			operators: [ 'is' ],
		},
	},
];

const actions = [];

const App = () => {
	const [ page, setPage ] = useState( 1 );
	const [ perPage, setPerPage ] = useState( 10 );
	const [ orderby, setOrderby ] = useState( 'title' );
	const [ order, setOrder ] = useState( 'asc' );
	const [ search, setSearch ] = useState( '' );
	const [ enabled, setEnabled ] = useState();
	// Retrieve the schemas from the store and check if it is resolving.
	const {
		records: schemas,
		isResolving,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'schema', {
		per_page: perPage,
		page,
		search,
		orderby,
		order,
		// This is a custom thing to allow us to filter by meta.
		enabled,
	} );

	// "view" and "setView" definition.
	const [ view, setView ] = useState( {
		type: 'table',
		perPage: perPage,
		layout: defaultLayouts.table.layout,
		fields: [ 'id', 'enabled', 'title' ],
	} );

	// Process the data and pagination information.
	const { data: processedData, paginationInfo } = useMemo( () => {
		return schemas, view, fields;
	}, [ view, isResolving ] );

	return (
		<DataViews
			isLoading={ isResolving }
			data={ schemas || [] }
			fields={ fields }
			view={ view }
			onChangeView={ ( data ) => {
				console.log( 'onChangeView', data );
				if ( data?.search?.length ) {
					setSearch( data.search );
					setOrderby( 'relevance' );
				} else {
					if ( data?.sort ) {
						setOrderby( data?.sort?.field );
						setOrder( data?.sort?.direction );
					}
				}
				setPerPage( data.perPage );
				setPage( data.page );
				setEnabled( data.filters?.[ 0 ]?.value );
				// // Pass the data to the view.
				setView( data );
			} }
			defaultLayouts={ defaultLayouts }
			actions={ actions }
			paginationInfo={ { totalItems, totalPages } }
			onChangeSelection={ ( things ) => {
				console.log( 'onChange', things );
			} }
		/>
	);
};

export default App;
